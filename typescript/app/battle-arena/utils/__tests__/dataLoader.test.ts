import {
  loadHeroesFromDatabase,
  loadMonstersFromDatabase,
  loadAllCharacterData,
} from '../dataLoader';
import { Character } from '../../types';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  const getItem = jest.fn((key: string) => {
    return store[key] || null;
  });

  const setItem = jest.fn((key: string, value: string) => {
    store[key] = value.toString();
  });

  const removeItem = jest.fn((key: string) => {
    delete store[key];
  });

  const clear = jest.fn(() => {
    store = {};
  });

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    get store() {
      return store;
    },
    set store(value: Record<string, string>) {
      store = value;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods
const originalWarn = console.warn;
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  console.warn = jest.fn();
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
  console.log = originalLog;
  console.error = originalError;
});

describe('dataLoader', () => {
  const mockHeroes: Character[] = [
    {
      name: 'Ranger',
      hitPoints: 30,
      maxHitPoints: 30,
      armorClass: 14,
      attackBonus: 4,
      damageDie: 'd8',
      abilities: [],
      description: 'A skilled tracker and archer',
      color: 'bg-green-900',
    },
    {
      name: 'Fighter',
      hitPoints: 35,
      maxHitPoints: 35,
      armorClass: 16,
      attackBonus: 5,
      damageDie: 'd10',
      abilities: [],
      description: 'A master of weapons and armor',
      color: 'bg-red-900',
    },
  ];

  const mockMonsters: Character[] = [
    {
      name: 'Goblin',
      hitPoints: 7,
      maxHitPoints: 7,
      armorClass: 15,
      attackBonus: 4,
      damageDie: 'd6',
      abilities: [],
      description: 'A small, green humanoid',
      color: 'bg-green-800',
    },
  ];

  describe('loadHeroesFromDatabase', () => {
    it('should load heroes from database and update localStorage', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ heroes: mockHeroes }),
      });

      const result = await loadHeroesFromDatabase();

      expect(result).toEqual(mockHeroes);
      expect(global.fetch).toHaveBeenCalledWith('/api/heroes');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'battle_arena_loaded_classes',
        JSON.stringify(mockHeroes)
      );
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should fall back to localStorage on network error', async () => {
      // Set up localStorage with saved data
      localStorageMock.setItem('battle_arena_loaded_classes', JSON.stringify(mockHeroes));

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadHeroesFromDatabase();

      expect(result).toEqual(mockHeroes);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Network error loading heroes from database'),
        expect.any(Error)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/✅ Loaded \d+ heroes from localStorage fallback/)
      );
    });

    it('should return empty array when network fails and localStorage is empty', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadHeroesFromDatabase();

      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
      // Allow for info logs but not the success fallback log
      const logCalls = (console.log as jest.Mock).mock.calls;
      const hasFallbackLog = logCalls.some((call: string[]) =>
        typeof call[0] === 'string' && call[0].includes('✅ Loaded') && call[0].includes('heroes from localStorage fallback')
      );
      expect(hasFallbackLog).toBe(false);
    });

    it('should return empty array when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await loadHeroesFromDatabase();

      expect(result).toEqual([]);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should return empty array when response has no heroes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ heroes: [] }),
      });

      const result = await loadHeroesFromDatabase();

      expect(result).toEqual([]);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage save failure gracefully', async () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn((_key: string, _value: string) => {
        throw new Error('Storage quota exceeded');
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ heroes: mockHeroes }),
      });

      const result = await loadHeroesFromDatabase();

      expect(result).toEqual(mockHeroes);
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to save heroes to localStorage:',
        expect.any(Error)
      );

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set up corrupted localStorage data
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = jest.fn((key: string) => {
        if (key === 'battle_arena_loaded_classes') {
          return 'invalid json{';
        }
        return null;
      });

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadHeroesFromDatabase();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to parse heroes from localStorage:',
        expect.any(Error)
      );

      // Restore original getItem
      localStorageMock.getItem = originalGetItem;
    });
  });

  describe('loadMonstersFromDatabase', () => {
    it('should load monsters from database and update localStorage', async () => {
      // Ensure localStorage.setItem is not mocked to throw
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn((key: string, value: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (localStorageMock as any).store[key] = value;
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ monsters: mockMonsters }),
      });

      const result = await loadMonstersFromDatabase();

      // Expect monsters to have _type marker added
      const expectedMonsters = mockMonsters.map(m => ({ ...m, _type: 'monster' as const }));
      expect(result).toEqual(expectedMonsters);
      expect(global.fetch).toHaveBeenCalledWith('/api/monsters-db');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'battle_arena_loaded_monsters',
        JSON.stringify(expectedMonsters)
      );
      expect(console.warn).not.toHaveBeenCalled();

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });

    it('should fall back to localStorage on network error', async () => {
      // Set up localStorage with saved data
      localStorageMock.setItem('battle_arena_loaded_monsters', JSON.stringify(mockMonsters));

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadMonstersFromDatabase();

      expect(result).toEqual(mockMonsters);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Network error loading monsters from database'),
        expect.any(Error)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/✅ Loaded \d+ monsters from localStorage fallback/)
      );
    });

    it('should return empty array when network fails and localStorage is empty', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadMonstersFromDatabase();

      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
      // Allow for info logs but not the success fallback log
      const logCalls = (console.log as jest.Mock).mock.calls;
      const hasFallbackLog = logCalls.some((call: string[]) =>
        typeof call[0] === 'string' && call[0].includes('✅ Loaded') && call[0].includes('monsters from localStorage fallback')
      );
      expect(hasFallbackLog).toBe(false);
    });

    it('should return empty array when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await loadMonstersFromDatabase();

      expect(result).toEqual([]);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should return empty array when response has no monsters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ monsters: [] }),
      });

      const result = await loadMonstersFromDatabase();

      expect(result).toEqual([]);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage save failure gracefully', async () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn((_key: string, _value: string) => {
        throw new Error('Storage quota exceeded');
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ monsters: mockMonsters }),
      });

      const result = await loadMonstersFromDatabase();

      // Expect monsters to have _type marker added
      const expectedMonsters = mockMonsters.map(m => ({ ...m, _type: 'monster' as const }));
      expect(result).toEqual(expectedMonsters);
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to save monsters to localStorage:',
        expect.any(Error)
      );

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set up corrupted localStorage data
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = jest.fn((key: string) => {
        if (key === 'battle_arena_loaded_monsters') {
          return 'invalid json{';
        }
        return null;
      });

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadMonstersFromDatabase();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to parse monsters from localStorage:',
        expect.any(Error)
      );

      // Restore original getItem
      localStorageMock.getItem = originalGetItem;
    });
  });

  describe('loadAllCharacterData', () => {
    it('should load both heroes and monsters in parallel', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ heroes: mockHeroes }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ monsters: mockMonsters }),
        });

      const result = await loadAllCharacterData();

      // Expect monsters to have _type marker added
      const expectedMonsters = mockMonsters.map(m => ({ ...m, _type: 'monster' as const }));
      expect(result).toEqual({
        heroes: mockHeroes,
        monsters: expectedMonsters,
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      // Set up localStorage for monsters fallback with _type marker
      const monstersWithType = mockMonsters.map(m => ({ ...m, _type: 'monster' as const }));
      localStorageMock.setItem('battle_arena_loaded_monsters', JSON.stringify(monstersWithType));

      // Heroes succeed, monsters fail
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ heroes: mockHeroes }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await loadAllCharacterData();

      // Expect monsters from localStorage to have _type marker
      const expectedMonsters = monstersWithType;
      expect(result).toEqual({
        heroes: mockHeroes,
        monsters: expectedMonsters,
      });
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Network error loading monsters from database'),
        expect.any(Error)
      );
    });

    it('should return empty arrays when both fail', async () => {
      // Clear localStorage to ensure no fallback data
      localStorageMock.clear();

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await loadAllCharacterData();

      expect(result).toEqual({
        heroes: [],
        monsters: [],
      });
    });
  });
});

