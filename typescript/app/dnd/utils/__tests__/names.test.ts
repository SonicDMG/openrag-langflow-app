import { getCharacterName, generateDeterministicCharacterName } from '../names';
import { DnDClass } from '../../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../../constants';

describe('getCharacterName', () => {
  // Helper to create a test DnDClass
  const createTestClass = (
    name: string,
    isCreatedMonster = false,
    isCustomHero = false
  ): DnDClass => {
    const baseClass: DnDClass = {
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
      const customHero: DnDClass = {
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
      const customHero: DnDClass = {
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
      const customHero: DnDClass = {
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

  describe('regular classes (FALLBACK_CLASSES)', () => {
    it('should generate deterministic name when playerName equals className', () => {
      const fighter = FALLBACK_CLASSES.find(c => c.name === 'Fighter');
      if (!fighter) {
        throw new Error('Fighter class not found in FALLBACK_CLASSES');
      }
      const name = getCharacterName('Fighter', fighter);
      // Should generate a deterministic name, not return "Fighter"
      expect(name).not.toBe('Fighter');
      expect(name).toBe(generateDeterministicCharacterName('Fighter'));
    });

    it('should use playerName when it differs from className', () => {
      const wizard = FALLBACK_CLASSES.find(c => c.name === 'Wizard');
      if (!wizard) {
        throw new Error('Wizard class not found in FALLBACK_CLASSES');
      }
      const name = getCharacterName('Merlin the Great', wizard);
      expect(name).toBe('Merlin the Great');
    });

    it('should generate deterministic name when playerName is empty', () => {
      const rogue = FALLBACK_CLASSES.find(c => c.name === 'Rogue');
      if (!rogue) {
        throw new Error('Rogue class not found in FALLBACK_CLASSES');
      }
      const name = getCharacterName('', rogue);
      expect(name).toBe(generateDeterministicCharacterName('Rogue'));
    });

    it('should generate deterministic name when playerName is undefined', () => {
      const cleric = FALLBACK_CLASSES.find(c => c.name === 'Cleric');
      if (!cleric) {
        throw new Error('Cleric class not found in FALLBACK_CLASSES');
      }
      const name = getCharacterName(undefined as any, cleric);
      expect(name).toBe(generateDeterministicCharacterName('Cleric'));
    });
  });

  describe('regular monsters', () => {
    it('should return monster name when playerName is empty', () => {
      const goblin = FALLBACK_MONSTERS.find(m => m.name === 'Goblin');
      if (!goblin) {
        throw new Error('Goblin not found in FALLBACK_MONSTERS');
      }
      const name = getCharacterName('', goblin);
      expect(name).toBe('Goblin');
    });

    it('should return playerName when provided for monster', () => {
      const orc = FALLBACK_MONSTERS.find(m => m.name === 'Orc');
      if (!orc) {
        throw new Error('Orc not found in FALLBACK_MONSTERS');
      }
      const name = getCharacterName('Grunk the Orc', orc);
      expect(name).toBe('Grunk the Orc');
    });

    it('should return monster name when playerName equals monster name', () => {
      const dragon = FALLBACK_MONSTERS.find(m => m.name === 'Dragon');
      if (!dragon) {
        throw new Error('Dragon not found in FALLBACK_MONSTERS');
      }
      const name = getCharacterName('Dragon', dragon);
      expect(name).toBe('Dragon');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string playerName consistently', () => {
      const fighter = FALLBACK_CLASSES.find(c => c.name === 'Fighter');
      if (!fighter) {
        throw new Error('Fighter class not found');
      }
      const name1 = getCharacterName('', fighter);
      const name2 = getCharacterName('', fighter);
      // Should be deterministic
      expect(name1).toBe(name2);
    });

    it('should handle whitespace-only playerName', () => {
      const wizard = FALLBACK_CLASSES.find(c => c.name === 'Wizard');
      if (!wizard) {
        throw new Error('Wizard class not found');
      }
      const name = getCharacterName('   ', wizard);
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

    it('should handle class with name matching a FALLBACK_CLASS name but is custom', () => {
      // This tests the edge case where a custom hero might have the same name as a fallback class
      // but is not actually in FALLBACK_CLASSES (e.g., loaded from database)
      const customFighter = {
        name: 'Fighter', // Same name as fallback, but custom
        hitPoints: 50,
        maxHitPoints: 50,
        armorClass: 15,
        attackBonus: 5,
        damageDie: 'd8',
        abilities: [],
        description: 'Custom fighter',
        color: '#000000',
      } as DnDClass;

      // If it's truly custom (not in FALLBACK_CLASSES array), it should use the name directly
      // But since 'Fighter' IS in FALLBACK_CLASSES, this will generate a name
      // This test verifies the logic works correctly
      const name = getCharacterName('', customFighter);
      // Since 'Fighter' is in FALLBACK_CLASSES, it should generate a name
      expect(name).toBe(generateDeterministicCharacterName('Fighter'));
    });
  });

  describe('deterministic behavior', () => {
    it('should return the same name for the same class when playerName is empty', () => {
      const fighter = FALLBACK_CLASSES.find(c => c.name === 'Fighter');
      if (!fighter) {
        throw new Error('Fighter class not found');
      }
      
      const name1 = getCharacterName('', fighter);
      const name2 = getCharacterName('', fighter);
      const name3 = getCharacterName('', fighter);
      
      expect(name1).toBe(name2);
      expect(name2).toBe(name3);
    });

    it('should return different names for different classes', () => {
      const fighter = FALLBACK_CLASSES.find(c => c.name === 'Fighter');
      const wizard = FALLBACK_CLASSES.find(c => c.name === 'Wizard');
      
      if (!fighter || !wizard) {
        throw new Error('Classes not found');
      }
      
      const fighterName = getCharacterName('', fighter);
      const wizardName = getCharacterName('', wizard);
      
      expect(fighterName).not.toBe(wizardName);
    });
  });
});

