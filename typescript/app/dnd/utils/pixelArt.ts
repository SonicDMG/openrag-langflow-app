import { DnDClass, CharacterEmotion } from '../types';

// Get class-specific color palette
export function getClassColors(className: string): {
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  hair: string;
} {
  const colorMap: Record<string, { primary: string; secondary: string; accent: string; skin: string; hair: string }> = {
    Fighter: { primary: '#7f1d1d', secondary: '#991b1b', accent: '#dc2626', skin: '#fbbf24', hair: '#1c1917' },
    Wizard: { primary: '#1e3a8a', secondary: '#1e40af', accent: '#3b82f6', skin: '#fde68a', hair: '#fbbf24' },
    Rogue: { primary: '#581c87', secondary: '#6b21a8', accent: '#a855f7', skin: '#fbbf24', hair: '#1c1917' },
    Cleric: { primary: '#78350f', secondary: '#92400e', accent: '#fbbf24', skin: '#fde68a', hair: '#fef3c7' },
    Barbarian: { primary: '#7c2d12', secondary: '#9a3412', accent: '#ea580c', skin: '#fbbf24', hair: '#dc2626' },
    Ranger: { primary: '#14532d', secondary: '#166534', accent: '#22c55e', skin: '#fbbf24', hair: '#1c1917' },
    Paladin: { primary: '#831843', secondary: '#9f1239', accent: '#ec4899', skin: '#fde68a', hair: '#fbbf24' },
    Bard: { primary: '#312e81', secondary: '#3730a3', accent: '#6366f1', skin: '#fbbf24', hair: '#a855f7' },
    Sorcerer: { primary: '#164e63', secondary: '#155e75', accent: '#06b6d4', skin: '#fde68a', hair: '#06b6d4' },
    Warlock: { primary: '#581c87', secondary: '#6b21a8', accent: '#8b5cf6', skin: '#fbbf24', hair: '#1c1917' },
    Monk: { primary: '#78350f', secondary: '#92400e', accent: '#f59e0b', skin: '#fbbf24', hair: '#1c1917' },
    Druid: { primary: '#064e3b', secondary: '#065f46', accent: '#10b981', skin: '#fbbf24', hair: '#166534' },
    Artificer: { primary: '#134e4a', secondary: '#0f766e', accent: '#14b8a6', skin: '#fde68a', hair: '#1c1917' },
  };

  return colorMap[className] || {
    primary: '#1c1917',
    secondary: '#292524',
    accent: '#78716c',
    skin: '#fbbf24',
    hair: '#1c1917',
  };
}

// Draw facial expression based on emotion
export function drawFaceExpression(
  ctx: CanvasRenderingContext2D,
  pixelSize: number,
  emotion: CharacterEmotion,
  isDefeated: boolean
) {
  const pixel = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  };

  // Eye positions (base)
  const leftEyeX = 12;
  const rightEyeX = 19;
  const eyeY = 8;

  // Mouth positions
  const mouthX = 15;
  const mouthY = 11;

  if (isDefeated || emotion === 'dead') {
    // X eyes for dead
    pixel(leftEyeX, eyeY, '#000000');
    pixel(leftEyeX + 1, eyeY + 1, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    pixel(rightEyeX - 1, eyeY + 1, '#000000');
    // Frown
    pixel(mouthX, mouthY, '#000000');
    pixel(mouthX + 1, mouthY, '#000000');
    pixel(mouthX + 2, mouthY, '#000000');
  } else if (emotion === 'victorious' || emotion === 'laughing') {
    // Happy eyes (squinted)
    pixel(leftEyeX, eyeY, '#000000');
    pixel(leftEyeX + 1, eyeY, '#000000');
    pixel(rightEyeX - 1, eyeY, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    // Big smile
    pixel(mouthX - 1, mouthY, '#000000');
    pixel(mouthX, mouthY - 1, '#000000');
    pixel(mouthX + 1, mouthY - 1, '#000000');
    pixel(mouthX + 2, mouthY - 1, '#000000');
    pixel(mouthX + 3, mouthY, '#000000');
  } else if (emotion === 'happy') {
    // Normal happy eyes
    pixel(leftEyeX, eyeY, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    // Smile
    pixel(mouthX, mouthY, '#000000');
    pixel(mouthX + 1, mouthY - 1, '#000000');
    pixel(mouthX + 2, mouthY - 1, '#000000');
    pixel(mouthX + 3, mouthY, '#000000');
  } else if (emotion === 'hurt' || emotion === 'sad') {
    // Sad eyes (slightly down)
    pixel(leftEyeX, eyeY + 1, '#000000');
    pixel(rightEyeX, eyeY + 1, '#000000');
    // Frown
    pixel(mouthX, mouthY, '#000000');
    pixel(mouthX + 1, mouthY + 1, '#000000');
    pixel(mouthX + 2, mouthY + 1, '#000000');
    pixel(mouthX + 3, mouthY, '#000000');
  } else if (emotion === 'rage' || emotion === 'frustrated') {
    // Angry eyes (angled down)
    pixel(leftEyeX, eyeY, '#000000');
    pixel(leftEyeX + 1, eyeY + 1, '#000000');
    pixel(rightEyeX - 1, eyeY + 1, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    // Angry mouth (open/teeth)
    pixel(mouthX, mouthY, '#000000');
    pixel(mouthX + 1, mouthY, '#ffffff');
    pixel(mouthX + 2, mouthY, '#ffffff');
    pixel(mouthX + 3, mouthY, '#000000');
  } else if (emotion === 'worried') {
    // Worried eyes (wide)
    pixel(leftEyeX - 1, eyeY, '#000000');
    pixel(leftEyeX, eyeY, '#000000');
    pixel(leftEyeX + 1, eyeY, '#000000');
    pixel(rightEyeX - 1, eyeY, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    pixel(rightEyeX + 1, eyeY, '#000000');
    // Small worried mouth
    pixel(mouthX + 1, mouthY, '#000000');
    pixel(mouthX + 2, mouthY, '#000000');
  } else if (emotion === 'determined') {
    // Determined eyes (normal, focused)
    pixel(leftEyeX, eyeY, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    // Neutral/slightly determined mouth
    pixel(mouthX + 1, mouthY, '#000000');
    pixel(mouthX + 2, mouthY, '#000000');
  } else if (emotion === 'triumphant' || emotion === 'excited') {
    // Triumphant/excited - big smile, bright eyes
    pixel(leftEyeX, eyeY, '#000000');
    pixel(leftEyeX + 1, eyeY, '#000000');
    pixel(rightEyeX - 1, eyeY, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    // Big triumphant smile
    pixel(mouthX - 1, mouthY - 1, '#000000');
    pixel(mouthX, mouthY - 1, '#000000');
    pixel(mouthX + 1, mouthY - 1, '#000000');
    pixel(mouthX + 2, mouthY - 1, '#000000');
    pixel(mouthX + 3, mouthY - 1, '#000000');
    pixel(mouthX + 4, mouthY, '#000000');
  } else if (emotion === 'confident') {
    // Confident - slight smile, focused eyes
    pixel(leftEyeX, eyeY, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    // Confident smile
    pixel(mouthX, mouthY, '#000000');
    pixel(mouthX + 1, mouthY - 1, '#000000');
    pixel(mouthX + 2, mouthY - 1, '#000000');
    pixel(mouthX + 3, mouthY, '#000000');
  } else if (emotion === 'surprised') {
    // Surprised - wide eyes, open mouth
    pixel(leftEyeX - 1, eyeY, '#000000');
    pixel(leftEyeX, eyeY, '#000000');
    pixel(leftEyeX + 1, eyeY, '#000000');
    pixel(rightEyeX - 1, eyeY, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    pixel(rightEyeX + 1, eyeY, '#000000');
    // Open surprised mouth (O shape)
    pixel(mouthX + 1, mouthY - 1, '#000000');
    pixel(mouthX, mouthY, '#000000');
    pixel(mouthX + 2, mouthY, '#000000');
    pixel(mouthX + 1, mouthY + 1, '#000000');
  } else {
    // Default: neutral eyes
    pixel(leftEyeX, eyeY, '#000000');
    pixel(rightEyeX, eyeY, '#000000');
    // Neutral mouth
    pixel(mouthX + 1, mouthY, '#000000');
    pixel(mouthX + 2, mouthY, '#000000');
  }
}

// Draw pixel art character
export function drawPixelCharacter(
  ctx: CanvasRenderingContext2D,
  size: number,
  playerClass: DnDClass,
  colors: ReturnType<typeof getClassColors>,
  hpPercent: number,
  isDefeated: boolean,
  emotion: CharacterEmotion
) {
  const scale = size / 32; // Base sprite is 32x32, scale to desired size
  const pixelSize = scale;

  // Helper to draw a pixel
  const pixel = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  };

  // Helper to draw a rectangle of pixels
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, w * pixelSize, h * pixelSize);
  };

  // Base character shape (32x32 grid)
  // Head
  rect(10, 4, 12, 10, colors.skin);
  
  // Hair/Helmet based on class
  if (playerClass.name === 'Wizard') {
    // Wizard hat
    rect(9, 2, 14, 4, colors.primary);
    rect(8, 1, 16, 2, colors.primary);
    pixel(7, 0, colors.primary);
    pixel(24, 0, colors.primary);
  } else if (playerClass.name === 'Fighter' || playerClass.name === 'Paladin') {
    // Helmet
    rect(10, 3, 12, 6, colors.secondary);
    rect(11, 2, 10, 2, colors.secondary);
  } else {
    // Hair
    rect(9, 3, 14, 5, colors.hair);
    rect(8, 4, 16, 2, colors.hair);
  }

  // Draw facial expression based on emotion
  drawFaceExpression(ctx, pixelSize, emotion, isDefeated);

  // Body/Torso
  rect(11, 14, 10, 12, colors.primary);
  
  // Arms
  rect(8, 15, 3, 8, colors.skin);
  rect(21, 15, 3, 8, colors.skin);
  
  // Shoulder pads/armor based on AC
  if (playerClass.armorClass >= 16) {
    rect(9, 14, 2, 4, colors.secondary);
    rect(21, 14, 2, 4, colors.secondary);
  }

  // Legs
  rect(12, 26, 4, 6, colors.primary);
  rect(16, 26, 4, 6, colors.primary);

  // Class-specific features
  if (playerClass.name === 'Wizard') {
    // Staff
    rect(22, 10, 1, 18, '#8b5cf6');
    pixel(22, 9, colors.accent);
  } else if (playerClass.name === 'Fighter' || playerClass.name === 'Paladin') {
    // Sword
    rect(23, 12, 1, 12, '#cbd5e1');
    rect(24, 12, 2, 2, '#fbbf24');
  } else if (playerClass.name === 'Rogue') {
    // Dagger
    rect(22, 14, 1, 6, '#cbd5e1');
    pixel(22, 13, '#fbbf24');
  } else if (playerClass.name === 'Ranger') {
    // Bow
    rect(22, 15, 2, 1, '#78350f');
    rect(24, 14, 1, 3, '#78350f');
  } else if (playerClass.name === 'Cleric') {
    // Holy symbol
    rect(13, 16, 6, 6, colors.accent);
    pixel(15, 18, '#ffffff');
    pixel(17, 18, '#ffffff');
  } else if (playerClass.name === 'Barbarian') {
    // Axe
    rect(22, 12, 2, 10, '#1c1917');
    rect(24, 12, 2, 2, colors.accent);
  }

  // HP indicator - red overlay when damaged
  if (hpPercent < 1 && !isDefeated) {
    const damageOverlay = Math.min(0.3, (1 - hpPercent) * 0.5);
    ctx.fillStyle = `rgba(220, 38, 38, ${damageOverlay})`;
    ctx.fillRect(0, 0, size, size);
  }

  // Stats-based visual indicators
  // High AC = more armor detail
  if (playerClass.armorClass >= 17) {
    rect(11, 18, 10, 2, colors.secondary);
  }

  // High attack bonus = weapon glow
  if (playerClass.attackBonus >= 5) {
    ctx.fillStyle = `rgba(251, 191, 36, 0.3)`;
    ctx.fillRect(20 * pixelSize, 10 * pixelSize, 6 * pixelSize, 8 * pixelSize);
  }
}

