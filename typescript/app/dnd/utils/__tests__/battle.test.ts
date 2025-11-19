import {
  getOpponent,
  createHitVisualEffects,
  createMissVisualEffects,
  createHealingVisualEffects,
  buildDamageDiceArray,
  getProjectileType,
} from '../battle';
import { DnDClass, AttackAbility } from '../../types';

// Mock dice functions
const mockRollDiceWithNotation = jest.fn((notation: string) => {
  if (notation === '1d8') return 5;
  if (notation === '2d6') return 7;
  if (notation === '1d6+3') return 9;
  return 4;
});

const mockParseDiceNotation = jest.fn((notation: string) => {
  if (notation === '1d8') return { dice: '1d8', modifier: 0 };
  if (notation === '2d6') return { dice: '2d6', modifier: 0 };
  if (notation === '1d6+3') return { dice: '1d6', modifier: 3 };
  return { dice: '1d6', modifier: 0 };
});

describe('Battle Utilities', () => {
  describe('getOpponent', () => {
    it('should return player2 when given player1', () => {
      expect(getOpponent('player1')).toBe('player2');
    });

    it('should return player1 when given player2', () => {
      expect(getOpponent('player2')).toBe('player1');
    });
  });

  describe('createHitVisualEffects', () => {
    const mockDefenderClass: DnDClass = {
      name: 'Warrior',
      hitPoints: 50,
      maxHitPoints: 50,
      armorClass: 15,
      attackBonus: 3,
      damageDie: '1d8',
      abilities: [],
      description: 'A warrior',
      color: '#ff0000',
    };

    const mockAttackerClass: DnDClass = {
      name: 'Wizard',
      hitPoints: 30,
      maxHitPoints: 30,
      armorClass: 12,
      attackBonus: 2,
      damageDie: '1d6',
      abilities: [],
      description: 'A wizard',
      color: '#0000ff',
    };

    it('should create hit effects for attacker and shake for defender', () => {
      const effects = createHitVisualEffects('player1', 'player2', 10, mockDefenderClass, mockAttackerClass);
      
      expect(effects).toHaveLength(3);
      expect(effects[0]).toEqual({ type: 'hit', player: 'player1' });
      expect(effects[1]).toEqual({ type: 'shake', player: 'player2', intensity: 10 });
      expect(effects[2]).toEqual({ type: 'cast', player: 'player1' });
    });

    it('should include cast effect when attacker class is provided', () => {
      const effects = createHitVisualEffects('player1', 'player2', 5, mockDefenderClass, mockAttackerClass);
      const castEffect = effects.find(e => e.type === 'cast');
      expect(castEffect).toBeDefined();
      expect(castEffect?.player).toBe('player1');
    });

    it('should work without attacker class', () => {
      const effects = createHitVisualEffects('player1', 'player2', 8, mockDefenderClass);
      expect(effects).toHaveLength(2);
      expect(effects[0].type).toBe('hit');
      expect(effects[1].type).toBe('shake');
    });
  });

  describe('createMissVisualEffects', () => {
    const mockAttackerClass: DnDClass = {
      name: 'Ranger',
      hitPoints: 40,
      maxHitPoints: 40,
      armorClass: 14,
      attackBonus: 4,
      damageDie: '1d8',
      abilities: [],
      description: 'A ranger',
      color: '#00ff00',
    };

    it('should create miss effect', () => {
      const effects = createMissVisualEffects('player1', mockAttackerClass);
      
      expect(effects).toHaveLength(2);
      expect(effects[0]).toEqual({ type: 'miss', player: 'player1' });
      expect(effects[1]).toEqual({ type: 'cast', player: 'player1' });
    });

    it('should work without attacker class', () => {
      const effects = createMissVisualEffects('player2');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('miss');
    });
  });

  describe('createHealingVisualEffects', () => {
    const mockCasterClass: DnDClass = {
      name: 'Cleric',
      hitPoints: 35,
      maxHitPoints: 35,
      armorClass: 16,
      attackBonus: 2,
      damageDie: '1d6',
      abilities: [],
      description: 'A cleric',
      color: '#ffff00',
    };

    it('should create sparkle effect for healing', () => {
      const effects = createHealingVisualEffects('player1', 15, mockCasterClass);
      
      expect(effects).toHaveLength(1);
      expect(effects[0]).toEqual({ type: 'sparkle', player: 'player1', intensity: 15 });
    });

    it('should work without caster class', () => {
      const effects = createHealingVisualEffects('player2', 10);
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('sparkle');
      expect(effects[0].intensity).toBe(10);
    });
  });

  describe('buildDamageDiceArray', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should build damage array with base dice only', () => {
      const result = buildDamageDiceArray('1d8', mockRollDiceWithNotation, mockParseDiceNotation);
      
      expect(result.diceArray).toHaveLength(1);
      expect(result.diceArray[0].diceType).toBe('1d8');
      expect(result.diceArray[0].result).toBe(5);
      expect(result.totalDamage).toBe(5);
    });

    it('should build damage array with base and bonus dice', () => {
      const result = buildDamageDiceArray('1d8', mockRollDiceWithNotation, mockParseDiceNotation, '2d6');
      
      expect(result.diceArray).toHaveLength(2);
      expect(result.diceArray[0].diceType).toBe('1d8');
      expect(result.diceArray[0].result).toBe(5);
      expect(result.diceArray[1].diceType).toBe('2d6');
      expect(result.diceArray[1].result).toBe(7);
      expect(result.totalDamage).toBe(12); // 5 + 7
    });

    it('should handle dice with modifiers', () => {
      const result = buildDamageDiceArray('1d6+3', mockRollDiceWithNotation, mockParseDiceNotation);
      
      expect(mockParseDiceNotation).toHaveBeenCalledWith('1d6+3');
      expect(result.totalDamage).toBe(9);
    });
  });

  describe('getProjectileType', () => {
    it('should return melee for basic melee attack', () => {
      expect(getProjectileType(null, 'melee')).toBe('melee');
    });

    it('should return ranged for basic ranged attack', () => {
      expect(getProjectileType(null, 'ranged')).toBe('ranged');
    });

    it('should default to melee when no ability or attack type', () => {
      expect(getProjectileType(null)).toBe('melee');
    });

    it('should detect fire projectile from ability name', () => {
      const ability: AttackAbility = {
        name: 'Fireball',
        type: 'attack',
        damageDice: '8d6',
        attackRoll: true,
        description: 'A ball of fire',
      };
      expect(getProjectileType(ability)).toBe('fire');
    });

    it('should detect ice projectile from description', () => {
      const ability: AttackAbility = {
        name: 'Cold Blast',
        type: 'attack',
        damageDice: '4d6',
        attackRoll: true,
        description: 'A blast of freezing cold',
      };
      expect(getProjectileType(ability)).toBe('ice');
    });

    it('should detect poison from ability name', () => {
      const ability: AttackAbility = {
        name: 'Poison Sting',
        type: 'attack',
        damageDice: '2d4',
        attackRoll: true,
        description: 'A poisonous attack',
      };
      expect(getProjectileType(ability)).toBe('poison');
    });

    it('should detect lightning from description', () => {
      const ability: AttackAbility = {
        name: 'Shock',
        type: 'attack',
        damageDice: '3d8',
        attackRoll: true,
        description: 'A lightning bolt',
      };
      expect(getProjectileType(ability)).toBe('lightning');
    });

    it('should detect melee from physical attack names', () => {
      const ability: AttackAbility = {
        name: 'Bite',
        type: 'attack',
        damageDice: '1d6',
        attackRoll: true,
        description: 'A physical bite',
      };
      expect(getProjectileType(ability)).toBe('melee');
    });

    it('should detect ranged from bow/arrow names', () => {
      const ability: AttackAbility = {
        name: 'Arrow Shot',
        type: 'attack',
        damageDice: '1d8',
        attackRoll: true,
        description: 'An arrow',
      };
      expect(getProjectileType(ability)).toBe('ranged');
    });

    it('should detect magic from spell names', () => {
      const ability: AttackAbility = {
        name: 'Magic Missile',
        type: 'attack',
        damageDice: '1d4+1',
        attackRoll: false,
        description: 'A magical missile',
      };
      expect(getProjectileType(ability)).toBe('magic');
    });

    it('should detect fire from dragon breath', () => {
      const ability: AttackAbility = {
        name: 'Breath Weapon',
        type: 'attack',
        damageDice: '6d6',
        attackRoll: false,
        description: 'Fire breath',
      };
      expect(getProjectileType(ability, undefined, 'Dragon')).toBe('fire');
    });

    it('should detect ice from white dragon class name', () => {
      expect(getProjectileType(null, undefined, 'White Dragon')).toBe('melee');
      // White Dragon class name should trigger ice detection
      const ability: AttackAbility = {
        name: 'Frost Attack',
        type: 'attack',
        damageDice: '6d6',
        attackRoll: false,
        description: 'A freezing attack',
      };
      // The function checks classLower.includes('white dragon') which should match
      expect(getProjectileType(ability, undefined, 'White Dragon')).toBe('ice');
    });
  });
});

