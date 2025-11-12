import { promises as fs } from 'fs';
import { join } from 'path';
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
  await fs.writeFile(join(monsterDir, '256.png'), bundle.images.png256);
  await fs.writeFile(join(monsterDir, '512.png'), bundle.images.png512);

  // Save part images if provided
  if (bundle.images.partsPngs) {
    for (const [partName, buffer] of Object.entries(bundle.images.partsPngs)) {
      await fs.writeFile(join(monsterDir, `${partName}.png`), buffer);
    }
  }

  // Save metadata
  const metadata = {
    monsterId: bundle.monsterId,
    klass: bundle.klass,
    seed: bundle.seed,
    prompt: bundle.prompt,
    stats: bundle.stats,
    palette: bundle.palette,
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

    // Load part images if they exist
    const partsPngs: Record<string, Buffer> = {};
    try {
      const files = await fs.readdir(monsterDir);
      for (const file of files) {
        if (file.endsWith('.png') && !['128.png', '256.png', '512.png'].includes(file)) {
          const partName = file.replace('.png', '');
          partsPngs[partName] = await fs.readFile(join(monsterDir, file));
        }
      }
    } catch (error) {
      // Parts may not exist, that's okay
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
        png256,
        png512,
        partsPngs: Object.keys(partsPngs).length > 0 ? partsPngs : undefined,
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

