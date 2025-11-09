'use client';

import { useRef, useEffect } from 'react';
import { DnDClass, CharacterEmotion } from '../types';
import { getClassColors, drawPixelCharacter } from '../utils/pixelArt';

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
}

export function PixelCharacter({ 
  playerClass, 
  size = 128,
  emotion,
  isActive = false,
  isDefeated = false,
  isVictor = false,
  shouldShake = false,
  shouldSparkle = false,
  shouldMiss = false,
  shouldHit = false,
  shouldSurprise = false
}: PixelCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevShouldMissRef = useRef(false);

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
    
    // Most important states first
    if (isDefeated) return 'dead';
    if (isVictor) return 'victorious';
    
    // Action-based emotions (temporary, high priority)
    // Priority: Surprised (by large damage) > Taking damage (hurt) > Being healed (happy) > Landing hit (triumphant) > Missing (frustrated)
    // This ensures the defender shows surprised when taking large damage, then hurt
    // IMPORTANT: shouldSurprise must be checked BEFORE shouldShake to ensure surprise shows
    // When surprise is active, it completely overrides hurt even if both are true
    if (shouldSurprise) {
      // Debug: log when surprise should be shown
      console.log('[PixelCharacter] Showing SURPRISED emotion', { shouldSurprise, shouldShake, hpPercent: playerClass.hitPoints / playerClass.maxHitPoints });
      return 'surprised'; // Taking large damage suddenly - show surprise (highest priority, overrides hurt)
    }
    // Only show hurt if surprise is NOT active (surprise takes absolute priority)
    if (shouldShake && !shouldSurprise) return 'hurt'; // Taking damage - show pain
    if (shouldSparkle) return 'happy'; // Being healed - should be happy!
    if (shouldHit) return 'triumphant'; // Just landed a hit - show excitement! (only for attacker)
    if (shouldMiss) return 'frustrated'; // Missed attack - frustrated
    
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

    // Get class-specific colors
    const classColors = getClassColors(playerClass.name);
    const hpPercent = playerClass.hitPoints / playerClass.maxHitPoints;
    const currentEmotion = determineEmotion();

    // Draw character based on class
    drawPixelCharacter(ctx, size, playerClass, classColors, hpPercent, isDefeated, currentEmotion);
  }, [playerClass, size, emotion, isActive, isDefeated, isVictor, shouldShake, shouldSparkle, shouldMiss, shouldHit, shouldSurprise]);

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

