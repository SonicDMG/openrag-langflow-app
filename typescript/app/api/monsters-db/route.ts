import { NextRequest, NextResponse } from 'next/server';
import { getAllMonsters, upsertMonster, upsertMonsters, monsterRecordToClass } from '../../../lib/db/astra';
import { DnDClass } from '../../dnd/types';

// GET - Fetch all monsters
export async function GET(req: NextRequest) {
  try {
    console.log('[API /monsters-db] GET request received - fetching monsters from database');
    const monsters = await getAllMonsters();
    const classes = monsters.map(monsterRecordToClass);
    console.log(`[API /monsters-db] Returning ${classes.length} monsters`);
    
    return NextResponse.json({ monsters: classes });
  } catch (error) {
    console.error('[API /monsters-db] Error fetching monsters:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch monsters' },
      { status: 500 }
    );
  }
}

// POST - Save a single monster
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { monster, searchContext } = body;

    if (!monster || !monster.name) {
      return NextResponse.json(
        { error: 'Monster data with name is required' },
        { status: 400 }
      );
    }

    await upsertMonster(monster as DnDClass, searchContext);
    
    return NextResponse.json({ success: true, message: 'Monster saved successfully' });
  } catch (error) {
    console.error('Error saving monster:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save monster' },
      { status: 500 }
    );
  }
}

// PUT - Save multiple monsters
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { monsters, searchContext } = body;

    if (!monsters || !Array.isArray(monsters)) {
      return NextResponse.json(
        { error: 'Monsters array is required' },
        { status: 400 }
      );
    }

    await upsertMonsters(monsters as DnDClass[], searchContext);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${monsters.length} monsters` 
    });
  } catch (error) {
    console.error('Error saving monsters:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save monsters' },
      { status: 500 }
    );
  }
}

