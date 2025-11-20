import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { MonsterBundle } from '../utils/monsterTypes';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

// Ensure monsters directory exists
async function ensureMonstersDir() {
  try {
    await fs.mkdir(MONSTERS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create monsters directory:', error);
    throw error;
  }
}

export async function saveMonsterBundle(bundle: MonsterBundle): Promise<string> {
  await ensureMonstersDir();
  
  const monsterDir = join(MONSTERS_DIR, bundle.monsterId);
  await fs.mkdir(monsterDir, { recursive: true });

  // Save rig.json
  const rigPath = join(monsterDir, 'rig.json');
  await fs.writeFile(rigPath, JSON.stringify(bundle.rig, null, 2));

  // Save images
  await fs.writeFile(join(monsterDir, '128.png'), bundle.images.png128);
  await fs.writeFile(join(monsterDir, '200.png'), bundle.images.png200);
  await fs.writeFile(join(monsterDir, '280x200.png'), bundle.images.png280x200);
  await fs.writeFile(join(monsterDir, '256.png'), bundle.images.png256);
  await fs.writeFile(join(monsterDir, '512.png'), bundle.images.png512);

  // Save cut-out images if they exist
  if (bundle.cutOutImages) {
    await fs.writeFile(join(monsterDir, '128-cutout.png'), bundle.cutOutImages.png128);
    await fs.writeFile(join(monsterDir, '200-cutout.png'), bundle.cutOutImages.png200);
    await fs.writeFile(join(monsterDir, '280x200-cutout.png'), bundle.cutOutImages.png280x200);
    await fs.writeFile(join(monsterDir, '256-cutout.png'), bundle.cutOutImages.png256);
    await fs.writeFile(join(monsterDir, '512-cutout.png'), bundle.cutOutImages.png512);
  }

  // Save background-only images if they exist
  if (bundle.backgroundOnlyImages) {
    await fs.writeFile(join(monsterDir, '128-background.png'), bundle.backgroundOnlyImages.png128);
    await fs.writeFile(join(monsterDir, '200-background.png'), bundle.backgroundOnlyImages.png200);
    await fs.writeFile(join(monsterDir, '280x200-background.png'), bundle.backgroundOnlyImages.png280x200);
    await fs.writeFile(join(monsterDir, '256-background.png'), bundle.backgroundOnlyImages.png256);
    await fs.writeFile(join(monsterDir, '512-background.png'), bundle.backgroundOnlyImages.png512);
  }


  // Save metadata
  // Note: hasCutout should be false when skipCutout was true (even if placeholder cutouts exist)
  // This is passed via the bundle's rig.meta.skipCutout flag
  const skipCutout = (bundle.rig.meta as any)?.skipCutout === true;
  const setting = (bundle as any).setting; // Get setting from bundle if available
  const metadata = {
    monsterId: bundle.monsterId,
    klass: bundle.klass,
    seed: bundle.seed,
    prompt: bundle.prompt,
    stats: bundle.stats,
    palette: bundle.palette,
    hasCutout: skipCutout ? false : !!bundle.cutOutImages, // Track if cutout images exist (false if skipCutout was true)
    skipCutout, // Store the skipCutout flag for reference
    setting, // Store the setting/theme used for image generation
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(join(monsterDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  return bundle.monsterId;
}

export async function loadMonsterBundle(monsterId: string): Promise<MonsterBundle | null> {
  try {
    const monsterDir = join(MONSTERS_DIR, monsterId);
    
    // Load metadata
    const metadataPath = join(monsterDir, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    // Load rig
    const rigPath = join(monsterDir, 'rig.json');
    const rig = JSON.parse(await fs.readFile(rigPath, 'utf-8'));

    // Load images
    const png128 = await fs.readFile(join(monsterDir, '128.png'));
    const png256 = await fs.readFile(join(monsterDir, '256.png'));
    const png512 = await fs.readFile(join(monsterDir, '512.png'));
    
    // Load 200.png if it exists, otherwise generate it from 256.png for backward compatibility
    let png200: Buffer;
    try {
      png200 = await fs.readFile(join(monsterDir, '200.png'));
    } catch {
      // For backward compatibility, generate 200.png from 256.png
      png200 = await sharp(png256)
        .resize(200, 200, { kernel: sharp.kernel.nearest })
        .png()
        .toBuffer();
      // Save it for future use
      await fs.writeFile(join(monsterDir, '200.png'), png200);
    }
    
    // Load 280x200.png if it exists, otherwise generate it from 256.png for backward compatibility
    let png280x200: Buffer;
    try {
      png280x200 = await fs.readFile(join(monsterDir, '280x200.png'));
    } catch {
      // For backward compatibility, generate 280x200.png from 256.png
      png280x200 = await sharp(png256)
        .resize(280, 200, { 
          kernel: sharp.kernel.nearest,
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();
      // Save it for future use
      await fs.writeFile(join(monsterDir, '280x200.png'), png280x200);
    }

    // Load cut-out images if they exist (optional for backward compatibility)
    let cutOutImages: MonsterBundle['cutOutImages'] | undefined;
    try {
      const png128CutOut = await fs.readFile(join(monsterDir, '128-cutout.png'));
      const png200CutOut = await fs.readFile(join(monsterDir, '200-cutout.png'));
      const png280x200CutOut = await fs.readFile(join(monsterDir, '280x200-cutout.png'));
      const png256CutOut = await fs.readFile(join(monsterDir, '256-cutout.png'));
      const png512CutOut = await fs.readFile(join(monsterDir, '512-cutout.png'));
      
      cutOutImages = {
        png128: png128CutOut,
        png200: png200CutOut,
        png280x200: png280x200CutOut,
        png256: png256CutOut,
        png512: png512CutOut,
      };
    } catch {
      // Cut-out images don't exist (backward compatibility)
      cutOutImages = undefined;
    }

    // Load background-only images if they exist (optional for backward compatibility)
    let backgroundOnlyImages: MonsterBundle['backgroundOnlyImages'] | undefined;
    try {
      const png128Bg = await fs.readFile(join(monsterDir, '128-background.png'));
      const png200Bg = await fs.readFile(join(monsterDir, '200-background.png'));
      const png280x200Bg = await fs.readFile(join(monsterDir, '280x200-background.png'));
      const png256Bg = await fs.readFile(join(monsterDir, '256-background.png'));
      const png512Bg = await fs.readFile(join(monsterDir, '512-background.png'));
      
      backgroundOnlyImages = {
        png128: png128Bg,
        png200: png200Bg,
        png280x200: png280x200Bg,
        png256: png256Bg,
        png512: png512Bg,
      };
    } catch {
      // Background-only images don't exist (backward compatibility)
      backgroundOnlyImages = undefined;
    }

    return {
      monsterId: metadata.monsterId,
      klass: metadata.klass,
      seed: metadata.seed,
      prompt: metadata.prompt,
      stats: metadata.stats,
      palette: metadata.palette,
      rig,
      images: {
        png128,
        png200,
        png280x200,
        png256,
        png512,
      },
      cutOutImages,
      backgroundOnlyImages,
    };
  } catch (error) {
    console.error(`Failed to load monster bundle ${monsterId}:`, error);
    return null;
  }
}

export async function deleteMonsterBundle(monsterId: string): Promise<boolean> {
  try {
    const monsterDir = join(MONSTERS_DIR, monsterId);
    
    // Check if directory exists
    try {
      await fs.access(monsterDir);
    } catch {
      // Directory doesn't exist, nothing to delete
      console.log(`Monster directory ${monsterId} does not exist`);
      return false;
    }
    
    // Delete the entire directory and all its contents
    await fs.rm(monsterDir, { recursive: true, force: true });
    console.log(`Successfully deleted monster bundle ${monsterId}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete monster bundle ${monsterId}:`, error);
    throw error;
  }
}

export function getMonsterUrl(monsterId: string, filename: string = 'rig.json'): string {
  return `/cdn/monsters/${monsterId}/${filename}`;
}

