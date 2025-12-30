import { useState, useCallback, useRef } from 'react';
import { ProjectileType } from '../../utils/battle/battle';

export type ProjectileData = {
  id: string;
  fromPlayer: 'player1' | 'player2' | 'support1' | 'support2';
  toPlayer: 'player1' | 'player2' | 'support1' | 'support2';
  isHit: boolean;
  onHit?: () => void;
  onComplete?: () => void;
  fromCardRotation?: number;
  delay?: number;
  projectileType?: ProjectileType;
};

// Flag to disable particle effects (projectiles) - set to true to disable
const PARTICLE_EFFECTS_DISABLED = false;

export function useProjectileEffects() {
  const [projectileEffects, setProjectileEffects] = useState<ProjectileData[]>([]);
  const lastProjectileTimeRef = useRef<{ [key: string]: number }>({});

  const showProjectileEffect = useCallback((
    fromPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    toPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    isHit: boolean,
    onHit?: () => void,
    onComplete?: () => void,
    fromCardRotation?: number,
    delay?: number,
    projectileType?: ProjectileType
  ) => {
    // Keep original player IDs - don't map support heroes to player1
    const visualFromPlayer: 'player1' | 'player2' | 'support1' | 'support2' = fromPlayer;
    const visualToPlayer: 'player1' | 'player2' | 'support1' | 'support2' = toPlayer;
    
    // Skip particle effects for misses - don't show any visual effects
    if (!isHit) {
      // Execute callbacks immediately without showing projectile
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 100);
      }
      return;
    }
    
    // Skip particle effects for melee and ranged attacks
    if (projectileType === 'melee' || projectileType === 'ranged') {
      // Execute callbacks immediately without showing projectile
      if (isHit && onHit) {
        setTimeout(() => {
          onHit();
        }, 50);
      }
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, isHit ? 100 : 150);
      }
      return;
    }
    
    // Disable particle effects for all other spell types except lightning and radiant
    const enabledTypes: ProjectileType[] = ['lightning', 'radiant'];
    if (projectileType && !enabledTypes.includes(projectileType)) {
      // Execute callbacks immediately without showing projectile
      if (isHit && onHit) {
        setTimeout(() => {
          onHit();
        }, 50);
      }
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, isHit ? 100 : 150);
      }
      return;
    }
    
    // If particle effects are disabled, execute callbacks immediately without showing projectile
    if (PARTICLE_EFFECTS_DISABLED) {
      // Execute onHit callback immediately for hits
      if (isHit && onHit) {
        // Small delay to maintain timing feel
        setTimeout(() => {
          onHit();
        }, 50);
      }
      // Execute onComplete callback
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, isHit ? 100 : 150);
      }
      return;
    }
    
    // Create a unique key for this attack (fromPlayer + toPlayer + delay)
    // This prevents duplicate projectiles for the same attack within 200ms
    const attackKey = `${fromPlayer}-${toPlayer}-${delay || 0}`;
    const now = Date.now();
    const lastTime = lastProjectileTimeRef.current[attackKey] || 0;
    
    // Prevent duplicate projectiles within 200ms for the same attack
    if (now - lastTime < 200) {
      return;
    }
    
    lastProjectileTimeRef.current[attackKey] = now;
    
    const projectileId = `projectile-${now}-${Math.random()}`;
    setProjectileEffects(prev => [...prev, {
      id: projectileId,
      fromPlayer: visualFromPlayer,
      toPlayer: visualToPlayer,
      isHit,
      onHit,
      onComplete,
      fromCardRotation,
      delay,
      projectileType,
    }]);
  }, []);

  const removeProjectileEffect = useCallback((id: string) => {
    setProjectileEffects(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearProjectileTracking = useCallback(() => {
    lastProjectileTimeRef.current = {};
  }, []);

  return {
    projectileEffects,
    showProjectileEffect,
    removeProjectileEffect,
    clearProjectileTracking,
  };
}

