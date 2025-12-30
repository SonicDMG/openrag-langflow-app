import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getAllMonsters, MonsterRecord } from '../../../../lib/db/astra';
import { Character } from '../../../battle-arena/lib/types';
import { loadDefaultMonsters } from '../../../battle-arena/utils/data/loadDefaults';

// POST - Export default monsters from database to JSON file
export async function POST() {
  try {
    console.log('[API /monsters/export-defaults] Exporting default monsters from database to JSON');
    
    // Load the list of default monster names from JSON
    const defaultMonstersFromJson = await loadDefaultMonsters();
    const defaultMonsterNames = new Set(defaultMonstersFromJson.map(m => m.name));
    
    // Fetch all monsters from database
    const allMonsters = await getAllMonsters();
    
    // Filter monsters that match default monster names OR have isDefault flag
    const defaultMonsters = allMonsters.filter((monster: MonsterRecord) =>
      monster.isDefault === true || defaultMonsterNames.has(monster.name)
    );
    
    if (defaultMonsters.length === 0) {
      return NextResponse.json(
        { error: 'No default monsters found in database to export. Please load default monsters first.' },
        { status: 404 }
      );
    }
    
    // Remove database-specific fields and prepare for JSON export
    const monstersForExport: Character[] = defaultMonsters.map((monster: MonsterRecord) => {
      // Create a clean copy without database metadata
      const cleanMonster: Character = {
        name: monster.name,
        hitPoints: monster.hitPoints,
        maxHitPoints: monster.maxHitPoints,
        armorClass: monster.armorClass,
        attackBonus: monster.attackBonus,
        damageDie: monster.damageDie,
        abilities: monster.abilities,
        description: monster.description,
        color: monster.color,
      };
      
      // Add optional fields if they exist
      if (monster.class) cleanMonster.class = monster.class;
      if (monster.meleeDamageDie) cleanMonster.meleeDamageDie = monster.meleeDamageDie;
      if (monster.rangedDamageDie) cleanMonster.rangedDamageDie = monster.rangedDamageDie;
      if (monster.race) cleanMonster.race = monster.race;
      if (monster.sex) cleanMonster.sex = monster.sex;
      
      // Add image references if they exist (for Everart images)
      if (monster.monsterId) (cleanMonster as any).monsterId = monster.monsterId;
      if (monster.imageUrl) (cleanMonster as any).imageUrl = monster.imageUrl;
      if (monster.imagePosition) (cleanMonster as any).imagePosition = monster.imagePosition;
      
      return cleanMonster;
    });
    
    // Create JSON structure
    const jsonData = {
      version: '1.0.0',
      description: 'Default monsters with abilities',
      exportedAt: new Date().toISOString(),
      monsters: monstersForExport,
    };
    
    // Write to JSON file
    const monstersPath = join(process.cwd(), '..', 'characters', 'default_monsters', 'monsters.json');
    await fs.writeFile(monstersPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    
    console.log(`[API /monsters/export-defaults] Successfully exported ${defaultMonsters.length} default monsters to JSON`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully exported ${defaultMonsters.length} default monsters to JSON`,
      count: defaultMonsters.length,
      path: 'characters/default_monsters/monsters.json',
    });
  } catch (error) {
    console.error('[API /monsters/export-defaults] Error exporting default monsters:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export default monsters' },
      { status: 500 }
    );
  }
}

// Made with Bob