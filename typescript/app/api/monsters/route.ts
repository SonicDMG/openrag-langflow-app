import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join } from 'path';
import { pixelize } from '@/app/battle-arena/server/pixelize';
import { saveMonsterBundle } from '@/app/battle-arena/server/storage';
import { generateReferenceImage, downloadImage } from '@/app/battle-arena/server/imageGeneration';
import { MonsterBundle } from '@/app/battle-arena/utils/monsterTypes';
import { CARD_SETTINGS, DEFAULT_SETTING } from '@/app/battle-arena/lib/constants';
import { CardSetting } from '@/app/battle-arena/lib/types';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

// Helper function to format error responses consistently
function formatErrorResponse(error: unknown): { error: string } {
  return {
    error: error instanceof Error ? error.message : 'Internal server error',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { klass, prompt, seed = Math.floor(Math.random() * 1000000), stats, animationConfig, setting = DEFAULT_SETTING } = body;
    let imageUrl = body.imageUrl; // Use let so we can update it with Everart URL

    if (!klass || !prompt) {
      return NextResponse.json(
        { error: 'klass and prompt are required' },
        { status: 400 }
      );
    }

    // Generate monster ID
    const monsterId = uuidv4();

    let refPngWithNewBg: Buffer;
    let palette: number[];

    // Always generate character directly on background (no cutout processing)
    console.log('Generating character with background...');
    
    if (imageUrl) {
      // Use provided image URL
      try {
        let imageBuffer: Buffer;
        if (imageUrl.startsWith('data:image/')) {
          const base64Data = imageUrl.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          imageBuffer = await downloadImage(imageUrl);
        }
        refPngWithNewBg = imageBuffer;
      } catch (error) {
        console.error('Failed to process provided image:', error);
        return NextResponse.json(
          { error: 'Failed to process provided image URL' },
          { status: 400 }
        );
      }
    } else {
      // Generate character on background directly
      try {
        let characterPrompt = prompt;
        // Ensure background is included in prompt
        if (!characterPrompt.toLowerCase().includes('background') &&
            !characterPrompt.toLowerCase().includes('setting')) {
          const settingConfig = CARD_SETTINGS[setting as CardSetting] || CARD_SETTINGS[DEFAULT_SETTING];
          characterPrompt = `${characterPrompt}, ${settingConfig.backgroundPhrase}`;
        }
        
        const characterImage = await generateReferenceImage({
          prompt: characterPrompt,
          model: '5000',
          imageCount: 1,
          width: 1024,
          height: 768,
        });
        
        refPngWithNewBg = characterImage.buffer;
        // Store the Everart URL if not already provided
        if (!imageUrl) {
          imageUrl = characterImage.url;
        }
      } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to generate image. Please provide an imageUrl or configure image generation service.',
          },
          { status: 500 }
        );
      }
    }

    // Pixelize the final image
    console.log('Pixelizing final image...');
    const pixelized = await pixelize(refPngWithNewBg, {
      base: 256,
      colors: 32,
    });
    
    const { png128, png200, png280x200, png256, png512 } = pixelized;
    palette = pixelized.palette;
    
    // Create bundle without cutout images
    const rig = {
      meta: {
        imageW: 256,
        imageH: 256,
        monsterId,
        class: klass,
        seed,
        animationConfig: animationConfig || undefined,
      },
    };

    const bundle: MonsterBundle & { setting?: string; imageUrl?: string } = {
      monsterId,
      klass,
      seed,
      prompt,
      stats: stats || {
        hitPoints: 30,
        maxHitPoints: 30,
        armorClass: 14,
        attackBonus: 4,
        damageDie: 'd8',
        description: `A ${klass} monster`,
      },
      palette,
      rig,
      setting: setting as string,
      imageUrl: imageUrl || undefined, // Store Everart cloud URL for cross-machine sharing
      images: {
        png128,
        png200,
        png280x200,
        png256,
        png512,
      },
      cutOutImages: undefined,
      backgroundOnlyImages: undefined,
    };

    await saveMonsterBundle(bundle);

    return NextResponse.json({
      monsterId,
      url: `/cdn/monsters/${monsterId}`,
      imageUrl: imageUrl || `/cdn/monsters/${monsterId}/280x200.png`, // Return Everart URL if available
    });
  } catch (error) {
    console.error('Monster creation error:', error);
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

// GET endpoint to list all created monsters
export async function GET(req: NextRequest) {
  try {
    // Check if monsters directory exists
    try {
      await fs.access(MONSTERS_DIR);
    } catch {
      // Directory doesn't exist, return empty array
      return NextResponse.json({ monsters: [] });
    }

    // Read all monster directories
    const entries = await fs.readdir(MONSTERS_DIR, { withFileTypes: true });
    const monsterDirs = entries.filter(entry => entry.isDirectory());

    // Load metadata for each monster
    const monsters = await Promise.all(
      monsterDirs.map(async (dir) => {
        try {
          const metadataPath = join(MONSTERS_DIR, dir.name, 'metadata.json');
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          
          return {
            monsterId: metadata.monsterId || dir.name,
            klass: metadata.klass,
            prompt: metadata.prompt || null,
            seed: metadata.seed,
            stats: metadata.stats,
            hasCutout: false, // Always false - no cutouts generated
            setting: metadata.setting || null,
            createdAt: metadata.createdAt || new Date().toISOString(),
            lastAssociatedAt: metadata.lastAssociatedAt,
            imageUrl: metadata.imageUrl || `/cdn/monsters/${dir.name}/280x200.png`, // Use Everart URL from metadata, fallback to local CDN
            imagePosition: metadata.imagePosition || { offsetX: 50, offsetY: 50 }, // Default to centered
          };
        } catch (error) {
          console.error(`Failed to load metadata for ${dir.name}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls and sort by creation date (newest first)
    const validMonsters = monsters
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ monsters: validMonsters });
  } catch (error) {
    console.error('Error listing monsters:', error);
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

// PATCH endpoint to update monster association
export async function PATCH(req: NextRequest) {
  try {
    const { monsterId, klass, stats, imagePosition } = await req.json();

    if (!monsterId || !klass) {
      return NextResponse.json(
        { error: 'monsterId and klass are required' },
        { status: 400 }
      );
    }

    // Validate imagePosition if provided
    if (imagePosition) {
      const { offsetX, offsetY } = imagePosition;
      if (
        typeof offsetX !== 'number' ||
        typeof offsetY !== 'number' ||
        offsetX < 0 || offsetX > 100 ||
        offsetY < 0 || offsetY > 100
      ) {
        return NextResponse.json(
          { error: 'imagePosition must have offsetX and offsetY between 0 and 100' },
          { status: 400 }
        );
      }
    }

    const monsterDir = join(MONSTERS_DIR, monsterId);
    const metadataPath = join(monsterDir, 'metadata.json');

    // Check if monster exists
    try {
      await fs.access(metadataPath);
    } catch {
      return NextResponse.json(
        { error: 'Monster not found' },
        { status: 404 }
      );
    }

    // Load existing metadata
    const existingMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    // Update metadata
    const updatedMetadata = {
      ...existingMetadata,
      klass,
      lastAssociatedAt: new Date().toISOString(),
      ...(stats && { stats: { ...existingMetadata.stats, ...stats } }),
      ...(imagePosition && { imagePosition }),
    };

    // Save updated metadata
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));

    return NextResponse.json({
      success: true,
      monsterId,
      klass,
      imagePosition: updatedMetadata.imagePosition,
      message: 'Monster association updated successfully',
    });
  } catch (error) {
    console.error('Error updating monster association:', error);
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

// DELETE endpoint to delete monster(s)
export async function DELETE(req: NextRequest) {
  try {
    const { monsterId, deleteAll } = await req.json();

    // Delete all monsters
    if (deleteAll === true) {
      try {
        await fs.access(MONSTERS_DIR);
        const entries = await fs.readdir(MONSTERS_DIR, { withFileTypes: true });
        const monsterDirs = entries.filter(entry => entry.isDirectory());
        
        let deletedCount = 0;
        let errors: string[] = [];

        for (const dir of monsterDirs) {
          try {
            const monsterDir = join(MONSTERS_DIR, dir.name);
            await fs.rm(monsterDir, { recursive: true, force: true });
            deletedCount++;
          } catch (error) {
            errors.push(`Failed to delete ${dir.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        return NextResponse.json({
          success: true,
          deletedCount,
          errors: errors.length > 0 ? errors : undefined,
          message: `Successfully deleted ${deletedCount} monster(s)`,
        });
      } catch (error) {
        // Directory doesn't exist, nothing to delete
        return NextResponse.json({
          success: true,
          deletedCount: 0,
          message: 'No monsters to delete',
        });
      }
    }

    // Delete single monster
    if (!monsterId) {
      return NextResponse.json(
        { error: 'monsterId is required or deleteAll must be true' },
        { status: 400 }
      );
    }

    const monsterDir = join(MONSTERS_DIR, monsterId);

    // Check if monster exists
    try {
      await fs.access(monsterDir);
    } catch {
      return NextResponse.json(
        { error: 'Monster not found' },
        { status: 404 }
      );
    }

    // Delete the monster directory
    await fs.rm(monsterDir, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      monsterId,
      message: 'Monster deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting monster:', error);
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

// Made with Bob
