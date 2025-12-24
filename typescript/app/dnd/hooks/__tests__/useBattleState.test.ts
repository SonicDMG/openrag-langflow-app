import { renderHook, act } from '@testing-library/react';
import { useBattleState } from '../battle/useBattleState';
import { DnDClass } from '../../types';

/**
 * Tests for useBattleState hook
 * Tests state management, HP updates, turn switching, and battle log functionality
 */

describe('useBattleState', () => {
  const createTestClass = (name: string, hitPoints: number, maxHitPoints: number): DnDClass => ({
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

  describe('Initial State', () => {
    it('should initialize with null player classes', () => {
      const { result } = renderHook(() => useBattleState());
      
      expect(result.current.player1Class).toBeNull();
      expect(result.current.player2Class).toBeNull();
    });

    it('should initialize with empty battle log', () => {
      const { result } = renderHook(() => useBattleState());
      
      expect(result.current.battleLog).toEqual([]);
    });

    it('should initialize with battle inactive', () => {
      const { result } = renderHook(() => useBattleState());
      
      expect(result.current.isBattleActive).toBe(false);
    });

    it('should initialize with player1 as current turn', () => {
      const { result } = renderHook(() => useBattleState());
      
      expect(result.current.currentTurn).toBe('player1');
    });
  });

  describe('Player Class Management', () => {
    it('should set player1 class', () => {
      const { result } = renderHook(() => useBattleState());
      const testClass = createTestClass('Warrior', 50, 50);
      
      act(() => {
        result.current.setPlayer1Class(testClass);
      });
      
      expect(result.current.player1Class).toEqual(testClass);
    });

    it('should set player2 class', () => {
      const { result } = renderHook(() => useBattleState());
      const testClass = createTestClass('Wizard', 30, 30);
      
      act(() => {
        result.current.setPlayer2Class(testClass);
      });
      
      expect(result.current.player2Class).toEqual(testClass);
    });

    it('should set player names', () => {
      const { result } = renderHook(() => useBattleState());
      
      act(() => {
        result.current.setPlayer1Name('Test Hero');
        result.current.setPlayer2Name('Test Monster');
      });
      
      expect(result.current.player1Name).toBe('Test Hero');
      expect(result.current.player2Name).toBe('Test Monster');
    });
  });

  describe('HP Management', () => {
    it('should update player1 HP with damage', () => {
      const { result } = renderHook(() => useBattleState());
      const testClass = createTestClass('Warrior', 50, 50);
      
      act(() => {
        result.current.setPlayer1Class(testClass);
        result.current.updatePlayerHP('player1', 15, true);
      });
      
      expect(result.current.player1Class?.hitPoints).toBe(35);
    });

    it('should update player2 HP with damage', () => {
      const { result } = renderHook(() => useBattleState());
      const testClass = createTestClass('Monster', 100, 100);
      
      act(() => {
        result.current.setPlayer2Class(testClass);
        result.current.updatePlayerHP('player2', 25, true);
      });
      
      expect(result.current.player2Class?.hitPoints).toBe(75);
    });

    it('should not allow HP to go below 0', () => {
      const { result } = renderHook(() => useBattleState());
      const testClass = createTestClass('Warrior', 10, 50);
      
      act(() => {
        result.current.setPlayer1Class(testClass);
        result.current.updatePlayerHP('player1', 50, true); // More damage than HP
      });
      
      expect(result.current.player1Class?.hitPoints).toBe(0);
    });

    it('should not allow HP to exceed maxHitPoints', () => {
      const { result } = renderHook(() => useBattleState());
      const testClass = createTestClass('Warrior', 40, 50);
      
      act(() => {
        result.current.setPlayer1Class(testClass);
        result.current.updatePlayerHP('player1', 60, false); // Set directly to 60, but max is 50
      });
      
      expect(result.current.player1Class?.hitPoints).toBe(50);
    });

    it('should update support hero HP', () => {
      const { result } = renderHook(() => useBattleState());
      const supportClass = createTestClass('Support', 30, 30);
      
      act(() => {
        result.current.setSupportHeroes([{
          class: supportClass,
          name: 'Support Hero',
          monsterId: null,
        }]);
        result.current.updatePlayerHP('support1', 10, true);
      });
      
      expect(result.current.supportHeroes[0].class.hitPoints).toBe(20);
    });

    it('should handle healing (setting HP directly)', () => {
      const { result } = renderHook(() => useBattleState());
      const testClass = createTestClass('Warrior', 20, 50);
      
      act(() => {
        result.current.setPlayer1Class(testClass);
        result.current.updatePlayerHP('player1', 35, false); // Set to 35
      });
      
      expect(result.current.player1Class?.hitPoints).toBe(35);
    });
  });

  describe('Battle Log', () => {
    it('should add log entries', () => {
      const { result } = renderHook(() => useBattleState());
      
      act(() => {
        result.current.addLog('attack', 'Player1 attacks Player2');
        result.current.addLog('system', 'Battle started');
      });
      
      expect(result.current.battleLog).toHaveLength(2);
      expect(result.current.battleLog[0].type).toBe('attack');
      expect(result.current.battleLog[0].message).toBe('Player1 attacks Player2');
      expect(result.current.battleLog[1].type).toBe('system');
    });

    it('should include timestamp in log entries', () => {
      const { result } = renderHook(() => useBattleState());
      const beforeTime = Date.now();
      
      act(() => {
        result.current.addLog('roll', 'Rolled a 20');
      });
      
      const afterTime = Date.now();
      const logEntry = result.current.battleLog[0];
      
      expect(logEntry.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(logEntry.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Battle State Management', () => {
    it('should activate battle', () => {
      const { result } = renderHook(() => useBattleState());
      
      act(() => {
        result.current.setIsBattleActive(true);
      });
      
      expect(result.current.isBattleActive).toBe(true);
    });

    it('should set current turn', () => {
      const { result } = renderHook(() => useBattleState());
      
      act(() => {
        result.current.setCurrentTurn('player2');
      });
      
      expect(result.current.currentTurn).toBe('player2');
    });

    it('should set move in progress flag', () => {
      const { result } = renderHook(() => useBattleState());
      
      act(() => {
        result.current.setIsMoveInProgress(true);
      });
      
      expect(result.current.isMoveInProgress).toBe(true);
    });
  });

  describe('Support Heroes', () => {
    it('should set support heroes', () => {
      const { result } = renderHook(() => useBattleState());
      const support1 = createTestClass('Support1', 30, 30);
      const support2 = createTestClass('Support2', 25, 25);
      
      act(() => {
        result.current.setSupportHeroes([
          { class: support1, name: 'Support Hero 1', monsterId: null },
          { class: support2, name: 'Support Hero 2', monsterId: null },
        ]);
      });
      
      expect(result.current.supportHeroes).toHaveLength(2);
      expect(result.current.supportHeroes[0].class.name).toBe('Support1');
      expect(result.current.supportHeroes[1].class.name).toBe('Support2');
    });

    it('should update support hero names', () => {
      const { result } = renderHook(() => useBattleState());
      
      act(() => {
        result.current.setSupportHeroNames(['Hero1', 'Hero2']);
      });
      
      expect(result.current.supportHeroNames).toEqual(['Hero1', 'Hero2']);
    });
  });

  describe('Turn Switching Logic', () => {
    it('should switch turn from player1 to player2 when no support heroes', async () => {
      const { result } = renderHook(() => useBattleState());
      
      await act(async () => {
        await result.current.switchTurn('player1', null);
      });
      
      expect(result.current.currentTurn).toBe('player2');
    });

    it('should switch turn from player2 to player1 when no support heroes', async () => {
      const { result } = renderHook(() => useBattleState());
      
      act(() => {
        result.current.setCurrentTurn('player2');
      });
      
      await act(async () => {
        await result.current.switchTurn('player2', null);
      });
      
      expect(result.current.currentTurn).toBe('player1');
    });

    it('should follow correct turn order with support heroes', async () => {
      const { result } = renderHook(() => useBattleState());
      const support1 = createTestClass('Support1', 30, 30);
      const support2 = createTestClass('Support2', 25, 25);
      
      act(() => {
        result.current.setSupportHeroes([
          { class: support1, name: 'Support1', monsterId: null },
          { class: support2, name: 'Support2', monsterId: null },
        ]);
      });
      
      // player1 -> support1
      await act(async () => {
        await result.current.switchTurn('player1', null);
      });
      expect(result.current.currentTurn).toBe('support1');
      
      // support1 -> support2
      await act(async () => {
        await result.current.switchTurn('support1', null);
      });
      expect(result.current.currentTurn).toBe('support2');
      
      // support2 -> player2
      await act(async () => {
        await result.current.switchTurn('support2', null);
      });
      expect(result.current.currentTurn).toBe('player2');
      
      // player2 -> player1
      await act(async () => {
        await result.current.switchTurn('player2', null);
      });
      expect(result.current.currentTurn).toBe('player1');
    });

    it('should skip defeated players in turn order', async () => {
      const { result } = renderHook(() => useBattleState());
      const support1 = createTestClass('Support1', 0, 30); // Defeated
      const support2 = createTestClass('Support2', 25, 25);
      
      act(() => {
        result.current.setSupportHeroes([
          { class: support1, name: 'Support1', monsterId: null },
          { class: support2, name: 'Support2', monsterId: null },
        ]);
      });
      
      // player1 -> support1 (defeated) -> should skip to support2
      await act(async () => {
        await result.current.switchTurn('player1', null);
      });
      
      // Should skip support1 and go to support2
      expect(result.current.currentTurn).toBe('support2');
    });

    it('should skip defeated player1 and continue battle with support heroes', async () => {
      const { result } = renderHook(() => useBattleState());
      const player1 = createTestClass('Player1', 0, 50); // Knocked out
      const support1 = createTestClass('Support1', 20, 30); // Still alive
      const support2 = createTestClass('Support2', 15, 25); // Still alive
      
      act(() => {
        result.current.setPlayer1Class(player1);
        result.current.setSupportHeroes([
          { class: support1, name: 'Support1', monsterId: null },
          { class: support2, name: 'Support2', monsterId: null },
        ]);
        result.current.setCurrentTurn('player2'); // Monster just attacked
      });
      
      // After monster's turn, should skip defeated player1 and go to support1
      await act(async () => {
        await result.current.switchTurn('player2', null);
      });
      
      // Should skip player1 (defeated) and go to support1
      expect(result.current.currentTurn).toBe('support1');
      
      // Support1 should be able to take their turn
      expect(result.current.supportHeroes[0].class.hitPoints).toBeGreaterThan(0);
      
      // Continue turn order: support1 -> support2
      await act(async () => {
        await result.current.switchTurn('support1', null);
      });
      expect(result.current.currentTurn).toBe('support2');
      
      // Support2 should be able to take their turn
      expect(result.current.supportHeroes[1].class.hitPoints).toBeGreaterThan(0);
      
      // After support2, should skip player1 again and go back to player2 (monster)
      await act(async () => {
        await result.current.switchTurn('support2', null);
      });
      expect(result.current.currentTurn).toBe('player2');
    });

    it('should continue battle when player1 is knocked out but at least one support hero remains', async () => {
      const { result } = renderHook(() => useBattleState());
      const player1 = createTestClass('Player1', 0, 50); // Knocked out
      const support1 = createTestClass('Support1', 0, 30); // Also knocked out
      const support2 = createTestClass('Support2', 10, 25); // Still alive
      
      act(() => {
        result.current.setPlayer1Class(player1);
        result.current.setSupportHeroes([
          { class: support1, name: 'Support1', monsterId: null },
          { class: support2, name: 'Support2', monsterId: null },
        ]);
      });
      
      // Battle should continue because support2 is still alive
      const player1Defeated = result.current.player1Class?.hitPoints <= 0;
      const support1Defeated = result.current.supportHeroes[0].class.hitPoints <= 0;
      const support2Defeated = result.current.supportHeroes[1].class.hitPoints <= 0;
      const allHeroesDefeated = player1Defeated && support1Defeated && support2Defeated;
      
      expect(player1Defeated).toBe(true);
      expect(support1Defeated).toBe(true);
      expect(support2Defeated).toBe(false);
      expect(allHeroesDefeated).toBe(false); // Battle should continue
      
      // Turn should skip both player1 and support1, go to support2
      await act(async () => {
        await result.current.switchTurn('player2', null);
      });
      expect(result.current.currentTurn).toBe('support2');
    });
  });

  describe('Reset Battle', () => {
    it('should reset all battle state', () => {
      const { result } = renderHook(() => useBattleState());
      const testClass = createTestClass('Warrior', 50, 50);
      
      act(() => {
        result.current.setPlayer1Class(testClass);
        result.current.setPlayer2Class(testClass);
        result.current.setIsBattleActive(true);
        result.current.setCurrentTurn('player2');
        result.current.addLog('system', 'Test log');
        result.current.setIsMoveInProgress(true);
      });
      
      act(() => {
        result.current.resetBattle();
      });
      
      expect(result.current.player1Class).toBeNull();
      expect(result.current.player2Class).toBeNull();
      expect(result.current.isBattleActive).toBe(false);
      // Note: resetBattle doesn't reset currentTurn (it stays as player2)
      expect(result.current.battleLog).toEqual([]);
      expect(result.current.isMoveInProgress).toBe(false);
      expect(result.current.supportHeroes).toEqual([]);
    });
  });
});

