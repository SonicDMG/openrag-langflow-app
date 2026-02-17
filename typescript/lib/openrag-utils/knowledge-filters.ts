/**
 * OpenRAG Knowledge Filters Utilities
 *
 * Functions for managing knowledge filters - reusable, named filter configurations
 * that can be applied to chat and search operations.
 * Can be run as a standalone script to test filter endpoints.
 */

import {
  OpenRAGClient,
  KnowledgeFilter,
  CreateKnowledgeFilterOptions,
  UpdateKnowledgeFilterOptions
} from 'openrag-sdk';

/**
 * Create a new knowledge filter.
 * 
 * @param options - Filter configuration including name, description, and query data
 * @param client - Optional OpenRAGClient instance
 * @returns Created filter with ID
 */
export async function createFilter(
  options: CreateKnowledgeFilterOptions,
  client?: OpenRAGClient
): Promise<{ success: boolean; id?: string; error?: string }> {
  const useClient = client || new OpenRAGClient();
  return await useClient.knowledgeFilters.create(options);
}

/**
 * Search for knowledge filters by name, description, or query content.
 *
 * @param query - Optional search query text (empty string returns all filters)
 * @param limit - Maximum number of results (default 100)
 * @param client - Optional OpenRAGClient instance
 * @returns List of matching filters
 */
export async function searchFilters(
  query?: string,
  limit?: number,
  client?: OpenRAGClient
): Promise<KnowledgeFilter[]> {
  console.log('[searchFilters] 🔄 Searching filters via SDK...');
  const useClient = client || new OpenRAGClient();
  const filters = await useClient.knowledgeFilters.search(query || '', limit || 100);
  console.log('[searchFilters] ✅ SDK method succeeded - returned', filters.length, 'filters');
  return filters;
}

/**
 * Get a specific knowledge filter by ID.
 *
 * @param filterId - The filter ID
 * @param client - Optional OpenRAGClient instance
 * @returns Filter details or null if not found
 */
export async function getFilter(
  filterId: string,
  client?: OpenRAGClient
): Promise<KnowledgeFilter | null> {
  console.log('[getFilter] 🔄 Getting filter via SDK:', filterId);
  const useClient = client || new OpenRAGClient();
  const filter = await useClient.knowledgeFilters.get(filterId);
  console.log('[getFilter] ✅ SDK method succeeded - returned filter:', filter?.name);
  return filter;
}

/**
 * Update a knowledge filter.
 *
 * @param filterId - The filter ID to update
 * @param updates - Fields to update
 * @param client - Optional OpenRAGClient instance
 * @returns True if successful
 */
export async function updateFilter(
  filterId: string,
  updates: UpdateKnowledgeFilterOptions,
  client?: OpenRAGClient
): Promise<boolean> {
  const useClient = client || new OpenRAGClient();
  return await useClient.knowledgeFilters.update(filterId, updates);
}

/**
 * Delete a knowledge filter.
 *
 * @param filterId - The filter ID to delete
 * @param client - Optional OpenRAGClient instance
 * @returns True if successful
 */
export async function deleteFilter(
  filterId: string,
  client?: OpenRAGClient
): Promise<boolean> {
  const useClient = client || new OpenRAGClient();
  return await useClient.knowledgeFilters.delete(filterId);
}

/**
 * Test knowledge filter endpoints (for standalone execution)
 */
async function main() {
  const apiKey = process.env.OPENRAG_API_KEY;
  const url = process.env.OPENRAG_URL;

  console.log(`Using API Key: ${apiKey?.slice(0, 20) || 'NOT SET'}...`);
  console.log(`Using URL: ${url}\n`);

  // Create a filter
  console.log('=== Create Knowledge Filter ===');
  const createResult = await createFilter({
    name: 'Technical Docs',
    description: 'Filter for technical documentation',
    queryData: {
      query: 'technical',
      filters: {
        document_types: ['application/pdf']
      },
      limit: 10,
      scoreThreshold: 0.5
    }
  });
  
  if (createResult.success && createResult.id) {
    console.log(`Created filter with ID: ${createResult.id}`);
    const filterId = createResult.id;

    // Search for filters
    console.log('\n=== Search Filters ===');
    const filters = await searchFilters('Technical');
    console.log(`Found ${filters.length} filters`);
    for (const filter of filters) {
      console.log(`  - ${filter.name}: ${filter.description}`);
    }

    // Get specific filter
    console.log('\n=== Get Filter ===');
    const filter = await getFilter(filterId);
    if (filter) {
      console.log(`Filter: ${filter.name}`);
      console.log(`Description: ${filter.description}`);
      console.log(`Query: ${filter.queryData.query}`);
    }

    // Update filter
    console.log('\n=== Update Filter ===');
    const updateResult = await updateFilter(filterId, {
      description: 'Updated description for technical docs'
    });
    console.log(`Update success: ${updateResult}`);

    // Delete filter
    console.log('\n=== Delete Filter ===');
    const deleteResult = await deleteFilter(filterId);
    console.log(`Delete success: ${deleteResult}`);
  } else {
    console.log(`Failed to create filter: ${createResult.error}`);
  }
  console.log();
}

// Allow running as standalone script
if (require.main === module) {
  main().catch(console.error);
}

// Made with Bob
