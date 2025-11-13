/**
 * Script to generate a placeholder image using EverArt
 * Run this once to generate the placeholder image: npx tsx scripts/generate-placeholder.ts
 */

import EverArt from 'everart';
import { config } from 'dotenv';
import { resolve } from 'path';
import { promises as fs } from 'fs';
import { join } from 'path';
import { downloadImage, ensure16x9AspectRatio } from '../app/dnd/server/imageGeneration';
import { ensureTransparentBackground } from '../app/dnd/server/backgroundRemoval';
import { pixelize } from '../app/dnd/server/pixelize';

// Load environment variables
config({ path: resolve(process.cwd(), '..', '.env') });

async function generatePlaceholder() {
  const apiKey = process.env.EVERART_API_KEY;
  if (!apiKey) {
    console.error('EVERART_API_KEY not found in environment variables');
    process.exit(1);
  }

  const backgroundScene = 'a medieval high-fantasy setting';
  const paletteDescription = 'warm earth tones with vibrant accents';
  
  const prompt = `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro fantasy aesthetic. A large question mark symbol, depicted in a distinctly medieval high-fantasy world. The question mark is placed in ${backgroundScene}, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, no modern objects or technology. Cinematic composition, 16:9 aspect ratio, transparent background. --ar 16:9 --style raw`;

  try {
    console.log('Generating placeholder image with EverArt...');
    const everartClient = new EverArt(apiKey);
    
    const targetHeight = 576;
    const targetWidth = 1024;
    
    const baseParams = {
      imageCount: 1,
      width: targetWidth,
      height: targetHeight,
    };

    const generations = await everartClient.v1.generations.create(
      '5000',
      prompt,
      'txt2img',
      baseParams
    );

    if (!generations || generations.length === 0) {
      throw new Error('No generations returned from EverArt');
    }

    console.log('Polling for result...');
    const result = await everartClient.v1.generations.fetchWithPolling(generations[0].id);
    const imageUrl = result.image_url;

    if (!imageUrl) {
      throw new Error('No image_url in result');
    }

    console.log('Downloading and processing image...');
    let refPng = await downloadImage(imageUrl);
    refPng = await ensure16x9AspectRatio(refPng);
    refPng = await ensureTransparentBackground(refPng);
    
    // Pixelize to match monster card style
    const { png280x200 } = await pixelize(refPng, {
      base: 256,
      colors: 32,
    });
    
    // Save to public directory
    const publicDir = join(process.cwd(), 'public', 'cdn');
    await fs.mkdir(publicDir, { recursive: true });
    
    const placeholderPath = join(publicDir, 'placeholder.png');
    await fs.writeFile(placeholderPath, png280x200);
    
    console.log(`✅ Placeholder image saved to ${placeholderPath}`);
  } catch (error) {
    console.error('Error generating placeholder:', error);
    process.exit(1);
  }
}

generatePlaceholder();

