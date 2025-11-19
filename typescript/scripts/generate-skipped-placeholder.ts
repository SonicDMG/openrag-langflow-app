/**
 * Script to generate a "SKIPPED" placeholder image using EverArt
 * Run this once to generate the skipped placeholder image: npx tsx scripts/generate-skipped-placeholder.ts
 */

import EverArt from 'everart';
import { config } from 'dotenv';
import { resolve } from 'path';
import { promises as fs } from 'fs';
import { join } from 'path';
import { downloadImage, ensure16x9AspectRatio } from '../app/dnd/server/imageGeneration';
import { ensureTransparentBackground } from '../app/dnd/server/backgroundRemoval';

// Load environment variables
config({ path: resolve(process.cwd(), '..', '.env') });

async function generateSkippedPlaceholder() {
  const apiKey = process.env.EVERART_API_KEY;
  if (!apiKey) {
    console.error('EVERART_API_KEY not found in environment variables');
    process.exit(1);
  }

  const paletteDescription = 'warm earth tones with vibrant accents';
  const prompt = `32-bit pixel art with clearly visible chunky pixel clusters, crisp sprite outlines, dithered shading, low-resolution retro fantasy aesthetic. The text "SKIPPED" in large bold letters, centered, transparent background, isolated text sprite, no background scene, no environment, no setting. Rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, no modern objects or technology. Centered composition, transparent background, 16:9 aspect ratio.`;

  try {
    console.log('Generating "SKIPPED" placeholder image with EverArt...');
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
    
    // Save the full-size processed image to disk
    const publicDir = join(process.cwd(), 'public', 'cdn');
    await fs.mkdir(publicDir, { recursive: true });
    
    const skippedPlaceholderPath = join(publicDir, 'skipped-placeholder.png');
    await fs.writeFile(skippedPlaceholderPath, refPng);
    
    console.log(`✅ "SKIPPED" placeholder image saved to ${skippedPlaceholderPath}`);
    console.log('The image will be automatically pixelized when used in monster creation.');
  } catch (error) {
    console.error('Error generating "SKIPPED" placeholder:', error);
    process.exit(1);
  }
}

generateSkippedPlaceholder();

