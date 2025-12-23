/**
 * OpenRAG Search Utilities
 * 
 * Functions for document search operations.
 * Can be run as a standalone script to test search endpoints.
 */

import { OpenRAGClient, SearchResponse, SearchFilters } from 'openrag-sdk';

/**
 * Search for documents using semantic search.
 * 
 * @param query - The search query
 * @param limit - Maximum number of results (default: 10)
 * @param scoreThreshold - Minimum relevance score (default: 0.0)
 * @param filterId - Optional knowledge filter ID to apply
 * @param filters - Optional search filters
 * @param client - Optional OpenRAGClient instance
 * @returns Search results with documents and scores
 */
export async function searchQuery(
  query: string,
  limit: number = 10,
  scoreThreshold: number = 0.0,
  filterId?: string,
  filters?: SearchFilters,
  client?: OpenRAGClient
): Promise<SearchResponse> {
  const useClient = client || new OpenRAGClient();
  
  return await useClient.search.query(query, {
    limit,
    scoreThreshold,
    filterId,
    filters
  });
}

/**
 * Test search endpoints (for standalone execution)
 */
async function main() {
  const apiKey = process.env.OPENRAG_API_KEY;
  const url = process.env.OPENRAG_URL;

  console.log(`Using API Key: ${apiKey?.slice(0, 20) || 'NOT SET'}...`);
  console.log(`Using URL: ${url}\n`);

  // Basic search
  console.log('=== Basic Search ===');
  const results = await searchQuery('document processing', 5);
  console.log(`Found ${results.results.length} results`);
  for (const result of results.results) {
    console.log(`\n${result.filename} (score: ${result.score.toFixed(3)})`);
    console.log(`  ${result.text.slice(0, 100)}...`);
  }
  console.log();

  // Search with filters
  console.log('=== Search with Filters ===');
  const filteredResults = await searchQuery(
    'API documentation',
    5,
    0.5,
    undefined,
    {
      document_types: ['application/pdf']
    }
  );
  console.log(`Found ${filteredResults.results.length} PDF results`);
  for (const result of filteredResults.results) {
    console.log(`  - ${result.filename} (score: ${result.score.toFixed(3)})`);
  }
  console.log();
}

// Allow running as standalone script
if (require.main === module) {
  main().catch(console.error);
}

// Made with Bob
