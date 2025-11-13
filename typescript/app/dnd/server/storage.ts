import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { MonsterBundle } from '../utils/rigTypes';

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


  // Save metadata
  const metadata = {
    monsterId: bundle.monsterId,
    klass: bundle.klass,
    seed: bundle.seed,
    prompt: bundle.prompt,
    stats: bundle.stats,
    palette: bundle.palette,
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
    };
  } catch (error) {
    console.error(`Failed to load monster bundle ${monsterId}:`, error);
    return null;
  }
}

export function getMonsterUrl(monsterId: string, filename: string = 'rig.json'): string {
  return `/cdn/monsters/${monsterId}/${filename}`;
}

