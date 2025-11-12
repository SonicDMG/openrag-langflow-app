import sharp from 'sharp';
import * as IQ from 'image-q';

type PixelizeOptions = { base: number; colors: number };

export interface PixelizeResult {
  png128: Buffer;
  png256: Buffer;
  png512: Buffer;
  palette: number[];
}

/**
 * Detect the bounding box of non-transparent/non-background content in an image
 * Returns the bounds that contain the actual character/content
 */
async function detectContentBounds(pngBuffer: Buffer): Promise<{ left: number; top: number; width: number; height: number } | null> {
  try {
    const img = sharp(pngBuffer);
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    
    // First pass: sample edge pixels to determine likely background color
    const edgeSamples: number[] = [];
    const sampleSize = Math.min(50, Math.floor(width / 10)); // Sample every Nth pixel on edges
    
    for (let i = 0; i < width; i += sampleSize) {
      // Top edge
      const topIdx = (0 * width + i) * channels;
      if (channels === 4) edgeSamples.push(data[topIdx], data[topIdx + 1], data[topIdx + 2], data[topIdx + 3]);
      // Bottom edge
      const bottomIdx = ((height - 1) * width + i) * channels;
      if (channels === 4) edgeSamples.push(data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2], data[bottomIdx + 3]);
    }
    for (let i = 0; i < height; i += sampleSize) {
      // Left edge
      const leftIdx = (i * width + 0) * channels;
      if (channels === 4) edgeSamples.push(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2], data[leftIdx + 3]);
      // Right edge
      const rightIdx = (i * width + (width - 1)) * channels;
      if (channels === 4) edgeSamples.push(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2], data[rightIdx + 3]);
    }
    
    // Calculate average background color from edges
    let avgR = 0, avgG = 0, avgB = 0, avgA = 0;
    const sampleCount = edgeSamples.length / 4;
    for (let i = 0; i < edgeSamples.length; i += 4) {
      avgR += edgeSamples[i];
      avgG += edgeSamples[i + 1];
      avgB += edgeSamples[i + 2];
      avgA += edgeSamples[i + 3];
    }
    avgR /= sampleCount;
    avgG /= sampleCount;
    avgB /= sampleCount;
    avgA /= sampleCount;
    
    // Strategy: Find areas with high local variation (detail) - this is where the character is
    // Backgrounds are usually uniform, characters have lots of color variation
    const variationThreshold = 30; // Minimum local variation to be considered "character"
    const sampleRadius = 2; // Check neighbors within this radius
    
    // Build a variation map - areas with high local color variation are likely the character
    const variationMap: number[][] = [];
    for (let y = 0; y < height; y++) {
      variationMap[y] = [];
      for (let x = 0; x < width; x++) {
        const centerIdx = (y * width + x) * channels;
        const centerR = data[centerIdx];
        const centerG = data[centerIdx + 1];
        const centerB = data[centerIdx + 2];
        const centerAlpha = channels === 4 ? data[centerIdx + 3] : 255;
        
        // Skip transparent or near-transparent pixels
        if (centerAlpha < 20) {
          variationMap[y][x] = 0;
          continue;
        }
        
        // Calculate local variation by comparing with neighbors
        let totalVariation = 0;
        let neighborCount = 0;
        
        for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
          for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const neighborIdx = (ny * width + nx) * channels;
              const neighborR = data[neighborIdx];
              const neighborG = data[neighborIdx + 1];
              const neighborB = data[neighborIdx + 2];
              
              const colorDiff = Math.sqrt(
                Math.pow(centerR - neighborR, 2) +
                Math.pow(centerG - neighborG, 2) +
                Math.pow(centerB - neighborB, 2)
              );
              totalVariation += colorDiff;
              neighborCount++;
            }
          }
        }
        
        const avgVariation = neighborCount > 0 ? totalVariation / neighborCount : 0;
        variationMap[y][x] = avgVariation;
        
        // Consider pixel as character content if it has high local variation
        // Also check if it's significantly different from background
        const colorDistance = Math.sqrt(
          Math.pow(centerR - avgR, 2) + 
          Math.pow(centerG - avgG, 2) + 
          Math.pow(centerB - avgB, 2)
        );
        
        const isCharacterPixel = avgVariation > variationThreshold || 
                                 (colorDistance > 50 && centerAlpha > 50);
        
        if (isCharacterPixel) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Add some padding around the detected content
    const padding = Math.max(10, Math.min(width, height) * 0.05); // 5% padding, min 10px
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Only return bounds if we found substantial content (at least 5% of image - more lenient)
    // AND it's not the entire image (which means detection failed)
    const isEntireImage = contentWidth >= width * 0.95 && contentHeight >= height * 0.95;
    
    if (!isEntireImage && contentWidth > width * 0.05 && contentHeight > height * 0.05) {
      return {
        left: minX,
        top: minY,
        width: contentWidth,
        height: contentHeight,
      };
    }
    return null; // No significant content detected, use fallback
  } catch (error) {
    console.warn('Failed to detect content bounds:', error);
    return null; // Fallback to full image
  }
}

/**
 * Pixelize an image by downscaling aggressively, then upscaling with nearest-neighbor,
 * and reducing the color palette
 */
export async function pixelize(
  pngBuffer: Buffer,
  { base, colors }: PixelizeOptions
): Promise<PixelizeResult> {
  // Ultra-simple approach: Just resize and pixelize the whole image
  // Use base/2 for pixel art effect - preserves good detail
  const small = Math.max(64, Math.floor(base / 2));
  
  // Get image metadata
  const metadata = await sharp(pngBuffer).metadata();
  const inputWidth = metadata.width || base;
  const inputHeight = metadata.height || base;
  
  // Resize using 'cover' with 'entropy' to focus on character area
  // This fills the canvas while trying to keep the most interesting part (character) visible
  let preprocessed: Buffer;
  try {
    preprocessed = await sharp(pngBuffer)
      .resize(base, base, { 
        fit: 'cover', // Fill the canvas
        position: 'entropy', // Focus on area with most detail (usually the character)
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
  } catch (e) {
    // Fallback to 'top' position if 'entropy' not supported - keeps top of image, crops bottom
    preprocessed = await sharp(pngBuffer)
      .resize(base, base, { 
        fit: 'cover',
        position: 'top', // Keep top of image, crop from bottom if needed
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
  }
  
  // Light downscale to create subtle pixel art effect (preserves more detail)
  const smallBuf = await sharp(preprocessed)
    .resize(small, small, { 
      fit: 'cover',
      position: 'center',
      kernel: sharp.kernel.nearest,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Upscale back to base size with nearest neighbor for crisp pixels
  const nearest = await sharp(smallBuf)
    .resize(base, base, { 
      kernel: sharp.kernel.nearest,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // 2) Palette reduction (image-q NeuQuant + Floyd–Steinberg)
  const { out, palette } = await quantize(nearest, colors);

  // 3) Also emit 128 & 512 with integer nearest upscale/downscale
  const png128 = await sharp(out)
    .resize(128, 128, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  
  const png256 = await sharp(out)
    .resize(256, 256, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  
  const png512 = await sharp(out)
    .resize(512, 512, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();

  return { png128, png256, png512, palette };
}

async function quantize(png: Buffer, colors: number): Promise<{ out: Buffer; palette: number[] }> {
  const img = sharp(png);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  const pointContainer = IQ.utils.PointContainer.fromUint8Array(
    data,
    info.width,
    info.height
  );

  const distance = new IQ.distance.EuclideanBT709();
  const paletteQuantizer = new IQ.palette.NeuQuant(distance, colors);
  paletteQuantizer.sample(pointContainer);
  
  // Get the palette from the quantizer
  const palette = paletteQuantizer.quantizeSync();

  // Use NearestColor for synchronous quantization (simpler and more reliable)
  // This gives good results for pixel art without the complexity of error diffusion
  const quantizer = new IQ.image.NearestColor(distance);
  const out = quantizer.quantize(pointContainer, palette);
  
  if (!out) {
    throw new Error('Quantization failed');
  }
  
  // The quantize method should return a PointContainer
  // Check if it's a PointContainer and convert to buffer
  let outBuf: Buffer;
  try {
    // Try to get the PointContainer - it might be returned directly or wrapped
    let pointContainer: any = out;
    
    // Check if it's already a PointContainer instance
    if (out instanceof IQ.utils.PointContainer) {
      pointContainer = out;
    } else if (out && typeof (out as any).getPointContainer === 'function') {
      pointContainer = (out as any).getPointContainer();
    }
    
    // Try to convert to buffer
    if (pointContainer && typeof pointContainer.toUint8Array === 'function') {
      outBuf = Buffer.from(pointContainer.toUint8Array());
    } else {
      // Fallback: use sharp's built-in quantization
      console.warn('image-q quantization failed, using sharp quantization fallback');
      const sharpQuantized = await sharp(png)
        .resize(info.width, info.height)
        .png({ colors, dither: 1 })
        .toBuffer();
      
      const pal = palette.getPointContainer().toUint8Array();
      return { out: sharpQuantized, palette: Array.from(pal) };
    }
  } catch (error) {
    console.error('Error converting quantize result, using sharp fallback:', error);
    // Fallback to sharp quantization
    const sharpQuantized = await sharp(png)
      .resize(info.width, info.height)
      .png({ colors, dither: 1 })
      .toBuffer();
    
    const pal = palette.getPointContainer().toUint8Array();
    return { out: sharpQuantized, palette: Array.from(pal) };
  }

  const pngOut = await sharp(outBuf, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  // Extract palette as RGBA array
  const pal = palette.getPointContainer().toUint8Array();
  return { out: pngOut, palette: Array.from(pal) };
}

