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

// Helper functions for drawing facial features
type PixelDrawer = (x: number, y: number, color: string) => void;

function drawXEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // 3x3 X pattern
  pixel(eyeX, eyeY, '#000000'); // Top-left
  pixel(eyeX + 2, eyeY, '#000000'); // Top-right
  pixel(eyeX + 1, eyeY + 1, '#000000'); // Center
  pixel(eyeX, eyeY + 2, '#000000'); // Bottom-left
  pixel(eyeX + 2, eyeY + 2, '#000000'); // Bottom-right
}

function drawSimpleEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  pixel(eyeX, eyeY, '#000000');
}

function drawSquintedEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
}

function drawWideEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
}

function drawVeryWideEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX - 1, eyeY + 1, '#000000');
  pixel(eyeX, eyeY + 1, '#000000');
  pixel(eyeX + 1, eyeY + 1, '#000000');
  pixel(eyeX + 2, eyeY + 1, '#000000');
}

function drawSurprisedEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // Black border with white center
  pixel(eyeX - 2, eyeY, '#000000'); // Top border
  pixel(eyeX - 1, eyeY, '#ffffff');
  pixel(eyeX, eyeY, '#ffffff');
  pixel(eyeX + 1, eyeY, '#ffffff');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX - 2, eyeY + 1, '#000000'); // Side border
  pixel(eyeX - 1, eyeY + 1, '#ffffff');
  pixel(eyeX, eyeY + 1, '#000000'); // Pupil
  pixel(eyeX + 1, eyeY + 1, '#ffffff');
  pixel(eyeX + 2, eyeY + 1, '#000000');
  pixel(eyeX - 2, eyeY + 2, '#000000'); // Bottom border
  pixel(eyeX - 1, eyeY + 2, '#ffffff');
  pixel(eyeX, eyeY + 2, '#ffffff');
  pixel(eyeX + 1, eyeY + 2, '#ffffff');
  pixel(eyeX + 2, eyeY + 2, '#000000');
}

function drawAngryEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY + 1, '#000000');
}

function drawSadEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  pixel(eyeX, eyeY + 1, '#000000');
}

function drawSmile(pixel: PixelDrawer, mouthX: number, mouthY: number, width: number = 4) {
  pixel(mouthX, mouthY, '#000000');
  for (let i = 1; i < width; i++) {
    pixel(mouthX + i, mouthY + 1, '#000000');
  }
  pixel(mouthX + width - 1, mouthY, '#000000');
}

function drawBigSmile(pixel: PixelDrawer, mouthX: number, mouthY: number, width: number = 6) {
  pixel(mouthX - 2, mouthY, '#000000');
  for (let i = -1; i < width - 1; i++) {
    pixel(mouthX + i, mouthY + 1, '#000000');
  }
  pixel(mouthX + width - 1, mouthY, '#000000');
}

function drawFrown(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  pixel(mouthX, mouthY, '#000000');
  pixel(mouthX + 1, mouthY - 1, '#000000');
  pixel(mouthX + 2, mouthY - 1, '#000000');
  pixel(mouthX + 3, mouthY, '#000000');
}

function drawNeutralMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  pixel(mouthX + 1, mouthY, '#000000');
  pixel(mouthX + 2, mouthY, '#000000');
}

function drawOpenMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  pixel(mouthX + 1, mouthY - 1, '#000000');
  pixel(mouthX, mouthY, '#000000');
  pixel(mouthX + 2, mouthY, '#000000');
  pixel(mouthX + 1, mouthY + 1, '#000000');
}

function drawLaughMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  pixel(mouthX - 1, mouthY - 1, '#000000');
  pixel(mouthX, mouthY - 1, '#ffffff'); // Teeth
  pixel(mouthX + 1, mouthY - 1, '#ffffff');
  pixel(mouthX + 2, mouthY - 1, '#ffffff');
  pixel(mouthX + 3, mouthY - 1, '#000000');
  pixel(mouthX - 1, mouthY, '#000000');
  pixel(mouthX, mouthY, '#ffffff');
  pixel(mouthX + 1, mouthY, '#ffffff');
  pixel(mouthX + 2, mouthY, '#ffffff');
  pixel(mouthX + 3, mouthY, '#000000');
  pixel(mouthX, mouthY + 1, '#000000');
  pixel(mouthX + 1, mouthY + 1, '#000000');
  pixel(mouthX + 2, mouthY + 1, '#000000');
}

function drawAngryMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  pixel(mouthX, mouthY, '#000000');
  pixel(mouthX + 1, mouthY, '#ffffff');
  pixel(mouthX + 2, mouthY, '#ffffff');
  pixel(mouthX + 3, mouthY, '#000000');
}

function drawDeadMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  pixel(mouthX, mouthY, '#000000');
  pixel(mouthX + 1, mouthY, '#000000');
  pixel(mouthX + 2, mouthY, '#000000');
  pixel(mouthX + 3, mouthY, '#000000');
  pixel(mouthX + 1, mouthY + 1, '#dc2626'); // Red tongue
  pixel(mouthX + 2, mouthY + 1, '#dc2626');
  pixel(mouthX + 1, mouthY + 2, '#dc2626'); // Red tongue tip
}

function drawExcitedMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  pixel(mouthX, mouthY - 1, '#000000');
  pixel(mouthX - 1, mouthY, '#000000');
  pixel(mouthX + 3, mouthY, '#000000');
  pixel(mouthX, mouthY + 1, '#000000');
  pixel(mouthX + 1, mouthY + 1, '#000000');
  pixel(mouthX + 2, mouthY + 1, '#000000');
  pixel(mouthX + 3, mouthY + 1, '#000000');
}

// Draw facial expression based on emotion
export function drawFaceExpression(
  ctx: CanvasRenderingContext2D,
  pixelSize: number,
  emotion: CharacterEmotion,
  isDefeated: boolean
) {
  const pixel: PixelDrawer = (x: number, y: number, color: string) => {
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
    drawXEye(pixel, leftEyeX, eyeY);
    drawXEye(pixel, rightEyeX - 2, eyeY);
    drawDeadMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'laughing') {
    drawSquintedEye(pixel, leftEyeX, eyeY);
    drawSquintedEye(pixel, rightEyeX - 1, eyeY);
    drawLaughMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'victorious') {
    drawWideEye(pixel, leftEyeX, eyeY);
    drawWideEye(pixel, rightEyeX - 1, eyeY);
    drawBigSmile(pixel, mouthX, mouthY, 6);
  } else if (emotion === 'happy') {
    drawSimpleEye(pixel, leftEyeX, eyeY);
    drawSimpleEye(pixel, rightEyeX, eyeY);
    drawSmile(pixel, mouthX, mouthY);
  } else if (emotion === 'hurt' || emotion === 'sad') {
    drawSadEye(pixel, leftEyeX, eyeY);
    drawSadEye(pixel, rightEyeX, eyeY);
    drawFrown(pixel, mouthX, mouthY);
  } else if (emotion === 'rage' || emotion === 'frustrated') {
    drawAngryEye(pixel, leftEyeX, eyeY);
    drawAngryEye(pixel, rightEyeX - 1, eyeY);
    drawAngryMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'worried') {
    drawWideEye(pixel, leftEyeX, eyeY);
    drawWideEye(pixel, rightEyeX - 1, eyeY);
    drawNeutralMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'determined') {
    drawSimpleEye(pixel, leftEyeX, eyeY);
    drawSimpleEye(pixel, rightEyeX, eyeY);
    drawNeutralMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'excited') {
    drawVeryWideEye(pixel, leftEyeX, eyeY);
    drawVeryWideEye(pixel, rightEyeX - 2, eyeY);
    drawExcitedMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'triumphant') {
    drawWideEye(pixel, leftEyeX, eyeY);
    drawWideEye(pixel, rightEyeX - 2, eyeY);
    drawBigSmile(pixel, mouthX, mouthY, 7);
  } else if (emotion === 'confident') {
    drawSimpleEye(pixel, leftEyeX, eyeY);
    drawSimpleEye(pixel, rightEyeX, eyeY);
    drawSmile(pixel, mouthX, mouthY);
  } else if (emotion === 'surprised') {
    drawSurprisedEye(pixel, leftEyeX, eyeY);
    drawSurprisedEye(pixel, rightEyeX - 2, eyeY);
    drawOpenMouth(pixel, mouthX, mouthY);
  } else {
    // Default: neutral eyes
    drawSimpleEye(pixel, leftEyeX, eyeY);
    drawSimpleEye(pixel, rightEyeX, eyeY);
    drawNeutralMouth(pixel, mouthX, mouthY);
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

  // Draw damage indicators (bruising/blood) based on HP loss
  if (hpPercent < 1 && !isDefeated) {
    const damageLevel = 1 - hpPercent; // 0 = full HP, 1 = critical
    
    // Draw bruises and cuts on face (only if not wearing helmet)
    if (playerClass.name !== 'Fighter' && playerClass.name !== 'Paladin') {
      const faceDamage = Math.min(damageLevel * 1.5, 1); // Face shows damage more prominently
      
      if (faceDamage > 0.2) {
        // Bruise on left cheek
        pixel(11, 7, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.8, 0.7)})`); // Brown bruise
        pixel(11, 8, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.6, 0.5)})`);
      }
      if (faceDamage > 0.3) {
        // Bruise on right cheek
        pixel(20, 7, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.8, 0.7)})`);
        pixel(20, 8, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.6, 0.5)})`);
      }
      if (faceDamage > 0.5) {
        // Cut on forehead
        pixel(15, 5, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.9, 0.8)})`); // Dark red cut
        pixel(16, 5, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.9, 0.8)})`);
      }
      if (faceDamage > 0.7) {
        // More cuts and bruises
        pixel(12, 6, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.7, 0.6)})`);
        pixel(19, 6, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.7, 0.6)})`);
        pixel(14, 9, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.6, 0.5)})`);
        pixel(17, 9, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.6, 0.5)})`);
      }
    }
    
    // Draw bruises and cuts on exposed arms
    if (damageLevel > 0.2) {
      // Left arm bruises
      const armDamage = Math.min(damageLevel * 1.2, 1);
      pixel(8, 16, `rgba(139, 69, 19, ${Math.min(armDamage * 0.7, 0.6)})`);
      pixel(8, 17, `rgba(139, 69, 19, ${Math.min(armDamage * 0.5, 0.4)})`);
      if (damageLevel > 0.4) {
        pixel(9, 18, `rgba(139, 0, 0, ${Math.min(armDamage * 0.8, 0.7)})`); // Cut
        pixel(9, 19, `rgba(139, 0, 0, ${Math.min(armDamage * 0.6, 0.5)})`);
      }
      
      // Right arm bruises
      pixel(22, 16, `rgba(139, 69, 19, ${Math.min(armDamage * 0.7, 0.6)})`);
      pixel(22, 17, `rgba(139, 69, 19, ${Math.min(armDamage * 0.5, 0.4)})`);
      if (damageLevel > 0.4) {
        pixel(21, 18, `rgba(139, 0, 0, ${Math.min(armDamage * 0.8, 0.7)})`); // Cut
        pixel(21, 19, `rgba(139, 0, 0, ${Math.min(armDamage * 0.6, 0.5)})`);
      }
    }
    
    // Draw blood on torso/body (scales with damage)
    if (damageLevel > 0.3) {
      const bodyDamage = Math.min(damageLevel * 1.1, 1);
      // Blood spots on torso
      pixel(12, 16, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.6, 0.5)})`);
      pixel(19, 16, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.6, 0.5)})`);
      if (damageLevel > 0.5) {
        pixel(13, 17, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.7, 0.6)})`);
        pixel(18, 17, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.7, 0.6)})`);
        pixel(15, 18, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.8, 0.7)})`); // Center wound
      }
      if (damageLevel > 0.7) {
        // More severe wounds
        pixel(14, 19, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.9, 0.8)})`);
        pixel(16, 19, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.9, 0.8)})`);
        pixel(12, 20, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.7, 0.6)})`);
        pixel(19, 20, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.7, 0.6)})`);
      }
    }
    
    // Draw blood on legs if very damaged
    if (damageLevel > 0.6) {
      const legDamage = Math.min(damageLevel * 1.0, 1);
      pixel(13, 27, `rgba(139, 0, 0, ${Math.min(legDamage * 0.6, 0.5)})`);
      pixel(18, 27, `rgba(139, 0, 0, ${Math.min(legDamage * 0.6, 0.5)})`);
      if (damageLevel > 0.8) {
        pixel(13, 28, `rgba(139, 0, 0, ${Math.min(legDamage * 0.7, 0.6)})`);
        pixel(18, 28, `rgba(139, 0, 0, ${Math.min(legDamage * 0.7, 0.6)})`);
      }
    }
    
    // Subtle red overlay for overall damage (less intense than before, since we have detailed damage)
    const damageOverlay = Math.min(0.15, (1 - hpPercent) * 0.25);
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

