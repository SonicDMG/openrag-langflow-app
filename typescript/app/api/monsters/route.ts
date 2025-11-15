import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { pixelize } from '@/app/dnd/server/pixelize';
import { saveMonsterBundle } from '@/app/dnd/server/storage';
import { generateReferenceImage, downloadImage, ensure16x9AspectRatio } from '@/app/dnd/server/imageGeneration';
import { removeBackground, ensureTransparentBackground } from '@/app/dnd/server/backgroundRemoval';
import { MonsterBundle } from '@/app/dnd/utils/monsterTypes';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

// Helper function to format error responses consistently
function formatErrorResponse(error: unknown): { error: string } {
  return {
    error: error instanceof Error ? error.message : 'Internal server error',
  };
}

export async function POST(req: NextRequest) {
  try {
    const { klass, prompt, seed = Math.floor(Math.random() * 1000000), stats, imageUrl, animationConfig } = await req.json();

    if (!klass || !prompt) {
      return NextResponse.json(
        { error: 'klass and prompt are required' },
        { status: 400 }
      );
    }

    // Generate monster ID
    const monsterId = uuidv4();

    // 1) Get the character image (should already be transparent background from preview generation)
    let refPngCutOut: Buffer;
    
    if (imageUrl) {
      // Use provided image URL (should be character with transparent background)
      try {
        // Check if it's a data URL (base64) or regular URL
        if (imageUrl.startsWith('data:image/')) {
          // Extract base64 data from data URL
          const base64Data = imageUrl.split(',')[1];
          refPngCutOut = Buffer.from(base64Data, 'base64');
          console.log('Using provided data URL image (already processed with transparent background)');
        } else {
          // Regular URL - download it
          refPngCutOut = await downloadImage(imageUrl);
          // If it came from generate-image with transparentBackground=true, it should already be processed
          // But if it's a direct URL, we may need to remove background
          // For now, assume it's already processed if it came from our generate-image endpoint
        }
        
        // Ensure 16:9 aspect ratio for perfect fit (crop if needed)
        console.log('Ensuring 16:9 aspect ratio for character...');
        refPngCutOut = await ensure16x9AspectRatio(refPngCutOut);
        
        // Ensure it has alpha channel (should already be transparent, but verify)
        refPngCutOut = await ensureTransparentBackground(refPngCutOut);
      } catch (error) {
        console.error('Failed to process provided image:', error);
        return NextResponse.json(
          { error: 'Failed to process provided image URL' },
          { status: 400 }
        );
      }
    } else {
      // Generate character with transparent background if no imageUrl provided
      try {
        console.log('Generating character with transparent background...');
        let characterPrompt = prompt;
        // Ensure transparent background is requested
        if (!characterPrompt.toLowerCase().includes('transparent')) {
          characterPrompt = characterPrompt + ', transparent background, isolated character, no background scene';
        }
        
        const characterImage = await generateReferenceImage({
          prompt: characterPrompt,
          model: '5000',
          imageCount: 1,
          width: 1024,
          height: 576, // 16:9 aspect ratio
        });
        
        refPngCutOut = await ensure16x9AspectRatio(characterImage.buffer);
        refPngCutOut = await ensureTransparentBackground(refPngCutOut);
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

    // 2) Generate a new atmospheric background and composite character on top
    console.log('Generating new background scene...');
    const backgroundPrompt = `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro fantasy aesthetic. An atmospheric medieval high-fantasy background scene with ancient ruins, mystical lighting, and dramatic atmosphere. EMPTY scene with ABSOLUTELY NO characters, NO creatures, NO people, NO beings, NO figures, NO entities, NO living things - ONLY the environment, architecture, landscape, ruins, lighting, and atmosphere. Completely empty of any characters or creatures. Warm earth tones with vibrant magical accents. Retro SNES/Genesis style, cinematic composition, 16:9 aspect ratio. --ar 16:9 --style raw`;
    
    let newBackgroundPng: Buffer;
    try {
      // Generate background using the utility function
      const backgroundImage = await generateReferenceImage({
        prompt: backgroundPrompt,
        model: '5000',
        imageCount: 1,
        width: 1024,
        height: 576, // 16:9 aspect ratio
      });
      
      newBackgroundPng = await ensure16x9AspectRatio(backgroundImage.buffer);
    } catch (error) {
      console.warn('Failed to generate new background, creating fallback:', error);
      // Fallback: create a simple solid color background
      newBackgroundPng = await sharp({
        create: {
          width: 1024,
          height: 576,
          channels: 3,
          background: { r: 45, g: 35, b: 28 } // Dark brown/amber background
        }
      })
      .png()
      .toBuffer();
    }

    // Composite the cut-out character on top of the new background
    console.log('Compositing character on new background...');
    const metadata = await sharp(newBackgroundPng).metadata();
    const cutOutMetadata = await sharp(refPngCutOut).metadata();
    
    if (!metadata.width || !metadata.height || !cutOutMetadata.width || !cutOutMetadata.height) {
      throw new Error('Unable to read image dimensions for compositing');
    }

    // Scale down the character to fit better (80% of background height, maintaining aspect ratio)
    // This prevents heads from being cut off due to 16:9 cropping
    const scaleFactor = Math.min(
      0.8, // Max 80% of background height
      (metadata.height * 0.8) / cutOutMetadata.height // Scale to fit 80% of background height
    );
    
    const scaledWidth = Math.floor(cutOutMetadata.width * scaleFactor);
    const scaledHeight = Math.floor(cutOutMetadata.height * scaleFactor);
    
    console.log(`Scaling character from ${cutOutMetadata.width}x${cutOutMetadata.height} to ${scaledWidth}x${scaledHeight} (${(scaleFactor * 100).toFixed(1)}%)`);
    
    // Resize the character cut-out
    const scaledCutOut = await sharp(refPngCutOut)
      .resize(scaledWidth, scaledHeight, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();

    // Center the character on the background with some vertical offset (character appears to be "in front")
    const compositeX = Math.floor((metadata.width - scaledWidth) / 2);
    const compositeY = Math.floor((metadata.height - scaledHeight) / 2) - 10; // Slight upward offset for depth
    
    const refPngWithNewBg = await sharp(newBackgroundPng)
      .composite([
        {
          input: scaledCutOut,
          left: Math.max(0, compositeX),
          top: Math.max(0, compositeY),
        }
      ])
      .png()
      .toBuffer();

    // 3) Pixelize all versions
    console.log('Pixelizing background-only version...');
    const { 
      png128: png128BgOnly, 
      png200: png200BgOnly, 
      png280x200: png280x200BgOnly, 
      png256: png256BgOnly, 
      png512: png512BgOnly,
      palette 
    } = await pixelize(newBackgroundPng, {
      base: 256,
      colors: 32,
    });

    console.log('Pixelizing composite version (new background + character)...');
    const { png128, png200, png280x200, png256, png512 } = await pixelize(refPngWithNewBg, {
      base: 256,
      colors: 32, // Increased from 16 to 32 for better color detail
    });

    console.log('Pixelizing cut-out version...');
    const { 
      png128: png128CutOut, 
      png200: png200CutOut, 
      png280x200: png280x200CutOut, 
      png256: png256CutOut, 
      png512: png512CutOut 
    } = await pixelize(refPngCutOut, {
      base: 256,
      colors: 32,
    });

    // 5) Create minimal rig metadata (no part extraction needed)
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

    // 6) Persist & return id
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
      cutOutImages: {
        png128: png128CutOut,
        png200: png200CutOut,
        png280x200: png280x200CutOut,
        png256: png256CutOut,
        png512: png512CutOut,
      },
      backgroundOnlyImages: {
        png128: png128BgOnly,
        png200: png200BgOnly,
        png280x200: png280x200BgOnly,
        png256: png256BgOnly,
        png512: png512BgOnly,
      },
    };

    await saveMonsterBundle(bundle);

    return NextResponse.json({
      monsterId,
      url: `/cdn/monsters/${monsterId}`,
    });
  } catch (error) {
    console.error('Monster creation error:', error);
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
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
            hasCutout: metadata.hasCutout ?? false, // Include cutout flag (default to false for backward compatibility)
            createdAt: metadata.createdAt || new Date().toISOString(),
            lastAssociatedAt: metadata.lastAssociatedAt, // Include last association time
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
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
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
      lastAssociatedAt: new Date().toISOString(), // Track when association was last updated
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

