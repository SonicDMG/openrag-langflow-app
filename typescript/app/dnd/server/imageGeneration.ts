// Image generation service using EverArt SDK
import sharp from 'sharp';
import EverArt from 'everart';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface ImageGenerationOptions {
  prompt: string;
  seed?: number;
  model?: string;
  imageCount?: number;
  width?: number;
  height?: number;
}

export interface GeneratedImage {
  url: string;
  buffer: Buffer;
}

/**
 * Generate an image using EverArt SDK
 * Returns both the URL and the downloaded buffer
 */
export async function generateReferenceImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  const apiKey = process.env.EVERART_API_KEY;
  if (!apiKey) {
    throw new Error('EverArt API key not configured. Please set EVERART_API_KEY environment variable.');
  }

  const {
    prompt,
    model = '5000',
    imageCount = 1,
    width = 1024,
    height = 576, // 16:9 aspect ratio
  } = options;

  const everartClient = new EverArt(apiKey);
  
  const baseParams = {
    imageCount,
    width,
    height,
  };

  // Create generation using SDK
  const generations = await everartClient.v1.generations.create(
    model,
    prompt,
    'txt2img',
    baseParams
  );

  if (!generations || generations.length === 0) {
    throw new Error('No generations returned from EverArt API');
  }

  // Poll for the result
  const result = await everartClient.v1.generations.fetchWithPolling(generations[0].id);
  const imageUrl = result.image_url;

  if (!imageUrl) {
    throw new Error('Image generation completed but no image URL was returned');
  }

  // Download the image
  const buffer = await downloadImage(imageUrl);

  return {
    url: imageUrl,
    buffer,
  };
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

// Cache for the "skipped" placeholder image to avoid regenerating it
let skippedPlaceholderCache: Buffer | null = null;

/**
 * Generate a "skipped" placeholder image using EverArt
 * Used when skipCutout is true to indicate that cutout/background images were skipped
 * The image is cached in memory and persisted to disk to avoid regenerating it
 */
export async function generateSkippedPlaceholder(): Promise<Buffer> {
  // Return cached version if available
  if (skippedPlaceholderCache) {
    return skippedPlaceholderCache;
  }

  // Try to load from disk first
  const skippedPlaceholderPath = join(process.cwd(), 'public', 'cdn', 'skipped-placeholder.png');
  try {
    const cachedBuffer = await fs.readFile(skippedPlaceholderPath);
    skippedPlaceholderCache = cachedBuffer;
    console.log('Loaded "SKIPPED" placeholder from disk cache');
    return cachedBuffer;
  } catch {
    // File doesn't exist, need to generate it
    console.log('Generating new "SKIPPED" placeholder image...');
  }

  const apiKey = process.env.EVERART_API_KEY;
  if (!apiKey) {
    throw new Error('EverArt API key not configured. Please set EVERART_API_KEY environment variable.');
  }

  const paletteDescription = 'warm earth tones with vibrant accents';
  const prompt = `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro fantasy aesthetic. The text "SKIPPED" in large bold letters, centered, transparent background, isolated text sprite, no background scene, no environment, no setting. Rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, no modern objects or technology. Centered composition, transparent background, 16:9 aspect ratio. --ar 16:9 --style raw`;

  const everartClient = new EverArt(apiKey);
  
  const baseParams = {
    imageCount: 1,
    width: 1024,
    height: 576, // 16:9 aspect ratio
  };

  // Create generation using SDK
  const generations = await everartClient.v1.generations.create(
    '5000',
    prompt,
    'txt2img',
    baseParams
  );

  if (!generations || generations.length === 0) {
    throw new Error('No generations returned from EverArt API');
  }

  // Poll for the result
  const result = await everartClient.v1.generations.fetchWithPolling(generations[0].id);
  const imageUrl = result.image_url;

  if (!imageUrl) {
    throw new Error('Image generation completed but no image URL was returned');
  }

  // Download and process the image
  let buffer = await downloadImage(imageUrl);
  buffer = await ensure16x9AspectRatio(buffer);
  
  // Import ensureTransparentBackground here to avoid circular dependency
  const { ensureTransparentBackground } = await import('./backgroundRemoval');
  buffer = await ensureTransparentBackground(buffer);

  // Cache in memory
  skippedPlaceholderCache = buffer;
  
  // Persist to disk for future use
  try {
    const cdnDir = join(process.cwd(), 'public', 'cdn');
    await fs.mkdir(cdnDir, { recursive: true });
    await fs.writeFile(skippedPlaceholderPath, buffer);
    console.log(`✅ "SKIPPED" placeholder saved to ${skippedPlaceholderPath}`);
  } catch (error) {
    console.warn('Failed to save "SKIPPED" placeholder to disk (will regenerate on next restart):', error);
  }
  
  return buffer;
}


