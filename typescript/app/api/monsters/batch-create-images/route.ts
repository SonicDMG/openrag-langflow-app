import { NextRequest, NextResponse } from 'next/server';
import { getAllMonsters } from '../../../../lib/db/astra';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CARD_SETTINGS, DEFAULT_SETTING } from '@/app/dnd/constants';
import { CardSetting } from '@/app/dnd/types';
import { enhanceDescriptionWithRaceAndSex } from '@/app/dnd/utils/promptEnhancement';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

/**
 * Builds the base pixel art prompt template with user's description
 * Always generates with background (no transparent background/cutout processing)
 */
function buildBasePrompt(userPrompt: string = '', setting: CardSetting = DEFAULT_SETTING as CardSetting, race?: string, sex?: string): string {
  const paletteDescription = 'warm earth tones with vibrant accents';
  const settingConfig = CARD_SETTINGS[setting] || CARD_SETTINGS[DEFAULT_SETTING];
  
  // Use the user's prompt/description and enhance with race/sex
  const baseDescription = userPrompt.trim() || 'a fantasy character';
  const description = enhanceDescriptionWithRaceAndSex(baseDescription, race, sex);
  
  // Always generate with background
  return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. ${description}, depicted in a distinctly ${settingConfig.settingPhrase} world. Placed in a expansive ${settingConfig.settingPhrase} setting, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Character (facing the camera), centered in frame. Retro SNES/Genesis style, ${settingConfig.technologyLevel}.`;
}

/**
 * Check if a monster already has images created
 */
async function monsterHasImages(monsterName: string): Promise<boolean> {
  try {
    // Check if monsters directory exists
    await fs.access(MONSTERS_DIR);
  } catch {
    // Directory doesn't exist, so no monsters have images
    return false;
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
          return true; // Monster has images
        } catch {
          return false; // Monster directory exists but no images
        }
      }
    } catch {
      // Skip directories without valid metadata
      continue;
    }
  }

  return false; // No matching monster found
}

/**
 * POST endpoint to batch create images for monsters without them
 */
export async function POST(req: NextRequest) {
  try {
    // Get all monsters from database
    const monsters = await getAllMonsters();
    
    if (monsters.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No monsters found in database',
        created: 0,
        skipped: 0,
        errors: [],
      });
    }

    // Filter monsters that don't have images
    const monstersWithoutImages: typeof monsters = [];
    const monstersWithImages: typeof monsters = [];

    for (const monster of monsters) {
      const hasImages = await monsterHasImages(monster.name);
      if (hasImages) {
        monstersWithImages.push(monster);
      } else {
        monstersWithoutImages.push(monster);
      }
    }

    if (monstersWithoutImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All monsters already have images',
        created: 0,
        skipped: monstersWithImages.length,
        errors: [],
      });
    }

    // Create images for monsters without them
    const results = {
      created: 0,
      skipped: monstersWithImages.length,
      errors: [] as Array<{ monster: string; error: string }>,
    };

    // Process each monster
    for (const monster of monstersWithoutImages) {
      try {
        // Build prompt from monster name and description
        // Always generate character with background
        const userPrompt = `${monster.name}: ${monster.description || 'a fantasy creature'}`;
        const prompt = buildBasePrompt(userPrompt, DEFAULT_SETTING as CardSetting);

        // Call the monster creation API
        // Use the request URL to construct the API endpoint
        const baseUrl = req.nextUrl.origin || `http://localhost:${process.env.PORT || 3000}`;
        const apiUrl = `${baseUrl}/api/monsters`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            klass: monster.name,
            prompt,
            seed: Math.floor(Math.random() * 1000000),
            stats: {
              hitPoints: monster.hitPoints,
              maxHitPoints: monster.maxHitPoints,
              armorClass: monster.armorClass,
              attackBonus: monster.attackBonus,
              damageDie: monster.damageDie,
              abilities: monster.abilities || [],
              description: monster.description,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to create monster image`);
        }

        const result = await response.json();
        console.log(`Created image for ${monster.name}: ${result.monsterId}`);
        results.created++;
      } catch (error) {
        results.errors.push({
          monster: monster.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch image creation completed. Created ${results.created} images, skipped ${results.skipped} monsters that already have images.`,
      created: results.created,
      skipped: results.skipped,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Batch image creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

