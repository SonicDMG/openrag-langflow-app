import { NextRequest, NextResponse } from 'next/server';
import { getAllHeroes, upsertHero, upsertHeroes, heroRecordToClass } from '../../../lib/db/astra';
import { DnDClass } from '../../dnd/types';

// GET - Fetch all heroes
export async function GET(req: NextRequest) {
  try {
    const heroes = await getAllHeroes();
    const classes = heroes.map(heroRecordToClass);
    
    return NextResponse.json({ heroes: classes });
  } catch (error) {
    console.error('Error fetching heroes:', error);
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

