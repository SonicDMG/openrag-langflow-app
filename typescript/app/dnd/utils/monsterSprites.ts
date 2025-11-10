// Monster sprite definitions - each monster gets a detailed, recognizable design
// Coordinates are relative to the sprite's drawing area (not the full canvas)

import { DnDClass, CharacterEmotion } from '../types';

type PixelDrawer = (x: number, y: number, color: string) => void;
type RectDrawer = (x: number, y: number, w: number, h: number, color: string) => void;

interface MonsterSpriteContext {
  pixel: PixelDrawer;
  rect: RectDrawer;
  spriteW: number;
  spriteH: number;
  centerX: number;
  centerY: number;
  colors: ReturnType<typeof import('./pixelArt').getMonsterColors>;
  emotion: CharacterEmotion;
  isDefeated: boolean;
}

// Draw a Dragon - large, winged, with horns and tail
export function drawDragon(ctx: MonsterSpriteContext) {
  const { pixel, rect, spriteW, spriteH, colors } = ctx;
  
  // Large dragon body (uses full 32x32)
  // Head - large reptilian head
  rect(8, 2, 16, 12, colors.skin);
  // Snout
  rect(6, 10, 4, 4, colors.skin);
  rect(22, 10, 4, 4, colors.skin);
  // Horns
  pixel(10, 1, colors.accent);
  pixel(11, 0, colors.accent);
  pixel(21, 0, colors.accent);
  pixel(22, 1, colors.accent);
  // Eyes
  pixel(11, 5, '#000000');
  pixel(20, 5, '#000000');
  
  // Body - large and muscular
  rect(10, 14, 12, 10, colors.primary);
  // Scales pattern
  for (let y = 15; y < 23; y += 2) {
    for (let x = 11; x < 21; x += 2) {
      pixel(x, y, colors.secondary);
    }
  }
  
  // Wings - large bat-like wings
  rect(2, 16, 6, 10, colors.secondary);
  rect(24, 16, 6, 10, colors.secondary);
  // Wing details
  pixel(1, 18, colors.accent);
  pixel(1, 22, colors.accent);
  pixel(30, 18, colors.accent);
  pixel(30, 22, colors.accent);
  
  // Tail - long and curved
  rect(20, 24, 4, 8, colors.primary);
  pixel(24, 28, colors.primary);
  pixel(25, 29, colors.primary);
  pixel(24, 30, colors.primary);
  
  // Legs - powerful hind legs
  rect(11, 24, 4, 8, colors.primary);
  rect(17, 24, 4, 8, colors.primary);
  // Claws
  pixel(11, 31, colors.accent);
  pixel(14, 31, colors.accent);
  pixel(17, 31, colors.accent);
  pixel(20, 31, colors.accent);
}

// Draw a Goblin - small, green, pointy-eared
export function drawGoblin(ctx: MonsterSpriteContext) {
  const { pixel, rect, spriteW, spriteH, colors } = ctx;
  
  // Small sprite (20x20), centered
  const baseX = 0;
  const baseY = 0;
  
  // Head - small and green
  rect(baseX + 4, baseY + 2, 6, 6, colors.skin);
  // Pointed ears
  pixel(baseX + 2, baseY + 3, colors.primary);
  pixel(baseX + 3, baseY + 2, colors.primary);
  pixel(baseX + 11, baseY + 2, colors.primary);
  pixel(baseX + 12, baseY + 3, colors.primary);
  // Eyes - beady and yellow
  pixel(baseX + 5, baseY + 4, '#fbbf24');
  pixel(baseX + 8, baseY + 4, '#fbbf24');
  // Nose
  pixel(baseX + 6, baseY + 6, colors.primary);
  
  // Body - small torso
  rect(baseX + 5, baseY + 8, 4, 6, colors.primary);
  
  // Arms - thin
  rect(baseX + 2, baseY + 9, 2, 4, colors.skin);
  rect(baseX + 12, baseY + 9, 2, 4, colors.skin);
  
  // Legs - short
  rect(baseX + 5, baseY + 14, 2, 4, colors.primary);
  rect(baseX + 9, baseY + 14, 2, 4, colors.primary);
}

// Draw an Orc - large, muscular, gray-green with tusks
export function drawOrc(ctx: MonsterSpriteContext) {
  const { pixel, rect, spriteW, spriteH, colors } = ctx;
  
  // Medium sprite (24x24)
  const baseX = 0;
  const baseY = 0;
  
  // Head - large and brutish
  rect(baseX + 6, baseY + 2, 12, 10, colors.skin);
  // Tusks - prominent
  pixel(baseX + 7, baseY + 8, '#ffffff');
  pixel(baseX + 16, baseY + 8, '#ffffff');
  pixel(baseX + 7, baseY + 9, '#ffffff');
  pixel(baseX + 16, baseY + 9, '#ffffff');
  // Eyes - red and angry
  pixel(baseX + 9, baseY + 5, '#dc2626');
  pixel(baseX + 14, baseY + 5, '#dc2626');
  // Nose - flat and wide
  rect(baseX + 10, baseY + 7, 4, 2, colors.primary);
  
  // Body - muscular torso
  rect(baseX + 7, baseY + 12, 10, 8, colors.primary);
  // Muscles
  pixel(baseX + 9, baseY + 13, colors.secondary);
  pixel(baseX + 15, baseY + 13, colors.secondary);
  
  // Arms - thick and powerful
  rect(baseX + 3, baseY + 13, 3, 8, colors.skin);
  rect(baseX + 18, baseY + 13, 3, 8, colors.skin);
  
  // Legs - thick
  rect(baseX + 8, baseY + 20, 4, 4, colors.primary);
  rect(baseX + 12, baseY + 20, 4, 4, colors.primary);
}

// Draw a Beholder - large floating eye with tentacles
export function drawBeholder(ctx: MonsterSpriteContext) {
  const { pixel, rect, spriteW, spriteH, colors } = ctx;
  
  // Huge sprite (32x32) - uses full canvas
  // Main body - large spherical eye
  rect(4, 4, 24, 24, colors.primary);
  // Central eye - white with black pupil
  rect(12, 12, 8, 8, '#ffffff');
  rect(14, 14, 4, 4, '#000000');
  // Eye shine
  pixel(15, 15, '#ffffff');
  
  // Tentacles around the body
  // Top tentacles
  pixel(10, 2, colors.secondary);
  pixel(14, 1, colors.secondary);
  pixel(18, 1, colors.secondary);
  pixel(22, 2, colors.secondary);
  // Side tentacles
  pixel(2, 10, colors.secondary);
  pixel(1, 14, colors.secondary);
  pixel(1, 18, colors.secondary);
  pixel(2, 22, colors.secondary);
  pixel(30, 10, colors.secondary);
  pixel(31, 14, colors.secondary);
  pixel(31, 18, colors.secondary);
  pixel(30, 22, colors.secondary);
  // Bottom tentacles
  pixel(10, 30, colors.secondary);
  pixel(14, 31, colors.secondary);
  pixel(18, 31, colors.secondary);
  pixel(22, 30, colors.secondary);
  
  // Mouth - toothy maw below eye
  rect(14, 24, 4, 4, '#000000');
  pixel(13, 25, '#ffffff');
  pixel(17, 25, '#ffffff');
}

// Draw a Troll - large, green, regenerating
export function drawTroll(ctx: MonsterSpriteContext) {
  const { pixel, rect, spriteW, spriteH, colors } = ctx;
  
  // Large sprite (28x28)
  const baseX = 0;
  const baseY = 0;
  
  // Head - large and ugly
  rect(baseX + 8, baseY + 2, 12, 10, colors.skin);
  // Warts
  pixel(baseX + 10, baseY + 4, colors.secondary);
  pixel(baseX + 18, baseY + 4, colors.secondary);
  pixel(baseX + 14, baseY + 6, colors.secondary);
  // Eyes - small and beady
  pixel(baseX + 11, baseY + 5, '#000000');
  pixel(baseX + 17, baseY + 5, '#000000');
  // Nose - large and bulbous
  rect(baseX + 12, baseY + 7, 4, 3, colors.primary);
  // Mouth - wide
  rect(baseX + 11, baseY + 10, 6, 2, '#000000');
  
  // Body - large and muscular
  rect(baseX + 9, baseY + 12, 10, 10, colors.primary);
  
  // Arms - long and powerful
  rect(baseX + 4, baseY + 13, 3, 10, colors.skin);
  rect(baseX + 21, baseY + 13, 3, 10, colors.skin);
  
  // Legs - thick
  rect(baseX + 10, baseY + 22, 4, 6, colors.primary);
  rect(baseX + 14, baseY + 22, 4, 6, colors.primary);
}

// Draw a Skeleton - bone structure
export function drawSkeleton(ctx: MonsterSpriteContext) {
  const { pixel, rect, spriteW, spriteH, colors } = ctx;
  
  // Small sprite (20x20)
  const baseX = 0;
  const baseY = 0;
  
  // Skull
  rect(baseX + 4, baseY + 2, 6, 6, colors.skin);
  // Eye sockets
  pixel(baseX + 5, baseY + 4, '#000000');
  pixel(baseX + 8, baseY + 4, '#000000');
  // Nose hole
  pixel(baseX + 6, baseY + 6, '#000000');
  // Jaw
  rect(baseX + 5, baseY + 7, 4, 1, colors.skin);
  
  // Spine/ribs
  rect(baseX + 5, baseY + 8, 4, 8, colors.skin);
  // Rib details
  rect(baseX + 3, baseY + 9, 2, 1, colors.secondary);
  rect(baseX + 9, baseY + 9, 2, 1, colors.secondary);
  rect(baseX + 3, baseY + 12, 2, 1, colors.secondary);
  rect(baseX + 9, baseY + 12, 2, 1, colors.secondary);
  
  // Arms
  rect(baseX + 2, baseY + 9, 2, 6, colors.skin);
  rect(baseX + 12, baseY + 9, 2, 6, colors.skin);
  
  // Legs
  rect(baseX + 5, baseY + 16, 2, 4, colors.skin);
  rect(baseX + 9, baseY + 16, 2, 4, colors.skin);
}

// Draw a Dragon (White Dragon variant)
export function drawWhiteDragon(ctx: MonsterSpriteContext) {
  // Similar to regular dragon but with ice/white colors
  drawDragon(ctx);
  // Add ice effects
  const { pixel } = ctx;
  // Ice crystals
  pixel(12, 3, '#e0e7ff');
  pixel(20, 3, '#e0e7ff');
  pixel(14, 15, '#c7d2fe');
  pixel(18, 15, '#c7d2fe');
}

// Draw a Giant - very large humanoid
export function drawGiant(ctx: MonsterSpriteContext) {
  const { pixel, rect, spriteW, spriteH, colors } = ctx;
  
  // Huge sprite (32x32)
  // Head - very large
  rect(7, 1, 18, 14, colors.skin);
  // Eyes
  pixel(11, 6, '#000000');
  pixel(20, 6, '#000000');
  // Nose
  rect(13, 9, 6, 3, colors.primary);
  // Mouth
  rect(12, 12, 8, 2, '#000000');
  // Beard
  rect(11, 13, 10, 2, colors.hair);
  
  // Body - massive
  rect(8, 15, 16, 12, colors.primary);
  // Chest muscles
  rect(11, 16, 4, 4, colors.secondary);
  rect(17, 16, 4, 4, colors.secondary);
  
  // Arms - very thick
  rect(4, 16, 3, 14, colors.skin);
  rect(25, 16, 3, 14, colors.skin);
  
  // Legs - massive
  rect(10, 27, 6, 5, colors.primary);
  rect(16, 27, 6, 5, colors.primary);
}

// Draw a Blob of Annihilation - dark, formless entity
export function drawBlobOfAnnihilation(ctx: MonsterSpriteContext) {
  const { pixel, rect, spriteW, spriteH, colors } = ctx;
  
  // Huge sprite (32x32) - amorphous shape
  // Main blob - irregular shape
  rect(6, 6, 20, 20, colors.primary);
  // Irregular edges
  pixel(5, 8, colors.primary);
  pixel(5, 12, colors.primary);
  pixel(5, 16, colors.primary);
  pixel(5, 20, colors.primary);
  pixel(27, 8, colors.primary);
  pixel(27, 12, colors.primary);
  pixel(27, 16, colors.primary);
  pixel(27, 20, colors.primary);
  pixel(8, 5, colors.primary);
  pixel(12, 5, colors.primary);
  pixel(16, 5, colors.primary);
  pixel(20, 5, colors.primary);
  pixel(24, 5, colors.primary);
  pixel(8, 27, colors.primary);
  pixel(12, 27, colors.primary);
  pixel(16, 27, colors.primary);
  pixel(20, 27, colors.primary);
  pixel(24, 27, colors.primary);
  
  // Void eyes - dark spots
  pixel(11, 11, colors.secondary);
  pixel(20, 11, colors.secondary);
  pixel(15, 15, colors.secondary);
  pixel(11, 20, colors.secondary);
  pixel(20, 20, colors.secondary);
  
  // Swirling darkness
  pixel(13, 13, colors.accent);
  pixel(18, 13, colors.accent);
  pixel(13, 18, colors.accent);
  pixel(18, 18, colors.accent);
}

