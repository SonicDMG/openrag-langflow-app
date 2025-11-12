import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pixelize } from '@/app/dnd/server/pixelize';
import { autoRig } from '@/app/dnd/server/autoRig';
import { saveMonsterBundle } from '@/app/dnd/server/storage';
import { downloadImage } from '@/app/dnd/server/imageGeneration';
import { removeBackground, ensureTransparentBackground } from '@/app/dnd/server/backgroundRemoval';
import { MonsterBundle } from '@/app/dnd/utils/rigTypes';

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

    // 2) Pixelize (256 suggested as working size)
          const { png128, png256, png512, palette } = await pixelize(refPng, {
            base: 256,
            colors: 32, // Increased from 16 to 32 for better color detail
          });

    // 3) Auto-rig (returns rig.json + per-part PNGs)
    const { rig, partsPngs } = await autoRig(png256);

    // Add metadata to rig (including animation config if provided)
    rig.meta = {
      ...rig.meta,
      monsterId,
      class: klass,
      seed,
      animationConfig: animationConfig || undefined,
      // Override weaponPart from animationConfig if provided
      weaponPart: animationConfig?.weaponPart || rig.meta?.weaponPart,
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
        png256,
        png512,
        partsPngs,
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

