/**
 * OpenRAG Documents Utilities
 * 
 * Functions for document ingestion and deletion.
 * Can be run as a standalone script to test document endpoints.
 */

import { OpenRAGClient, IngestResponse, DeleteDocumentResponse } from 'openrag-sdk';

/**
 * Ingest a document into the knowledge base.
 * 
 * @param filePath - Path to the file to ingest (Node.js)
 * @param file - File or Blob object to ingest (Browser)
 * @param filename - Filename for the document
 * @param wait - Whether to wait for ingestion to complete (default: true)
 * @param client - Optional OpenRAGClient instance
 * @returns Ingestion result with status and task_id
 */
export async function ingestDocument(
  options: {
    filePath?: string;
    file?: File | Blob;
    filename?: string;
    wait?: boolean;
  },
  client?: OpenRAGClient
): Promise<IngestResponse> {
  const useClient = client || new OpenRAGClient();
  
  return await useClient.documents.ingest({
    filePath: options.filePath,
    file: options.file,
    filename: options.filename,
    wait: options.wait ?? true
  });
}

/**
 * Delete a document from the knowledge base.
 * 
 * @param filename - The filename to delete
 * @param client - Optional OpenRAGClient instance
 * @returns Deletion result with success status
 */
export async function deleteDocument(
  filename: string,
  client?: OpenRAGClient
): Promise<DeleteDocumentResponse> {
  const useClient = client || new OpenRAGClient();
  return await useClient.documents.delete(filename);
}

/**
 * Test document endpoints (for standalone execution)
 */
async function main() {
  const apiKey = process.env.OPENRAG_API_KEY;
  const url = process.env.OPENRAG_URL;

  console.log(`Using API Key: ${apiKey?.slice(0, 20) || 'NOT SET'}...`);
  console.log(`Using URL: ${url}\n`);

  // Note: This is a placeholder test - you would need an actual file to test
  console.log('=== Document Operations ===');
  console.log('To test document ingestion:');
  console.log('  const result = await ingestDocument({ filePath: "./test.pdf" });');
  console.log('  console.log(`Status: ${result.status}`);');
  console.log();
  console.log('To test document deletion:');
  console.log('  const result = await deleteDocument("test.pdf");');
  console.log('  console.log(`Success: ${result.success}`);');
  console.log();
}

// Allow running as standalone script
if (require.main === module) {
  main().catch(console.error);
}

// Made with Bob
