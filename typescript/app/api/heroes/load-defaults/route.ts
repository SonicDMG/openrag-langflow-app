import { NextResponse } from 'next/server';
import { upsertHeroes } from '../../../../lib/db/astra';
import { loadDefaultHeroes } from '../../../dnd/utils/loadDefaults';
import { DnDClass } from '../../../dnd/types';

// POST - Load default heroes into database
export async function POST() {
  try {
    console.log('[API /heroes/load-defaults] Loading default heroes from JSON to database');
    
    // Load heroes from JSON file
    const heroesFromJson = await loadDefaultHeroes();
    
    // Add isDefault flag to all heroes
    const defaultHeroes: DnDClass[] = heroesFromJson.map(hero => ({
      ...hero,
      isDefault: true,
    }));
    
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
