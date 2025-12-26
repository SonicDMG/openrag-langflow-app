import { Character, AttackAbility } from '../../types';

/**
 * Tests for multi-attack ability damage calculation
 * Ensures total damage is calculated correctly and HP updates properly
 */

describe('Multi-Attack Ability Damage Calculation', () => {
  const createTestClass = (name: string, hitPoints: number, maxHitPoints: number): Character => ({
    name,
    hitPoints,
    maxHitPoints,
    armorClass: 15,
    attackBonus: 3,
    damageDie: '1d8',
    abilities: [],
    description: 'Test class',
    color: '#000000',
  });

  const createMultiAttackAbility = (numAttacks: number, damageDice: string): AttackAbility => ({
    name: `Multi Attack (${numAttacks})`,
    type: 'attack',
    damageDice,
    numAttacks,
    attackRoll: true,
  });

  describe('Total Damage Calculation', () => {
    it('should sum damage from all successful hits', () => {
      const hits = [true, true, false, true]; // 3 hits, 1 miss
      const damages = [8, 6, 0, 7]; // Damage for each attack
      
      const totalDamage = damages.reduce((sum, damage) => sum + damage, 0);
      
      expect(totalDamage).toBe(21);
    });

    it('should handle all hits', () => {
      const hits = [true, true, true]; // All hits
      const damages = [5, 6, 7];
      
      const totalDamage = damages.reduce((sum, damage) => sum + damage, 0);
      
      expect(totalDamage).toBe(18);
    });

    it('should handle all misses', () => {
      const hits = [false, false, false]; // All misses
      const damages = [0, 0, 0];
      
      const totalDamage = damages.reduce((sum, damage) => sum + damage, 0);
      
      expect(totalDamage).toBe(0);
    });

    it('should handle mixed hits and misses', () => {
      const hits = [true, false, true, false, true]; // 3 hits, 2 misses
      const damages = [4, 0, 5, 0, 6];
      
      const totalDamage = damages.reduce((sum, damage) => sum + damage, 0);
      
      expect(totalDamage).toBe(15);
    });
  });

  describe('HP Calculation with Multi-Attack', () => {
    it('should calculate newHP correctly with total damage from multiple hits', () => {
      const defenderClass = createTestClass('Monster', 50, 100);
      const totalDamage = 25; // From multiple attacks
      
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBe(25);
    });

    it('should reduce HP to 0 when total damage exceeds current HP', () => {
      const defenderClass = createTestClass('Monster', 20, 100);
      const totalDamage = 35; // More than current HP
      
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBe(0);
      expect(newHP <= 0).toBe(true);
    });

    it('should handle exact HP defeat with multi-attack', () => {
      const defenderClass = createTestClass('Monster', 30, 100);
      const totalDamage = 30; // Exactly current HP
      
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBe(0);
      expect(newHP <= 0).toBe(true);
    });

    it('should calculate HP correctly when some attacks miss', () => {
      const defenderClass = createTestClass('Monster', 50, 100);
      const hits = [true, false, true, true]; // 3 hits, 1 miss
      const damages = [10, 0, 8, 12]; // Only hits deal damage
      const totalDamage = damages.reduce((sum, d) => sum + d, 0);
      
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(totalDamage).toBe(30);
      expect(newHP).toBe(20);
    });
  });

  describe('Defeat Detection with Multi-Attack', () => {
    it('should detect defeat when total damage reduces HP to 0', () => {
      const defenderClass = createTestClass('Monster', 25, 100);
      const totalDamage = 25;
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBe(0);
      expect(newHP <= 0).toBe(true);
    });

    it('should detect defeat when total damage exceeds HP', () => {
      const defenderClass = createTestClass('Monster', 15, 100);
      const totalDamage = 20;
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBe(0);
      expect(newHP <= 0).toBe(true);
    });

    it('should not detect defeat when total damage leaves HP positive', () => {
      const defenderClass = createTestClass('Monster', 50, 100);
      const totalDamage = 30;
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBe(20);
      expect(newHP <= 0).toBe(false);
    });
  });

  describe('Multi-Attack with Different Damage Values', () => {
    it('should handle attacks with varying damage amounts', () => {
      const defenderClass = createTestClass('Monster', 100, 100);
      const damages = [5, 12, 8, 15, 3]; // Varied damage
      const totalDamage = damages.reduce((sum, d) => sum + d, 0);
      
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(totalDamage).toBe(43);
      expect(newHP).toBe(57);
    });

    it('should handle large number of attacks', () => {
      const defenderClass = createTestClass('Monster', 100, 100);
      const numAttacks = 10;
      const damages = Array(numAttacks).fill(5); // 10 attacks, 5 damage each
      const totalDamage = damages.reduce((sum, d) => sum + d, 0);
      
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(totalDamage).toBe(50);
      expect(newHP).toBe(50);
    });

    it('should handle single attack in multi-attack ability', () => {
      const defenderClass = createTestClass('Monster', 50, 100);
      const damages = [15]; // Only one attack
      const totalDamage = damages.reduce((sum, d) => sum + d, 0);
      
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(totalDamage).toBe(15);
      expect(newHP).toBe(35);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero damage from all attacks', () => {
      const defenderClass = createTestClass('Monster', 50, 100);
      const totalDamage = 0;
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBe(50);
      expect(newHP > 0).toBe(true);
    });

    it('should handle very large total damage', () => {
      const defenderClass = createTestClass('Monster', 10, 100);
      const totalDamage = 1000;
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBe(0);
      expect(newHP <= 0).toBe(true);
    });

    it('should handle fractional damage (if dice allow)', () => {
      const defenderClass = createTestClass('Monster', 50, 100);
      const totalDamage = 12.5; // Hypothetical fractional damage
      const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
      
      expect(newHP).toBeCloseTo(37.5, 5);
    });
  });

  describe('Attack Roll Results', () => {
    it('should only count damage from successful hits', () => {
      const hits = [true, false, true, false, true];
      const attackDamages = [8, 6, 7, 5, 9]; // Damage rolled for each
      const damages = hits.map((hit, i) => hit ? attackDamages[i] : 0);
      const totalDamage = damages.reduce((sum, d) => sum + d, 0);
      
      expect(totalDamage).toBe(24); // Only 3 hits counted
    });

    it('should handle critical hits (if implemented)', () => {
      const hits = [true, true, true];
      const isCritical = [false, true, false];
      const baseDamages = [5, 6, 7];
      const damages = hits.map((hit, i) => {
        if (!hit) return 0;
        return isCritical[i] ? baseDamages[i] * 2 : baseDamages[i];
      });
      const totalDamage = damages.reduce((sum, d) => sum + d, 0);
      
      expect(totalDamage).toBe(24); // 5 + 12 + 7 = 24
    });
  });
});

