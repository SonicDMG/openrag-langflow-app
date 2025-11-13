'use client';

import { useRef, useEffect } from 'react';
import { DnDClass } from '../types';
import { getClassColors, getMonsterColors, drawPixelCharacter, drawMonsterPixelArt } from '../utils/pixelArt';
import { MONSTER_ICONS } from '../constants';

// Pixel Character Component - Renders retro pixel art based on class and stats
interface PixelCharacterProps {
  playerClass: DnDClass;
  size?: number; // Canvas size in pixels
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

    // Draw character based on type (monster or class)
    if (isMonster) {
      const monsterColors = getMonsterColors(playerClass.name);
      // Determine if casting is for healing or attack (similar to classes)
      const isHealing = shouldCast && shouldSparkle;
      const isAttacking = shouldCast && (shouldHit || shouldMiss || !shouldSparkle);
      drawMonsterPixelArt(ctx, size, playerClass, monsterColors, hpPercent, isDefeated, shouldCast, isHealing, isAttacking);
    } else {
      const classColors = getClassColors(playerClass.name);
      // Determine if casting is for healing or attack
      // Healing: sparkle effect is active (indicates healing spell)
      // Attack: hit or miss effect is active (both indicate an attack spell was cast)
      // Note: shouldCast and shouldSparkle/shouldHit/shouldMiss should be set simultaneously
      // but we check both to ensure spell type is determined correctly
      const isHealing = shouldCast && shouldSparkle;
      // For attacks: shouldCast with hit/miss, OR shouldCast without sparkle (attack is more common)
      const isAttacking = shouldCast && (shouldHit || shouldMiss || !shouldSparkle);
      drawPixelCharacter(ctx, size, playerClass, classColors, hpPercent, isDefeated, shouldCast, isHealing, isAttacking);
    }
  }, [playerClass, size, isActive, isDefeated, isVictor, shouldShake, shouldSparkle, shouldMiss, shouldHit, shouldSurprise, shouldCast]);

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

