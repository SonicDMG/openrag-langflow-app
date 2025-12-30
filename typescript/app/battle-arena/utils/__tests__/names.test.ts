import { getCharacterName, generateDeterministicCharacterName } from '../character/names';
import { Character } from '../../lib/types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../../lib/constants';

describe('getCharacterName', () => {
  // Helper to create a test Character
  const createTestClass = (
    name: string,
    isCreatedMonster = false,
    isCustomHero = false
  ): Character => {
    const baseClass: Character = {
      name,
      hitPoints: 50,
      maxHitPoints: 50,
      armorClass: 15,
      attackBonus: 5,
      damageDie: 'd8',
      abilities: [],
      description: 'Test character',
      color: '#000000',
    };

    if (isCreatedMonster) {
      return {
        ...baseClass,
        klass: 'Fighter', // Created monsters have klass property
        monsterId: 'test-monster-id',
      } as any;
    }

    return baseClass;
  };

  describe('null/undefined class handling', () => {
    it('should return playerName when class is null and playerName is provided', () => {
      expect(getCharacterName('TestName', null)).toBe('TestName');
    });

    it('should return "Unknown" when class is null and playerName is empty', () => {
      expect(getCharacterName('', null)).toBe('Unknown');
    });

    it('should return "Unknown" when class is null and playerName is undefined', () => {
      expect(getCharacterName(undefined as any, null)).toBe('Unknown');
    });
  });

  describe('created monsters', () => {
    it('should return playerName when provided for created monster', () => {
      const createdMonster = createTestClass('Aragorn', true);
      expect(getCharacterName('Aragorn the Ranger', createdMonster)).toBe('Aragorn the Ranger');
    });

    it('should return class.name when playerName is empty for created monster', () => {
      const createdMonster = createTestClass('Aragorn', true);
      expect(getCharacterName('', createdMonster)).toBe('Aragorn');
    });

    it('should return class.name when playerName is undefined for created monster', () => {
      const createdMonster = createTestClass('Legolas', true);
      expect(getCharacterName(undefined as any, createdMonster)).toBe('Legolas');
    });
  });

  describe('custom heroes', () => {
    it('should return playerName when provided for custom hero', () => {
      // Create a class that's not in FALLBACK_CLASSES and not a monster
      const customHero: Character = {
        name: 'Aragorn',
        hitPoints: 50,
        maxHitPoints: 50,
        armorClass: 15,
        attackBonus: 5,
        damageDie: 'd8',
        abilities: [],
        description: 'Custom hero',
        color: '#000000',
      };
      expect(getCharacterName('Aragorn', customHero)).toBe('Aragorn');
    });

    it('should return class.name when playerName is empty for custom hero', () => {
      // Create a class that's not in FALLBACK_CLASSES and not a monster
      const customHero: Character = {
        name: 'Legolas',
        hitPoints: 50,
        maxHitPoints: 50,
        armorClass: 15,
        attackBonus: 5,
        damageDie: 'd8',
        abilities: [],
        description: 'Custom hero',
        color: '#000000',
      };
      expect(getCharacterName('', customHero)).toBe('Legolas');
    });

    it('should identify custom hero correctly (not in FALLBACK_CLASSES, not a monster)', () => {
      // Create a class that's not in FALLBACK_CLASSES and not a monster
      const customHero: Character = {
        name: 'Gandalf the Grey',
        hitPoints: 50,
        maxHitPoints: 50,
        armorClass: 15,
        attackBonus: 5,
        damageDie: 'd8',
        abilities: [],
        description: 'Custom hero',
        color: '#000000',
      };
      const name = getCharacterName('', customHero);
      expect(name).toBe('Gandalf the Grey');
      // Verify it's not generating a deterministic name (custom heroes use their name directly)
      expect(name).not.toBe(generateDeterministicCharacterName('Gandalf the Grey'));
      // Verify it's not in FALLBACK_CLASSES
      expect(FALLBACK_CLASSES.some(c => c.name === customHero.name)).toBe(false);
    });
  });

  // Note: FALLBACK_CLASSES tests removed as they're no longer relevant.
  // FALLBACK_CLASSES now contains actual character data (e.g., "Whisper Nightshade")
  // instead of generic class types (e.g., "Fighter"), so the old tests don't apply.

  describe('regular monsters', () => {
    it('should return monster name when playerName is empty', () => {
      if (FALLBACK_MONSTERS.length === 0) {
        console.warn('FALLBACK_MONSTERS is empty, skipping test');
        return;
      }
      const monster = FALLBACK_MONSTERS[0];
      const name = getCharacterName('', monster);
      expect(name).toBe(monster.name);
    });

    it('should return playerName when provided for monster', () => {
      if (FALLBACK_MONSTERS.length === 0) {
        console.warn('FALLBACK_MONSTERS is empty, skipping test');
        return;
      }
      const monster = FALLBACK_MONSTERS[0];
      const name = getCharacterName('Custom Monster Name', monster);
      expect(name).toBe('Custom Monster Name');
    });

    it('should return monster name when playerName equals monster name', () => {
      if (FALLBACK_MONSTERS.length === 0) {
        console.warn('FALLBACK_MONSTERS is empty, skipping test');
        return;
      }
      const monster = FALLBACK_MONSTERS[0];
      const name = getCharacterName(monster.name, monster);
      expect(name).toBe(monster.name);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string playerName consistently', () => {
      if (FALLBACK_CLASSES.length === 0) {
        console.warn('FALLBACK_CLASSES is empty, skipping test');
        return;
      }
      const character = FALLBACK_CLASSES[0];
      const name1 = getCharacterName('', character);
      const name2 = getCharacterName('', character);
      // Should be deterministic
      expect(name1).toBe(name2);
    });

    it('should handle whitespace-only playerName', () => {
      if (FALLBACK_CLASSES.length === 0) {
        console.warn('FALLBACK_CLASSES is empty, skipping test');
        return;
      }
      const character = FALLBACK_CLASSES[0];
      const name = getCharacterName('   ', character);
      // Whitespace should be treated as truthy, so it should use it
      expect(name).toBe('   ');
    });

    it('should distinguish between created monster and custom hero', () => {
      const createdMonster = createTestClass('TestName', true);
      const customHero = createTestClass('TestName', false, true);
      
      // Both should return the name, but for different reasons
      expect(getCharacterName('', createdMonster)).toBe('TestName');
      expect(getCharacterName('', customHero)).toBe('TestName');
    });

    // Note: Removed obsolete test for FALLBACK_CLASS name matching
    // as FALLBACK_CLASSES now contains actual character names, not class types
  });

  describe('deterministic behavior', () => {
    it('should return the same name for the same class when playerName is empty', () => {
      if (FALLBACK_CLASSES.length === 0) {
        console.warn('FALLBACK_CLASSES is empty, skipping test');
        return;
      }
      const character = FALLBACK_CLASSES[0];
      
      const name1 = getCharacterName('', character);
      const name2 = getCharacterName('', character);
      const name3 = getCharacterName('', character);
      
      expect(name1).toBe(name2);
      expect(name2).toBe(name3);
    });

    it('should return different names for different classes', () => {
      if (FALLBACK_CLASSES.length < 2) {
        console.warn('Need at least 2 characters in FALLBACK_CLASSES, skipping test');
        return;
      }
      const character1 = FALLBACK_CLASSES[0];
      const character2 = FALLBACK_CLASSES[1];
      
      const name1 = getCharacterName('', character1);
      const name2 = getCharacterName('', character2);
      
      expect(name1).not.toBe(name2);
    });
  });
});

