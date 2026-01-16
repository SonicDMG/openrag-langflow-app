import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

/**
 * API endpoint to serve monster images dynamically
 * GET /api/cdn/monsters/[monsterId]/[filename]
 * 
 * This route serves images that are created at runtime,
 * which aren't accessible via static file serving in standalone mode.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ monsterId: string; filename: string }> }
) {
  try {
    const { monsterId, filename } = await params;

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Only allow specific image files
    const allowedFiles = ['128.png', '200.png', '256.png', '512.png', '280x200.png'];
    if (!allowedFiles.includes(filename)) {
      return NextResponse.json(
        { error: 'File not allowed' },
        { status: 403 }
      );
    }

    const filePath = join(MONSTERS_DIR, monsterId, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Read and serve the file
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[cdn-monsters] Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Made with Bob
