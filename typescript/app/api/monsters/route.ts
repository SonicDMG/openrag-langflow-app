import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join } from 'path';
import { pixelize } from '@/app/dnd/server/pixelize';
import { saveMonsterBundle, loadMonsterBundle } from '@/app/dnd/server/storage';
import { downloadImage, ensure16x9AspectRatio } from '@/app/dnd/server/imageGeneration';
import { removeBackground, ensureTransparentBackground } from '@/app/dnd/server/backgroundRemoval';
import { MonsterBundle } from '@/app/dnd/utils/rigTypes';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

// Note: This function will be called with MCP tool access
// For now, we'll use a placeholder that the actual implementation will replace
async function generateReferenceImageWithEverArt(
  prompt: string,
  seed: number,
  model: string = '5000'
): Promise<Buffer> {
  // This should use the MCP tool mcp_everart_generate_image
  // Since we can't directly call MCP tools from server code,
  // we'll need to make an HTTP request to a service that has MCP access,
  // or we can implement this differently.
  // For now, throw an error to indicate this needs to be implemented
  throw new Error(
    'Image generation needs to be implemented with MCP tool access. ' +
    'Consider creating a separate service endpoint or using the MCP tool directly in the route handler.'
  );
}

export async function POST(req: NextRequest) {
  try {
    const { klass, prompt, seed = Math.floor(Math.random() * 1000000), stats, imageUrl, animationConfig, removeBg = false } = await req.json();

    if (!klass || !prompt) {
      return NextResponse.json(
        { error: 'klass and prompt are required' },
        { status: 400 }
      );
    }

    // Generate monster ID
    const monsterId = uuidv4();

    // 1) Generate a reference image using EverArt
    // Option 1: Call the image generation API endpoint
    // Option 2: Accept imageUrl in request body (if generated client-side)
    // Option 3: Use a direct EverArt API call
    
    let refPng: Buffer;
    
    if (imageUrl) {
      // Use provided image URL
      try {
        refPng = await downloadImage(imageUrl);
        
        // Ensure 16:9 aspect ratio for perfect fit (crop if needed)
        console.log('Ensuring 16:9 aspect ratio...');
        refPng = await ensure16x9AspectRatio(refPng);
        
        // Optionally remove background if requested
        if (removeBg) {
          console.log('Removing background from image...');
          refPng = await removeBackground(refPng, {
            threshold: 30,
            useEdgeDetection: true,
            preserveAntiAliasing: true,
          });
        } else {
          // Ensure image has alpha channel even if we're not removing background
          refPng = await ensureTransparentBackground(refPng);
        }
      } catch (error) {
        console.error('Failed to download provided image:', error);
        return NextResponse.json(
          { error: 'Failed to download provided image URL' },
          { status: 400 }
        );
      }
    } else {
      // Try to generate image via service
      try {
        const imageUrl = await generateImageViaService(prompt, seed);
        refPng = await downloadImage(imageUrl);
        
        // Ensure 16:9 aspect ratio for perfect fit (crop if needed)
        console.log('Ensuring 16:9 aspect ratio...');
        refPng = await ensure16x9AspectRatio(refPng);
      } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to generate image. Please provide an imageUrl or configure image generation service.',
            hint: 'You can generate an image using the EverArt MCP tool and pass the URL in the request body.'
          },
          { status: 500 }
        );
      }
    }

    // 2) Pixelize (280x200 for card display, 256 for reference)
          const { png128, png200, png280x200, png256, png512, palette } = await pixelize(refPng, {
            base: 256,
            colors: 32, // Increased from 16 to 32 for better color detail
          });

    // 3) Create minimal rig metadata (no part extraction needed)
    const rig = {
      meta: {
        imageW: 256,
        imageH: 256,
        monsterId,
        class: klass,
        seed,
        animationConfig: animationConfig || undefined,
        weaponPart: animationConfig?.weaponPart || undefined,
      },
      bones: [],
      slots: [],
      parts: {},
      expressions: {
        neutral: {},
      },
    };

    // 4) Persist & return id
    const bundle: MonsterBundle = {
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
      images: {
        png128,
        png200,
        png280x200,
        png256,
        png512,
      },
    };

    await saveMonsterBundle(bundle);

    return NextResponse.json({
      monsterId,
      url: `/cdn/monsters/${monsterId}`,
    });
  } catch (error) {
    console.error('Monster creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate image via EverArt service
 * 
 * Since MCP tools are not directly available in Next.js API routes,
 * you have a few options:
 * 
 * Option 1: Create a proxy service that has MCP access
 * Option 2: Use a different image generation API (Stable Diffusion, DALL-E, etc.)
 * Option 3: Generate images client-side and upload them
 * 
 * For now, this is a placeholder that you can replace with your preferred method.
 * The function should return a URL to the generated image.
 */
async function generateImageViaService(
  prompt: string,
  seed: number,
  model: string = '5000'
): Promise<string> {
  // TODO: Implement image generation
  // Example using a hypothetical EverArt API:
  // const response = await fetch('https://api.everart.ai/generate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ prompt, seed, model }),
  // });
  // const data = await response.json();
  // return data.imageUrl;
  
  // For development/testing, you could also:
  // 1. Use a placeholder image service
  // 2. Generate images via a separate microservice
  // 3. Use the MCP tool in a different context and pass the URL
  
  throw new Error(
    'Image generation not implemented. ' +
    'Please configure generateImageViaService to use EverArt or another image generation service.'
  );
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
            prompt: metadata.prompt,
            seed: metadata.seed,
            stats: metadata.stats,
            createdAt: metadata.createdAt || new Date().toISOString(),
            imageUrl: `/cdn/monsters/${dir.name}/280x200.png`,
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update monster association
export async function PATCH(req: NextRequest) {
  try {
    const { monsterId, klass, stats } = await req.json();

    if (!monsterId || !klass) {
      return NextResponse.json(
        { error: 'monsterId and klass are required' },
        { status: 400 }
      );
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
      ...(stats && { stats: { ...existingMetadata.stats, ...stats } }),
    };

    // Save updated metadata
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));

    return NextResponse.json({
      success: true,
      monsterId,
      klass,
      message: 'Monster association updated successfully',
    });
  } catch (error) {
    console.error('Error updating monster association:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

