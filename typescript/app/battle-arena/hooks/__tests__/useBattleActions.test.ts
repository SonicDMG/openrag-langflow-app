import { renderHook, act } from '@testing-library/react';
import { useBattleActions } from '../battle/useBattleActions';
import { Character } from '../../lib/types';

/**
 * Tests for useBattleActions hook
 * Tests battle actions including attack, ability use, and turn switching when heroes are knocked out
 */

describe('useBattleActions', () => {
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

  const createMockDependencies = (overrides: Partial<Parameters<typeof useBattleActions>[0]> = {}) => {
    const defaultPlayer1 = createTestClass('Hero', 50, 50);
    const defaultPlayer2 = createTestClass('Monster', 100, 100);
    
    const mockSwitchTurn = jest.fn().mockResolvedValue(undefined);
    const mockAddLog = jest.fn();
    const mockSetIsMoveInProgress = jest.fn();
    const mockUpdatePlayerHP = jest.fn();
    const mockSetDefeatedPlayer = jest.fn();
    
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
      showFloatingNumbers: jest.fn(),
      showProjectileEffect: jest.fn(),
      clearProjectileTracking: jest.fn(),
      switchTurn: mockSwitchTurn,
      handleVictory: jest.fn().mockResolvedValue(undefined),
      setDefeatedPlayer: mockSetDefeatedPlayer,
      ...overrides,
    };
  };

  describe('Knocked Out Hero Turn Switching', () => {
    it('should switch turn to support heroes when player1 is knocked out and tries to attack', async () => {
      const player1 = createTestClass('Hero', 0, 50); // Knocked out
      const support1 = createTestClass('Support1', 20, 30);
      const support2 = createTestClass('Support2', 15, 25);
      
      const deps = createMockDependencies({
        player1Class: player1,
        supportHeroes: [
          { class: support1, name: 'Support1', monsterId: null },
          { class: support2, name: 'Support2', monsterId: null },
        ],
        currentTurn: 'player1',
      });

      const { result } = renderHook(() => useBattleActions(deps));

      await act(async () => {
        await result.current.performAttack('player1');
      });

      // Should log that turn passes to support heroes
      expect(deps.addLog).toHaveBeenCalledWith(
        'system',
        expect.stringContaining('is knocked out and cannot act. Turn passes to support heroes.')
      );

      // Should switch turn (will skip player1 and go to support1)
      expect(deps.switchTurn).toHaveBeenCalledWith('player1');
      expect(deps.setIsMoveInProgress).toHaveBeenCalledWith(false);
    });

    it('should switch turn to support heroes when player1 is knocked out and tries to use ability', async () => {
      const player1 = createTestClass('Hero', 0, 50); // Knocked out
      const support1 = createTestClass('Support1', 20, 30);
      const support2 = createTestClass('Support2', 15, 25);
      
      const deps = createMockDependencies({
        player1Class: player1,
        supportHeroes: [
          { class: support1, name: 'Support1', monsterId: null },
          { class: support2, name: 'Support2', monsterId: null },
        ],
        currentTurn: 'player1',
      });

      const { result } = renderHook(() => useBattleActions(deps));

      await act(async () => {
        await result.current.useAbility('player1', 0);
      });

      // Should log that turn passes to support heroes
      expect(deps.addLog).toHaveBeenCalledWith(
        'system',
        expect.stringContaining('is knocked out and cannot act. Turn passes to support heroes.')
      );

      // Should switch turn (will skip player1 and go to support1)
      expect(deps.switchTurn).toHaveBeenCalledWith('player1');
      expect(deps.setIsMoveInProgress).toHaveBeenCalledWith(false);
    });

    it('should end battle when all heroes are defeated and player1 tries to act', async () => {
      const player1 = createTestClass('Hero', 0, 50); // Knocked out
      const support1 = createTestClass('Support1', 0, 30); // Also knocked out
      const support2 = createTestClass('Support2', 0, 25); // Also knocked out
      
      const deps = createMockDependencies({
        player1Class: player1,
        supportHeroes: [
          { class: support1, name: 'Support1', monsterId: null },
          { class: support2, name: 'Support2', monsterId: null },
        ],
        currentTurn: 'player1',
      });

      const { result } = renderHook(() => useBattleActions(deps));

      await act(async () => {
        await result.current.performAttack('player1');
      });

      // Should set defeated player since all heroes are defeated
      expect(deps.setDefeatedPlayer).toHaveBeenCalledWith('player1');
      expect(deps.setIsMoveInProgress).toHaveBeenCalledWith(false);
      
      // Should NOT switch turn since battle should end
      expect(deps.switchTurn).not.toHaveBeenCalled();
    });

    it('should not switch turn if knocked out player is not the current turn', async () => {
      const player1 = createTestClass('Hero', 0, 50); // Knocked out
      const support1 = createTestClass('Support1', 20, 30);
      
      const deps = createMockDependencies({
        player1Class: player1,
        supportHeroes: [
          { class: support1, name: 'Support1', monsterId: null },
        ],
        currentTurn: 'support1', // Not player1's turn
      });

      const { result } = renderHook(() => useBattleActions(deps));

      await act(async () => {
        await result.current.performAttack('player1');
      });

      // Should not switch turn since it's not player1's turn
      expect(deps.switchTurn).not.toHaveBeenCalled();
      expect(deps.setIsMoveInProgress).toHaveBeenCalledWith(false);
    });

    it('should switch turn for knocked out support hero', async () => {
      const player1 = createTestClass('Hero', 30, 50);
      const support1 = createTestClass('Support1', 0, 30); // Knocked out
      const support2 = createTestClass('Support2', 15, 25);
      
      const deps = createMockDependencies({
        player1Class: player1,
        supportHeroes: [
          { class: support1, name: 'Support1', monsterId: null },
          { class: support2, name: 'Support2', monsterId: null },
        ],
        currentTurn: 'support1', // Support1's turn but they're knocked out
      });

      const { result } = renderHook(() => useBattleActions(deps));

      await act(async () => {
        await result.current.performAttack('support1');
      });

      // Should switch turn (will skip support1 and go to next player)
      expect(deps.switchTurn).toHaveBeenCalledWith('support1');
      expect(deps.setIsMoveInProgress).toHaveBeenCalledWith(false);
    });

    it('should handle one-on-one battle when player1 is knocked out', async () => {
      const player1 = createTestClass('Hero', 0, 50); // Knocked out
      
      const deps = createMockDependencies({
        player1Class: player1,
        supportHeroes: [], // No support heroes (one-on-one)
        currentTurn: 'player1',
      });

      const { result } = renderHook(() => useBattleActions(deps));

      await act(async () => {
        await result.current.performAttack('player1');
      });

      // Should switch turn (will go to player2)
      expect(deps.switchTurn).toHaveBeenCalledWith('player1');
      expect(deps.setIsMoveInProgress).toHaveBeenCalledWith(false);
    });
  });

  describe('Normal Battle Actions', () => {
    it('should set move in progress when player is not knocked out', async () => {
      const player1 = createTestClass('Hero', 30, 50);
      
      const deps = createMockDependencies({
        player1Class: player1,
        currentTurn: 'player1',
      });

      const { result } = renderHook(() => useBattleActions(deps));

      await act(async () => {
        // Start the attack - it will set move in progress
        // Note: We're not completing the full attack flow here, just testing the initial check
        await result.current.performAttack('player1');
      });

      // Should set move in progress (attack started)
      expect(deps.setIsMoveInProgress).toHaveBeenCalledWith(true);
    });
  });
});

