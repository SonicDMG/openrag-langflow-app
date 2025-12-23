/**
 * OpenRAG Settings Utilities
 * 
 * Functions for managing OpenRAG configuration.
 * Can be run as a standalone script to test settings endpoints.
 */

import { OpenRAGClient, SettingsResponse, SettingsUpdateOptions } from 'openrag-sdk';

/**
 * Get current OpenRAG settings.
 * 
 * @param client - Optional OpenRAGClient instance
 * @returns Current settings including agent and knowledge configuration
 */
export async function getSettings(client?: OpenRAGClient): Promise<SettingsResponse> {
  const useClient = client || new OpenRAGClient();
  return await useClient.settings.get();
}

/**
 * Update OpenRAG settings.
 * 
 * @param updates - Settings to update
 * @param client - Optional OpenRAGClient instance
 * @returns Update result with success message
 */
export async function updateSettings(
  updates: SettingsUpdateOptions,
  client?: OpenRAGClient
): Promise<{ message: string }> {
  const useClient = client || new OpenRAGClient();
  return await useClient.settings.update(updates);
}

/**
 * Test settings endpoints (for standalone execution)
 */
async function main() {
  const apiKey = process.env.OPENRAG_API_KEY;
  const url = process.env.OPENRAG_URL;

  console.log(`Using API Key: ${apiKey?.slice(0, 20) || 'NOT SET'}...`);
  console.log(`Using URL: ${url}\n`);

  // Get settings
  console.log('=== Get Settings ===');
  const settings = await getSettings();
  console.log('Agent Settings:');
  console.log(`  LLM Provider: ${settings.agent.llm_provider || 'not set'}`);
  console.log(`  LLM Model: ${settings.agent.llm_model || 'not set'}`);
  console.log('Knowledge Settings:');
  console.log(`  Embedding Provider: ${settings.knowledge.embedding_provider || 'not set'}`);
  console.log(`  Embedding Model: ${settings.knowledge.embedding_model || 'not set'}`);
  console.log(`  Chunk Size: ${settings.knowledge.chunk_size || 'not set'}`);
  console.log(`  Chunk Overlap: ${settings.knowledge.chunk_overlap || 'not set'}`);
  console.log();

  // Update settings example
  console.log('=== Update Settings (Example) ===');
  console.log('To update settings:');
  console.log('  const result = await updateSettings({');
  console.log('    chunk_size: 1000,');
  console.log('    chunk_overlap: 200');
  console.log('  });');
  console.log('  console.log(result.message);');
  console.log();
}

// Allow running as standalone script
if (require.main === module) {
  main().catch(console.error);
}

// Made with Bob
