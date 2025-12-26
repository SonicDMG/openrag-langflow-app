import { renderHook, act, waitFor } from '@testing-library/react';
import { useBattleEffects } from '../battle/useBattleEffects';
import { PendingVisualEffect, ProjectileType } from '../../utils/battle';

/**
 * Tests for useBattleEffects hook
 * Tests visual effects management, floating numbers, and effect triggers
 */

describe('useBattleEffects', () => {
  describe('Initial State', () => {
    it('should initialize with no active effects', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      expect(result.current.shakingPlayer).toBeNull();
      expect(result.current.sparklingPlayer).toBeNull();
      expect(result.current.missingPlayer).toBeNull();
      expect(result.current.hittingPlayer).toBeNull();
      expect(result.current.castingPlayer).toBeNull();
      expect(result.current.flashingPlayer).toBeNull();
      expect(result.current.floatingNumbers).toEqual([]);
    });

    it('should initialize with zero triggers', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      expect(result.current.shakeTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.sparkleTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.missTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.hitTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.castTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.flashTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
    });
  });

  describe('Visual Effects - Shake', () => {
    it('should apply shake effect to player1', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'shake',
        player: 'player1',
        intensity: 15,
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
      });
      
      expect(result.current.shakingPlayer).toBe('player1');
      expect(result.current.shakeTrigger.player1).toBe(1);
      expect(result.current.shakeIntensity.player1).toBe(15);
    });

    it('should apply shake effect to player2', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'shake',
        player: 'player2',
        intensity: 25,
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
      });
      
      expect(result.current.shakingPlayer).toBe('player2');
      expect(result.current.shakeTrigger.player2).toBe(1);
      expect(result.current.shakeIntensity.player2).toBe(25);
    });

    it('should increment shake trigger on multiple shakes', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'shake',
        player: 'player1',
        intensity: 10,
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
        result.current.applyVisualEffect(effect);
        result.current.applyVisualEffect(effect);
      });
      
      expect(result.current.shakeTrigger.player1).toBe(3);
    });

    it('should handle shake complete', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'shake',
        player: 'player1',
        intensity: 10,
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
      });
      
      expect(result.current.shakingPlayer).toBe('player1');
      
      act(() => {
        result.current.handleShakeComplete();
      });
      
      expect(result.current.shakingPlayer).toBeNull();
    });
  });

  describe('Visual Effects - Sparkle', () => {
    it('should apply sparkle effect for healing', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'sparkle',
        player: 'player1',
        intensity: 20,
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
      });
      
      expect(result.current.sparklingPlayer).toBe('player1');
      expect(result.current.sparkleTrigger.player1).toBe(1);
      expect(result.current.sparkleIntensity.player1).toBe(20);
    });

    it('should handle sparkle complete', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'sparkle',
        player: 'player2',
        intensity: 15,
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
        result.current.handleSparkleComplete();
      });
      
      expect(result.current.sparklingPlayer).toBeNull();
    });
  });

  describe('Visual Effects - Miss', () => {
    it('should apply miss effect', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'miss',
        player: 'player1',
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
      });
      
      expect(result.current.missingPlayer).toBe('player1');
      expect(result.current.missTrigger.player1).toBe(1);
    });

    it('should handle miss complete', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'miss',
        player: 'player2',
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
        result.current.handleMissComplete();
      });
      
      expect(result.current.missingPlayer).toBeNull();
    });
  });

  describe('Visual Effects - Hit', () => {
    it('should apply hit effect', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'hit',
        player: 'player1',
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
      });
      
      expect(result.current.hittingPlayer).toBe('player1');
      expect(result.current.hitTrigger.player1).toBe(1);
    });

    it('should handle hit complete', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'hit',
        player: 'player2',
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
        result.current.handleHitComplete();
      });
      
      expect(result.current.hittingPlayer).toBeNull();
    });
  });

  describe('Visual Effects - Cast', () => {
    it('should apply cast effect', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'cast',
        player: 'player1',
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
      });
      
      expect(result.current.castingPlayer).toBe('player1');
      expect(result.current.castTrigger.player1).toBe(1);
    });

    it('should handle cast complete', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effect: PendingVisualEffect = {
        type: 'cast',
        player: 'player2',
      };
      
      act(() => {
        result.current.applyVisualEffect(effect);
        result.current.handleCastComplete();
      });
      
      expect(result.current.castingPlayer).toBeNull();
    });
  });

  describe('Flash Effect', () => {
    it('should trigger flash effect for player1', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.triggerFlashEffect('player1', 'fire');
      });
      
      expect(result.current.flashingPlayer).toBe('player1');
      expect(result.current.flashTrigger.player1).toBe(1);
      expect(result.current.flashProjectileType.player1).toBe('fire');
      expect(result.current.castProjectileType.player1).toBe('fire');
    });

    it('should trigger flash effect for player2', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.triggerFlashEffect('player2', 'ice');
      });
      
      expect(result.current.flashingPlayer).toBe('player2');
      expect(result.current.flashTrigger.player2).toBe(1);
      expect(result.current.flashProjectileType.player2).toBe('ice');
    });

    it('should handle flash effects for support heroes', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.triggerFlashEffect('support1', 'lightning');
        result.current.triggerFlashEffect('support2', 'poison');
      });
      
      // Last one should be active
      expect(result.current.flashingPlayer).toBe('support2');
      expect(result.current.flashProjectileType.support1).toBe('lightning');
      expect(result.current.flashProjectileType.support2).toBe('poison');
    });

    it('should handle flash without projectile type', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.triggerFlashEffect('player1');
      });
      
      expect(result.current.flashingPlayer).toBe('player1');
      expect(result.current.flashProjectileType.player1).toBeNull();
    });

    it('should handle flash complete', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.triggerFlashEffect('player1', 'fire');
        result.current.handleFlashComplete();
      });
      
      expect(result.current.flashingPlayer).toBeNull();
    });
  });

  describe('Floating Numbers', () => {
    it('should show floating numbers', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.showFloatingNumbers([
          { value: 15, type: 'damage', targetPlayer: 'player1' },
          { value: 20, type: 'healing', targetPlayer: 'player2' },
        ]);
      });
      
      expect(result.current.floatingNumbers).toHaveLength(2);
      expect(result.current.floatingNumbers[0].value).toBe(15);
      expect(result.current.floatingNumbers[0].type).toBe('damage');
      expect(result.current.floatingNumbers[1].value).toBe(20);
      expect(result.current.floatingNumbers[1].type).toBe('healing');
    });

    it('should generate unique IDs for floating numbers', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.showFloatingNumbers([
          { value: 10, type: 'damage', targetPlayer: 'player1' },
        ]);
        result.current.showFloatingNumbers([
          { value: 20, type: 'damage', targetPlayer: 'player1' },
        ]);
      });
      
      expect(result.current.floatingNumbers).toHaveLength(2);
      expect(result.current.floatingNumbers[0].id).not.toBe(result.current.floatingNumbers[1].id);
    });

    it('should handle persistent floating numbers', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.showFloatingNumbers([
          { value: 'DEFEATED!', type: 'defeated', targetPlayer: 'player1', persistent: true },
        ]);
      });
      
      expect(result.current.floatingNumbers[0].persistent).toBe(true);
    });

    it('should remove floating number on complete', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.showFloatingNumbers([
          { value: 15, type: 'damage', targetPlayer: 'player1' },
        ]);
      });
      
      const numberId = result.current.floatingNumbers[0].id;
      
      act(() => {
        result.current.handleFloatingNumberComplete(numberId);
      });
      
      expect(result.current.floatingNumbers).toHaveLength(0);
    });

    it('should apply visual effects when showing floating numbers', () => {
      const { result } = renderHook(() => useBattleEffects());
      const effects: PendingVisualEffect[] = [
        { type: 'shake', player: 'player1', intensity: 15 },
        { type: 'hit', player: 'player2' },
      ];
      
      act(() => {
        result.current.showFloatingNumbers(
          [{ value: 15, type: 'damage', targetPlayer: 'player1' }],
          effects
        );
      });
      
      expect(result.current.shakingPlayer).toBe('player1');
      expect(result.current.hittingPlayer).toBe('player2');
    });

    it('should execute callbacks when showing floating numbers', async () => {
      const { result } = renderHook(() => useBattleEffects());
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      act(() => {
        result.current.showFloatingNumbers(
          [{ value: 10, type: 'damage', targetPlayer: 'player1' }],
          [],
          [callback1, callback2]
        );
      });
      
      // Wait for requestAnimationFrame callbacks
      await waitFor(() => {
        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });
  });

  describe('Victory and Defeat States', () => {
    it('should set defeated player', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.setDefeatedPlayer('player1');
      });
      
      expect(result.current.defeatedPlayer).toBe('player1');
    });

    it('should set victor player', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.setVictorPlayer('player2');
      });
      
      expect(result.current.victorPlayer).toBe('player2');
    });

    it('should trigger confetti', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      act(() => {
        result.current.setConfettiTrigger(1);
      });
      
      expect(result.current.confettiTrigger).toBe(1);
    });
  });

  describe('Reset Effects', () => {
    it('should reset all effects', () => {
      const { result } = renderHook(() => useBattleEffects());
      
      // Set up various effects
      act(() => {
        result.current.applyVisualEffect({ type: 'shake', player: 'player1', intensity: 10 });
        result.current.applyVisualEffect({ type: 'sparkle', player: 'player2', intensity: 15 });
        result.current.applyVisualEffect({ type: 'miss', player: 'player1' });
        result.current.applyVisualEffect({ type: 'hit', player: 'player2' });
        result.current.applyVisualEffect({ type: 'cast', player: 'player1' });
        result.current.triggerFlashEffect('player2', 'fire');
        result.current.setDefeatedPlayer('player1');
        result.current.setVictorPlayer('player2');
        result.current.showFloatingNumbers([
          { value: 10, type: 'damage', targetPlayer: 'player1' },
        ]);
      });
      
      // Reset
      act(() => {
        result.current.resetEffects();
      });
      
      // Verify all effects are cleared
      expect(result.current.shakingPlayer).toBeNull();
      expect(result.current.sparklingPlayer).toBeNull();
      expect(result.current.missingPlayer).toBeNull();
      expect(result.current.hittingPlayer).toBeNull();
      expect(result.current.castingPlayer).toBeNull();
      expect(result.current.flashingPlayer).toBeNull();
      expect(result.current.defeatedPlayer).toBeNull();
      expect(result.current.victorPlayer).toBeNull();
      expect(result.current.floatingNumbers).toEqual([]);
      // Note: resetEffects resets miss, hit, cast, and flash triggers, but not shake/sparkle triggers
      expect(result.current.missTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.hitTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.castTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.flashTrigger).toEqual({ player1: 0, player2: 0, support1: 0, support2: 0 });
      expect(result.current.flashProjectileType).toEqual({ player1: null, player2: null, support1: null, support2: null });
    });
  });
});

