import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';
import EverArt from 'everart';
import { downloadImage } from '@/app/battle-arena/services/server/image';
import { removeBackground } from '@/app/battle-arena/services/server/image';
import { CARD_SETTINGS, DEFAULT_SETTING } from '@/app/battle-arena/lib/constants';
import { CardSetting } from '@/app/battle-arena/lib/types';
import { enhanceDescriptionWithRaceAndSex } from '@/app/battle-arena/utils/promptEnhancement';

// Load environment variables from the root .env file
config({ path: resolve(process.cwd(), '..', '.env') });

// Helper function to format error responses consistently
function formatErrorResponse(error: unknown): { error: string } {
  return {
    error: error instanceof Error ? error.message : 'Internal server error',
  };
}

/**
 * Builds the base pixel art prompt template with user's description
 * @param userPrompt - The user's character description
 * @param transparentBackground - If true, removes background references from prompt
 * @param setting - The card setting/theme (medieval, futuristic, etc.)
 * @param race - Character race (optional, use "n/a" if not applicable)
 * @param sex - Character sex (optional, use "n/a" if not applicable)
 */
function buildPixelArtPrompt(userPrompt: string, transparentBackground: boolean = false, setting: CardSetting = DEFAULT_SETTING as CardSetting, race?: string, sex?: string): string {
  // Default values for template placeholders
  const creature = 'creature';
  const uniqueFeature = userPrompt.trim() || 'distinctive fantasy appearance';
  const paletteDescription = 'warm earth tones with vibrant accents';
  const settingConfig = CARD_SETTINGS[setting] || CARD_SETTINGS[DEFAULT_SETTING];
  
  // Enhance description with race and sex
  const enhancedFeature = enhanceDescriptionWithRaceAndSex(uniqueFeature, race, sex);
  
  // Try to extract creature type from user prompt (simple heuristic)
  // Look for common creature/class words at the start
  const promptLower = userPrompt.toLowerCase().trim();
  const creatureMatch = promptLower.match(/^(?:a |an |the )?([a-z]+)/);
  
  if (transparentBackground) {
    // For transparent background, focus on isolated character only - no background references
    if (creatureMatch) {
      const firstWord = creatureMatch[1];
      // Common creature/class types
      const creatureTypes = ['wizard', 'warrior', 'rogue', 'cleric', 'ranger', 'dragon', 'goblin', 'orc', 'troll', 'demon', 'angel', 'knight', 'mage', 'sorcerer', 'monk', 'bard', 'paladin', 'barbarian', 'druid', 'warlock'];
      if (creatureTypes.includes(firstWord)) {
        const remainingPrompt = userPrompt.substring(userPrompt.toLowerCase().indexOf(firstWord) + firstWord.length).trim();
        const enhancedRemaining = enhanceDescriptionWithRaceAndSex(remainingPrompt, race, sex);
        return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. A ${firstWord}${enhancedRemaining ? `: ${enhancedRemaining}` : ''}, isolated character sprite, no background scene, no environment, no setting. Rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, ${settingConfig.technologyLevel}. Centered composition, transparent background.`;
      }
    }
    // Fallback for transparent background
    return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. A ${creature}${enhancedFeature ? `: ${enhancedFeature}` : ''}, isolated character sprite, no background scene, no environment, no setting. Rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, ${settingConfig.technologyLevel}. Centered composition, transparent background.`;
  }
  
  // Prompts with background
  if (creatureMatch) {
    const firstWord = creatureMatch[1];
    // Common creature/class types
    const creatureTypes = ['wizard', 'warrior', 'rogue', 'cleric', 'ranger', 'dragon', 'goblin', 'orc', 'troll', 'demon', 'angel', 'knight', 'mage', 'sorcerer', 'monk', 'bard', 'paladin', 'barbarian', 'druid', 'warlock'];
    if (creatureTypes.includes(firstWord)) {
      // Use the matched creature type
      const remainingPrompt = userPrompt.substring(userPrompt.toLowerCase().indexOf(firstWord) + firstWord.length).trim();
      const enhancedRemaining = enhanceDescriptionWithRaceAndSex(remainingPrompt, race, sex);
      return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. A ${firstWord}${enhancedRemaining ? `: ${enhancedRemaining}` : ''}, depicted in a distinctly ${settingConfig.settingPhrase} world. Placed in a expansive ${settingConfig.settingPhrase} setting, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Character (facing the camera), centered in frame. Retro SNES/Genesis style, ${settingConfig.technologyLevel}.`;
    }
  }
  
  // Fallback: use the full user prompt as the unique feature
  return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. A ${creature}${enhancedFeature ? `: ${enhancedFeature}` : ''}, depicted in a distinctly ${settingConfig.settingPhrase} world. Placed in a expansive ${settingConfig.settingPhrase} setting, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Character (facing the camera), centered in frame. Retro SNES/Genesis style, ${settingConfig.technologyLevel}.`;
}

/**
 * Image Generation API Route
 * 
 * This endpoint generates images using EverArt API via the SDK.
 * Based on the working implementation from codebeasts app (imageUtils.ts approach).
 * 
 * Requires EVERART_API_KEY environment variable to be set.
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, seed, model = '5000', image_count = 1, transparentBackground = true, aspectRatio, setting = DEFAULT_SETTING, pixelize = false, race, sex, skipPixelize = false } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }
    
    // Check if the prompt already contains the pixel art template keywords
    // If so, it's likely a full prompt from the MonsterCreator component
    const isFullPrompt = prompt.includes('32-bit pixel art') || 
                        prompt.includes('chunky pixel clusters') || 
                        prompt.includes('retro fantasy aesthetic');
    
    // Build the base pixel art prompt using the template
    // If it's already a full prompt, check if it needs background removal
    let enhancedPrompt: string;
    if (isFullPrompt) {
      // If it's a full prompt, check if it contains background references
      // If transparentBackground is true and prompt has background references, rebuild it
      if (transparentBackground && 
          (prompt.includes('depicted in a distinctly medieval high-fantasy world') || 
           prompt.includes('placed in') || 
           prompt.includes('Placed in'))) {
        // Extract character description from the existing prompt
        const match = prompt.match(/retro .+? aesthetic\.\s*(.+?)(?:,\s*depicted|,\s*Placed|$)/i);
        const description = match ? match[1].trim() : prompt;
        enhancedPrompt = buildPixelArtPrompt(description, true, setting as CardSetting, race, sex); // true = transparent background
      } else {
        // Use prompt as-is, but ensure transparent background is mentioned if needed
        enhancedPrompt = prompt;
        if (transparentBackground && !enhancedPrompt.toLowerCase().includes('transparent') && 
            !enhancedPrompt.toLowerCase().includes('no background')) {
          enhancedPrompt = enhancedPrompt + ', transparent background, isolated character, no background scene, no environment';
        }
        // If transparentBackground is false, use prompt exactly as-is (don't modify it)
      }
    } else {
      // Build new prompt with transparent background if requested
      enhancedPrompt = buildPixelArtPrompt(prompt, transparentBackground, setting as CardSetting, race, sex);
    }
    
    // Note: aspect ratio is already specified in the template (16:9)
    // Additional aspect ratio hint can still be added if specified
    if (aspectRatio && aspectRatio !== '16:9') {
      const aspectRatioHint = `, ${aspectRatio} aspect ratio`;
      enhancedPrompt = enhancedPrompt + aspectRatioHint;
    }

    // Log the final prompt being sent to EverArt
    console.log('=== FINAL PROMPT SENT TO EVERART ===');
    console.log(enhancedPrompt);
    console.log('=== END FINAL PROMPT ===');

    const apiKey = process.env.EVERART_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'EverArt API key not configured. Please set EVERART_API_KEY environment variable.',
        },
        { status: 500 }
      );
    }

    try {
      // Use EverArt SDK (matching the imageUtils.ts approach from codebeasts)
      const everartClient = new EverArt(apiKey);
      
      // Calculate 16:9 dimensions (using 1024x576 for good quality)
      // 16:9 aspect ratio = width/height = 16/9
      // For height of 576, width = 576 * 16/9 = 1024
      const targetHeight = 576;
      const targetWidth = 1024; // 16:9 ratio
      
      const baseParams: {
        imageCount?: number;
        width?: number;
        height?: number;
      } = {
        imageCount: image_count,
        width: targetWidth,
        height: targetHeight, // 16:9 aspect ratio (1024x576)
      };
      
      // Note: seed is not supported by EverArt SDK options
      // If seed is needed, it may need to be added to the prompt or API may not support it

      // Create generation using SDK with enhanced prompt
      const generations = await everartClient.v1.generations.create(
        model,
        enhancedPrompt,
        'txt2img',
        baseParams
      );

      if (!generations || generations.length === 0) {
        return NextResponse.json(
          { error: 'No generations returned from EverArt API' },
          { status: 500 }
        );
      }

      // Poll for the result
      const result = await everartClient.v1.generations.fetchWithPolling(generations[0].id);
      const imageUrl = result.image_url;

      if (!imageUrl) {
        console.error('No image_url in result:', result);
        return NextResponse.json(
          {
            error: 'Image generation completed but no image URL was returned',
            result,
          },
          { status: 500 }
        );
      }

      // Log the original image URL for debugging
      console.log('=== ORIGINAL IMAGE URL FROM EVERART ===');
      console.log(imageUrl);
      console.log('=== END ORIGINAL IMAGE URL ===');

      // Process the image based on requirements
      let finalImageUrl = imageUrl;
      let imageBuffer: Buffer | null = null;

      // Skip pixelization if explicitly requested (for debugging/testing)
      const shouldPixelize = pixelize && !skipPixelize;

      if (transparentBackground || shouldPixelize) {
        try {
          imageBuffer = await downloadImage(imageUrl);
          
          // Remove background if requested
          if (transparentBackground) {
            console.log('Removing background from generated image...');
            imageBuffer = await removeBackground(imageBuffer, {
              threshold: 30,
              useEdgeDetection: true,
              preserveAntiAliasing: true,
            });
          }

          // Pixelize if requested
          if (shouldPixelize) {
            console.log('Pixelizing image to match app style...');
            const { ensure16x9AspectRatio } = await import('@/app/battle-arena/services/server/image');
            const sharp = (await import('sharp')).default;
            const IQ = await import('image-q');
            
            try {
              // Ensure 16:9 aspect ratio first
              imageBuffer = await ensure16x9AspectRatio(imageBuffer);
              
              // Validate image buffer before processing
              const prePixelizeMetadata = await sharp(imageBuffer).metadata();
              if (!prePixelizeMetadata.width || !prePixelizeMetadata.height) {
                throw new Error('Invalid image buffer before pixelization');
              }
              console.log(`Pre-pixelize dimensions: ${prePixelizeMetadata.width}x${prePixelizeMetadata.height}`);
              
              // Pixelize the image - for 16:9 images, we'll use a custom approach
              // Target size: 1024x576 (16:9)
              const targetWidth = 1024;
              const targetHeight = 576;
              const smallHeight = 180; // Downscale to this for pixelization
              const smallWidth = Math.round(smallHeight * (16 / 9)); // 320
              
              // Downscale aggressively
              const smallBuf = await sharp(imageBuffer)
                .resize(smallWidth, smallHeight, { kernel: sharp.kernel.lanczos3 })
                .png()
                .toBuffer();
              
              // Upscale with nearest neighbor
              const nearest = await sharp(smallBuf)
                .resize(targetWidth, targetHeight, { kernel: sharp.kernel.nearest })
                .png()
                .toBuffer();
              
              // Reduce color palette to 32 colors using image-q (same approach as pixelize.ts)
              const img = sharp(nearest);
              const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
              
              // Validate we got valid image data
              if (!data || !info || !info.width || !info.height) {
                throw new Error('Failed to extract raw image data for quantization');
              }
              
              // Use image-q for quantization (matching pixelize.ts implementation)
              const pointContainer = IQ.utils.PointContainer.fromUint8Array(
                data,
                info.width,
                info.height
              );
              
              const distance = new IQ.distance.EuclideanBT709();
              const paletteQuantizer = new IQ.palette.NeuQuant(distance, 32);
              paletteQuantizer.sample(pointContainer);
              const palette = paletteQuantizer.quantizeSync();
              
              const quantizer = new IQ.image.NearestColor(distance);
              const out = quantizer.quantize(pointContainer, palette);
              
              if (!out) {
                throw new Error('Quantization failed - no output from quantizer');
              }
              
              // Convert quantized result to buffer
              let outBuf: Buffer | undefined;
              if (out instanceof IQ.utils.PointContainer) {
                outBuf = Buffer.from(out.toUint8Array());
                console.log('Using image-q quantization result');
              } else {
                // Fallback to sharp quantization
                console.warn('image-q quantization failed, using sharp quantization fallback');
                imageBuffer = await sharp(nearest)
                  .png({ colors: 32, dither: 1 })
                  .toBuffer();
              }
              
              if (outBuf) {
                // Validate outBuf has expected size
                const expectedSize = info.width * info.height * 4; // RGBA = 4 channels
                if (outBuf.length !== expectedSize) {
                  console.error(`Buffer size mismatch: expected ${expectedSize}, got ${outBuf.length}`);
                  throw new Error(`Quantized buffer size mismatch: expected ${expectedSize} bytes, got ${outBuf.length}`);
                }
                
                const quantizedImage = await sharp(outBuf, {
                  raw: { width: info.width, height: info.height, channels: 4 },
                })
                  .png()
                  .toBuffer();
                
                // Validate the final image
                const finalMetadata = await sharp(quantizedImage).metadata();
                if (!finalMetadata.width || !finalMetadata.height) {
                  throw new Error('Pixelized image is invalid');
                }
                console.log(`Post-pixelize dimensions: ${finalMetadata.width}x${finalMetadata.height}`);
                
                imageBuffer = quantizedImage;
              }
              
              // Final validation - check if image is mostly black (which would indicate a problem)
              const stats = await sharp(imageBuffer)
                .stats();
              const avgBrightness = stats.channels.reduce((sum, ch) => sum + (ch.mean || 0), 0) / stats.channels.length;
              if (avgBrightness < 10) {
                console.error(`Warning: Pixelized image appears to be mostly black (avg brightness: ${avgBrightness.toFixed(2)})`);
                throw new Error('Pixelized image appears to be black - skipping pixelization');
              }
              
              console.log('Image pixelized successfully');
            } catch (pixelizeError) {
              console.error('Pixelization error:', pixelizeError);
              // If pixelization fails, return the original EverArt image URL directly
              // This avoids any processing issues and gives the user the image that EverArt generated
              console.log('Fell back to original EverArt image URL due to pixelization error');
              finalImageUrl = imageUrl; // Use the original URL from EverArt
              imageBuffer = null; // Don't process it
            }
          }
          
          // Convert to base64 data URL for immediate use (only if we have a processed buffer)
          if (imageBuffer) {
            const base64 = imageBuffer.toString('base64');
            finalImageUrl = `data:image/png;base64,${base64}`;
          }
          // If imageBuffer is null, finalImageUrl should already be set to the original imageUrl
        } catch (error) {
          console.warn('Failed to process image:', error);
          // Continue with original imageUrl if processing fails
          finalImageUrl = imageUrl;
        }
      }

      return NextResponse.json({
        imageUrl: finalImageUrl,
        model,
        seed,
      });
    } catch (sdkError: any) {
      console.error('EverArt SDK error:', sdkError);
      return NextResponse.json(
        {
          error: sdkError?.message || 'Failed to generate image with EverArt SDK',
          details: sdkError?.response?.data || sdkError?.toString(),
        },
        { status: sdkError?.status || sdkError?.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

