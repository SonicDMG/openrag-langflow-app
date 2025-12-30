import sharp from 'sharp';

export interface BackgroundRemovalOptions {
  /**
   * Threshold for color distance from background to be considered foreground (0-255)
   * Lower values = more aggressive removal, higher values = more conservative
   */
  threshold?: number;
  
  /**
   * Whether to use edge detection to identify background
   * If true, samples edge pixels to determine background color
   * If false, uses a more aggressive approach
   */
  useEdgeDetection?: boolean;
  
  /**
   * Alpha threshold - pixels with alpha below this are considered transparent
   */
  alphaThreshold?: number;
  
  /**
   * Whether to preserve semi-transparent pixels (for anti-aliasing)
   */
  preserveAntiAliasing?: boolean;
}

/**
 * Remove background from an image by making background pixels transparent
 * Uses edge detection to identify background color, then removes similar pixels
 */
export async function removeBackground(
  pngBuffer: Buffer,
  options: BackgroundRemovalOptions = {}
): Promise<Buffer> {
  const {
    threshold = 30,
    useEdgeDetection = true,
    alphaThreshold = 20,
    preserveAntiAliasing = true,
  } = options;

  try {
    const img = sharp(pngBuffer);
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    const hasAlpha = channels === 4;
    
    // Always work with RGBA format - convert if needed
    let rgbaData: Buffer;
    if (hasAlpha) {
      rgbaData = Buffer.from(data);
    } else {
      // Convert RGB to RGBA
      rgbaData = Buffer.alloc(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        rgbaData[i * 4] = data[i * 3];     // R
        rgbaData[i * 4 + 1] = data[i * 3 + 1]; // G
        rgbaData[i * 4 + 2] = data[i * 3 + 2]; // B
        rgbaData[i * 4 + 3] = 255;         // A (fully opaque)
      }
    }
    
    // Create output buffer (always RGBA)
    const output = Buffer.from(rgbaData);
    
    // Determine background color
    let bgR = 0, bgG = 0, bgB = 0, bgA = 255;
    
    if (useEdgeDetection) {
      // Sample edge pixels to determine background color (always RGBA now)
      const edgeSamples: number[] = [];
      const sampleSize = Math.min(50, Math.floor(width / 10));
      
      for (let i = 0; i < width; i += sampleSize) {
        // Top edge
        const topIdx = (0 * width + i) * 4;
        edgeSamples.push(rgbaData[topIdx], rgbaData[topIdx + 1], rgbaData[topIdx + 2], rgbaData[topIdx + 3]);
        // Bottom edge
        const bottomIdx = ((height - 1) * width + i) * 4;
        edgeSamples.push(rgbaData[bottomIdx], rgbaData[bottomIdx + 1], rgbaData[bottomIdx + 2], rgbaData[bottomIdx + 3]);
      }
      
      for (let i = 0; i < height; i += sampleSize) {
        // Left edge
        const leftIdx = (i * width + 0) * 4;
        edgeSamples.push(rgbaData[leftIdx], rgbaData[leftIdx + 1], rgbaData[leftIdx + 2], rgbaData[leftIdx + 3]);
        // Right edge
        const rightIdx = (i * width + (width - 1)) * 4;
        edgeSamples.push(rgbaData[rightIdx], rgbaData[rightIdx + 1], rgbaData[rightIdx + 2], rgbaData[rightIdx + 3]);
      }
      
      // Calculate average background color
      if (edgeSamples.length > 0) {
        const sampleCount = edgeSamples.length / 4;
        for (let i = 0; i < edgeSamples.length; i += 4) {
          bgR += edgeSamples[i];
          bgG += edgeSamples[i + 1];
          bgB += edgeSamples[i + 2];
          bgA += edgeSamples[i + 3];
        }
        bgR /= sampleCount;
        bgG /= sampleCount;
        bgB /= sampleCount;
        bgA /= sampleCount;
      }
    } else {
      // Use corners as background sample (always RGBA now)
      const corners = [
        [0, 0], // top-left
        [width - 1, 0], // top-right
        [0, height - 1], // bottom-left
        [width - 1, height - 1], // bottom-right
      ];
      
      let cornerCount = 0;
      for (const [x, y] of corners) {
        const idx = (y * width + x) * 4;
        bgR += rgbaData[idx];
        bgG += rgbaData[idx + 1];
        bgB += rgbaData[idx + 2];
        bgA += rgbaData[idx + 3];
        cornerCount++;
      }
      if (cornerCount > 0) {
        bgR /= cornerCount;
        bgG /= cornerCount;
        bgB /= cornerCount;
        bgA /= cornerCount;
      }
    }
    
    // Process each pixel (always working with RGBA now)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4; // Always 4 channels (RGBA)
        const r = rgbaData[idx];
        const g = rgbaData[idx + 1];
        const b = rgbaData[idx + 2];
        const a = rgbaData[idx + 3];
        
        // Skip already transparent pixels
        if (a < alphaThreshold) {
          output[idx + 3] = 0; // Make fully transparent
          continue;
        }
        
        // Calculate color distance from background
        const colorDistance = Math.sqrt(
          Math.pow(r - bgR, 2) +
          Math.pow(g - bgG, 2) +
          Math.pow(b - bgB, 2)
        );
        
        // Check if pixel is similar to background
        if (colorDistance <= threshold) {
          // Make transparent
          output[idx + 3] = 0;
        } else if (preserveAntiAliasing && colorDistance <= threshold * 2) {
          // For anti-aliasing, gradually reduce alpha
          const alphaFactor = (colorDistance - threshold) / threshold;
          output[idx + 3] = Math.floor(a * alphaFactor);
        }
      }
    }
    
    // Convert back to PNG (always RGBA)
    const result = await sharp(output, {
      raw: {
        width,
        height,
        channels: 4, // Always RGBA
      },
    })
      .png()
      .toBuffer();
    
    return result;
  } catch (error) {
    console.error('Background removal error:', error);
    // Return original image if processing fails
    return pngBuffer;
  }
}

/**
 * Create an image with transparent background from scratch
 * This is a helper for when you want to ensure an image has alpha channel
 */
export async function ensureTransparentBackground(pngBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(pngBuffer).metadata();
  const hasAlpha = metadata.hasAlpha;
  
  if (hasAlpha) {
    // Already has alpha, return as-is
    return pngBuffer;
  }
  
  // Convert to RGBA
  return await sharp(pngBuffer)
    .ensureAlpha()
    .png()
    .toBuffer();
}

