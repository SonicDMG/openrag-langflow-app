import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';
import EverArt from 'everart';
import { downloadImage } from '@/app/dnd/server/imageGeneration';
import { removeBackground } from '@/app/dnd/server/backgroundRemoval';
import { CARD_SETTINGS, DEFAULT_SETTING } from '@/app/dnd/constants';
import { CardSetting } from '@/app/dnd/types';

// Load environment variables from the root .env file
config({ path: resolve(process.cwd(), '..', '.env') });

// Helper function to format error responses consistently
function formatErrorResponse(error: unknown): { error: string } {
  return {
    error: error instanceof Error ? error.message : 'Internal server error',
  };
}

/**
 * Enhances a character description with race and sex information
 * @param description - The base character description
 * @param race - Character race (optional, use "n/a" if not applicable)
 * @param sex - Character sex (optional, use "n/a" if not applicable)
 * @returns Enhanced description with race and sex included
 */
function enhanceDescriptionWithRaceAndSex(description: string, race?: string, sex?: string): string {
  const parts: string[] = [];
  
  if (race && race !== 'n/a' && race.trim()) {
    parts.push(race.trim());
  }
  
  if (sex && sex !== 'n/a' && sex.trim()) {
    parts.push(sex.trim());
  }
  
  if (parts.length > 0) {
    return `${parts.join(' ')} ${description}`.trim();
  }
  
  return description;
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
      return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. A ${firstWord}${enhancedRemaining ? `: ${enhancedRemaining}` : ''}, depicted in a distinctly ${settingConfig.settingPhrase} world. Placed in a expansive ${settingConfig.settingPhrase} setting, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Position the character in the lower third of the frame, (facing the camera), viewed from a pulled-back wide-angle perspective showing expansive landscape surrounding them. The character should occupy only 60-70% of the composition, with dominant landscape and sky filling the remainder. Retro SNES/Genesis style, ${settingConfig.technologyLevel}.`;
    }
  }
  
  // Fallback: use the full user prompt as the unique feature
  return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. A ${creature}${enhancedFeature ? `: ${enhancedFeature}` : ''}, depicted in a distinctly ${settingConfig.settingPhrase} world. Placed in a expansive ${settingConfig.settingPhrase} setting, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Position the character in the lower third of the frame, (facing the camera), viewed from a pulled-back wide-angle perspective showing expansive landscape surrounding them. The character should occupy only 60-70% of the composition, with dominant landscape and sky filling the remainder. Retro SNES/Genesis style, ${settingConfig.technologyLevel}.`;
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
    const { prompt, seed, model = '5000', image_count = 1, transparentBackground = true, aspectRatio, setting = DEFAULT_SETTING, pixelize = false, race, sex } = await req.json();

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

      // Process the image based on requirements
      let finalImageUrl = imageUrl;
      let imageBuffer: Buffer | null = null;

      if (transparentBackground || pixelize) {
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
          if (pixelize) {
            console.log('Pixelizing image to match app style...');
            const { ensure16x9AspectRatio } = await import('@/app/dnd/server/imageGeneration');
            const sharp = (await import('sharp')).default;
            const IQ = await import('image-q');
            
            // Ensure 16:9 aspect ratio first
            imageBuffer = await ensure16x9AspectRatio(imageBuffer);
            
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
              throw new Error('Quantization failed');
            }
            
            // Convert quantized result to buffer
            let outBuf: Buffer | undefined;
            if (out instanceof IQ.utils.PointContainer) {
              outBuf = Buffer.from(out.toUint8Array());
            } else {
              // Fallback to sharp quantization
              console.warn('image-q quantization failed, using sharp quantization fallback');
              imageBuffer = await sharp(nearest)
                .png({ colors: 32, dither: 1 })
                .toBuffer();
            }
            
            if (outBuf) {
              const quantizedImage = await sharp(outBuf, {
                raw: { width: info.width, height: info.height, channels: 4 },
              })
                .png()
                .toBuffer();
              
              imageBuffer = quantizedImage;
            }
            
            console.log('Image pixelized successfully');
          }
          
          // Convert to base64 data URL for immediate use
          const base64 = imageBuffer.toString('base64');
          finalImageUrl = `data:image/png;base64,${base64}`;
        } catch (error) {
          console.warn('Failed to process image:', error);
          // Continue with original imageUrl if processing fails
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

