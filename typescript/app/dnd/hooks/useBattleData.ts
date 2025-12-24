import { useState, useEffect } from 'react';
import { DnDClass } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../constants';
import { loadHeroesFromDatabase, loadMonstersFromDatabase } from '../utils/dataLoader';

/**
 * Simplified character loading with offline-first approach:
 * 1. Try database (network call)
 * 2. If network fails → use localStorage cache
 * 3. If no cache → use FALLBACK_CLASSES/MONSTERS (emergency only)
 * 4. Save successful database loads to localStorage
 *
 * No more complex duplicate filtering - all characters are treated equally.
 */

export function useBattleData() {
  // Start with empty arrays - no longer auto-load fallbacks
  const [availableClasses, setAvailableClasses] = useState<DnDClass[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [availableMonsters, setAvailableMonsters] = useState<DnDClass[]>([]);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);
  const [monstersLoaded, setMonstersLoaded] = useState(false);
  // Track if we have initial data (from cache or database) - used to prevent hiding content during refresh
  const [hasInitialData, setHasInitialData] = useState(false);
  const [createdMonsters, setCreatedMonsters] = useState<Array<DnDClass & { monsterId: string; imageUrl: string }>>([]);
  const [isLoadingCreatedMonsters, setIsLoadingCreatedMonsters] = useState(false);
  const [isRefreshingFromDatabase, setIsRefreshingFromDatabase] = useState(false);
  const [hasLoadedFromCache, setHasLoadedFromCache] = useState(false);

  // Load from localStorage immediately after mount (client-side only, after hydration)
  useEffect(() => {
    // Only run on client side, after hydration
    if (typeof window === 'undefined' || hasLoadedFromCache) return;

    try {
      const savedHeroes = localStorage.getItem('dnd_loaded_classes');
      const savedMonsters = localStorage.getItem('dnd_loaded_monsters');
      
      if (savedHeroes) {
        const heroes = JSON.parse(savedHeroes) as DnDClass[];
        console.log(`[useBattleData] Loaded ${heroes.length} heroes from localStorage (instant)`);
        setAvailableClasses(heroes);
        setClassesLoaded(true);
      } else {
        // Even if no cache, we have fallback data, so mark as having initial data
        setHasInitialData(true);
      }
      
      if (savedMonsters) {
        const monsters = JSON.parse(savedMonsters) as DnDClass[];
        console.log(`[useBattleData] Loaded ${monsters.length} monsters from localStorage (instant)`);
        setAvailableMonsters(monsters);
        setMonstersLoaded(true);
      } else {
        // Even if no cache, we have fallback data, so mark as having initial data
        setHasInitialData(true);
      }
      
      setHasLoadedFromCache(true);
      setHasInitialData(true);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setHasLoadedFromCache(true);
    }
  }, [hasLoadedFromCache]);

  useEffect(() => {
    // Wait for cache load to complete before starting database refresh
    if (!hasLoadedFromCache) return;

    // Set refreshing state at the start (for the loading indicator in header)
    setIsRefreshingFromDatabase(true);

    // Load classes from database in background (updates localStorage and state if different)
    // Don't set isLoadingClasses to true during background refresh - we already have data displayed
    const loadClasses = async () => {
      // Don't set loading state during background refresh - we have cached data already
      try {
        const heroes = await loadHeroesFromDatabase();
        console.log(`[useBattleData] Loaded ${heroes.length} heroes from database (background refresh)`);
        
        // Use database results if available, otherwise fall back to FALLBACK_CLASSES
        if (heroes.length > 0) {
          setAvailableClasses(heroes);
          // Cache successful load for offline use
          localStorage.setItem('dnd_loaded_classes', JSON.stringify(heroes));
        } else {
          // No heroes in database - use FALLBACK_CLASSES as emergency fallback
          console.log('[useBattleData] No heroes in database, using FALLBACK_CLASSES');
          setAvailableClasses(FALLBACK_CLASSES);
        }
        setClassesLoaded(true);
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    };

    // Load monsters from database in background (updates localStorage and state if different)
    // Don't set isLoadingMonsters during background refresh - we already have data displayed
    const loadMonsters = async () => {
      try {
        const monsters = await loadMonstersFromDatabase();
        console.log(`[useBattleData] Loaded ${monsters.length} monsters from database (background refresh)`);
        
        // Use database results if available, otherwise fall back to FALLBACK_MONSTERS
        if (monsters.length > 0) {
          setAvailableMonsters(monsters);
          // Cache successful load for offline use
          localStorage.setItem('dnd_loaded_monsters', JSON.stringify(monsters));
        } else {
          // No monsters in database - use FALLBACK_MONSTERS as emergency fallback
          console.log('[useBattleData] No monsters in database, using FALLBACK_MONSTERS');
          setAvailableMonsters(FALLBACK_MONSTERS);
        }
        setMonstersLoaded(true);
      } catch (error) {
        console.error('Failed to load monsters:', error);
        // On error, use FALLBACK_MONSTERS if we don't have cached data
        if (availableMonsters.length === 0) {
          console.log('[useBattleData] Error loading monsters, using FALLBACK_MONSTERS');
          setAvailableMonsters(FALLBACK_MONSTERS);
        }
      }
    };

    // Load both in parallel, then set refreshing to false when both complete
    Promise.all([loadClasses(), loadMonsters()]).finally(() => {
      setIsRefreshingFromDatabase(false);
    });
  }, [hasLoadedFromCache]);

  // Load created monsters from API (separate effect, doesn't depend on cache)
  useEffect(() => {
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
              imagePosition: m.imagePosition, // Include image position from API
              hasCutout: m.hasCutout ?? false,
              lastAssociatedAt: m.lastAssociatedAt,
              // Store the klass separately so we can use it for class type display
              klass: m.klass,
              // Preserve prompt and setting for PDF export
              prompt: m.prompt,
              setting: m.setting,
            } as DnDClass & { monsterId: string; imageUrl: string; imagePosition?: { offsetX: number; offsetY: number }; hasCutout?: boolean; lastAssociatedAt?: string; klass?: string; prompt?: string; setting?: string };
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
    isRefreshingFromDatabase,
  };
}

