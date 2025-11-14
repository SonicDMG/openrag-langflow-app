import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';
import EverArt from 'everart';
import { downloadImage } from '@/app/dnd/server/imageGeneration';
import { removeBackground } from '@/app/dnd/server/backgroundRemoval';

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
 */
function buildPixelArtPrompt(userPrompt: string, transparentBackground: boolean = false): string {
  // Default values for template placeholders
  const creature = 'creature';
  const uniqueFeature = userPrompt.trim() || 'distinctive fantasy appearance';
  const paletteDescription = 'warm earth tones with vibrant accents';
  
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
        return `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro fantasy aesthetic. A ${firstWord}${remainingPrompt ? ` with ${remainingPrompt}` : ''}, isolated character sprite, no background scene, no environment, no setting. Rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, no modern objects or technology. Centered composition, transparent background, 16:9 aspect ratio. --ar 16:9 --style raw`;
      }
    }
    // Fallback for transparent background
    return `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro fantasy aesthetic. A ${creature} with ${uniqueFeature}, isolated character sprite, no background scene, no environment, no setting. Rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, no modern objects or technology. Centered composition, transparent background, 16:9 aspect ratio. --ar 16:9 --style raw`;
  }
  
  // Original prompts with background (for reference)
  const backgroundScene = 'a medieval high-fantasy setting';
  if (creatureMatch) {
    const firstWord = creatureMatch[1];
    // Common creature/class types
    const creatureTypes = ['wizard', 'warrior', 'rogue', 'cleric', 'ranger', 'dragon', 'goblin', 'orc', 'troll', 'demon', 'angel', 'knight', 'mage', 'sorcerer', 'monk', 'bard', 'paladin', 'barbarian', 'druid', 'warlock'];
    if (creatureTypes.includes(firstWord)) {
      // Use the matched creature type
      const remainingPrompt = userPrompt.substring(userPrompt.toLowerCase().indexOf(firstWord) + firstWord.length).trim();
      return `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro fantasy aesthetic. A ${firstWord}${remainingPrompt ? ` with ${remainingPrompt}` : ''}, depicted in a distinctly medieval high-fantasy world. The creature is placed in ${backgroundScene}, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, no modern objects or technology. Cinematic composition, 16:9 aspect ratio. --ar 16:9 --style raw`;
    }
  }
  
  // Fallback: use the full user prompt as the unique feature
  return `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro fantasy aesthetic. A ${creature} with ${uniqueFeature}, depicted in a distinctly medieval high-fantasy world. The creature is placed in ${backgroundScene}, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, no modern objects or technology. Cinematic composition, 16:9 aspect ratio. --ar 16:9 --style raw`;
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
    const { prompt, seed, model = '5000', image_count = 1, transparentBackground = true, aspectRatio } = await req.json();

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
        const match = prompt.match(/retro fantasy aesthetic\.\s*(.+?)(?:,\s*depicted|,\s*Placed|$)/i);
        const description = match ? match[1].trim() : prompt;
        enhancedPrompt = buildPixelArtPrompt(description, true); // true = transparent background
      } else {
        // Use prompt as-is, but ensure transparent background is mentioned if needed
        enhancedPrompt = prompt;
        if (transparentBackground && !enhancedPrompt.toLowerCase().includes('transparent') && 
            !enhancedPrompt.toLowerCase().includes('no background')) {
          enhancedPrompt = enhancedPrompt + ', transparent background, isolated character, no background scene, no environment';
        }
      }
    } else {
      // Build new prompt with transparent background if requested
      enhancedPrompt = buildPixelArtPrompt(prompt, transparentBackground);
    }
    
    // Note: aspect ratio is already specified in the template (16:9)
    // Additional aspect ratio hint can still be added if specified
    if (aspectRatio && aspectRatio !== '16:9') {
      const aspectRatioHint = `, ${aspectRatio} aspect ratio`;
      enhancedPrompt = enhancedPrompt + aspectRatioHint;
    }

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

      // If transparent background was requested, process the image to remove background
      let finalImageUrl = imageUrl;
      if (transparentBackground) {
        try {
          console.log('Removing background from generated image...');
          const imageBuffer = await downloadImage(imageUrl);
          const processedBuffer = await removeBackground(imageBuffer, {
            threshold: 30,
            useEdgeDetection: true,
            preserveAntiAliasing: true,
          });
          
          // Convert to base64 data URL for immediate use
          const base64 = processedBuffer.toString('base64');
          finalImageUrl = `data:image/png;base64,${base64}`;
          console.log('Background removed successfully, returning as data URL');
        } catch (error) {
          console.warn('Failed to remove background, using original image:', error);
          // Continue with original imageUrl if background removal fails
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

