import { NextResponse } from 'next/server';
import { upsertMonsters } from '../../../../lib/db/astra';
import { loadDefaultMonsters } from '../../../battle-arena/utils/loadDefaults';
import { Character } from '../../../battle-arena/lib/types';

// POST - Load default monsters into database
export async function POST() {
  try {
    console.log('[API /monsters/load-defaults] Loading default monsters from JSON to database');
    
    // Load monsters from JSON file
    const monstersFromJson = await loadDefaultMonsters();
    
    // Add isDefault flag to all monsters
    const defaultMonsters: Character[] = monstersFromJson.map(monster => ({
      ...monster,
      isDefault: true,
    }));
    
    // Save all default monsters to database
    await upsertMonsters(defaultMonsters, 'Default Monsters');
    
    console.log(`[API /monsters/load-defaults] Successfully loaded ${defaultMonsters.length} default monsters from JSON`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${defaultMonsters.length} default monsters from JSON`,
      count: defaultMonsters.length
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