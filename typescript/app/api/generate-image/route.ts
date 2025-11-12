import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';
import EverArt from 'everart';

// Load environment variables from the root .env file
config({ path: resolve(process.cwd(), '..', '.env') });

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
    const { prompt, seed, model = '5000', image_count = 1 } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
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
      
      const baseParams: {
        imageCount?: number;
        seed?: number;
      } = {
        imageCount: image_count,
      };
      
      if (seed) {
        baseParams.seed = seed;
      }

      // Create generation using SDK
      const generations = await everartClient.v1.generations.create(
        model,
        prompt,
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

