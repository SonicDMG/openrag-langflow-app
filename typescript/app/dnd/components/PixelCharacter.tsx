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
  shouldHit = false
}: PixelCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine emotion based on battle state if not explicitly provided
  // Priority order matters - check most specific states first
  const determineEmotion = (): CharacterEmotion => {
    if (emotion) return emotion;
    
    // Most important states first
    if (isDefeated) return 'dead';
    if (isVictor) return 'victorious';
    
    // Action-based emotions (temporary, high priority)
    if (shouldHit) return 'triumphant'; // Just landed a hit - show excitement!
    if (shouldSparkle) return 'happy'; // Being healed - should be happy!
    if (shouldShake) return 'hurt'; // Taking damage - show pain
    if (shouldMiss) return 'frustrated'; // Missed attack - frustrated
    
    // State-based emotions (based on HP and turn status)
    const hpPercent = playerClass.hitPoints / playerClass.maxHitPoints;
    if (hpPercent < 0.2) return 'worried'; // Very low HP - worried
    if (hpPercent < 0.3) return 'sad'; // Low HP - sad
    if (hpPercent < 0.5) return 'worried'; // Medium-low HP - worried
    if (isActive && hpPercent > 0.7) return 'confident'; // Active turn with high HP - confident
    if (isActive) return 'determined'; // Active turn - determined
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
  }, [playerClass, size, emotion, isActive, isDefeated, isVictor, shouldShake, shouldSparkle, shouldMiss, shouldHit]);

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

