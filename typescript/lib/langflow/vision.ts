import { LangflowClient } from '@datastax/langflow-client';
import { readFile } from 'fs/promises';
import { basename } from 'path';

/**
 * Initialize Langflow client for vision analysis
 */
function getLangflowClient(): LangflowClient | null {
  const baseUrl = process.env.LANGFLOW_BASE_URL;
  const apiKey = process.env.LANGFLOW_API_KEY;

  if (!baseUrl) {
    console.warn('LANGFLOW_BASE_URL not configured, vision analysis disabled');
    return null;
  }

  return new LangflowClient({
    baseUrl,
    apiKey: apiKey || undefined,
  });
}

/**
 * Analyze a character image using Langflow vision flow
 *
 * @param imagePath - Local file path to the image
 * @param inputComponentId - The ID of the Chat Input component in Langflow (optional, defaults to 'ChatInput')
 * @param sessionId - Optional unique session ID for this analysis (auto-generated if not provided)
 * @returns Visual description of the character, or null if analysis fails
 *
 * @example
 * const description = await analyzeCharacterImage('/path/to/image.png', 'ChatInput-xz9hn');
 * // Returns: "A tall elven warrior with silver armor..."
 */
export async function analyzeCharacterImage(
  imagePath: string,
  inputComponentId: string = 'ChatInput',
  sessionId?: string
): Promise<string | null> {
  const client = getLangflowClient();
  const flowId = process.env.LANGFLOW_VISION_FLOW_ID;

  if (!client || !flowId) {
    console.warn('Langflow vision not fully configured, skipping image analysis');
    return null;
  }

  try {
    // Read and upload the file
    const imageBuffer = await readFile(imagePath);
    const filename = basename(imagePath);
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    const imageFile = new File([imageBlob], filename, { type: 'image/png' });
    
    // Create a flow instance and upload
    const flow = client.flow(flowId);
    const uploadResponse = await flow.uploadFile(imageFile);
    
    // Run the flow with the uploaded file path in tweaks
    const tweaks = {
      [inputComponentId]: {
        files: [uploadResponse.filePath],
      },
    } as any;
    
    // NOTE: Do NOT include session_id - it causes "list index out of range" bug with ChatInput files
    const response = await flow.run('Analyze this character image', {
      input_type: 'chat',
      output_type: 'chat',
      tweaks,
    });

    // Extract the visual description from the response
    let visualDescription = response.chatOutputText();
    
    if (!visualDescription) {
      // Fallback: try to extract from raw response structure
      try {
        const outputs = (response as any).outputs;
        if (outputs && outputs[0]?.outputs?.[0]?.results?.message?.data?.text) {
          visualDescription = outputs[0].outputs[0].results.message.data.text;
        }
      } catch (e) {
        // Silent fallback failure
      }
    }

    if (visualDescription && typeof visualDescription === 'string') {
      return visualDescription.trim();
    }

    return null;
  } catch (error) {
    console.error('Error analyzing character image:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Analyze a character image with streaming support (optional)
 * Useful for real-time feedback during analysis
 *
 * @param imageUrl - URL of the image to analyze
 * @param imageBase64 - Base64 encoded image (alternative to URL)
 * @param sessionId - Optional unique session ID for this analysis (auto-generated if not provided)
 */
export async function* analyzeCharacterImageStreaming(
  imageUrl?: string,
  imageBase64?: string,
  sessionId?: string
): AsyncGenerator<string> {
  const client = getLangflowClient();
  const flowId = process.env.LANGFLOW_VISION_FLOW_ID;

  if (!client || !flowId) {
    console.warn('Langflow vision not fully configured');
    return;
  }

  try {
    // Generate unique session ID if not provided
    const uniqueSessionId = sessionId || `vision-stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log('Starting streaming vision analysis...');
    console.log('Session ID:', uniqueSessionId);
    
    const flow = client.flow(flowId);
    const stream = await flow.stream(imageBase64 || imageUrl || '', {
      input_type: 'chat',
      output_type: 'chat',
      session_id: uniqueSessionId,
    });

    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // value is a StreamEvent object
        if (value.event === 'token' && value.data?.chunk) {
          yield value.data.chunk;
        } else if (value.event === 'add_message' && value.data?.text) {
          yield value.data.text;
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Error in streaming vision analysis:', error);
  }
}

// Made with Bob
