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
 * NOTE: This function bypasses the OpenRAG SDK and makes a direct HTTP call
 * because the SDK implementation doesn't match the OpenRAG API specification.
 * The API expects a POST request with JSON body containing query and limit,
 * while the SDK may be using a different approach.
 *
 * @param query - Optional search query text (empty string returns all filters)
 * @param limit - Maximum number of results (default 100)
 * @param client - Optional OpenRAGClient instance (unused, kept for compatibility)
 * @returns List of matching filters
 */
export async function searchFilters(
  query?: string,
  limit?: number,
  client?: OpenRAGClient
): Promise<KnowledgeFilter[]> {
  // Get environment variables
  const OPENRAG_URL = process.env.OPENRAG_URL;
  const OPENRAG_API_KEY = process.env.OPENRAG_API_KEY;

  // Validate environment variables
  if (!OPENRAG_URL) {
    throw new Error('OPENRAG_URL environment variable is not set');
  }
  if (!OPENRAG_API_KEY) {
    throw new Error('OPENRAG_API_KEY environment variable is not set');
  }

  // Prepare request body matching the working curl command
  const requestBody = {
    query: query || "",
    limit: limit || 100
  };

  try {
    // Make direct HTTP POST request to OpenRAG API
    const response = await fetch(`${OPENRAG_URL}/api/v1/knowledge-filters/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENRAG_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRAG API returned ${response.status}: ${errorText}`
      );
    }

    // Parse and return the filters array
    const data = await response.json();
    
    let filters: any[] = [];
    
    // The API should return an array of filters
    if (Array.isArray(data)) {
      filters = data;
    }
    // Handle case where response might be wrapped in an object
    else if (data && Array.isArray(data.filters)) {
      filters = data.filters;
    }
    else {
      // If we get here, the response format is unexpected
      console.error('Unexpected response format from OpenRAG API:', data);
      return [];
    }
    
    // Parse query_data JSON string for each filter
    const parsedFilters = filters.map(filter => {
      if (filter.query_data && typeof filter.query_data === 'string') {
        try {
          filter.queryData = JSON.parse(filter.query_data);
        } catch (error) {
          console.error(`Failed to parse query_data for filter ${filter.id}:`, error);
          filter.queryData = {};
        }
      } else if (filter.query_data && typeof filter.query_data === 'object') {
        // Already an object, just normalize the property name
        filter.queryData = filter.query_data;
      }
      return filter;
    });
    
    return parsedFilters as KnowledgeFilter[];
    
  } catch (error) {
    // Log and re-throw errors with context
    console.error('Error searching knowledge filters:', error);
    throw new Error(
      `Failed to search knowledge filters: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get a specific knowledge filter by ID.
 *
 * NOTE: This function bypasses the OpenRAG SDK and makes a direct HTTP call
 * for consistency with searchFilters and to ensure proper API compatibility.
 *
 * @param filterId - The filter ID
 * @param client - Optional OpenRAGClient instance (unused, kept for compatibility)
 * @returns Filter details or null if not found
 */
export async function getFilter(
  filterId: string,
  client?: OpenRAGClient
): Promise<KnowledgeFilter | null> {
  // Get environment variables
  const OPENRAG_URL = process.env.OPENRAG_URL;
  const OPENRAG_API_KEY = process.env.OPENRAG_API_KEY;

  // Validate environment variables
  if (!OPENRAG_URL) {
    throw new Error('OPENRAG_URL environment variable is not set');
  }
  if (!OPENRAG_API_KEY) {
    throw new Error('OPENRAG_API_KEY environment variable is not set');
  }

  try {
    // Make direct HTTP GET request to OpenRAG API
    const response = await fetch(`${OPENRAG_URL}/api/v1/knowledge-filters/${filterId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENRAG_API_KEY}`
      }
    });

    // Handle 404 - filter not found
    if (response.status === 404) {
      return null;
    }

    // Handle other non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRAG API returned ${response.status}: ${errorText}`
      );
    }

    // Parse and return the filter
    const rawFilter = await response.json();
    
    // The API returns the filter wrapped in a success object
    const filterData = rawFilter.success ? rawFilter.filter : rawFilter;
    
    // The API returns query_data as a JSON string, we need to parse it
    if (filterData.query_data && typeof filterData.query_data === 'string') {
      try {
        filterData.queryData = JSON.parse(filterData.query_data);
      } catch (error) {
        console.error('Failed to parse query_data:', error);
        filterData.queryData = {};
      }
    } else if (filterData.query_data && typeof filterData.query_data === 'object') {
      // Already an object, just normalize the property name
      filterData.queryData = filterData.query_data;
    }
    
    return filterData as KnowledgeFilter;
    
  } catch (error) {
    // Log and re-throw errors with context
    console.error(`Error fetching knowledge filter ${filterId}:`, error);
    throw new Error(
      `Failed to fetch knowledge filter: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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
