import { NextRequest } from 'next/server';
import { OpenRAGClient } from 'openrag-sdk';
import { config } from 'dotenv';
import { resolve } from 'path';
import {
  validateRequestBody,
  chatMessageSchema,
  getClientIp,
  logValidationFailure,
  logApiError
} from '@/lib/security';
import { getFilter } from '@/lib/openrag-utils/knowledge-filters';

// Load environment variables from the root .env file
config({ path: resolve(process.cwd(), '..', '.env') });

// Helper function to format error responses consistently
function formatErrorResponse(error: unknown): { error: string } {
  return {
    error: error instanceof Error ? error.message : 'Internal server error',
  };
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  
  try {
    // Validate request body using Zod schema
    const validation = await validateRequestBody(request, chatMessageSchema);
    
    if (!validation.success) {
      logValidationFailure('/api/chat', clientIp, validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: validation.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message, previousResponseId, filterId, limit, scoreThreshold } = validation.data;

    // Debug: Log the incoming request parameters
    console.log('=== Incoming Request Parameters ===');
    console.log('Message:', message.substring(0, 100) + (message.length > 100 ? '...' : ''));
    console.log('ChatId:', previousResponseId || 'null');
    console.log('FilterId:', filterId || 'undefined');
    console.log('Requested Limit:', limit !== undefined ? limit : 'undefined');
    console.log('Requested ScoreThreshold:', scoreThreshold !== undefined ? scoreThreshold : 'undefined');
    console.log('===================================');

    // If filterId is provided, fetch the filter to get its configuration
    // Filter configuration takes precedence over request parameters
    let filterScoreThreshold = scoreThreshold !== undefined ? scoreThreshold : 0;
    let filterLimit = limit !== undefined ? limit : 100;
    let filterName = 'none';
    
    if (filterId) {
      try {
        console.log(`=== Fetching Filter Configuration ===`);
        console.log(`Filter ID: ${filterId}`);
        const filter = await getFilter(filterId);
        console.log(`Filter fetched:`, filter ? 'SUCCESS' : 'NULL');
        
        if (filter) {
          console.log(`Full filter object:`, JSON.stringify(filter, null, 2));
          filterName = filter.name;
          
          if (filter.queryData) {
            console.log(`Filter queryData:`, JSON.stringify(filter.queryData, null, 2));
            
            // Filter's configuration takes precedence
            if (filter.queryData.scoreThreshold !== undefined) {
              console.log(`Applying filter scoreThreshold: ${filter.queryData.scoreThreshold} (was: ${filterScoreThreshold})`);
              filterScoreThreshold = filter.queryData.scoreThreshold;
            }
            if (filter.queryData.limit !== undefined) {
              console.log(`Applying filter limit: ${filter.queryData.limit} (was: ${filterLimit})`);
              filterLimit = filter.queryData.limit;
            }
          } else {
            console.log(`WARNING: Filter has no queryData property`);
          }
          
          console.log(`=== Filter Configuration Applied ===`);
          console.log(`Filter Name: "${filter.name}"`);
          console.log(`Final Limit: ${filterLimit}`);
          console.log(`Final ScoreThreshold: ${filterScoreThreshold}`);
          console.log('====================================');
        } else {
          console.log(`WARNING: Filter ${filterId} returned null`);
        }
      } catch (error) {
        console.error(`ERROR fetching filter ${filterId}:`, error);
        console.warn(`Using request/default values: limit=${filterLimit}, scoreThreshold=${filterScoreThreshold}`);
      }
    }

    // Debug: Log the final parameters that will be sent
    console.log('=== Final OpenRAG Chat Request ===');
    console.log('SDK Function: client.chat.stream()');
    console.log('Filter Applied:', filterName);
    console.log('Final Limit:', filterLimit);
    console.log('Final ScoreThreshold:', filterScoreThreshold);
    console.log('==================================');

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
          const streamParams = {
            message,
            chatId: previousResponseId || undefined,
            filter_id: filterId || undefined,
            limit: filterLimit,
            scoreThreshold: filterScoreThreshold
          };
          
          console.log('=== OpenRAG SDK Stream Params ===');
          console.log(JSON.stringify(streamParams, null, 2));
          console.log('=================================');
          
          const stream = await client.chat.stream(streamParams);

          console.log('=== OpenRAG Response Stream Started ===');
          let contentLength = 0;
          let eventCount = 0;
          let sourcesCount = 0;

          try {
            // Process streaming events
            for await (const event of stream) {
              eventCount++;
              console.log(`Event #${eventCount}:`, event.type);
              
              if (event.type === 'content') {
                contentLength += event.delta.length;
                console.log(`  Content delta length: ${event.delta.length}, Total: ${contentLength}`);
                // Send content chunks to client
                const chunkData = JSON.stringify({
                  type: 'chunk',
                  content: event.delta,
                });
                controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
              } else if (event.type === 'sources') {
                sourcesCount++;
                console.log(`  Sources event #${sourcesCount}:`, event.sources?.length || 0, 'sources');
                // Optional: handle sources if needed
                // For now, we'll skip sources to match current behavior
              } else if (event.type === 'done') {
                console.log(`  Done event - ChatId: ${event.chatId || 'null'}`);
                // Extract chat ID for conversation continuity
                chatId = event.chatId || null;
                completed = true;
              }
            }
            
            console.log('=== OpenRAG Response Summary ===');
            console.log(`Total events: ${eventCount}`);
            console.log(`Total content length: ${contentLength} chars`);
            console.log(`Sources events: ${sourcesCount}`);
            console.log(`Final chatId: ${chatId || 'null'}`);
            console.log(`Completed: ${completed}`);
            console.log('================================');

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
    logApiError(
      '/api/chat',
      'POST',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
    return new Response(
      JSON.stringify(formatErrorResponse(error)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Made with Bob
