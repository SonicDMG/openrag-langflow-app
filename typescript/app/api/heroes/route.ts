import { NextRequest, NextResponse } from 'next/server';
import { getAllHeroes, upsertHero, upsertHeroes, heroRecordToClass, deleteHero } from '../../../lib/db/astra';
import { DnDClass } from '../../dnd/types';

// GET - Fetch all heroes
export async function GET(req: NextRequest) {
  try {
    console.log('[API /heroes] GET request received - fetching heroes from database');
    const heroes = await getAllHeroes();
    const classes = heroes.map(heroRecordToClass);
    console.log(`[API /heroes] Returning ${classes.length} heroes`);
    
    return NextResponse.json({ heroes: classes });
  } catch (error) {
    console.error('[API /heroes] Error fetching heroes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch heroes' },
      { status: 500 }
    );
  }
}

// POST - Save a single hero
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hero, searchContext } = body;

    if (!hero || !hero.name) {
      return NextResponse.json(
        { error: 'Hero data with name is required' },
        { status: 400 }
      );
    }

    await upsertHero(hero as DnDClass, searchContext);
    
    return NextResponse.json({ success: true, message: 'Hero saved successfully' });
  } catch (error) {
    console.error('Error saving hero:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save hero' },
      { status: 500 }
    );
  }
}

// PUT - Save multiple heroes
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { heroes, searchContext } = body;

    if (!heroes || !Array.isArray(heroes)) {
      return NextResponse.json(
        { error: 'Heroes array is required' },
        { status: 400 }
      );
    }

    await upsertHeroes(heroes as DnDClass[], searchContext);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${heroes.length} heroes` 
    });
  } catch (error) {
    console.error('Error saving heroes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save heroes' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a hero
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Hero name is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteHero(name);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Hero not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Hero deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting hero:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete hero' },
      { status: 500 }
    );
  }
}

