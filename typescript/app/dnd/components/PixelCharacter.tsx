'use client';

import { useRef, useEffect, useState } from 'react';
import { DnDClass, CharacterEmotion } from '../types';
import { getClassColors, getMonsterColors, drawPixelCharacter, drawMonsterPixelArt } from '../utils/pixelArt';
import { MONSTER_ICONS } from '../constants';

// Pixel Character Component - Renders retro pixel art based on class and stats
interface PixelCharacterProps {
  playerClass: DnDClass;
  size?: number; // Canvas size in pixels
  emotion?: CharacterEmotion; // Character's current emotion
  isActive?: boolean; // Whether it's this character's turn
  isDefeated?: boolean; // Whether character is defeated
  isVictor?: boolean; // Whether character is the victor
  shouldShake?: boolean; // Whether character is taking damage
  shouldSparkle?: boolean; // Whether character is being healed
  shouldMiss?: boolean; // Whether character just missed an attack
  shouldHit?: boolean; // Whether character just landed a successful hit
  shouldSurprise?: boolean; // Whether character is surprised by large damage
  shouldCast?: boolean; // Whether wizard is casting a spell
}

export function PixelCharacter({ 
  playerClass, 
  size = 256,
  emotion,
  isActive = false,
  isDefeated = false,
  isVictor = false,
  shouldShake = false,
  shouldSparkle = false,
  shouldMiss = false,
  shouldHit = false,
  shouldSurprise = false,
  shouldCast = false
}: PixelCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevShouldMissRef = useRef(false);
  const [idleFrame, setIdleFrame] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Apply face palm animation when shouldMiss becomes true
  useEffect(() => {
    // Only trigger animation when shouldMiss changes from false to true
    if (shouldMiss && !prevShouldMissRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        // Force animation restart by removing and re-adding the class
        canvas.classList.remove('face-palm');
        let timer: NodeJS.Timeout;
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (canvas) {
              canvas.classList.add('face-palm');
              // Remove class after animation completes
              timer = setTimeout(() => {
                if (canvas) {
                  canvas.classList.remove('face-palm');
                }
              }, 800); // Match animation duration
            }
          });
        });
        
        return () => {
          if (timer) clearTimeout(timer);
        };
      }
    }
    prevShouldMissRef.current = shouldMiss;
  }, [shouldMiss]);

  // Determine emotion based on battle state if not explicitly provided
  // Priority order matters - check most specific states first
  const determineEmotion = (): CharacterEmotion => {
    if (emotion) return emotion;
    
    // Action-based emotions (temporary, highest priority - even over defeated state)
    // Priority: Surprised (by large damage) > Landing hit (triumphant) > Taking damage (hurt) > Being healed (happy) > Missing (frustrated)
    // This ensures the defender shows surprised when taking large damage, then hurt
    // IMPORTANT: shouldSurprise must be checked BEFORE shouldShake to ensure surprise shows
    // When surprise is active, it completely overrides hurt even if both are true
    // IMPORTANT: shouldHit must be checked BEFORE isDefeated to allow hit animation to complete
    if (shouldSurprise) {
      return 'surprised'; // Taking large damage suddenly - show surprise (highest priority, overrides hurt)
    }
    if (shouldHit) return 'triumphant'; // Just landed a hit - show excitement! (only for attacker) - takes priority over defeated state
    // Only show hurt if surprise is NOT active (surprise takes absolute priority)
    if (shouldShake && !shouldSurprise) return 'hurt'; // Taking damage - show pain
    if (shouldSparkle) return 'happy'; // Being healed - should be happy!
    if (shouldMiss) return 'frustrated'; // Missed attack - frustrated
    
    // State-based emotions (only if no action-based emotions are active)
    // Most important states first
    if (isDefeated) return 'dead';
    if (isVictor) return 'victorious';
    
    // State-based emotions (based on HP and turn status)
    // IMPORTANT: Only check these if NO action-based emotions are active
    // Action-based emotions (shouldSurprise, shouldShake, etc.) take absolute priority
    const hpPercent = playerClass.hitPoints / playerClass.maxHitPoints;
    
    // Check HP thresholds from lowest to highest
    // Only show these if no action-based emotions are active
    if (hpPercent < 0.2) return 'worried'; // Very low HP - worried
    if (hpPercent < 0.3) return 'sad'; // Low HP - sad
    if (hpPercent < 0.5) return 'worried'; // Medium-low HP - worried
    
    // Turn-based emotions (only if HP is reasonable)
    if (isActive) {
      return hpPercent > 0.7 ? 'confident' : 'determined';
    }
    
    // HP-based emotions when not active
    if (hpPercent > 0.8) return 'happy'; // High HP - happy
    if (hpPercent > 0.6) return 'determined'; // Good HP - determined
    
    return 'determined'; // Default
  };

  // Determine if character should be idle (no active animations)
  const isIdle = !shouldShake && !shouldSparkle && !shouldMiss && !shouldHit && !shouldSurprise && !isDefeated && !isVictor;

  // Idle animation loop
  useEffect(() => {
    if (!isIdle) {
      // Stop animation when not idle
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (currentTime: number) => {
      // Throttle to ~12 fps for smooth but not too fast animation
      if (currentTime - lastFrameTimeRef.current >= 83) {
        setIdleFrame(prev => (prev + 1) % 60); // Cycle through 60 frames (5 seconds at 12fps)
        lastFrameTimeRef.current = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize time reference and start animation immediately
    lastFrameTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isIdle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Enable pixelated rendering
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, size, size);

    // Check if this is a monster or a class
    const isMonster = MONSTER_ICONS[playerClass.name] !== undefined;
    const hpPercent = playerClass.hitPoints / playerClass.maxHitPoints;
    const currentEmotion = determineEmotion();

    // Draw character based on type (monster or class)
    // Pass idleFrame only when idle, otherwise pass 0
    const animationFrame = isIdle ? idleFrame : 0;
    if (isMonster) {
      const monsterColors = getMonsterColors(playerClass.name);
      drawMonsterPixelArt(ctx, size, playerClass, monsterColors, hpPercent, isDefeated, currentEmotion, animationFrame);
    } else {
      const classColors = getClassColors(playerClass.name);
      // Determine if casting is for healing or attack
      // Healing: sparkle effect is active
      // Attack: hit or miss effect is active (both indicate an attack spell was cast)
      const isHealing = shouldCast && shouldSparkle;
      const isAttacking = shouldCast && (shouldHit || shouldMiss);
      drawPixelCharacter(ctx, size, playerClass, classColors, hpPercent, isDefeated, currentEmotion, animationFrame, shouldCast, isHealing, isAttacking);
    }
  }, [playerClass, size, emotion, isActive, isDefeated, isVictor, shouldShake, shouldSparkle, shouldMiss, shouldHit, shouldSurprise, shouldCast, idleFrame, isIdle]);

  return (
    <canvas
      ref={canvasRef}
      className="pixel-art"
      style={{
        imageRendering: 'pixelated' as const,
        width: '100%',
        maxWidth: `${size}px`,
        height: 'auto',
        display: 'block',
        margin: '0 auto',
      }}
    />
  );
}

