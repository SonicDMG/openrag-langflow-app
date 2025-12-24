import { useState, useCallback, useRef } from 'react';
import { PendingVisualEffect, ProjectileType } from '../../utils/battle';
import { FloatingNumberType } from '../../components/FloatingNumber';

export type FloatingNumberData = {
  id: string;
  value: number | string;
  type: FloatingNumberType;
  targetPlayer: 'player1' | 'player2' | 'support1' | 'support2';
  persistent?: boolean;
};

export function useBattleEffects() {
  // Counter for unique floating number IDs
  const floatingNumberCounterRef = useRef(0);
  
  // Visual effect states
  const [shakingPlayer, setShakingPlayer] = useState<'player1' | 'player2' | 'support1' | 'support2' | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState({ player1: 0, player2: 0, support1: 0, support2: 0 });
  const [shakeIntensity, setShakeIntensity] = useState<{ player1: number; player2: number; support1: number; support2: number }>({ player1: 0, player2: 0, support1: 0, support2: 0 });
  
  const [sparklingPlayer, setSparklingPlayer] = useState<'player1' | 'player2' | 'support1' | 'support2' | null>(null);
  const [sparkleTrigger, setSparkleTrigger] = useState({ player1: 0, player2: 0, support1: 0, support2: 0 });
  const [sparkleIntensity, setSparkleIntensity] = useState<{ player1: number; player2: number; support1: number; support2: number }>({ player1: 0, player2: 0, support1: 0, support2: 0 });
  
  const [missingPlayer, setMissingPlayer] = useState<'player1' | 'player2' | 'support1' | 'support2' | null>(null);
  const [missTrigger, setMissTrigger] = useState({ player1: 0, player2: 0, support1: 0, support2: 0 });
  
  const [hittingPlayer, setHittingPlayer] = useState<'player1' | 'player2' | 'support1' | 'support2' | null>(null);
  const [hitTrigger, setHitTrigger] = useState({ player1: 0, player2: 0, support1: 0, support2: 0 });
  
  const [castingPlayer, setCastingPlayer] = useState<'player1' | 'player2' | 'support1' | 'support2' | null>(null);
  const [castTrigger, setCastTrigger] = useState({ player1: 0, player2: 0, support1: 0, support2: 0 });
  
  const [flashingPlayer, setFlashingPlayer] = useState<'player1' | 'player2' | 'support1' | 'support2' | null>(null);
  const [flashTrigger, setFlashTrigger] = useState({ player1: 0, player2: 0, support1: 0, support2: 0 });
  const [flashProjectileType, setFlashProjectileType] = useState<{ player1: ProjectileType | null; player2: ProjectileType | null; support1: ProjectileType | null; support2: ProjectileType | null }>({ player1: null, player2: null, support1: null, support2: null });
  const [castProjectileType, setCastProjectileType] = useState<{ player1: ProjectileType | null; player2: ProjectileType | null; support1: ProjectileType | null; support2: ProjectileType | null }>({ player1: null, player2: null, support1: null, support2: null });
  
  const [defeatedPlayer, setDefeatedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [victorPlayer, setVictorPlayer] = useState<'player1' | 'player2' | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  
  const [selectionSyncTrigger, setSelectionSyncTrigger] = useState(0);
  
  // Floating numbers state
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumberData[]>([]);

  // Helper function to apply a visual effect
  const applyVisualEffect = useCallback((effect: PendingVisualEffect) => {
    switch (effect.type) {
      case 'shake':
        setShakingPlayer(effect.player);
        setShakeTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        if (effect.intensity !== undefined) {
          setShakeIntensity(prev => ({ ...prev, [effect.player]: effect.intensity! }));
        }
        break;
      case 'sparkle':
        setSparklingPlayer(effect.player);
        setSparkleTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        if (effect.intensity !== undefined) {
          setSparkleIntensity(prev => ({ ...prev, [effect.player]: effect.intensity! }));
        }
        break;
      case 'miss':
        setMissingPlayer(effect.player);
        setMissTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'hit':
        setHittingPlayer(effect.player);
        setHitTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'cast':
        setCastingPlayer(effect.player);
        setCastTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
    }
  }, []);

  // Helper function to trigger flash effect on attacking card
  const triggerFlashEffect = useCallback((attacker: 'player1' | 'player2' | 'support1' | 'support2', projectileType?: ProjectileType) => {
    setFlashingPlayer(attacker);
    setFlashTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
    if (projectileType) {
      setFlashProjectileType(prev => ({ ...prev, [attacker]: projectileType }));
      setCastProjectileType(prev => ({ ...prev, [attacker]: projectileType }));
    }
  }, []);

  // Helper function to show floating numbers and apply effects immediately
  const showFloatingNumbers = useCallback((
    numbers: Array<{ value: number | string; type: FloatingNumberType; targetPlayer: 'player1' | 'player2' | 'support1' | 'support2'; persistent?: boolean }>,
    visualEffects: PendingVisualEffect[] = [],
    callbacks: (() => void)[] = []
  ) => {
    // Show floating numbers immediately
    const numberData: FloatingNumberData[] = numbers.map((n, idx) => {
      floatingNumberCounterRef.current += 1;
      return {
        id: `${Date.now()}-${floatingNumberCounterRef.current}-${idx}`,
        ...n,
      };
    });
    setFloatingNumbers(prev => [...prev, ...numberData]);
    
    // Apply visual effects immediately
    visualEffects.forEach(effect => {
      applyVisualEffect(effect);
    });
    
    // Execute callbacks immediately (with a tiny delay to ensure state updates)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        callbacks.forEach(callback => callback());
      });
    });
  }, [applyVisualEffect]);

  // Handle floating number completion (cleanup)
  const handleFloatingNumberComplete = useCallback((id: string) => {
    setFloatingNumbers(prev => prev.filter(n => n.id !== id));
  }, []);

  // Animation completion handlers
  const handleShakeComplete = useCallback(() => {
    setShakingPlayer(null);
  }, []);

  const handleSparkleComplete = useCallback(() => {
    setSparklingPlayer(null);
  }, []);

  const handleMissComplete = useCallback(() => {
    setMissingPlayer(null);
  }, []);

  const handleHitComplete = useCallback(() => {
    setHittingPlayer(null);
  }, []);

  const handleCastComplete = useCallback(() => {
    setCastingPlayer(null);
  }, []);

  const handleFlashComplete = useCallback(() => {
    setFlashingPlayer(null);
  }, []);

  // Reset all effects
  const resetEffects = useCallback(() => {
    setShakingPlayer(null);
    setSparklingPlayer(null);
    setMissingPlayer(null);
    setHittingPlayer(null);
    setCastingPlayer(null);
    setFlashingPlayer(null);
    setDefeatedPlayer(null);
    setVictorPlayer(null);
    setMissTrigger({ player1: 0, player2: 0, support1: 0, support2: 0 });
    setHitTrigger({ player1: 0, player2: 0, support1: 0, support2: 0 });
    setCastTrigger({ player1: 0, player2: 0, support1: 0, support2: 0 });
    setFlashTrigger({ player1: 0, player2: 0, support1: 0, support2: 0 });
    setFlashProjectileType({ player1: null, player2: null, support1: null, support2: null });
    setCastProjectileType({ player1: null, player2: null, support1: null, support2: null });
    setFloatingNumbers([]);
  }, []);

  return {
    // States
    shakingPlayer,
    shakeTrigger,
    shakeIntensity,
    sparklingPlayer,
    sparkleTrigger,
    sparkleIntensity,
    missingPlayer,
    missTrigger,
    hittingPlayer,
    hitTrigger,
    castingPlayer,
    castTrigger,
    flashingPlayer,
    flashTrigger,
    flashProjectileType,
    castProjectileType,
    defeatedPlayer,
    victorPlayer,
    confettiTrigger,
    selectionSyncTrigger,
    floatingNumbers,
    // Setters (for external control)
    setDefeatedPlayer,
    setVictorPlayer,
    setConfettiTrigger,
    setSelectionSyncTrigger,
    // Functions
    applyVisualEffect,
    triggerFlashEffect,
    showFloatingNumbers,
    handleFloatingNumberComplete,
    handleShakeComplete,
    handleSparkleComplete,
    handleMissComplete,
    handleHitComplete,
    handleCastComplete,
    handleFlashComplete,
    resetEffects,
  };
}

