import { renderHook, act } from '@testing-library/react';
import { useAIOpponent, AIOpponentCallbacks } from '../battle/useAIOpponent';
import { Character, Ability, AttackAbility, HealingAbility } from '../../types';

/**
 * Tests for useAIOpponent hook
 * Tests AI decision-making, timing, and callback execution
 */

describe('useAIOpponent', () => {
  jest.useFakeTimers();

  const createTestClass = (
    name: string,
    hitPoints: number,
    maxHitPoints: number,
    abilities: Ability[] = []
  ): Character => ({
    name,
    hitPoints,
    maxHitPoints,
    armorClass: 15,
    attackBonus: 3,
    damageDie: '1d8',
    abilities,
    description: 'Test class',
    color: '#000000',
  });

  const createAttackAbility = (name: string): AttackAbility => ({
    name,
    type: 'attack',
    damageDice: '2d6',
    attackRoll: true,
    description: 'Test attack',
  });

  const createHealingAbility = (name: string): HealingAbility => ({
    name,
    type: 'healing',
    healingDice: '1d8+3',
    description: 'Test healing',
  });

  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('AI Activation Conditions', () => {
    it('should not activate when AI mode is inactive', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const opponentClass = createTestClass('Monster', 50, 50);

      renderHook(() =>
        useAIOpponent({
          isActive: false,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callbacks.onAttack).not.toHaveBeenCalled();
      expect(callbacks.onUseAbility).not.toHaveBeenCalled();
    });

    it('should not activate when it is not the AI player turn', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const opponentClass = createTestClass('Monster', 50, 50);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player1', // Not player2's turn
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callbacks.onAttack).not.toHaveBeenCalled();
    });

    it('should not activate when move is in progress', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const opponentClass = createTestClass('Monster', 50, 50);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: true, // Move in progress
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callbacks.onAttack).not.toHaveBeenCalled();
    });

    it('should not activate when player is defeated', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const opponentClass = createTestClass('Monster', 50, 50);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: 'player2', // Defeated
          opponentClass,
          playerId: 'player2',
          callbacks,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callbacks.onAttack).not.toHaveBeenCalled();
    });

    it('should not activate when opponent class is null', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass: null, // No class
          playerId: 'player2',
          callbacks,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callbacks.onAttack).not.toHaveBeenCalled();
    });
  });

  describe('AI Decision Making - Basic Attack', () => {
    it('should use basic attack when no abilities available', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const opponentClass = createTestClass('Monster', 50, 50, []); // No abilities

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(callbacks.onAttack).toHaveBeenCalled();
      expect(callbacks.onUseAbility).not.toHaveBeenCalled();
    });

    it('should use basic attack 30% of the time when attack abilities exist', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const abilities = [createAttackAbility('Fireball'), createAttackAbility('Lightning Bolt')];
      const opponentClass = createTestClass('Monster', 50, 50, abilities);

      // Mock Math.random to return 0.8 (above 0.7 threshold, so should use basic attack)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.8);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(callbacks.onAttack).toHaveBeenCalled();
      expect(callbacks.onUseAbility).not.toHaveBeenCalled();

      Math.random = originalRandom;
    });
  });

  describe('AI Decision Making - Attack Abilities', () => {
    it('should use attack ability 70% of the time when available', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const abilities = [createAttackAbility('Fireball')];
      const opponentClass = createTestClass('Monster', 50, 50, abilities);

      // Mock Math.random to return 0.5 (below 0.7 threshold, so should use ability)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(callbacks.onUseAbility).toHaveBeenCalledWith(0); // First ability
      expect(callbacks.onAttack).not.toHaveBeenCalled();

      Math.random = originalRandom;
    });

    it('should select random attack ability when multiple available', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const abilities = [
        createAttackAbility('Fireball'),
        createAttackAbility('Lightning Bolt'),
        createAttackAbility('Ice Storm'),
      ];
      const opponentClass = createTestClass('Monster', 50, 50, abilities);

      // Mock Math.random: first call for ability selection (0.5 = use ability), second for which ability
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 0.5; // Use ability
        if (callCount === 2) return 0.5; // Select second ability (index 1)
        return 0.5;
      });

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(callbacks.onUseAbility).toHaveBeenCalled();
      // Should be called with one of the ability indices (0, 1, or 2)
      const callArgs = (callbacks.onUseAbility as jest.Mock).mock.calls[0][0];
      expect([0, 1, 2]).toContain(callArgs);

      Math.random = originalRandom;
    });
  });

  describe('AI Decision Making - Healing', () => {
    it('should heal 30% of the time when HP is below 30%', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const abilities = [createHealingAbility('Cure Wounds')];
      const opponentClass = createTestClass('Monster', 10, 50, abilities); // 20% HP

      // Mock Math.random to return 0.2 (below 0.3 threshold for healing)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.2);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(callbacks.onUseAbility).toHaveBeenCalledWith(0); // Healing ability
      expect(callbacks.onAttack).not.toHaveBeenCalled();

      Math.random = originalRandom;
    });

    it('should heal 20% of the time when HP is below 50%', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const abilities = [createHealingAbility('Cure Wounds')];
      const opponentClass = createTestClass('Monster', 20, 50, abilities); // 40% HP

      // Mock Math.random to return 0.15 (below 0.2 threshold for healing)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.15);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(callbacks.onUseAbility).toHaveBeenCalledWith(0); // Healing ability

      Math.random = originalRandom;
    });

    it('should heal 10% of the time when HP is above 50%', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const abilities = [createHealingAbility('Cure Wounds')];
      const opponentClass = createTestClass('Monster', 40, 50, abilities); // 80% HP

      // Mock Math.random to return 0.05 (below 0.1 threshold for healing)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.05);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(callbacks.onUseAbility).toHaveBeenCalledWith(0); // Healing ability

      Math.random = originalRandom;
    });

    it('should not heal when no healing abilities available', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const abilities = [createAttackAbility('Fireball')];
      const opponentClass = createTestClass('Monster', 10, 50, abilities); // Low HP but no healing

      // Mock Math.random to return 0.5 (below 0.7 threshold, so should use attack ability)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should use attack ability or basic attack, not healing
      expect(callbacks.onUseAbility).toHaveBeenCalledWith(0); // Attack ability
      
      Math.random = originalRandom;
    });
  });

  describe('AI Timing and Delays', () => {
    it('should wait for delay before executing action', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const opponentClass = createTestClass('Monster', 50, 50, []);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 500,
        })
      );

      // Should not call before delay
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(callbacks.onAttack).not.toHaveBeenCalled();

      // Should call after delay
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(callbacks.onAttack).toHaveBeenCalled();
    });

    it('should check move in progress before executing action', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const opponentClass = createTestClass('Monster', 50, 50, []);
      const onMoveInProgressChange = jest.fn();

      // Note: The hook checks isMoveInProgress inside the timeout callback
      // This test verifies that check works correctly
      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
          onMoveInProgressChange,
        })
      );

      // Advance time but the hook checks isMoveInProgress at execution time
      // Since we can't change it during the timeout, we test the normal flow
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should have called onAttack since move was not in progress
      expect(callbacks.onAttack).toHaveBeenCalled();
    });
  });

  describe('State Change Callbacks', () => {
    it('should call onStateChange when AI starts', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const onStateChange = jest.fn();
      const opponentClass = createTestClass('Monster', 50, 50, []);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
          onStateChange,
        })
      );

      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(onStateChange).toHaveBeenCalledWith(true);
    });

    it('should call onMoveInProgressChange before executing action', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const onMoveInProgressChange = jest.fn();
      const opponentClass = createTestClass('Monster', 50, 50, []);

      renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
          onMoveInProgressChange,
        })
      );

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(onMoveInProgressChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Cleanup', () => {
    it('should provide cleanup function', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const onStateChange = jest.fn();
      const opponentClass = createTestClass('Monster', 50, 50, []);

      const { result } = renderHook(() =>
        useAIOpponent({
          isActive: true,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 500,
          onStateChange,
        })
      );

      // Start the delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Cleanup before timeout completes
      act(() => {
        result.current.cleanup();
      });

      // Complete the delay - should not fire because cleanup was called
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not have called onAttack because cleanup was called
      expect(callbacks.onAttack).not.toHaveBeenCalled();
      expect(onStateChange).toHaveBeenCalledWith(false);
    });

    it('should not activate when AI is inactive', () => {
      const callbacks: AIOpponentCallbacks = {
        onAttack: jest.fn(),
        onUseAbility: jest.fn(),
      };
      const opponentClass = createTestClass('Monster', 50, 50, []);

      // Start with inactive AI
      renderHook(() =>
        useAIOpponent({
          isActive: false,
          currentTurn: 'player2',
          isMoveInProgress: false,
          defeatedPlayer: null,
          opponentClass,
          playerId: 'player2',
          callbacks,
          delay: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should not have called onAttack because AI is inactive
      expect(callbacks.onAttack).not.toHaveBeenCalled();
    });
  });
});

