// Image generation service using EverArt MCP tool
// Note: This will be called from the API route which has access to MCP tools
import sharp from 'sharp';

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

/**
 * Ensure image has exactly 16:9 aspect ratio by cropping/resizing
 * This ensures generated images fit perfectly into the system
 * Uses center crop to preserve the most important content
 */
export async function ensure16x9AspectRatio(imageBuffer: Buffer): Promise<Buffer> {
  const img = sharp(imageBuffer);
  const metadata = await img.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }
  
  const currentAspectRatio = metadata.width / metadata.height;
  const targetAspectRatio = 16 / 9; // 1.777...
  
  // If already 16:9 (within small tolerance), return as-is
  if (Math.abs(currentAspectRatio - targetAspectRatio) < 0.01) {
    return imageBuffer;
  }
  
  let processed: Buffer;
  
  if (currentAspectRatio > targetAspectRatio) {
    // Image is wider than 16:9 - crop width (center crop)
    const targetWidth = Math.round(metadata.height * targetAspectRatio);
    const left = Math.round((metadata.width - targetWidth) / 2);
    processed = await img
      .extract({ left, top: 0, width: targetWidth, height: metadata.height })
      .png()
      .toBuffer();
  } else {
    // Image is taller than 16:9 - crop height (center crop)
    const targetHeight = Math.round(metadata.width / targetAspectRatio);
    const top = Math.round((metadata.height - targetHeight) / 2);
    processed = await img
      .extract({ left: 0, top, width: metadata.width, height: targetHeight })
      .png()
      .toBuffer();
  }
  
  return processed;
}


