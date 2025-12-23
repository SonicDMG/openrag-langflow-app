import { useEffect, useRef } from 'react';
import { applyAnimationClass } from '../../utils/animations';

interface AnimationCallbacks {
  onShakeComplete?: () => void;
  onSparkleComplete?: () => void;
  onMissComplete?: () => void;
  onHitComplete?: () => void;
  onCastComplete?: () => void;
  onFlashComplete?: () => void;
}

interface AnimationTriggers {
  shouldShake: boolean;
  shouldSparkle: boolean;
  shouldMiss: boolean;
  shouldHit: boolean;
  shouldCast: boolean;
  shouldFlash: boolean;
  shakeTrigger: number;
  sparkleTrigger: number;
  missTrigger: number;
  hitTrigger: number;
  castTrigger: number;
  flashTrigger: number;
  shakeIntensity: number;
  isSelected: boolean;
  selectionSyncTrigger: number;
}

interface AnimationRefs {
  animationRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Custom hook to manage all card animations
 * Consolidates 8 separate useEffect hooks into a single, manageable hook
 */
export function useCardAnimations(
  triggers: AnimationTriggers,
  callbacks: AnimationCallbacks,
  refs: AnimationRefs,
  maxHitPoints: number
) {
  const {
    shouldShake,
    shouldSparkle,
    shouldMiss,
    shouldHit,
    shouldCast,
    shouldFlash,
    shakeTrigger,
    sparkleTrigger,
    missTrigger,
    hitTrigger,
    castTrigger,
    flashTrigger,
    shakeIntensity,
    isSelected,
    selectionSyncTrigger,
  } = triggers;

  const {
    onShakeComplete,
    onSparkleComplete,
    onMissComplete,
    onHitComplete,
    onCastComplete,
    onFlashComplete,
  } = callbacks;

  const { animationRef } = refs;

  // Shake animation
  useEffect(() => {
    const targetRef = animationRef;
    
    if (targetRef.current && shouldShake) {
      const intensity = shakeIntensity > 0 ? shakeIntensity : 1;
      const intensityPercent = Math.min(intensity / maxHitPoints, 1.0);
      const scale = 0.15 + (Math.sqrt(intensityPercent) * 1.85);
      targetRef.current.style.setProperty('--shake-intensity', scale.toString());
    }
    
    const cleanup = applyAnimationClass(
      targetRef.current,
      shouldShake,
      shakeTrigger,
      'shake',
      400,
      onShakeComplete || (() => {})
    );
    return cleanup;
  }, [shouldShake, shakeTrigger, shakeIntensity, maxHitPoints, onShakeComplete, animationRef]);

  // Sparkle animation
  useEffect(() => {
    if (shouldSparkle && sparkleTrigger > 0) {
      const timer = setTimeout(() => {
        onSparkleComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldSparkle, sparkleTrigger, onSparkleComplete]);

  // Miss animation
  useEffect(() => {
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldMiss,
      missTrigger,
      'miss',
      600,
      onMissComplete || (() => {})
    );
    return cleanup;
  }, [shouldMiss, missTrigger, onMissComplete, animationRef]);

  // Hit animation
  useEffect(() => {
    if (shouldHit && hitTrigger > 0) {
      const timer = setTimeout(() => {
        onHitComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldHit, hitTrigger, onHitComplete]);

  // Cast animation
  useEffect(() => {
    if (shouldCast && castTrigger > 0) {
      const timer = setTimeout(() => {
        onCastComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldCast, castTrigger, onCastComplete]);

  // Flash animation
  useEffect(() => {
    if (shouldFlash && flashTrigger > 0) {
      const timer = setTimeout(() => {
        onFlashComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldFlash, flashTrigger, onFlashComplete]);

  // Pulse animation for selected cards
  useEffect(() => {
    if (!animationRef.current) return;
    
    if (isSelected) {
      const element = animationRef.current;
      element.classList.remove('card-pulse');
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (element && isSelected) {
            element.classList.add('card-pulse');
          }
        });
      });
    } else {
      animationRef.current.classList.remove('card-pulse');
    }
  }, [isSelected, selectionSyncTrigger, animationRef]);
}

// Made with Bob
