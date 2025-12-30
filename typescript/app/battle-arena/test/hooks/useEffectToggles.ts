/**
 * Custom hook for managing visual effect toggles in test mode
 * Consolidates effect enable/disable state and provides wrapped effect functions
 */

import { useState, useCallback } from 'react';
import { PendingVisualEffect, ProjectileType } from '../../utils/battle/battle';

export type EffectType = 'particle' | 'flash' | 'shake' | 'sparkle' | 'hit' | 'miss' | 'cast';

export interface EffectToggles {
  particle: boolean;
  flash: boolean;
  shake: boolean;
  sparkle: boolean;
  hit: boolean;
  miss: boolean;
  cast: boolean;
}

export interface UseEffectTogglesReturn {
  toggles: EffectToggles;
  setToggle: (effect: EffectType, enabled: boolean) => void;
  applyVisualEffectWithToggles: (effect: PendingVisualEffect) => void;
  triggerFlashEffectWithToggles: (
    attacker: 'player1' | 'player2' | 'support1' | 'support2',
    projectileType?: ProjectileType
  ) => void;
  showProjectileEffectWithToggles: (
    fromPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    toPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    isHit: boolean,
    onHit?: () => void,
    onComplete?: () => void,
    fromCardRotation?: number,
    delay?: number,
    projectileType?: ProjectileType
  ) => void;
}

export interface UseEffectTogglesConfig {
  applyVisualEffect: (effect: PendingVisualEffect) => void;
  triggerFlashEffect: (
    attacker: 'player1' | 'player2' | 'support1' | 'support2',
    projectileType?: ProjectileType
  ) => void;
  showProjectileEffect: (
    fromPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    toPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    isHit: boolean,
    onHit?: () => void,
    onComplete?: () => void,
    fromCardRotation?: number,
    delay?: number,
    projectileType?: ProjectileType
  ) => void;
}

/**
 * Hook for managing effect toggles and providing wrapped effect functions
 */
export function useEffectToggles(config: UseEffectTogglesConfig): UseEffectTogglesReturn {
  const { applyVisualEffect, triggerFlashEffect, showProjectileEffect } = config;

  // Effect toggle states
  const [particleEffectsEnabled, setParticleEffectsEnabled] = useState(true);
  const [flashEffectsEnabled, setFlashEffectsEnabled] = useState(true);
  const [shakeEffectsEnabled, setShakeEffectsEnabled] = useState(true);
  const [sparkleEffectsEnabled, setSparkleEffectsEnabled] = useState(true);
  const [hitEffectsEnabled, setHitEffectsEnabled] = useState(true);
  const [missEffectsEnabled, setMissEffectsEnabled] = useState(true);
  const [castEffectsEnabled, setCastEffectsEnabled] = useState(true);

  // Consolidated toggles object
  const toggles: EffectToggles = {
    particle: particleEffectsEnabled,
    flash: flashEffectsEnabled,
    shake: shakeEffectsEnabled,
    sparkle: sparkleEffectsEnabled,
    hit: hitEffectsEnabled,
    miss: missEffectsEnabled,
    cast: castEffectsEnabled,
  };

  // Set individual toggle
  const setToggle = useCallback((effect: EffectType, enabled: boolean) => {
    switch (effect) {
      case 'particle':
        setParticleEffectsEnabled(enabled);
        break;
      case 'flash':
        setFlashEffectsEnabled(enabled);
        break;
      case 'shake':
        setShakeEffectsEnabled(enabled);
        break;
      case 'sparkle':
        setSparkleEffectsEnabled(enabled);
        break;
      case 'hit':
        setHitEffectsEnabled(enabled);
        break;
      case 'miss':
        setMissEffectsEnabled(enabled);
        break;
      case 'cast':
        setCastEffectsEnabled(enabled);
        break;
    }
  }, []);

  // Wrapper that respects effect toggles
  const applyVisualEffectWithToggles = useCallback(
    (effect: PendingVisualEffect) => {
      // Respect effect toggles in test mode
      switch (effect.type) {
        case 'shake':
          if (!shakeEffectsEnabled) return;
          break;
        case 'sparkle':
          if (!sparkleEffectsEnabled) return;
          break;
        case 'miss':
          if (!missEffectsEnabled) return;
          break;
        case 'hit':
          if (!hitEffectsEnabled) return;
          break;
        case 'cast':
          if (!castEffectsEnabled) return;
          break;
      }
      applyVisualEffect(effect);
    },
    [
      shakeEffectsEnabled,
      sparkleEffectsEnabled,
      missEffectsEnabled,
      hitEffectsEnabled,
      castEffectsEnabled,
      applyVisualEffect,
    ]
  );

  // Wrapper for flash effects
  const triggerFlashEffectWithToggles = useCallback(
    (attacker: 'player1' | 'player2' | 'support1' | 'support2', projectileType?: ProjectileType) => {
      if (!flashEffectsEnabled) return;
      triggerFlashEffect(attacker, projectileType);
    },
    [flashEffectsEnabled, triggerFlashEffect]
  );

  // Wrapper for projectile effects
  const showProjectileEffectWithToggles = useCallback(
    (
      fromPlayer: 'player1' | 'player2' | 'support1' | 'support2',
      toPlayer: 'player1' | 'player2' | 'support1' | 'support2',
      isHit: boolean,
      onHit?: () => void,
      onComplete?: () => void,
      fromCardRotation?: number,
      delay?: number,
      projectileType?: ProjectileType
    ) => {
      // If particle effects are disabled, execute callbacks immediately
      if (!particleEffectsEnabled) {
        if (isHit && onHit) {
          setTimeout(() => onHit(), 50);
        }
        if (onComplete) {
          setTimeout(() => onComplete(), isHit ? 100 : 150);
        }
        return;
      }
      showProjectileEffect(
        fromPlayer,
        toPlayer,
        isHit,
        onHit,
        onComplete,
        fromCardRotation,
        delay,
        projectileType
      );
    },
    [particleEffectsEnabled, showProjectileEffect]
  );

  return {
    toggles,
    setToggle,
    applyVisualEffectWithToggles,
    triggerFlashEffectWithToggles,
    showProjectileEffectWithToggles,
  };
}

// Made with Bob
