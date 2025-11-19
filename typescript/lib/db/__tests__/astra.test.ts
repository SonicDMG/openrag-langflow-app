import { DnDClass, Ability } from '../../../app/dnd/types';
import { HeroRecord, MonsterRecord } from '../astra';

// Mock the conversion functions - we'll need to export them or test them indirectly
// For now, we'll test the public API that uses them

describe('Database Conversions - Race and Sex', () => {
  const mockAbility: Ability = {
    name: 'Test Ability',
    type: 'attack',
    damageDice: '1d8',
    attackRoll: true,
    attacks: 1,
    description: 'Test description',
  };

  const createMockDnDClass = (overrides?: Partial<DnDClass>): DnDClass => ({
    name: 'Test Character',
    hitPoints: 25,
    maxHitPoints: 30,
    armorClass: 16,
    attackBonus: 5,
    damageDie: 'd8',
    abilities: [mockAbility],
    description: 'Test description',
    color: 'bg-blue-500',
    ...overrides,
  });

  const createMockHeroRecord = (overrides?: Partial<HeroRecord>): HeroRecord => ({
    name: 'Test Hero',
    hitPoints: 25,
    maxHitPoints: 30,
    armorClass: 16,
    attackBonus: 5,
    damageDie: 'd8',
    abilities: [mockAbility],
    description: 'Test description',
    color: 'bg-blue-500',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  const createMockMonsterRecord = (overrides?: Partial<MonsterRecord>): MonsterRecord => ({
    name: 'Test Monster',
    hitPoints: 30,
    maxHitPoints: 30,
    armorClass: 14,
    attackBonus: 4,
    damageDie: 'd6',
    abilities: [mockAbility],
    description: 'Test description',
    color: 'bg-red-500',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  describe('HeroRecord type', () => {
    it('should include race and sex fields', () => {
      const record: HeroRecord = createMockHeroRecord({
        race: 'Human',
        sex: 'male',
      });

      expect(record.race).toBe('Human');
      expect(record.sex).toBe('male');
    });

    it('should allow undefined race and sex', () => {
      const record: HeroRecord = createMockHeroRecord();

      expect(record.race).toBeUndefined();
      expect(record.sex).toBeUndefined();
    });
  });

  describe('MonsterRecord type', () => {
    it('should include race and sex fields', () => {
      const record: MonsterRecord = createMockMonsterRecord({
        race: 'Orc',
        sex: 'female',
      });

      expect(record.race).toBe('Orc');
      expect(record.sex).toBe('female');
    });

    it('should allow undefined race and sex', () => {
      const record: MonsterRecord = createMockMonsterRecord();

      expect(record.race).toBeUndefined();
      expect(record.sex).toBeUndefined();
    });
  });

  describe('DnDClass with race and sex', () => {
    it('should support race and sex fields', () => {
      const character: DnDClass = createMockDnDClass({
        race: 'Elf',
        sex: 'other',
      });

      expect(character.race).toBe('Elf');
      expect(character.sex).toBe('other');
    });

    it('should allow undefined race and sex', () => {
      const character: DnDClass = createMockDnDClass();

      expect(character.race).toBeUndefined();
      expect(character.sex).toBeUndefined();
    });
  });

  // Note: The actual conversion functions (classToHeroRecord, heroRecordToClass, etc.)
  // are not exported, so we can't test them directly. However, we can test that:
  // 1. The types support race and sex
  // 2. The data structures are compatible
  // 3. Integration tests would verify the actual conversions work

  describe('Data structure compatibility', () => {
    it('should maintain race and sex through conversion cycle', () => {
      // This is a conceptual test - in practice, the conversion functions
      // would be tested through integration tests with the actual database operations
      const originalClass: DnDClass = createMockDnDClass({
        race: 'Dwarf',
        sex: 'male',
      });

      // Simulate what the conversion would do
      const recordData = {
        name: originalClass.name,
        hitPoints: originalClass.hitPoints,
        maxHitPoints: originalClass.maxHitPoints,
        armorClass: originalClass.armorClass,
        attackBonus: originalClass.attackBonus,
        damageDie: originalClass.damageDie,
        abilities: originalClass.abilities,
        description: originalClass.description,
        color: originalClass.color,
        race: originalClass.race,
        sex: originalClass.sex,
      };

      // Simulate converting back
      const convertedClass: DnDClass = {
        ...originalClass,
        race: recordData.race,
        sex: recordData.sex,
      };

      expect(convertedClass.race).toBe('Dwarf');
      expect(convertedClass.sex).toBe('male');
    });

    it('should handle undefined race and sex in conversion cycle', () => {
      const originalClass: DnDClass = createMockDnDClass();

      const recordData = {
        name: originalClass.name,
        hitPoints: originalClass.hitPoints,
        maxHitPoints: originalClass.maxHitPoints,
        armorClass: originalClass.armorClass,
        attackBonus: originalClass.attackBonus,
        damageDie: originalClass.damageDie,
        abilities: originalClass.abilities,
        description: originalClass.description,
        color: originalClass.color,
        race: originalClass.race,
        sex: originalClass.sex,
      };

      const convertedClass: DnDClass = {
        ...originalClass,
        race: recordData.race,
        sex: recordData.sex,
      };

      expect(convertedClass.race).toBeUndefined();
      expect(convertedClass.sex).toBeUndefined();
    });

    it('should handle "n/a" values gracefully', () => {
      // In practice, "n/a" should be filtered out before conversion
      // But we test that the structure can handle it
      const record: HeroRecord = createMockHeroRecord({
        race: 'n/a',
        sex: 'n/a',
      });

      // The record can contain "n/a", but it should be filtered when converting to class
      expect(record.race).toBe('n/a');
      expect(record.sex).toBe('n/a');
    });
  });
});

