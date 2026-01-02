import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';
import { join } from 'path';
import { analyzeCharacterImage } from '@/lib/langflow/vision';

// Load environment variables from the root .env file
config({ path: resolve(process.cwd(), '..', '.env') });

/**
 * Get the local file path for a character image
 */
function getLocalImagePath(monsterId: string): string {
  return join(process.cwd(), 'public', 'cdn', 'monsters', monsterId, '280x200.png');
}

/**
 * Character Image Analysis API Route
 *
 * This endpoint analyzes a character image using Langflow vision flow
 * and returns a visual description. This is called ONLY when a user
 * saves a character to avoid wasting tokens on temporary images.
 *
 * Uses direct HTTP implementation to avoid Langflow SDK issues.
 *
 * POST /api/analyze-character-image
 * Body: { monsterId: string, inputComponentId?: string }
 * Returns: { visualDescription: string | null, success: boolean, logs: string[] }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { monsterId, inputComponentId } = await req.json();

    if (!monsterId) {
      return NextResponse.json(
        { error: 'monsterId is required', success: false },
        { status: 400 }
      );
    }

    // Get configuration
    const flowId = process.env.LANGFLOW_VISION_FLOW_ID;
    const defaultInputComponentId = process.env.LANGFLOW_CHAT_INPUT_ID || 'ChatInput';
    const langflowConfigured = !!(process.env.LANGFLOW_BASE_URL && flowId);

    if (!langflowConfigured) {
      console.warn('Langflow not configured - skipping image analysis');
      return NextResponse.json({
        visualDescription: null,
        success: false,
        message: 'Langflow not configured'
      });
    }

    // Get local image file path
    const imagePath = getLocalImagePath(monsterId);
    
    // Call Langflow vision analysis
    const visualDescription = await analyzeCharacterImage(
      imagePath,
      inputComponentId || defaultInputComponentId
    );
    
    const duration = Date.now() - startTime;

    if (visualDescription) {
      console.log(`✅ Character image analyzed: ${imagePath}`);
      console.log(`📝 Visual description: "${visualDescription.substring(0, 100)}..."`);
      console.log(`⏱️  Duration: ${duration}ms`);
    } else {
      console.warn(`⚠️  No visual description generated for: ${imagePath}`);
    }

    return NextResponse.json({
      visualDescription,
      success: !!visualDescription,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`❌ Character image analysis failed: ${errorMsg}`);

    return NextResponse.json(
      {
        error: errorMsg,
        visualDescription: null,
        success: false,
        duration,
      },
      { status: 500 }
    );
  }
}

// Made with Bob
