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

// Extract response ID from chunk (handles both plain objects and class instances)
function extractResponseId(chunk: unknown): string | null {
  const chunkObj = typeof (chunk as { toJSON?: () => unknown })?.toJSON === 'function' 
    ? (chunk as { toJSON: () => unknown }).toJSON() 
    : chunk;
  return (chunkObj as { id?: string })?.id || (chunk as { id?: string })?.id || null;
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
    // According to Langflow docs, previous_response_id should be in the request body
    // Try both extra_body (OpenAI SDK standard) and direct parameter (some SDKs may need this)
    const requestParams: {
      model: string;
      input: string;
      stream: boolean;
      extra_body?: { previous_response_id: string };
      previous_response_id?: string;
    } = {
      model: modelId,
      input: message,
      stream: true,
    };

    // Add previous_response_id if provided (for conversation continuity)
    // Use both extra_body (OpenAI SDK standard) and direct parameter to ensure compatibility
    if (previousResponseId) {
      requestParams.extra_body = { previous_response_id: previousResponseId };
      requestParams.previous_response_id = previousResponseId;
    }

    // Create a streaming response
    const stream = await client.responses.create(requestParams);

    // Create a ReadableStream to send chunks to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let responseId: string | null = null;
        let completed = false;

        try {
          // Check if stream is iterable (it should be when stream: true)
          if (!stream || typeof (stream as { [Symbol.asyncIterator]?: () => unknown })[Symbol.asyncIterator] !== 'function') {
            throw new Error('Stream is not iterable');
          }

          // According to Langflow docs, each chunk has an 'id' field that is the response identifier
          // The id field is present in ALL chunks, so we can extract it from the first chunk
          for await (const chunk of stream as unknown as AsyncIterable<unknown>) {
            // Extract response ID from chunk (for conversation continuity)
            // According to Langflow API docs, chunk structure is:
            // { id: string, object: "response.chunk", created: number, model: string, delta: {...}, status: string | null }
            // Match Python behavior: check every chunk until we find one with an id
            if (responseId === null) {
              responseId = extractResponseId(chunk);
            }

            // Extract content delta from chunk
            const typedChunk = chunk as { delta?: string | { content?: string }; status?: string };
            const delta = typedChunk.delta;
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
            // According to Langflow docs, the stream continues until a chunk with "status": "completed"
            if (typedChunk.status === 'completed') {
              // Ensure we have the response ID (match Python behavior: try to get from this chunk if still null)
              if (responseId === null) {
                responseId = extractResponseId(chunk);
              }

              // Send final response ID to client (match Python: always return response_id even if None)
              const finalData = JSON.stringify({
                type: 'done',
                responseId: responseId,
              });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
              completed = true;
              break;
            }
          }
          
          // If stream ended without completion status, ensure we send response ID if we have it
          // This handles edge cases where the stream might end unexpectedly
          // Match Python behavior: always return response_id (even if None)
          if (!completed) {
            const finalData = JSON.stringify({
              type: 'done',
              responseId: responseId,
            });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
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

