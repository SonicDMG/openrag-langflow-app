import { NextRequest, NextResponse } from 'next/server';
import { getAllMonsters, upsertMonster } from '../../../../lib/db/astra';
import { promises as fs } from 'fs';
import { join } from 'path';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

/**
 * POST endpoint to update imageUrl from metadata for all monsters with monsterId
 * Reads Everart URL from metadata files and updates database records
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

    // Check if monsters directory exists
    try {
      await fs.access(MONSTERS_DIR);
    } catch {
      return NextResponse.json({
        success: true,
        message: 'No monster images directory found',
        updated: 0,
        skipped: monsters.length,
        errors: [],
      });
    }

    // Process each monster
    for (const monster of monsters) {
      try {
        // Skip if no monsterId
        if (!monster.monsterId) {
          console.log(`Skipping ${monster.name} - no monsterId`);
          results.skipped++;
          continue;
        }

        // Read metadata file
        const metadataPath = join(MONSTERS_DIR, monster.monsterId, 'metadata.json');
        let metadata;
        try {
          metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        } catch {
          console.log(`Skipping ${monster.name} - no metadata file found`);
          results.skipped++;
          continue;
        }

        // Check if metadata has Everart imageUrl
        if (!metadata.imageUrl) {
          console.log(`Skipping ${monster.name} - no imageUrl in metadata`);
          results.skipped++;
          continue;
        }

        // Check if database already has this imageUrl
        if (monster.imageUrl === metadata.imageUrl) {
          console.log(`Skipping ${monster.name} - imageUrl already up to date`);
          results.skipped++;
          continue;
        }

        // Update monster in database with Everart imageUrl from metadata
        const updatedMonster = {
          ...monster,
          imageUrl: metadata.imageUrl,
        };
        
        await upsertMonster(updatedMonster, 'Image URL Update');
        console.log(`Updated ${monster.name} with Everart imageUrl: ${metadata.imageUrl}`);
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
      message: `Update completed. Updated ${results.updated} monsters, skipped ${results.skipped}.`,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Image URL update error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Made with Bob
