import { DnDClass } from '../types';

const HEROES_STORAGE_KEY = 'dnd_loaded_classes';
const MONSTERS_STORAGE_KEY = 'dnd_loaded_monsters';

/**
 * Load heroes from database, with fallback to localStorage
 * Updates localStorage on successful database load
 */
export async function loadHeroesFromDatabase(): Promise<DnDClass[]> {
  try {
    console.log('[dataLoader] Fetching heroes from /api/heroes');
    const response = await fetch('/api/heroes');
    if (response.ok) {
      const data = await response.json();
      console.log(`[dataLoader] Received ${data.heroes?.length || 0} heroes from API`);
      if (data.heroes && data.heroes.length > 0) {
        // Successfully loaded from database - update localStorage
        try {
          localStorage.setItem(HEROES_STORAGE_KEY, JSON.stringify(data.heroes));
          console.log(`[dataLoader] Saved ${data.heroes.length} heroes to localStorage`);
        } catch (storageError) {
          console.warn('Failed to save heroes to localStorage:', storageError);
        }
        return data.heroes;
      } else {
        console.log('[dataLoader] No heroes in API response');
      }
    } else {
      console.warn(`[dataLoader] API response not ok: ${response.status}`);
    }
  } catch (error) {
    // Network error - try localStorage fallback
    console.warn('⚠️ Network error loading heroes from database, falling back to localStorage:', error);
    try {
      const savedHeroes = localStorage.getItem(HEROES_STORAGE_KEY);
      if (savedHeroes) {
        const parsedHeroes = JSON.parse(savedHeroes) as DnDClass[];
        console.log(`✅ Loaded ${parsedHeroes.length} heroes from localStorage fallback`);
        return parsedHeroes;
      } else {
        console.log('[dataLoader] No heroes in localStorage fallback');
      }
    } catch (parseError) {
      console.error('Failed to parse heroes from localStorage:', parseError);
    }
  }
  
  // Return empty array if both database and localStorage fail
  console.log('[dataLoader] Returning empty array for heroes');
  return [];
}

/**
 * Load monsters from database, with fallback to localStorage
 * Updates localStorage on successful database load
 */
export async function loadMonstersFromDatabase(): Promise<DnDClass[]> {
  try {
    console.log('[dataLoader] Fetching monsters from /api/monsters-db');
    const response = await fetch('/api/monsters-db');
    if (response.ok) {
      const data = await response.json();
      console.log(`[dataLoader] Received ${data.monsters?.length || 0} monsters from API`);
      if (data.monsters && data.monsters.length > 0) {
        // Successfully loaded from database - update localStorage
        try {
          localStorage.setItem(MONSTERS_STORAGE_KEY, JSON.stringify(data.monsters));
          console.log(`[dataLoader] Saved ${data.monsters.length} monsters to localStorage`);
        } catch (storageError) {
          console.warn('Failed to save monsters to localStorage:', storageError);
        }
        return data.monsters;
      } else {
        console.log('[dataLoader] No monsters in API response');
      }
    } else {
      console.warn(`[dataLoader] API response not ok: ${response.status}`);
    }
  } catch (error) {
    // Network error - try localStorage fallback
    console.warn('⚠️ Network error loading monsters from database, falling back to localStorage:', error);
    try {
      const savedMonsters = localStorage.getItem(MONSTERS_STORAGE_KEY);
      if (savedMonsters) {
        const parsedMonsters = JSON.parse(savedMonsters) as DnDClass[];
        console.log(`✅ Loaded ${parsedMonsters.length} monsters from localStorage fallback`);
        return parsedMonsters;
      } else {
        console.log('[dataLoader] No monsters in localStorage fallback');
      }
    } catch (parseError) {
      console.error('Failed to parse monsters from localStorage:', parseError);
    }
  }
  
  // Return empty array if both database and localStorage fail
  console.log('[dataLoader] Returning empty array for monsters');
  return [];
}

/**
 * Load both heroes and monsters from database on app initialization
 * Updates localStorage on successful loads
 */
export async function loadAllCharacterData(): Promise<{
  heroes: DnDClass[];
  monsters: DnDClass[];
}> {
  const [heroes, monsters] = await Promise.all([
    loadHeroesFromDatabase(),
    loadMonstersFromDatabase(),
  ]);
  
  return { heroes, monsters };
}

