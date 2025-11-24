import { useState, useEffect } from 'react';
import { DnDClass } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../constants';
import { loadHeroesFromDatabase, loadMonstersFromDatabase } from '../utils/dataLoader';

// Character name lists for each class (from names.ts)
const CLASS_NAME_LISTS: Record<string, string[]> = {
  Fighter: ['Thorin Ironfist', 'Gareth the Bold', 'Ragnar Steelheart', 'Sir Aldric', 'Bjorn the Mighty', 'Kaelen Bladeborn', 'Darius Warhammer', 'Conan the Conqueror'],
  Wizard: ['Merlin Shadowweaver', 'Gandalf the Grey', 'Zephyr Starfire', 'Archmage Elara', 'Thaddeus Spellwright', 'Lyra Moonwhisper', 'Alistair the Wise', 'Morgana Arcane'],
  Rogue: ['Shadow the Silent', 'Raven Blackdagger', 'Whisper Nightshade', 'Vex the Swift', 'Sly Cooper', 'Nyx Shadowstep', 'Jade the Thief', 'Crimson Blade'],
  Cleric: ['Brother Marcus', 'Sister Seraphina', 'Father Lightbringer', 'High Priestess Celeste', 'Brother Gabriel', 'Sister Mercy', 'Father Devout', 'Cleric Aria'],
  Barbarian: ['Grok the Furious', 'Thokk Bloodaxe', 'Berserker Korg', 'Rage the Unstoppable', 'Grimjaw the Wild', 'Thunder Fist', 'Bloodfang', 'Ragnarok'],
  Ranger: ['Aragorn the Wanderer', 'Legolas Greenleaf', 'Hawkeye the Tracker', 'Sylvan the Hunter', 'Ranger Kael', 'Forest Walker', 'Arrow the Swift', 'Wildheart'],
  Paladin: ['Sir Galahad', 'Lady Justice', 'Knight Valor', 'Sir Percival', 'Paladin Dawn', 'Holy Champion', 'Sir Lancelot', 'Divine Shield'],
  Bard: ['Lorelei the Songstress', 'Merry the Minstrel', 'Bardic Thunder', 'Lyric the Storyteller', 'Melody Bright', 'Harmony the Voice', 'Verse the Charmer', 'Rhyme the Witty'],
  Sorcerer: ['Zara Stormcaller', 'Draco the Wild', 'Nova the Radiant', 'Chaos the Untamed', 'Aurora Spellborn', 'Tempest the Furious', 'Ember the Bright', 'Starfire'],
  Warlock: ['Malachi Darkpact', 'Lilith the Cursed', 'Necro the Bound', 'Shadow the Summoner', 'Vex the Hexed', 'Raven the Cursed', 'Void the Dark', 'Pactkeeper'],
  Monk: ['Master Chen', 'Sifu Li', 'Zen the Peaceful', 'Iron Fist', 'Master Po', 'Dragon the Wise', 'Tiger the Fierce', 'Crane the Graceful'],
  Druid: ['Oakheart the Ancient', 'Luna Moonwhisper', 'Thorn the Wild', 'Nature the Keeper', 'Grove the Guardian', 'Ivy the Green', 'Root the Deep', 'Bloom the Bright'],
  Artificer: ['Tinker the Inventor', 'Gear the Builder', 'Cog the Mechanic', 'Spark the Creator', 'Forge the Smith', 'Wrench the Fixer', 'Blueprint the Designer', 'Steam the Engineer'],
};

/**
 * Check if a custom hero name matches any character name in a fallback class's name list.
 * This helps filter out fallback classes when a custom hero with a matching name exists.
 */
function isCustomHeroNameInClassList(customHeroName: string, className: string): boolean {
  const nameList = CLASS_NAME_LISTS[className] || [];
  return nameList.some(name => name.toLowerCase() === customHeroName.toLowerCase());
}

/**
 * Filter out fallback classes that have a custom hero with a matching character name.
 * This prevents duplicate cards (e.g., "Sylvan the Hunter" custom hero and "Ranger" fallback class).
 */
function filterFallbackClassesWithCustomHeroes(heroes: DnDClass[]): DnDClass[] {
  // Identify custom heroes (not in FALLBACK_CLASSES)
  const customHeroes = heroes.filter(hero => 
    !FALLBACK_CLASSES.some(fc => fc.name === hero.name)
  );
  
  // If no custom heroes, return all heroes as-is
  if (customHeroes.length === 0) {
    return heroes;
  }
  
  // Filter out fallback classes that have a custom hero with a matching name
  return heroes.filter(hero => {
    // Keep all custom heroes
    const isCustomHero = !FALLBACK_CLASSES.some(fc => fc.name === hero.name);
    if (isCustomHero) {
      return true;
    }
    
    // For fallback classes, check if any custom hero name matches this class's name list
    const hasMatchingCustomHero = customHeroes.some(customHero => 
      isCustomHeroNameInClassList(customHero.name, hero.name)
    );
    
    // Exclude fallback class if there's a matching custom hero
    return !hasMatchingCustomHero;
  });
}

export function useBattleData() {
  const [availableClasses, setAvailableClasses] = useState<DnDClass[]>(FALLBACK_CLASSES);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [availableMonsters, setAvailableMonsters] = useState<DnDClass[]>(FALLBACK_MONSTERS);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);
  const [monstersLoaded, setMonstersLoaded] = useState(false);
  const [createdMonsters, setCreatedMonsters] = useState<Array<DnDClass & { monsterId: string; imageUrl: string }>>([]);
  const [isLoadingCreatedMonsters, setIsLoadingCreatedMonsters] = useState(false);

  useEffect(() => {
    // Load classes from database (with automatic localStorage fallback and update)
    const loadClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const heroes = await loadHeroesFromDatabase();
        console.log(`[useBattleData] Loaded ${heroes.length} heroes from database`);
        if (heroes.length > 0) {
          // Filter out fallback classes that have matching custom heroes
          const filteredHeroes = filterFallbackClassesWithCustomHeroes(heroes);
          console.log(`[useBattleData] Filtered to ${filteredHeroes.length} heroes (removed ${heroes.length - filteredHeroes.length} fallback classes with matching custom heroes)`);
          setAvailableClasses(filteredHeroes);
          setClassesLoaded(true);
        } else {
          console.log('[useBattleData] No heroes found in database, using fallback classes');
        }
      } catch (error) {
        console.error('Failed to load classes:', error);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    // Load monsters from database (with automatic localStorage fallback and update)
    const loadMonsters = async () => {
      setIsLoadingMonsters(true);
      try {
        const monsters = await loadMonstersFromDatabase();
        console.log(`[useBattleData] Loaded ${monsters.length} monsters from database`);
        if (monsters.length > 0) {
          setAvailableMonsters(monsters);
          setMonstersLoaded(true);
        } else {
          console.log('[useBattleData] No monsters found in database, using fallback monsters');
        }
      } catch (error) {
        console.error('Failed to load monsters:', error);
      } finally {
        setIsLoadingMonsters(false);
      }
    };

    loadClasses();
    loadMonsters();

    // Load created monsters from API
    const loadCreatedMonsters = async () => {
      setIsLoadingCreatedMonsters(true);
      try {
        const response = await fetch('/api/monsters');
        if (response.ok) {
          const data = await response.json();
          // Convert created monsters to DnDClass format
          const convertedMonsters = data.monsters.map((m: any) => {
            // Find matching class/monster from fallbacks to get stats and abilities
            const fallbackClass = FALLBACK_CLASSES.find(c => c.name === m.klass);
            const fallbackMonster = FALLBACK_MONSTERS.find(m2 => m2.name === m.klass);
            const fallback = fallbackClass || fallbackMonster;
            
            // Extract character name from prompt if available
            // The prompt format is usually: "CharacterName: description" or "CharacterName ClassName: description"
            // or "ClassName RaceName: description"
            let characterName = m.klass; // Default to klass
            if (m.prompt) {
              // Try to extract name from prompt - look for pattern like "Name:" or "Name ClassName:"
              // First, try to find the part before the first colon
              const colonIndex = m.prompt.indexOf(':');
              if (colonIndex > 0) {
                const beforeColon = m.prompt.substring(0, colonIndex).trim();
                const parts = beforeColon.split(/\s+/);
                
                // Check if the klass appears in the parts
                const klassIndex = parts.findIndex((p: string) => p === m.klass);
                
                if (klassIndex > 0) {
                  // Pattern like "Onyx Champion" - extract "Onyx" (everything before klass)
                  characterName = parts.slice(0, klassIndex).join(' ');
                } else if (klassIndex === -1 && parts.length > 0) {
                  // Klass not found in parts - check if first part is different from klass
                  if (parts[0] !== m.klass && parts.length === 1) {
                    // Single word that's not the klass - likely the character name
                    characterName = parts[0];
                  } else if (parts.length === 2 && parts[0] === m.klass) {
                    // Pattern like "Champion Human" - klass is first, so use klass as name
                    characterName = m.klass;
                  } else if (parts.length > 1 && parts[0] !== m.klass) {
                    // Multiple words, first is not klass - might be "Name Race" or "Name Class"
                    // Use first word as character name
                    characterName = parts[0];
                  }
                }
                // If klassIndex === 0, then klass is first word, so use klass as name (already set)
              }
            }
            
            return {
              name: characterName, // Use extracted character name instead of klass
              hitPoints: m.stats?.hitPoints || fallback?.hitPoints || 30,
              maxHitPoints: m.stats?.maxHitPoints || m.stats?.hitPoints || fallback?.maxHitPoints || 30,
              armorClass: m.stats?.armorClass || fallback?.armorClass || 14,
              attackBonus: m.stats?.attackBonus || fallback?.attackBonus || 4,
              damageDie: m.stats?.damageDie || fallback?.damageDie || 'd8',
              abilities: fallback?.abilities || [],
              description: m.stats?.description || fallback?.description || `A ${m.klass} created in the monster creator.`,
              color: fallback?.color || 'bg-slate-900',
              monsterId: m.monsterId,
              imageUrl: m.imageUrl?.replace('/256.png', '/280x200.png').replace('/200.png', '/280x200.png') || m.imageUrl,
              hasCutout: m.hasCutout ?? false,
              lastAssociatedAt: m.lastAssociatedAt,
              // Store the klass separately so we can use it for class type display
              klass: m.klass,
              // Preserve prompt and setting for PDF export
              prompt: m.prompt,
              setting: m.setting,
            } as DnDClass & { monsterId: string; imageUrl: string; hasCutout?: boolean; lastAssociatedAt?: string; klass?: string; prompt?: string; setting?: string };
          });
          setCreatedMonsters(convertedMonsters);
        }
      } catch (error) {
        console.error('Failed to load created monsters:', error);
      } finally {
        setIsLoadingCreatedMonsters(false);
      }
    };
    loadCreatedMonsters();

    // Reload created monsters when window regains focus (in case user updated associations in another tab)
    const handleFocus = () => {
      loadCreatedMonsters();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return {
    availableClasses,
    isLoadingClasses,
    classesLoaded,
    availableMonsters,
    isLoadingMonsters,
    monstersLoaded,
    createdMonsters,
    isLoadingCreatedMonsters,
  };
}

