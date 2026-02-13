import { NextRequest, NextResponse } from 'next/server';
import { searchFilters } from '@/lib/openrag-utils/knowledge-filters';
import { getClientIp, logApiError } from '@/lib/security';

/**
 * GET endpoint to search/list all knowledge filters
 *
 * Query Parameters:
 * - searchTerm (optional): Term to search for in filter names (empty string returns all)
 *
 * Returns array of filters with their filter_id, name, description, and queryData
 */
export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  
  try {
    // Extract search parameters from query string
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || searchParams.get('searchTerm') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    console.log(`[/api/openrag/filters] Searching filters with query: "${query || '(all)'}"`);

    // Search for filters using the utility function (undefined query returns all filters)
    const filters = await searchFilters(query, limit);

    console.log(`[/api/openrag/filters] Found ${filters.length} filters`);

    // Return the filters array
    return NextResponse.json({
      success: true,
      filters,
      count: filters.length
    });

  } catch (error) {
    // Check if this is a 404 error (filters feature not available)
    const isNotFound = error instanceof Error &&
      (error.message.includes('Resource not found') ||
       error.message.includes('404') ||
       (error as any).statusCode === 404);
    
    if (isNotFound) {
      console.log('[/api/openrag/filters] Knowledge filters feature not available in OpenRAG instance');
      // Return empty array with success=true when filters feature is not available
      return NextResponse.json({
        success: true,
        filters: [],
        count: 0,
        message: 'Knowledge filters feature not available'
      });
    }
    
    // For other errors, log and return error response
    console.error('[/api/openrag/filters] Failed to search filters:', error);
    console.error('[/api/openrag/filters] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });
    
    logApiError(
      '/api/openrag/filters',
      'GET',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search filters',
        filters: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

// Made with Bob