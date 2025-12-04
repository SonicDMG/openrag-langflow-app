import { NextResponse } from 'next/server';
import { upsertHeroes } from '../../../../lib/db/astra';
import { FALLBACK_CLASSES } from '../../../dnd/constants';
import { DnDClass } from '../../../dnd/types';

// POST - Load default heroes into database
export async function POST() {
  try {
    console.log('[API /heroes/load-defaults] Loading default heroes to database');
    
    // Add isDefault flag to all fallback classes
    const defaultHeroes: DnDClass[] = FALLBACK_CLASSES.map(hero => ({
      ...hero,
      isDefault: true,
    }));
    
    // Save all default heroes to database
    await upsertHeroes(defaultHeroes, 'Default D&D Heroes');
    
    console.log(`[API /heroes/load-defaults] Successfully loaded ${defaultHeroes.length} default heroes`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully loaded ${defaultHeroes.length} default heroes`,
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
