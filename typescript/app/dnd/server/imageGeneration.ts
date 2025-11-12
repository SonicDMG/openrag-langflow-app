// Image generation service using EverArt MCP tool
// Note: This will be called from the API route which has access to MCP tools

export interface ImageGenerationOptions {
  prompt: string;
  seed?: number;
  model?: string;
}

export interface GeneratedImage {
  url: string;
  buffer: Buffer;
}

/**
 * Generate a reference image using EverArt
 * This function should be called from the API route where MCP tools are available
 * For now, we'll return a placeholder structure that the API route will implement
 */
export async function generateReferenceImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  // This will be implemented in the API route using the MCP tool
  // The API route has access to mcp_everart_generate_image
  throw new Error('This function should be called from the API route with MCP access');
}

/**
 * Download image from URL and return as Buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

