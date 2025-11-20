import { useState, useEffect } from 'react';
import { DnDClass } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../constants';
import { loadHeroesFromDatabase, loadMonstersFromDatabase } from '../utils/dataLoader';

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
          setAvailableClasses(heroes);
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

