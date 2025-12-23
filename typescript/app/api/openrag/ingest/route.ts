import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/openrag-utils';

/**
 * API route to ingest documents into OpenRAG
 * This is a server-side endpoint that handles file uploads from the client
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Blob (it already is a Blob, but this ensures compatibility)
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    // Ingest the document using the OpenRAG SDK
    const result = await ingestDocument({
      file: blob,
      filename: filename || file.name,
      wait: true
    });

    return NextResponse.json({
      success: true,
      status: result.status,
      task_id: result.task_id,
      message: 'Document ingested successfully'
    });
  } catch (error) {
    console.error('Failed to ingest document:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to ingest document',
        success: false
      },
      { status: 500 }
    );
  }
}

// Made with Bob
