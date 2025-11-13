import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';
import EverArt from 'everart';

// Load environment variables from the root .env file
config({ path: resolve(process.cwd(), '..', '.env') });

/**
 * Builds the base pixel art prompt template with user's description
 */
function buildPixelArtPrompt(userPrompt: string): string {
  // Default values for template placeholders
  const creature = 'creature';
  const uniqueFeature = userPrompt.trim() || 'distinctive fantasy appearance';
  const backgroundScene = 'a medieval high-fantasy setting';
  const paletteDescription = 'warm earth tones with vibrant accents';
  
  // Try to extract creature type from user prompt (simple heuristic)
  // Look for common creature/class words at the start
  const promptLower = userPrompt.toLowerCase().trim();
  const creatureMatch = promptLower.match(/^(?:a |an |the )?([a-z]+)/);
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
    
    // Build the base pixel art prompt using the template
    let enhancedPrompt = buildPixelArtPrompt(prompt);
    
    // Add transparent background request if needed
    if (transparentBackground) {
      // Add transparent background request to prompt
      // Try multiple phrasings to increase chances of success
      const bgPhrases = [
        ', transparent background',
        ', no background',
        ', alpha channel',
        ', isolated on transparent background',
      ];
      // Use the first phrase (most common)
      enhancedPrompt = enhancedPrompt + bgPhrases[0];
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

      return NextResponse.json({
        imageUrl,
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

