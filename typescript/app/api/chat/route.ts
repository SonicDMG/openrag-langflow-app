import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the root .env file
config({ path: resolve(process.cwd(), '..', '.env') });

const langflowServerUrl = process.env.LANGFLOW_SERVER_URL;
const langflowApiKey = process.env.LANGFLOW_API_KEY;
const modelId = '1098eea1-6649-4e1d-aed1-b77249fb8dd0';

// Initialize OpenAI client for Langflow
function getLangflowClient() {

  if (!langflowServerUrl || !langflowApiKey) {
    throw new Error('LANGFLOW_SERVER_URL and LANGFLOW_API_KEY must be set');
  }

  return new OpenAI({
    baseURL: `${langflowServerUrl}/api/v1/`,
    defaultHeaders: {
      'x-api-key': langflowApiKey,
    },
    apiKey: 'dummy-api-key', // Required by OpenAI SDK but not used by Langflow
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message, previousResponseId } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = getLangflowClient();

    // Build request parameters for the Responses API
    const requestParams: {
      model: string;
      input: string;
      stream: boolean;
      extra_body?: { previous_response_id: string };
    } = {
      model: modelId,
      input: message,
      stream: true,
    };

    // Add previous_response_id if provided (for conversation continuity)
    if (previousResponseId) {
      requestParams.extra_body = { previous_response_id: previousResponseId };
    }

    // Create a streaming response
    const stream = await client.responses.create(requestParams);

    // Create a ReadableStream to send chunks to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let responseId: string | null = null;

        try {
          // Check if stream is iterable (it should be when stream: true)
          if (!stream || typeof (stream as any)[Symbol.asyncIterator] !== 'function') {
            throw new Error('Stream is not iterable');
          }

          for await (const chunk of stream as AsyncIterable<any>) {
            // Extract response ID from chunk (for conversation continuity)
            if (responseId === null) {
              responseId = (chunk as any).id || null;
            }

            // Extract content delta from chunk
            const delta = (chunk as any).delta;
            if (delta) {
              // Handle both dict and string formats
              const text = typeof delta === 'string' ? delta : delta.content || '';

              if (text) {
                // Send chunk as JSON
                const chunkData = JSON.stringify({
                  type: 'chunk',
                  content: text,
                });
                controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
              }
            }

            // Check for completion status
            if ((chunk as any).status === 'completed') {
              if (responseId === null) {
                responseId = (chunk as any).id || null;
              }

              // Send final response ID
              const finalData = JSON.stringify({
                type: 'done',
                responseId: responseId,
              });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
              break;
            }
          }
        } catch (error) {
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

