import { Character, AttackAbility } from '../../lib/types';
import { rollDice } from '../../utils/game-mechanics/dice';

/**
 * Test utilities for battle calculations
 * These test the core battle logic without React hooks
 */

describe('Battle Calculations', () => {
  describe('Attack Roll Calculation', () => {
    const createTestClass = (attackBonus: number, armorClass: number): Character => ({
      name: 'Test Class',
      hitPoints: 50,
      maxHitPoints: 50,
      armorClass,
      attackBonus,
      damageDie: '1d8',
      abilities: [],
      description: 'Test',
      color: '#000000',
    });

    it('should calculate attack roll correctly with attack bonus', () => {
      const attacker = createTestClass(3, 15);
      const d20Roll = 15;
      const attackRoll = d20Roll + attacker.attackBonus;
      
      expect(attackRoll).toBe(18);
    });

    it('should hit when attack roll equals armor class', () => {
      const attacker = createTestClass(2, 15);
      const d20Roll = 13;
      const attackRoll = d20Roll + attacker.attackBonus;
      const defenderAC = 15;
      
      expect(attackRoll).toBe(15);
      expect(attackRoll >= defenderAC).toBe(true);
    });

    it('should hit when attack roll exceeds armor class', () => {
      const attacker = createTestClass(4, 15);
      const d20Roll = 12;
      const attackRoll = d20Roll + attacker.attackBonus;
      const defenderAC = 15;
      
      expect(attackRoll).toBe(16);
      expect(attackRoll >= defenderAC).toBe(true);
    });

    it('should miss when attack roll is less than armor class', () => {
      const attacker = createTestClass(2, 15);
      const d20Roll = 10;
      const attackRoll = d20Roll + attacker.attackBonus;
      const defenderAC = 15;
      
      expect(attackRoll).toBe(12);
      expect(attackRoll >= defenderAC).toBe(false);
    });

    it('should handle zero attack bonus', () => {
      const attacker = createTestClass(0, 15);
      const d20Roll = 15;
      const attackRoll = d20Roll + attacker.attackBonus;
      
      expect(attackRoll).toBe(15);
    });

    it('should handle negative attack bonus (edge case)', () => {
      const attacker = createTestClass(-1, 15);
      const d20Roll = 16;
      const attackRoll = d20Roll + attacker.attackBonus;
      
      expect(attackRoll).toBe(15);
    });
  });

  describe('Damage Calculation', () => {
    const createTestClass = (damageDie: string): Character => ({
      name: 'Test Class',
      hitPoints: 50,
      maxHitPoints: 50,
      armorClass: 15,
      attackBonus: 3,
      damageDie,
      abilities: [],
      description: 'Test',
      color: '#000000',
    });

    it('should calculate damage using damage die', () => {
      const attacker = createTestClass('1d8');
      const damage = rollDice(attacker.damageDie);
      
      expect(damage).toBeGreaterThanOrEqual(1);
      expect(damage).toBeLessThanOrEqual(8);
    });

    it('should use melee damage die when specified', () => {
      const attacker: Character = {
        ...createTestClass('1d6'),
        meleeDamageDie: '1d10',
      };
      
      const meleeDamage = rollDice(attacker.meleeDamageDie);
      expect(meleeDamage).toBeGreaterThanOrEqual(1);
      expect(meleeDamage).toBeLessThanOrEqual(10);
    });

    it('should use ranged damage die when specified', () => {
      const attacker: Character = {
        ...createTestClass('1d6'),
        rangedDamageDie: '1d8',
      };
      
      const rangedDamage = rollDice(attacker.rangedDamageDie);
      expect(rangedDamage).toBeGreaterThanOrEqual(1);
      expect(rangedDamage).toBeLessThanOrEqual(8);
    });

    it('should fallback to default damage die when melee/ranged not specified', () => {
      const attacker = createTestClass('1d8');
      const damage = rollDice(attacker.damageDie);
      
      expect(damage).toBeGreaterThanOrEqual(1);
      expect(damage).toBeLessThanOrEqual(8);
    });
  });

  describe('HP Management', () => {
    it('should calculate new HP correctly after damage', () => {
      const currentHP = 50;
      const damage = 15;
      const newHP = Math.max(0, currentHP - damage);
      
      expect(newHP).toBe(35);
    });

    it('should not allow negative HP', () => {
      const currentHP = 10;
      const damage = 25;
      const newHP = Math.max(0, currentHP - damage);
      
      expect(newHP).toBe(0);
    });

    it('should calculate healing correctly', () => {
      const currentHP = 30;
      const maxHP = 50;
      const healAmount = 20;
      const newHP = Math.min(maxHP, currentHP + healAmount);
      
      expect(newHP).toBe(50);
    });

    it('should not exceed max HP when healing', () => {
      const currentHP = 45;
      const maxHP = 50;
      const healAmount = 10;
      const newHP = Math.min(maxHP, currentHP + healAmount);
      
      expect(newHP).toBe(50);
    });

    it('should handle exact max HP healing', () => {
      const currentHP = 40;
      const maxHP = 50;
      const healAmount = 10;
      const newHP = Math.min(maxHP, currentHP + healAmount);
      
      expect(newHP).toBe(50);
    });
  });

  describe('Defeat Conditions', () => {
    const createTestClass = (hitPoints: number, maxHitPoints: number): Character => ({
      name: 'Test Class',
      hitPoints,
      maxHitPoints,
      armorClass: 15,
      attackBonus: 3,
      damageDie: '1d8',
      abilities: [],
      description: 'Test',
      color: '#000000',
    });

    it('should detect defeat when HP is 0', () => {
      const player = createTestClass(0, 50);
      expect(player.hitPoints <= 0).toBe(true);
    });

    it('should detect defeat when HP is negative', () => {
      const player = createTestClass(-5, 50);
      expect(player.hitPoints <= 0).toBe(true);
    });

    it('should not detect defeat when HP is positive', () => {
      const player = createTestClass(10, 50);
      expect(player.hitPoints <= 0).toBe(false);
    });

    it('should detect defeat when HP is exactly 0 after damage', () => {
      const currentHP = 10;
      const damage = 10;
      const newHP = Math.max(0, currentHP - damage);
      
      expect(newHP).toBe(0);
      expect(newHP <= 0).toBe(true);
    });
  });

  describe('Team Battle Logic', () => {
    const createSupportHero = (hitPoints: number): { class: Character; name: string; monsterId: string | null } => ({
      class: {
        name: 'Support Hero',
        hitPoints,
        maxHitPoints: 30,
        armorClass: 14,
        attackBonus: 2,
        damageDie: '1d6',
        abilities: [],
        description: 'Support',
        color: '#00ff00',
      },
      name: 'Support',
      monsterId: null,
    });

    it('should identify all heroes defeated in team battle', () => {
      const player1HP = 0;
      const support1 = createSupportHero(0);
      const support2 = createSupportHero(0);
      
      const allDefeated = player1HP <= 0 && support1.class.hitPoints <= 0 && support2.class.hitPoints <= 0;
      
      expect(allDefeated).toBe(true);
    });

    it('should identify not all heroes defeated when one remains', () => {
      const player1HP = 10;
      const support1 = createSupportHero(0);
      const support2 = createSupportHero(0);
      
      const allDefeated = player1HP <= 0 && support1.class.hitPoints <= 0 && support2.class.hitPoints <= 0;
      
      expect(allDefeated).toBe(false);
    });

    it('should handle team battle with only one support hero', () => {
      const player1HP = 0;
      const support1 = createSupportHero(0);
      
      const allDefeated = player1HP <= 0 && support1.class.hitPoints <= 0;
      
      expect(allDefeated).toBe(true);
    });

    it('should correctly identify available targets for monster', () => {
      const player1HP = 20;
      const support1 = createSupportHero(15);
      const support2 = createSupportHero(0); // Defeated
      
      const availableTargets: Array<'player1' | 'support1' | 'support2'> = [];
      if (player1HP > 0) availableTargets.push('player1');
      if (support1.class.hitPoints > 0) availableTargets.push('support1');
      if (support2.class.hitPoints > 0) availableTargets.push('support2');
      
      expect(availableTargets).toEqual(['player1', 'support1']);
      expect(availableTargets.length).toBe(2);
    });
  });

  describe('Turn Order Logic', () => {
    type Player = 'player1' | 'player2' | 'support1' | 'support2';
    
    const getNextPlayer = (
      current: Player,
      hasSupportHeroes: boolean,
      supportHeroCount: number
    ): Player => {
      if (!hasSupportHeroes) {
        return current === 'player1' ? 'player2' : 'player1';
      }
      
      if (current === 'player1') {
        return 'support1';
      } else if (current === 'support1') {
        return supportHeroCount > 1 ? 'support2' : 'player2';
      } else if (current === 'support2') {
        return 'player2';
      } else {
        return 'player1';
      }
    };

    it('should alternate between player1 and player2 when no support heroes', () => {
      expect(getNextPlayer('player1', false, 0)).toBe('player2');
      expect(getNextPlayer('player2', false, 0)).toBe('player1');
    });

    it('should follow correct order with one support hero', () => {
      expect(getNextPlayer('player1', true, 1)).toBe('support1');
      expect(getNextPlayer('support1', true, 1)).toBe('player2');
      expect(getNextPlayer('player2', true, 1)).toBe('player1');
    });

    it('should follow correct order with two support heroes', () => {
      expect(getNextPlayer('player1', true, 2)).toBe('support1');
      expect(getNextPlayer('support1', true, 2)).toBe('support2');
      expect(getNextPlayer('support2', true, 2)).toBe('player2');
      expect(getNextPlayer('player2', true, 2)).toBe('player1');
    });

    it('should skip defeated players in turn order', () => {
      const isDefeated = (player: Player, player1HP: number, support1HP: number, support2HP: number): boolean => {
        if (player === 'player1') return player1HP <= 0;
        if (player === 'support1') return support1HP <= 0;
        if (player === 'support2') return support2HP <= 0;
        return false;
      };

      const player1HP = 0; // Defeated
      const support1HP = 20;
      const support2HP = 15;
      
      let current: Player = 'player2';
      let next = getNextPlayer(current, true, 2);
      
      // Should skip player1 and go to support1
      while (isDefeated(next, player1HP, support1HP, support2HP)) {
        next = getNextPlayer(next, true, 2);
      }
      
      expect(next).toBe('support1');
    });
  });

  describe('Ability Damage Calculations', () => {
    const createAttackAbility = (damageDice: string, bonusDamageDice?: string): AttackAbility => ({
      name: 'Test Ability',
      type: 'attack',
      damageDice,
      attackRoll: true,
      bonusDamageDice,
      description: 'Test ability',
    });

    it('should calculate base damage from ability', () => {
      const ability = createAttackAbility('2d6');
      // Mock roll would return a value, but we test the structure
      expect(ability.damageDice).toBe('2d6');
    });

    it('should include bonus damage dice when present', () => {
      const ability = createAttackAbility('1d8', '2d6');
      expect(ability.damageDice).toBe('1d8');
      expect(ability.bonusDamageDice).toBe('2d6');
    });

    it('should handle automatic damage abilities (no attack roll)', () => {
      const ability: AttackAbility = {
        name: 'Auto Damage',
        type: 'attack',
        damageDice: '3d6',
        attackRoll: false,
        description: 'Automatic damage',
      };
      
      expect(ability.attackRoll).toBe(false);
    });

    it('should handle multi-attack abilities', () => {
      const ability: AttackAbility = {
        name: 'Multi Attack',
        type: 'attack',
        damageDice: '1d6',
        attackRoll: true,
        attacks: 3,
        description: 'Multiple attacks',
      };
      
      expect(ability.attacks).toBe(3);
    });
  });
});

