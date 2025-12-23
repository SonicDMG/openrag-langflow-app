/**
 * OpenRAG Chat Utilities
 * 
 * Functions for chat operations including simple chat, streaming, and conversation management.
 * Can be run as a standalone script to test chat endpoints.
 */

import { OpenRAGClient, ChatResponse, StreamEvent } from 'openrag-sdk';

/**
 * Send a simple non-streaming chat message.
 * 
 * @param message - The message to send
 * @param chatId - Optional chat ID to continue a conversation
 * @param client - Optional OpenRAGClient instance
 * @returns Response with 'response', 'chatId', and 'sources'
 */
export async function chatSimple(
  message: string,
  chatId?: string,
  client?: OpenRAGClient
): Promise<ChatResponse> {
  if (client) {
    return await client.chat.create({ message, chatId });
  }

  const newClient = new OpenRAGClient();
  return await newClient.chat.create({ message, chatId });
}

/**
 * Send a streaming chat message and yield events.
 * 
 * @param message - The message to send
 * @param chatId - Optional chat ID to continue a conversation
 * @param client - Optional OpenRAGClient instance
 * @yields Event objects with type, delta, sources, chatId, etc.
 */
export async function* chatStreaming(
  message: string,
  chatId?: string,
  client?: OpenRAGClient
): AsyncGenerator<StreamEvent | { type: 'final'; text: string; chatId?: string | null; sources: any[] }> {
  const useClient = client || new OpenRAGClient();
  
  const stream = await useClient.chat.stream({ message, chatId });
  try {
    for await (const event of stream) {
      yield event;
    }
    
    // Return final data
    yield {
      type: 'final',
      text: stream.text,
      chatId: stream.chatId,
      sources: stream.sources
    };
  } finally {
    stream.close();
  }
}

/**
 * List all conversations.
 * 
 * @param client - Optional OpenRAGClient instance
 * @returns List of conversation objects
 */
export async function listConversations(client?: OpenRAGClient) {
  const useClient = client || new OpenRAGClient();
  const result = await useClient.chat.list();
  return result.conversations;
}

/**
 * Get a specific conversation with its messages.
 * 
 * @param chatId - The conversation ID
 * @param client - Optional OpenRAGClient instance
 * @returns Conversation data with messages
 */
export async function getConversation(chatId: string, client?: OpenRAGClient) {
  const useClient = client || new OpenRAGClient();
  const conversation = await useClient.chat.get(chatId);
  return {
    chatId: conversation.chatId,
    title: conversation.title,
    messages: conversation.messages
  };
}

/**
 * Delete a conversation.
 * 
 * @param chatId - The conversation ID to delete
 * @param client - Optional OpenRAGClient instance
 * @returns True if successful
 */
export async function deleteConversation(chatId: string, client?: OpenRAGClient): Promise<boolean> {
  const useClient = client || new OpenRAGClient();
  await useClient.chat.delete(chatId);
  return true;
}

/**
 * Test chat endpoints (for standalone execution)
 */
async function main() {
  const apiKey = process.env.OPENRAG_API_KEY;
  const url = process.env.OPENRAG_URL;

  console.log(`Using API Key: ${apiKey?.slice(0, 20) || 'NOT SET'}...`);
  console.log(`Using URL: ${url}\n`);

  // Simple chat
  console.log('=== Simple Chat ===');
  const response = await chatSimple('Hello! What is RAG?');
  console.log(`Response: ${response.response.slice(0, 200)}...`);
  console.log(`Chat ID: ${response.chatId}`);
  console.log(`Sources: ${response.sources.length}`);
  console.log();

  // Streaming chat
  console.log('=== Streaming Chat ===');
  process.stdout.write('Response: ');
  for await (const event of chatStreaming('Explain it briefly')) {
    if (event.type === 'content') {
      process.stdout.write(event.delta);
    } else if (event.type === 'done') {
      console.log(`\nChat ID: ${event.chatId}`);
    }
  }
  console.log();

  // List conversations
  console.log('=== List Conversations ===');
  const conversations = await listConversations();
  console.log(`Total conversations: ${conversations.length}`);
  for (const conv of conversations.slice(0, 3)) {
    console.log(`  - ${conv.chatId}: ${conv.title}`);
  }
  console.log();
}

// Allow running as standalone script
if (require.main === module) {
  main().catch(console.error);
}

// Made with Bob
