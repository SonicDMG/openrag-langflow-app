import { NextRequest, NextResponse } from 'next/server';
import { getAllMonsters, upsertMonster } from '../../../../lib/db/astra';
import { promises as fs } from 'fs';
import { join } from 'path';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

interface MonsterImageInfo {
  monsterId: string;
  imageUrl: string;
}

/**
 * Check if a monster has images and return the monsterId and imageUrl
 */
async function findMonsterImages(monsterName: string): Promise<MonsterImageInfo | null> {
  try {
    // Check if monsters directory exists
    await fs.access(MONSTERS_DIR);
  } catch {
    return null;
  }

  // Read all monster directories
  const entries = await fs.readdir(MONSTERS_DIR, { withFileTypes: true });
  const monsterDirs = entries.filter(entry => entry.isDirectory());

  // Check if any monster directory has metadata.json with matching klass
  for (const dir of monsterDirs) {
    try {
      const metadataPath = join(MONSTERS_DIR, dir.name, 'metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      
      if (metadata.klass === monsterName) {
        // Found a monster with this klass, check if it has images
        const imagePath = join(MONSTERS_DIR, dir.name, '280x200.png');
        try {
          await fs.access(imagePath);
          // Return monsterId and imageUrl (prefer Everart URL from metadata, fallback to CDN)
          return {
            monsterId: dir.name,
            imageUrl: metadata.imageUrl || `/cdn/monsters/${dir.name}/280x200.png`,
          };
        } catch {
          return null;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * POST endpoint to sync existing monster images to database
 * Updates database records with monsterId and imageUrl for monsters that have images
 */
export async function POST(req: NextRequest) {
  try {
    // Get all monsters from database
    const monsters = await getAllMonsters();
    
    if (monsters.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No monsters found in database',
        updated: 0,
        skipped: 0,
        errors: [],
      });
    }

    const results = {
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ monster: string; error: string }>,
    };

    // Process each monster
    for (const monster of monsters) {
      try {
        // Check if monster already has monsterId in database
        if (monster.monsterId) {
          console.log(`Skipping ${monster.name} - already has monsterId in database`);
          results.skipped++;
          continue;
        }

        // Check if monster has images on filesystem
        const imageInfo = await findMonsterImages(monster.name);
        
        if (!imageInfo) {
          console.log(`Skipping ${monster.name} - no images found`);
          results.skipped++;
          continue;
        }

        // Update monster in database with monsterId and imageUrl (from Everart or CDN)
        const updatedMonster = {
          ...monster,
          monsterId: imageInfo.monsterId,
          imageUrl: imageInfo.imageUrl,
        };
        
        await upsertMonster(updatedMonster, 'Image Sync');
        console.log(`Updated ${monster.name} with monsterId: ${imageInfo.monsterId}`);
        results.updated++;
      } catch (error) {
        results.errors.push({
          monster: monster.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. Updated ${results.updated} monsters, skipped ${results.skipped}.`,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Image sync error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Made with Bob
