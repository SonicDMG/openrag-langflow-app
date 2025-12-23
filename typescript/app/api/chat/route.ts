import { NextRequest } from 'next/server';
import { OpenRAGClient } from 'openrag-sdk';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the root .env file
config({ path: resolve(process.cwd(), '..', '.env') });

// Helper function to format error responses consistently
function formatErrorResponse(error: unknown): { error: string } {
  return {
    error: error instanceof Error ? error.message : 'Internal server error',
  };
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

    // Initialize OpenRAG client
    // Client auto-discovers OPENRAG_API_KEY and OPENRAG_URL from environment
    const client = new OpenRAGClient();

    // Create a ReadableStream to send chunks to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let chatId: string | null = null;
        let completed = false;

        try {
          // Use OpenRAG SDK's streaming API
          // Note: previousResponseId maps to chatId in OpenRAG SDK
          const stream = await client.chat.stream({
            message,
            chatId: previousResponseId || undefined
          });

          try {
            // Process streaming events
            for await (const event of stream) {
              if (event.type === 'content') {
                // Send content chunks to client
                const chunkData = JSON.stringify({
                  type: 'chunk',
                  content: event.delta,
                });
                controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
              } else if (event.type === 'sources') {
                // Optional: handle sources if needed
                // For now, we'll skip sources to match current behavior
              } else if (event.type === 'done') {
                // Extract chat ID for conversation continuity
                chatId = event.chatId || null;
                completed = true;
              }
            }

            // After iteration, get chat ID from stream if not already set
            if (!chatId && stream.chatId) {
              chatId = stream.chatId;
            }
          } finally {
            // Always close the stream
            stream.close();
          }

          // Send final done message with chat ID
          const finalData = JSON.stringify({
            type: 'done',
            responseId: chatId,
          });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

        } catch (error) {
          console.error('Streaming error:', error);
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
      JSON.stringify(formatErrorResponse(error)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Made with Bob
