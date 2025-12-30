import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getAllHeroes, HeroRecord } from '../../../../lib/db/astra';
import { Character } from '../../../battle-arena/lib/types';
import { loadDefaultHeroes } from '../../../battle-arena/utils/data/loadDefaults';

// POST - Export default heroes from database to JSON file
export async function POST() {
  try {
    console.log('[API /heroes/export-defaults] Exporting default heroes from database to JSON');
    
    // Load the list of default hero names from JSON
    const defaultHeroesFromJson = await loadDefaultHeroes();
    const defaultHeroNames = new Set(defaultHeroesFromJson.map(h => h.name));
    
    // Fetch all heroes from database
    const allHeroes = await getAllHeroes();
    
    // Filter heroes that match default hero names OR have isDefault flag
    const defaultHeroes = allHeroes.filter((hero: HeroRecord) =>
      hero.isDefault === true || defaultHeroNames.has(hero.name)
    );
    
    if (defaultHeroes.length === 0) {
      return NextResponse.json(
        { error: 'No default heroes found in database to export. Please load default heroes first.' },
        { status: 404 }
      );
    }
    
    // Remove database-specific fields and prepare for JSON export
    const heroesForExport: Character[] = defaultHeroes.map((hero: HeroRecord) => {
      // Create a clean copy without database metadata
      // Note: hero.name now contains the display name (e.g., "Berserker Korg")
      // and hero.class contains the original class name (e.g., "Barbarian")
      const cleanHero: Character = {
        name: hero.name, // This is now the display name
        hitPoints: hero.hitPoints,
        maxHitPoints: hero.maxHitPoints,
        armorClass: hero.armorClass,
        attackBonus: hero.attackBonus,
        damageDie: hero.damageDie,
        abilities: hero.abilities,
        description: hero.description,
        color: hero.color,
      };
      
      // Add optional fields if they exist
      if (hero.class) cleanHero.class = hero.class;
      if (hero.meleeDamageDie) cleanHero.meleeDamageDie = hero.meleeDamageDie;
      if (hero.rangedDamageDie) cleanHero.rangedDamageDie = hero.rangedDamageDie;
      if (hero.race) cleanHero.race = hero.race;
      if (hero.sex) cleanHero.sex = hero.sex;
      
      // Add image references if they exist (for Everart images)
      if (hero.monsterId) (cleanHero as any).monsterId = hero.monsterId;
      if (hero.imageUrl) (cleanHero as any).imageUrl = hero.imageUrl;
      if (hero.imagePosition) (cleanHero as any).imagePosition = hero.imagePosition;
      
      return cleanHero;
    });
    
    // Create JSON structure
    const jsonData = {
      version: '1.0.0',
      description: 'Default hero classes with abilities',
      exportedAt: new Date().toISOString(),
      heroes: heroesForExport,
    };
    
    // Write to JSON file
    const heroesPath = join(process.cwd(), '..', 'characters', 'default_heroes', 'heroes.json');
    await fs.writeFile(heroesPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    
    console.log(`[API /heroes/export-defaults] Successfully exported ${defaultHeroes.length} default heroes to JSON`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully exported ${defaultHeroes.length} default heroes to JSON`,
      count: defaultHeroes.length,
      path: 'characters/default_heroes/heroes.json',
    });
  } catch (error) {
    console.error('[API /heroes/export-defaults] Error exporting default heroes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export default heroes' },
      { status: 500 }
    );
  }
}

// Made with Bob