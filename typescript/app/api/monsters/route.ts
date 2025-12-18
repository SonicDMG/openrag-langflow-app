import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { pixelize } from '@/app/dnd/server/pixelize';
import { saveMonsterBundle } from '@/app/dnd/server/storage';
import { generateReferenceImage, downloadImage, ensure16x9AspectRatio, generateSkippedPlaceholder } from '@/app/dnd/server/imageGeneration';
import { removeBackground, ensureTransparentBackground } from '@/app/dnd/server/backgroundRemoval';
import { MonsterBundle } from '@/app/dnd/utils/monsterTypes';
import { CARD_SETTINGS, DEFAULT_SETTING } from '@/app/dnd/constants';
import { CardSetting } from '@/app/dnd/types';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

// Helper function to format error responses consistently
function formatErrorResponse(error: unknown): { error: string } {
  return {
    error: error instanceof Error ? error.message : 'Internal server error',
  };
}

export async function POST(req: NextRequest) {
  try {
    const { klass, prompt, seed = Math.floor(Math.random() * 1000000), stats, imageUrl, animationConfig, skipCutout = true, setting = DEFAULT_SETTING } = await req.json();

    if (!klass || !prompt) {
      return NextResponse.json(
        { error: 'klass and prompt are required' },
        { status: 400 }
      );
    }

    // Generate monster ID
    const monsterId = uuidv4();

    let refPngWithNewBg: Buffer;
    let refPngCutOut: Buffer | undefined;
    let newBackgroundPng: Buffer | undefined;
    let palette: number[];

    if (skipCutout) {
      // Simplified path: Generate character directly on background (no cutout processing)
      console.log('Generating character directly on background (skipCutout=true)...');
      
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
          // Don't crop to 16:9 - preserve original aspect ratio
          refPngWithNewBg = imageBuffer;
        } catch (error) {
          console.error('Failed to process provided image:', error);
          return NextResponse.json(
            { error: 'Failed to process provided image URL' },
            { status: 400 }
          );
        }
      } else {
        // Generate character on background directly (no transparent background needed)
        try {
          let characterPrompt = prompt;
          // Remove any transparent background references and add background scene
          if (characterPrompt.toLowerCase().includes('transparent') || 
              characterPrompt.toLowerCase().includes('no background') ||
              characterPrompt.toLowerCase().includes('isolated character')) {
            // Rebuild prompt with background
            const description = characterPrompt
              .replace(/transparent background[,\s]*/gi, '')
              .replace(/isolated character[,\s]*/gi, '')
              .replace(/no background scene[,\s]*/gi, '')
              .replace(/no environment[,\s]*/gi, '')
              .replace(/no setting[,\s]*/gi, '')
              .trim();
            const settingConfig = CARD_SETTINGS[setting as CardSetting] || CARD_SETTINGS[DEFAULT_SETTING];
            characterPrompt = `${description}, depicted in a ${settingConfig.backgroundPhrase}`;
          } else if (!characterPrompt.toLowerCase().includes('background') && 
                     !characterPrompt.toLowerCase().includes('setting')) {
            // Add background if not present
            const settingConfig = CARD_SETTINGS[setting as CardSetting] || CARD_SETTINGS[DEFAULT_SETTING];
            characterPrompt = `${characterPrompt}, ${settingConfig.backgroundPhrase}`;
          }
          
          const characterImage = await generateReferenceImage({
            prompt: characterPrompt,
            model: '5000',
            imageCount: 1,
            width: 1024,
            height: 768, // 4:3 aspect ratio to match generated images
          });
          
          // Don't crop to 16:9 - preserve original 4:3 aspect ratio
          refPngWithNewBg = characterImage.buffer;
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
      
      // When skipCutout is true, generate "skipped" placeholder images for cutout and background-only
      console.log('Generating "skipped" placeholder images (skipCutout=true)...');
      let skippedPlaceholder: Buffer;
      try {
        skippedPlaceholder = await generateSkippedPlaceholder();
        
        // Pixelize the placeholder
        const skippedPixelized = await pixelize(skippedPlaceholder, {
          base: 256,
          colors: 32,
        });
        
        // Create bundle with "skipped" placeholder images
        const rig = {
          meta: {
            imageW: 256,
            imageH: 256,
            monsterId,
            class: klass,
            seed,
            animationConfig: animationConfig || undefined,
            skipCutout: true, // Flag to indicate cutouts were skipped
          },
        };

        const bundle: MonsterBundle & { setting?: string } = {
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
          setting: setting as string, // Include setting in bundle
          images: {
            png128,
            png200,
            png280x200,
            png256,
            png512,
          },
          // Use "skipped" placeholder images for both cutout and background-only
          cutOutImages: {
            png128: skippedPixelized.png128,
            png200: skippedPixelized.png200,
            png280x200: skippedPixelized.png280x200,
            png256: skippedPixelized.png256,
            png512: skippedPixelized.png512,
          },
          backgroundOnlyImages: {
            png128: skippedPixelized.png128,
            png200: skippedPixelized.png200,
            png280x200: skippedPixelized.png280x200,
            png256: skippedPixelized.png256,
            png512: skippedPixelized.png512,
          },
        };

        await saveMonsterBundle(bundle);
      } catch (error) {
        console.warn('Failed to generate skipped placeholder, using fallback placeholder.png:', error);
        // Fallback: use existing placeholder.png file if "SKIPPED" placeholder generation fails
        try {
          const placeholderPath = join(process.cwd(), 'public', 'cdn', 'placeholder.png');
          let placeholderBuffer: Buffer;
          try {
            placeholderBuffer = await fs.readFile(placeholderPath);
          } catch {
            // If placeholder.png doesn't exist, create a simple colored placeholder
            console.warn('placeholder.png not found, creating simple placeholder');
            placeholderBuffer = await sharp({
              create: {
                width: 1024,
                height: 576,
                channels: 4,
                background: { r: 200, g: 200, b: 200, alpha: 1 }
              }
            })
              .png()
              .toBuffer();
          }
          
          // Ensure 16:9 aspect ratio and process
          let processedPlaceholder = await ensure16x9AspectRatio(placeholderBuffer);
          
          // Pixelize the placeholder
          const placeholderPixelized = await pixelize(processedPlaceholder, {
            base: 256,
            colors: 32,
          });
          
          const rig = {
            meta: {
              imageW: 256,
              imageH: 256,
              monsterId,
              class: klass,
              seed,
              animationConfig: animationConfig || undefined,
              skipCutout: true,
            },
          };

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
            // Use fallback placeholder images for both cutout and background-only
            cutOutImages: {
              png128: placeholderPixelized.png128,
              png200: placeholderPixelized.png200,
              png280x200: placeholderPixelized.png280x200,
              png256: placeholderPixelized.png256,
              png512: placeholderPixelized.png512,
            },
            backgroundOnlyImages: {
              png128: placeholderPixelized.png128,
              png200: placeholderPixelized.png200,
              png280x200: placeholderPixelized.png280x200,
              png256: placeholderPixelized.png256,
              png512: placeholderPixelized.png512,
            },
          };

          await saveMonsterBundle(bundle);
        } catch (fallbackError) {
          console.error('Failed to use fallback placeholder, creating without cutout/background images:', fallbackError);
          // Last resort: create bundle without cutout/background images
          const rig = {
            meta: {
              imageW: 256,
              imageH: 256,
              monsterId,
              class: klass,
              seed,
              animationConfig: animationConfig || undefined,
              skipCutout: true,
            },
          };

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
            cutOutImages: undefined,
            backgroundOnlyImages: undefined,
          };

          await saveMonsterBundle(bundle);
        }
      }

      return NextResponse.json({
        monsterId,
        url: `/cdn/monsters/${monsterId}`,
      });
    } else {
      // Full path: Generate character with transparent background, then composite
      // 1) Get the character image (should already be transparent background from preview generation)
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
          
          // Don't crop cutout images - preserve full character including head and feet
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
            height: 576, // 16:9 aspect ratio (but we won't crop to enforce it)
          });
          
          // Don't crop cutout images - preserve full character including head and feet
          refPngCutOut = await ensureTransparentBackground(characterImage.buffer);
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
      const settingConfig = CARD_SETTINGS[setting as CardSetting] || CARD_SETTINGS[DEFAULT_SETTING];
      const paletteDescription = 'warm earth tones with vibrant accents';
      const backgroundPrompt = `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. An atmospheric ${settingConfig.backgroundPhrase}, and dramatic atmosphere. EMPTY scene with ABSOLUTELY NO characters, NO creatures, NO people, NO beings, NO figures, NO entities, NO living things - ONLY the environment, architecture, landscape, ruins, lighting, and atmosphere. Completely empty of any characters or creatures. ${paletteDescription}. Retro SNES/Genesis style, ${settingConfig.technologyLevel}, cinematic composition, 16:9 aspect ratio.`;
      
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

      // 3) Pixelize all versions first, then composite using pixelized images
      // This ensures the composite matches exactly what's displayed in CharacterCard
      console.log('Pixelizing background-only version...');
      const { 
        png128: png128BgOnly, 
        png200: png200BgOnly, 
        png280x200: png280x200BgOnly, 
        png256: png256BgOnly, 
        png512: png512BgOnly,
        palette: bgPalette 
      } = await pixelize(newBackgroundPng, {
        base: 256,
        colors: 32,
      });

      console.log('Pixelizing cut-out version...');
      const cutOutResult = await pixelize(refPngCutOut, {
        base: 256,
        colors: 32,
        preserveFullImage: true, // Preserve full cutout image including top (no cropping)
      });
      
      palette = bgPalette;

      // Composite the pixelized cutout onto the pixelized background
      // This ensures the composite matches exactly what CharacterCard displays
      console.log('Compositing pixelized character on pixelized background...');
      const bgMetadata = await sharp(png280x200BgOnly).metadata();
      const cutOutMetadata = await sharp(cutOutResult.png280x200).metadata();
      
      if (!bgMetadata.width || !bgMetadata.height || !cutOutMetadata.width || !cutOutMetadata.height) {
        throw new Error('Unable to read pixelized image dimensions for compositing');
      }

      // Scale down the character to 80% of background height (matching CharacterCard scale)
      const scaleFactor = 0.8; // 80% scale to match CharacterCard
      const scaledWidth = Math.floor(cutOutMetadata.width * scaleFactor);
      const scaledHeight = Math.floor(cutOutMetadata.height * scaleFactor);
      
      console.log(`Scaling pixelized character from ${cutOutMetadata.width}x${cutOutMetadata.height} to ${scaledWidth}x${scaledHeight} (80%)`);
      
      // Resize the pixelized character cut-out
      const scaledCutOut = await sharp(cutOutResult.png280x200)
        .resize(scaledWidth, scaledHeight, {
          fit: 'inside',
          kernel: sharp.kernel.nearest, // Use nearest neighbor to maintain pixel art quality
        })
        .png()
        .toBuffer();

      // Center the character horizontally, align bottom to background bottom
      const compositeX = Math.floor((bgMetadata.width - scaledWidth) / 2);
      const compositeY = Math.floor(bgMetadata.height - scaledHeight); // Align to bottom
      
      const png280x200 = await sharp(png280x200BgOnly)
        .composite([
          {
            input: scaledCutOut,
            left: Math.max(0, compositeX),
            top: Math.max(0, compositeY),
          }
        ])
        .png()
        .toBuffer();

      // Generate other sizes from the composite
      // For 280x200, we already have it
      // For other sizes, we can scale from the 280x200 composite or create them separately
      // For simplicity, let's scale from the 280x200 composite
      const png128 = await sharp(png280x200)
        .resize(128, Math.round(128 * (200/280)), {
          kernel: sharp.kernel.nearest,
        })
        .png()
        .toBuffer();
      
      const png200 = await sharp(png280x200)
        .resize(200, Math.round(200 * (200/280)), {
          kernel: sharp.kernel.nearest,
        })
        .png()
        .toBuffer();
      
      const png256 = await sharp(png280x200)
        .resize(256, Math.round(256 * (200/280)), {
          kernel: sharp.kernel.nearest,
        })
        .png()
        .toBuffer();
      
      const png512 = await sharp(png280x200)
        .resize(512, Math.round(512 * (200/280)), {
          kernel: sharp.kernel.nearest,
        })
        .png()
        .toBuffer();

      // 4) Create minimal rig metadata (no part extraction needed)
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

      // 5) Persist & return id
      const bundle: MonsterBundle & { setting?: string } = {
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
        setting: setting as string, // Include setting in bundle
        images: {
          png128,
          png200,
          png280x200,
          png256,
          png512,
        },
        cutOutImages: {
          png128: cutOutResult.png128,
          png200: cutOutResult.png200,
          png280x200: cutOutResult.png280x200,
          png256: cutOutResult.png256,
          png512: cutOutResult.png512,
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
    }
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
            prompt: metadata.prompt || null, // Include prompt (null for backward compatibility)
            seed: metadata.seed,
            stats: metadata.stats,
            hasCutout: metadata.hasCutout ?? false, // Include cutout flag (default to false for backward compatibility)
            setting: metadata.setting || null, // Include setting/theme (null for backward compatibility with older monsters)
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

