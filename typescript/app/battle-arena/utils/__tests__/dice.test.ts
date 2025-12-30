import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../game-mechanics/dice';

describe('Dice Utilities', () => {
  describe('rollDice', () => {
    it('should roll a single die with explicit count (1d6)', () => {
      const result = rollDice('1d6');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should roll multiple dice (3d6)', () => {
      const result = rollDice('3d6');
      expect(result).toBeGreaterThanOrEqual(3);
      expect(result).toBeLessThanOrEqual(18);
    });

    it('should handle format without count (d10)', () => {
      const result = rollDice('d10');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('should return 0 for invalid format', () => {
      const result = rollDice('invalid');
      expect(result).toBe(0);
    });

    it('should handle d20 rolls correctly', () => {
      const result = rollDice('d20');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    });

    it('should handle large dice counts (10d6)', () => {
      const result = rollDice('10d6');
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(60);
    });
  });

  describe('parseDiceNotation', () => {
    it('should parse simple dice notation (1d8)', () => {
      const result = parseDiceNotation('1d8');
      expect(result.dice).toBe('1d8');
      expect(result.modifier).toBe(0);
    });

    it('should parse dice with positive modifier (1d8+3)', () => {
      const result = parseDiceNotation('1d8+3');
      expect(result.dice).toBe('1d8');
      expect(result.modifier).toBe(3);
    });

    it('should parse dice with negative modifier (2d6-1)', () => {
      const result = parseDiceNotation('2d6-1');
      expect(result.dice).toBe('2d6');
      expect(result.modifier).toBe(-1);
    });

    it('should handle format without count (d8+3)', () => {
      const result = parseDiceNotation('d8+3');
      expect(result.dice).toBe('1d8');
      expect(result.modifier).toBe(3);
    });

    it('should handle format without count and modifier (d6)', () => {
      const result = parseDiceNotation('d6');
      expect(result.dice).toBe('1d6');
      expect(result.modifier).toBe(0);
    });

    it('should fallback to d6 for invalid notation', () => {
      const result = parseDiceNotation('invalid');
      expect(result.dice).toBe('d6');
      expect(result.modifier).toBe(0);
    });

    it('should handle multiple dice with modifier (3d6+2)', () => {
      const result = parseDiceNotation('3d6+2');
      expect(result.dice).toBe('3d6');
      expect(result.modifier).toBe(2);
    });
  });

  describe('rollDiceWithNotation', () => {
    it('should roll dice and apply positive modifier', () => {
      const result = rollDiceWithNotation('1d6+3');
      expect(result).toBeGreaterThanOrEqual(4); // 1 + 3
      expect(result).toBeLessThanOrEqual(9); // 6 + 3
    });

    it('should roll dice and apply negative modifier', () => {
      const result = rollDiceWithNotation('1d6-1');
      expect(result).toBeGreaterThanOrEqual(0); // 1 - 1
      expect(result).toBeLessThanOrEqual(5); // 6 - 1
    });

    it('should roll dice without modifier', () => {
      const result = rollDiceWithNotation('1d8');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(8);
    });

    it('should handle format without count (d10+5)', () => {
      const result = rollDiceWithNotation('d10+5');
      expect(result).toBeGreaterThanOrEqual(6); // 1 + 5
      expect(result).toBeLessThanOrEqual(15); // 10 + 5
    });

    it('should handle multiple dice with modifier (2d8+4)', () => {
      const result = rollDiceWithNotation('2d8+4');
      expect(result).toBeGreaterThanOrEqual(6); // 2 + 4
      expect(result).toBeLessThanOrEqual(20); // 16 + 4
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large dice (1d100)', () => {
      const result = rollDice('1d100');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle single-sided die (1d1)', () => {
      const result = rollDice('1d1');
      expect(result).toBe(1);
    });

    it('should handle large modifiers (1d6+100)', () => {
      const result = rollDiceWithNotation('1d6+100');
      expect(result).toBeGreaterThanOrEqual(101);
      expect(result).toBeLessThanOrEqual(106);
    });
  });
});

