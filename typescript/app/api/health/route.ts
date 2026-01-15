import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker and monitoring
 * Returns 200 OK if the application is running
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'openrag-langflow-app'
    },
    { status: 200 }
  );
}

// Made with Bob
