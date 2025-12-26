import { generateReferenceImage } from '../app/battle-arena/server/imageGeneration';
import { pixelize } from '../app/battle-arena/server/pixelize';
import { promises as fs } from 'fs';
import { join } from 'path';

async function generatePlaceholder() {
  console.log('Generating placeholder image with EverArt...');
  
  const prompt = `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro medieval high-fantasy aesthetic. A large question mark symbol "?" centered in the frame, depicted in a distinctly medieval high-fantasy world. Placed in a expansive medieval high-fantasy setting, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive warm earth tones with vibrant accents palette. Position the question mark in the center of the frame, viewed from a pulled-back wide-angle perspective showing expansive landscape surrounding it. Retro SNES/Genesis style, no modern objects or technology.`;
  
  try {
    // Generate image using EverArt
    const image = await generateReferenceImage({
      prompt,
      model: '5000',
      imageCount: 1,
      width: 1024,
      height: 768, // 4:3 aspect ratio
    });
    
    console.log('Pixelizing placeholder image...');
    
    // Pixelize the image
    const pixelized = await pixelize(image.buffer, {
      base: 256,
      colors: 32,
    });
    
    // Save to public/cdn/placeholder.png
    const outputPath = join(process.cwd(), 'public', 'cdn', 'placeholder.png');
    await fs.writeFile(outputPath, pixelized.png280x200);
    
    console.log('✅ Successfully generated and saved placeholder.png');
  } catch (error) {
    console.error('Failed to generate placeholder:', error);
    process.exit(1);
  }
}

generatePlaceholder();

// Made with Bob
