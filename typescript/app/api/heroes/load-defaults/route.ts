import { NextResponse } from 'next/server';
import { upsertHeroes } from '../../../../lib/db/astra';
import { loadDefaultHeroes } from '../../../dnd/utils/loadDefaults';
import { generateDeterministicCharacterName } from '../../../dnd/utils/names';
import { DnDClass } from '../../../dnd/types';

// POST - Load default heroes into database
export async function POST() {
  try {
    console.log('[API /heroes/load-defaults] Loading default heroes from JSON to database');
    
    // Load heroes from JSON file
    const heroesFromJson = await loadDefaultHeroes();
    
    // Generate display names for default heroes and update their names
    // This ensures heroes are stored with their display names (e.g., "Berserker Korg")
    // rather than just class names (e.g., "Barbarian")
    const defaultHeroes: DnDClass[] = heroesFromJson.map(hero => {
      // Check if hero.name is a standard class name (exists in CLASS_NAME_LISTS)
      // If so, generate a deterministic display name
      const displayName = generateDeterministicCharacterName(hero.name);
      
      console.log(`[API /heroes/load-defaults] Processing hero: ${hero.name} -> ${displayName}`);
      
      return {
        ...hero,
        name: displayName, // Use generated display name as the primary name
        class: hero.name,  // Store original class name in the class field
        isDefault: true,
      };
    });
    
    // Save all default heroes to database
    await upsertHeroes(defaultHeroes, 'Default D&D Heroes');
    
    console.log(`[API /heroes/load-defaults] Successfully loaded ${defaultHeroes.length} default heroes from JSON`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${defaultHeroes.length} default heroes from JSON`,
      count: defaultHeroes.length
    });
  } catch (error) {
    console.error('[API /heroes/load-defaults] Error loading default heroes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load default heroes' },
      { status: 500 }
    );
  }
}

// Made with Bob
