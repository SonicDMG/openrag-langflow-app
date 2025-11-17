import { useState, useEffect } from 'react';
import { DnDClass } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../constants';

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
    // Load classes from Astra DB (with fallback to localStorage)
    const loadClasses = async () => {
      try {
        // Try Astra DB first
        const response = await fetch('/api/heroes');
        if (response.ok) {
          const data = await response.json();
          if (data.heroes && data.heroes.length > 0) {
            setAvailableClasses(data.heroes);
            setClassesLoaded(true);
            console.log(`Loaded ${data.heroes.length} classes from Astra DB`);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load classes from Astra DB, trying localStorage:', error);
      }

      // Fallback to localStorage
      try {
        const savedClasses = localStorage.getItem('dnd_loaded_classes');
        if (savedClasses) {
          const parsedClasses = JSON.parse(savedClasses) as DnDClass[];
          setAvailableClasses(parsedClasses);
          setClassesLoaded(true);
          console.log(`Loaded ${parsedClasses.length} classes from localStorage`);
        }
      } catch (error) {
        console.error('Failed to load classes from localStorage:', error);
      }
    };

    // Load monsters from Astra DB (with fallback to localStorage)
    const loadMonsters = async () => {
      try {
        // Try Astra DB first
        const response = await fetch('/api/monsters-db');
        if (response.ok) {
          const data = await response.json();
          if (data.monsters && data.monsters.length > 0) {
            setAvailableMonsters(data.monsters);
            setMonstersLoaded(true);
            console.log(`Loaded ${data.monsters.length} monsters from Astra DB`);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load monsters from Astra DB, trying localStorage:', error);
      }

      // Fallback to localStorage
      try {
        const savedMonsters = localStorage.getItem('dnd_loaded_monsters');
        if (savedMonsters) {
          const parsedMonsters = JSON.parse(savedMonsters) as DnDClass[];
          setAvailableMonsters(parsedMonsters);
          setMonstersLoaded(true);
          console.log(`Loaded ${parsedMonsters.length} monsters from localStorage`);
        }
      } catch (error) {
        console.error('Failed to load monsters from localStorage:', error);
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
                const klassIndex = parts.findIndex(p => p === m.klass);
                
                if (klassIndex > 0) {
                  // Pattern like "Onyx Champion" - extract "Onyx" (everything before klass)
                  characterName = parts.slice(0, klassIndex).join(' ');
                  console.log(`[useBattleData] Extracted character name "${characterName}" from prompt "${beforeColon}" (klass: ${m.klass})`);
                } else if (klassIndex === -1 && parts.length > 0) {
                  // Klass not found in parts - check if first part is different from klass
                  if (parts[0] !== m.klass && parts.length === 1) {
                    // Single word that's not the klass - likely the character name
                    characterName = parts[0];
                    console.log(`[useBattleData] Using single word "${characterName}" as character name (klass: ${m.klass})`);
                  } else if (parts.length === 2 && parts[0] === m.klass) {
                    // Pattern like "Champion Human" - klass is first, so use klass as name
                    characterName = m.klass;
                    console.log(`[useBattleData] Using klass "${characterName}" as character name (pattern: "${beforeColon}")`);
                  } else if (parts.length > 1 && parts[0] !== m.klass) {
                    // Multiple words, first is not klass - might be "Name Race" or "Name Class"
                    // Use first word as character name
                    characterName = parts[0];
                    console.log(`[useBattleData] Using first word "${characterName}" as character name (klass: ${m.klass}, pattern: "${beforeColon}")`);
                  }
                }
                // If klassIndex === 0, then klass is first word, so use klass as name (already set)
              } else {
                console.log(`[useBattleData] No colon found in prompt, using klass "${characterName}" as character name`);
              }
            } else {
              console.log(`[useBattleData] No prompt found, using klass "${characterName}" as character name`);
            }
            
            console.log(`[useBattleData] Final: name="${characterName}", klass="${m.klass}"`);
            
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
            } as DnDClass & { monsterId: string; imageUrl: string; hasCutout?: boolean; lastAssociatedAt?: string; klass?: string };
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

