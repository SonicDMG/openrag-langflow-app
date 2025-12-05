import { NextResponse } from 'next/server';
import { upsertMonsters } from '../../../../lib/db/astra';
import { loadDefaultMonsters } from '../../../dnd/utils/loadDefaults';
import { DnDClass } from '../../../dnd/types';

// POST - Load default monsters into database
export async function POST() {
  try {
    console.log('[API /monsters/load-defaults] Loading default monsters from JSON to database');
    
    // Load monsters from JSON file
    const monstersFromJson = await loadDefaultMonsters();
    
    // Add isDefault flag to all monsters
    const defaultMonsters: DnDClass[] = monstersFromJson.map(monster => ({
      ...monster,
      isDefault: true,
    }));
    
    // Save all default monsters to database
    await upsertMonsters(defaultMonsters, 'Default D&D Monsters');
    
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