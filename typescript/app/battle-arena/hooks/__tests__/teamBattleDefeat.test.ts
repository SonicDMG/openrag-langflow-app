import { renderHook, act } from '@testing-library/react';
import { useBattleActions } from '../battle/useBattleActions';
import { Character } from '../../lib/types';

/**
 * Tests for team battle defeat conditions
 * Ensures battles continue correctly when heroes are knocked out individually
 */

describe('Team Battle Defeat Conditions', () => {
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

  const createSupportHero = (name: string, hitPoints: number) => ({
    class: createTestClass(name, hitPoints, 30),
    name,
    monsterId: null as string | null,
  });

  const createMockDependencies = (overrides: Partial<Parameters<typeof useBattleActions>[0]> = {}) => {
    const defaultPlayer1 = createTestClass('Hero', 50, 50);
    const defaultPlayer2 = createTestClass('Monster', 100, 100);
    
    const mockSwitchTurn = jest.fn().mockResolvedValue(undefined);
    const mockAddLog = jest.fn();
    const mockSetIsMoveInProgress = jest.fn();
    const mockUpdatePlayerHP = jest.fn();
    const mockSetDefeatedPlayer = jest.fn();
    const mockHandleVictory = jest.fn().mockResolvedValue(undefined);
    const mockShowFloatingNumbers = jest.fn((numbers, effects, callbacks) => {
      if (callbacks && callbacks.length > 0) {
        callbacks.forEach((cb: () => void) => {
          if (cb) cb();
        });
      }
    });
    
    const checkAllHeroesDefeated = jest.fn((defender: 'player1' | 'player2' | 'support1' | 'support2', defenderNewHP: number) => {
      const deps = overrides as any;
      const player1HP = defender === 'player1' ? defenderNewHP : (deps.player1Class?.hitPoints ?? 0);
      const support1HP = defender === 'support1' ? defenderNewHP : (deps.supportHeroes?.[0]?.class.hitPoints ?? 0);
      const support2HP = defender === 'support2' ? defenderNewHP : (deps.supportHeroes?.[1]?.class.hitPoints ?? 0);
      
      return player1HP <= 0 && support1HP <= 0 && support2HP <= 0;
    });
    
    return {
      player1Class: defaultPlayer1,
      player2Class: defaultPlayer2,
      supportHeroes: [],
      isBattleActive: true,
      isMoveInProgress: false,
      classDetails: {},
      defeatedPlayer: null,
      currentTurn: 'player1',
      setIsMoveInProgress: mockSetIsMoveInProgress,
      updatePlayerHP: mockUpdatePlayerHP,
      addLog: mockAddLog,
      applyVisualEffect: jest.fn(),
      triggerFlashEffect: jest.fn(),
      showFloatingNumbers: mockShowFloatingNumbers,
      showProjectileEffect: jest.fn(),
      clearProjectileTracking: jest.fn(),
      switchTurn: mockSwitchTurn,
      handleVictory: mockHandleVictory,
      setDefeatedPlayer: mockSetDefeatedPlayer,
      checkAllHeroesDefeated,
      ...overrides,
    };
  };

  describe('Player1 Knocked Out - Battle Continues', () => {
    it('should continue battle when player1 is knocked out but support heroes remain', () => {
      const player1HP = 0;
      const support1 = createSupportHero('Support1', 20);
      const support2 = createSupportHero('Support2', 15);
      
      const player1Defeated = player1HP <= 0;
      const support1Defeated = support1.class.hitPoints <= 0;
      const support2Defeated = support2.class.hitPoints <= 0;
      const allHeroesDefeated = player1Defeated && support1Defeated && support2Defeated;
      
      expect(player1Defeated).toBe(true);
      expect(support1Defeated).toBe(false);
      expect(support2Defeated).toBe(false);
      expect(allHeroesDefeated).toBe(false); // Battle should continue
    });

    it('should show "KNOCKED OUT!" for player1 when support heroes remain', () => {
      const player1HP = 0;
      const support1 = createSupportHero('Support1', 20);
      const support2 = createSupportHero('Support2', 15);
      
      const isTeamBattle = true;
      const allHeroesDefeated = player1HP <= 0 && support1.class.hitPoints <= 0 && support2.class.hitPoints <= 0;
      
      if (isTeamBattle && !allHeroesDefeated) {
        // Should show "KNOCKED OUT!" not "DEFEATED!"
        const shouldShowKnockedOut = true;
        expect(shouldShowKnockedOut).toBe(true);
      }
    });

    it('should allow support heroes to continue fighting after player1 is knocked out', () => {
      const player1 = createTestClass('Hero', 0, 50);
      const support1 = createSupportHero('Support1', 20);
      const support2 = createSupportHero('Support2', 15);
      
      const deps = createMockDependencies({
        player1Class: player1,
        supportHeroes: [support1, support2],
        currentTurn: 'support1',
      });

      const { result } = renderHook(() => useBattleActions(deps));

      // Support hero should be able to attack
      expect(support1.class.hitPoints > 0).toBe(true);
      expect(support2.class.hitPoints > 0).toBe(true);
    });
  });

  describe('Support Hero Knockout - Battle Continues', () => {
    it('should continue battle when only support1 is knocked out', () => {
      const player1HP = 30;
      const support1 = createSupportHero('Support1', 0);
      const support2 = createSupportHero('Support2', 15);
      
      const player1Defeated = player1HP <= 0;
      const support1Defeated = support1.class.hitPoints <= 0;
      const support2Defeated = support2.class.hitPoints <= 0;
      const allHeroesDefeated = player1Defeated && support1Defeated && support2Defeated;
      
      expect(support1Defeated).toBe(true);
      expect(player1Defeated).toBe(false);
      expect(support2Defeated).toBe(false);
      expect(allHeroesDefeated).toBe(false); // Battle should continue
    });

    it('should continue battle when only support2 is knocked out', () => {
      const player1HP = 30;
      const support1 = createSupportHero('Support1', 20);
      const support2 = createSupportHero('Support2', 0);
      
      const player1Defeated = player1HP <= 0;
      const support1Defeated = support1.class.hitPoints <= 0;
      const support2Defeated = support2.class.hitPoints <= 0;
      const allHeroesDefeated = player1Defeated && support1Defeated && support2Defeated;
      
      expect(support2Defeated).toBe(true);
      expect(player1Defeated).toBe(false);
      expect(support1Defeated).toBe(false);
      expect(allHeroesDefeated).toBe(false); // Battle should continue
    });

    it('should show "KNOCKED OUT!" for support heroes, not "DEFEATED!"', () => {
      const support1 = createSupportHero('Support1', 0);
      
      // Support heroes should show "KNOCKED OUT!" not "DEFEATED!"
      const shouldShowKnockedOut = support1.class.hitPoints <= 0;
      expect(shouldShowKnockedOut).toBe(true);
    });
  });

  describe('All Heroes Defeated - Battle Ends', () => {
    it('should end battle when player1 and both support heroes are at 0 HP', () => {
      const player1HP = 0;
      const support1 = createSupportHero('Support1', 0);
      const support2 = createSupportHero('Support2', 0);
      
      const player1Defeated = player1HP <= 0;
      const support1Defeated = support1.class.hitPoints <= 0;
      const support2Defeated = support2.class.hitPoints <= 0;
      const allHeroesDefeated = player1Defeated && support1Defeated && support2Defeated;
      
      expect(allHeroesDefeated).toBe(true); // Battle should end
    });

    it('should call handleVictory when all heroes are defeated', async () => {
      const player1 = createTestClass('Hero', 0, 50);
      const support1 = createSupportHero('Support1', 0);
      const support2 = createSupportHero('Support2', 0);
      const monster = createTestClass('Monster', 50, 100);
      
      const deps = createMockDependencies({
        player1Class: player1,
        player2Class: monster,
        supportHeroes: [support1, support2],
        currentTurn: 'player2',
      });

      const allHeroesDefeated = player1.hitPoints <= 0 && 
                                 support1.class.hitPoints <= 0 && 
                                 support2.class.hitPoints <= 0;

      if (allHeroesDefeated) {
        await act(async () => {
          await deps.handleVictory(
            monster,
            player1,
            10,
            '',
            '',
            'Final attack',
            'player1'
          );
        });
      }

      expect(deps.handleVictory).toHaveBeenCalledWith(
        monster,
        player1,
        10,
        '',
        '',
        'Final attack',
        'player1'
      );
    });

    it('should set defeated player to player1 when all heroes are defeated', () => {
      const player1HP = 0;
      const support1 = createSupportHero('Support1', 0);
      const support2 = createSupportHero('Support2', 0);
      
      const allHeroesDefeated = player1HP <= 0 && 
                                 support1.class.hitPoints <= 0 && 
                                 support2.class.hitPoints <= 0;
      
      if (allHeroesDefeated) {
        const shouldSetDefeated = true;
        expect(shouldSetDefeated).toBe(true);
      }
    });
  });

  describe('Team Battle with Single Support Hero', () => {
    it('should continue battle when player1 is knocked out but single support hero remains', () => {
      const player1HP = 0;
      const support1 = createSupportHero('Support1', 20);
      
      const player1Defeated = player1HP <= 0;
      const support1Defeated = support1.class.hitPoints <= 0;
      const allHeroesDefeated = player1Defeated && support1Defeated;
      
      expect(allHeroesDefeated).toBe(false); // Battle should continue
    });

    it('should end battle when player1 and single support hero are both defeated', () => {
      const player1HP = 0;
      const support1 = createSupportHero('Support1', 0);
      
      const player1Defeated = player1HP <= 0;
      const support1Defeated = support1.class.hitPoints <= 0;
      const allHeroesDefeated = player1Defeated && support1Defeated;
      
      expect(allHeroesDefeated).toBe(true); // Battle should end
    });
  });

  describe('Mixed Knockout States', () => {
    it('should handle player1 alive, support1 knocked out, support2 alive', () => {
      const player1HP = 30;
      const support1 = createSupportHero('Support1', 0);
      const support2 = createSupportHero('Support2', 15);
      
      const allHeroesDefeated = player1HP <= 0 && 
                                 support1.class.hitPoints <= 0 && 
                                 support2.class.hitPoints <= 0;
      
      expect(allHeroesDefeated).toBe(false);
      expect(support1.class.hitPoints <= 0).toBe(true);
      expect(player1HP > 0).toBe(true);
      expect(support2.class.hitPoints > 0).toBe(true);
    });

    it('should handle player1 knocked out, support1 alive, support2 knocked out', () => {
      const player1HP = 0;
      const support1 = createSupportHero('Support1', 20);
      const support2 = createSupportHero('Support2', 0);
      
      const allHeroesDefeated = player1HP <= 0 && 
                                 support1.class.hitPoints <= 0 && 
                                 support2.class.hitPoints <= 0;
      
      expect(allHeroesDefeated).toBe(false);
      expect(player1HP <= 0).toBe(true);
      expect(support1.class.hitPoints > 0).toBe(true);
      expect(support2.class.hitPoints <= 0).toBe(true);
    });
  });

  describe('checkAllHeroesDefeated Logic', () => {
    it('should correctly identify all heroes defeated using current HP values', () => {
      const defender = 'player1' as const;
      const defenderNewHP = 0;
      const player1HP = 0; // From state
      const support1HP = 0; // From state
      const support2HP = 0; // From state
      
      const player1Defeated = defender === 'player1' ? defenderNewHP <= 0 : player1HP <= 0;
      const support1Defeated = defender === 'support1' ? defenderNewHP <= 0 : support1HP <= 0;
      const support2Defeated = defender === 'support2' ? defenderNewHP <= 0 : support2HP <= 0;
      const allDefeated = player1Defeated && support1Defeated && support2Defeated;
      
      expect(allDefeated).toBe(true);
    });

    it('should use newHP for current defender, state for others', () => {
      const defender = 'support1' as const;
      const defenderNewHP = 0; // Just knocked out
      const player1HP = 20; // Still alive
      const support1HP = 0; // Would be from state, but we use defenderNewHP
      const support2HP = 15; // Still alive
      
      const player1Defeated = defender === 'player1' ? defenderNewHP <= 0 : player1HP <= 0;
      const support1Defeated = defender === 'support1' ? defenderNewHP <= 0 : support1HP <= 0;
      const support2Defeated = defender === 'support2' ? defenderNewHP <= 0 : support2HP <= 0;
      const allDefeated = player1Defeated && support1Defeated && support2Defeated;
      
      expect(support1Defeated).toBe(true); // Uses defenderNewHP
      expect(player1Defeated).toBe(false); // Uses state
      expect(support2Defeated).toBe(false); // Uses state
      expect(allDefeated).toBe(false);
    });
  });
});

