import { NextRequest, NextResponse } from 'next/server';
import { getFilter } from '@/lib/openrag-utils/knowledge-filters';
import { getClientIp, logApiError } from '@/lib/security';

/**
 * GET endpoint to fetch a specific knowledge filter by ID
 * 
 * Path Parameters:
 * - filterId: The unique identifier of the filter
 * 
 * Returns the complete filter object or 404 if not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filterId: string }> }
) {
  const clientIp = getClientIp(request);
  const { filterId } = await params;

  try {
    // Validate filterId parameter
    if (!filterId || typeof filterId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filter ID provided'
        },
        { status: 400 }
      );
    }

    // Fetch the filter using the utility function
    const filter = await getFilter(filterId);

    // Return 404 if filter not found
    if (!filter) {
      return NextResponse.json(
        {
          success: false,
          error: 'Filter not found'
        },
        { status: 404 }
      );
    }

    // Return the filter object
    return NextResponse.json({
      success: true,
      filter
    });

  } catch (error) {
    console.error(`Failed to fetch filter ${filterId}:`, error);
    logApiError(
      `/api/openrag/filters/${filterId}`,
      'GET',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch filter'
      },
      { status: 500 }
    );
  }
}

// Made with Bob