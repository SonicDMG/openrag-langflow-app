import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const DECALS_DIR = join(process.cwd(), 'public', 'cdn', 'decals');

async function cropDecal(filename: string) {
  const inputPath = join(DECALS_DIR, filename);
  const outputPath = join(DECALS_DIR, filename);

  try {
    console.log(`Processing ${filename}...`);
    
    // Read the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      console.error(`Could not read dimensions for ${filename}`);
      return;
    }

    // Detect content bounds (find non-transparent area)
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    // Find bounding box of non-transparent content
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const alpha = channels === 4 ? data[idx + 3] : 255;
        
        if (alpha > 10) { // Non-transparent pixel
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Add some padding (10% on each side)
    const padding = Math.max(
      Math.floor((maxX - minX) * 0.1),
      Math.floor((maxY - minY) * 0.1),
      10
    );
    
    const cropLeft = Math.max(0, minX - padding);
    const cropTop = Math.max(0, minY - padding);
    const cropWidth = Math.min(width - cropLeft, maxX - minX + padding * 2);
    const cropHeight = Math.min(height - cropTop, maxY - minY + padding * 2);
    
    console.log(`  Original: ${width}x${height}`);
    console.log(`  Content bounds: ${minX},${minY} to ${maxX},${maxY}`);
    console.log(`  Crop: ${cropLeft},${cropTop} ${cropWidth}x${cropHeight}`);
    
    // Crop and save
    const cropped = await image
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
      })
      .png()
      .toBuffer();
    
    await fs.writeFile(outputPath, cropped);
    
    console.log(`✅ Cropped ${filename} to ${cropWidth}x${cropHeight}`);
  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error);
  }
}

async function main() {
  const decals = [
    'battle-arena.png',
    'test-page.png',
    'character-image-creator.png',
    'create-character.png',
    'load-data.png',
  ];

  for (const decal of decals) {
    await cropDecal(decal);
  }

  console.log('✅ All decals cropped!');
}

main().catch(console.error);

