import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { removeBackground } from '../app/battle-arena/services/server/image';

const DECALS_DIR = join(process.cwd(), 'public', 'cdn', 'decals');
const UI_BACKGROUND_COLOR = '#D1C9BA'; // The UI background color

async function processDecal(filename: string) {
  const inputPath = join(DECALS_DIR, filename);
  const outputPath = join(DECALS_DIR, filename);

  try {
    console.log(`Processing ${filename}...`);
    
    // Read the image
    const imageBuffer = await fs.readFile(inputPath);
    
    // Try to remove background (make transparent)
    const processed = await removeBackground(imageBuffer, {
      threshold: 40,
      useEdgeDetection: true,
      preserveAntiAliasing: true,
    });
    
    // Save the processed image
    await fs.writeFile(outputPath, processed);
    
    console.log(`✅ Processed ${filename}`);
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
    await processDecal(decal);
  }

  console.log('✅ All decals processed!');
}

main().catch(console.error);

