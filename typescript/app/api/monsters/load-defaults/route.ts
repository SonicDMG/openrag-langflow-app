import { NextResponse } from 'next/server';
import { upsertMonsters } from '../../../../lib/db/astra';
import { loadDefaultMonsters } from '../../../battle-arena/utils/data/loadDefaults';
import { Character } from '../../../battle-arena/lib/types';

// POST - Load default monsters into database
export async function POST() {
  try {
    console.log('[API /monsters/load-defaults] Loading default monsters from JSON');
    
    // Load monsters from JSON file
    const monstersFromJson = await loadDefaultMonsters();
    
    // Add isDefault flag to all monsters
    const defaultMonsters: Character[] = monstersFromJson.map(monster => ({
      ...monster,
      isDefault: true,
    }));
    
    // Try to save to database (will gracefully skip if database not available)
    try {
      await upsertMonsters(defaultMonsters, 'Default Monsters');
      console.log(`[API /monsters/load-defaults] Successfully saved ${defaultMonsters.length} default monsters to database`);
    } catch (dbError) {
      console.log('[API /monsters/load-defaults] Database not available, monsters loaded from JSON only');
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${defaultMonsters.length} default monsters`,
      count: defaultMonsters.length,
      monsters: defaultMonsters
    });
  } catch (error) {
    console.error('[API /monsters/load-defaults] Error loading default monsters:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load default monsters' },
      { status: 500 }
    );
  }
}

// Made with Bob