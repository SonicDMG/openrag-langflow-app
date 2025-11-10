import { DnDClass, CharacterEmotion } from '../types';
import { MONSTER_ICONS } from '../constants';

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

// Get monster-specific color palette
export function getMonsterColors(monsterName: string): {
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  hair: string;
} {
  const colorMap: Record<string, { primary: string; secondary: string; accent: string; skin: string; hair: string }> = {
    Goblin: { primary: '#166534', secondary: '#15803d', accent: '#22c55e', skin: '#84cc16', hair: '#14532d' },
    Orc: { primary: '#1f2937', secondary: '#374151', accent: '#6b7280', skin: '#4b5563', hair: '#111827' },
    Dragon: { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    Troll: { primary: '#166534', secondary: '#16a34a', accent: '#4ade80', skin: '#86efac', hair: '#14532d' },
    Ogre: { primary: '#374151', secondary: '#4b5563', accent: '#6b7280', skin: '#9ca3af', hair: '#1f2937' },
    Kobold: { primary: '#854d0e', secondary: '#a16207', accent: '#fbbf24', skin: '#fde047', hair: '#713f12' },
    Skeleton: { primary: '#6b7280', secondary: '#9ca3af', accent: '#d1d5db', skin: '#f3f4f6', hair: '#4b5563' },
    Zombie: { primary: '#166534', secondary: '#16a34a', accent: '#4ade80', skin: '#a7f3d0', hair: '#14532d' },
    Vampire: { primary: '#7f1d1d', secondary: '#991b1b', accent: '#dc2626', skin: '#fca5a5', hair: '#1c1917' },
    Werewolf: { primary: '#1f2937', secondary: '#374151', accent: '#6b7280', skin: '#9ca3af', hair: '#111827' },
    Demon: { primary: '#581c87', secondary: '#6b21a8', accent: '#a855f7', skin: '#c084fc', hair: '#3b0764' },
    Devil: { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    Beholder: { primary: '#6b21a8', secondary: '#7c3aed', accent: '#a855f7', skin: '#c084fc', hair: '#581c87' },
    'Mind Flayer': { primary: '#312e81', secondary: '#3730a3', accent: '#6366f1', skin: '#818cf8', hair: '#1e1b4b' },
    Lich: { primary: '#374151', secondary: '#4b5563', accent: '#9ca3af', skin: '#d1d5db', hair: '#1f2937' },
    Giant: { primary: '#9a3412', secondary: '#c2410c', accent: '#ea580c', skin: '#fb923c', hair: '#7c2d12' },
    Elemental: { primary: '#0c4a6e', secondary: '#075985', accent: '#0284c7', skin: '#38bdf8', hair: '#082f49' },
    Undead: { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', skin: '#d1d5db', hair: '#374151' },
    Beast: { primary: '#78350f', secondary: '#92400e', accent: '#d97706', skin: '#fbbf24', hair: '#451a03' },
    Aberration: { primary: '#581c87', secondary: '#6b21a8', accent: '#9333ea', skin: '#c084fc', hair: '#3b0764' },
    'Allosaurus': { primary: '#166534', secondary: '#16a34a', accent: '#4ade80', skin: '#86efac', hair: '#14532d' },
    'Anklyosaurus': { primary: '#78350f', secondary: '#92400e', accent: '#d97706', skin: '#fbbf24', hair: '#451a03' },
    'Bugbear Stalker': { primary: '#1f2937', secondary: '#374151', accent: '#6b7280', skin: '#4b5563', hair: '#111827' },
    'Goblin Boss': { primary: '#14532d', secondary: '#166534', accent: '#22c55e', skin: '#65a30d', hair: '#052e16' },
    'Goblin Minion': { primary: '#166534', secondary: '#15803d', accent: '#22c55e', skin: '#84cc16', hair: '#14532d' },
    'Hobgoblin Captain': { primary: '#9a3412', secondary: '#c2410c', accent: '#ea580c', skin: '#fb923c', hair: '#7c2d12' },
    'Pirate': { primary: '#78350f', secondary: '#92400e', accent: '#d97706', skin: '#fbbf24', hair: '#1c1917' },
    'Pirate Captain': { primary: '#92400e', secondary: '#b45309', accent: '#f59e0b', skin: '#fbbf24', hair: '#78350f' },
    'Pteradon': { primary: '#6b7280', secondary: '#9ca3af', accent: '#d1d5db', skin: '#f3f4f6', hair: '#4b5563' },
    'Sphinx of Wonder': { primary: '#854d0e', secondary: '#a16207', accent: '#fbbf24', skin: '#fde047', hair: '#713f12' },
    'Swarm of Crawling Claws': { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', skin: '#d1d5db', hair: '#374151' },
    'Tough Boss': { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    'Troll Limb': { primary: '#166534', secondary: '#16a34a', accent: '#4ade80', skin: '#86efac', hair: '#14532d' },
    'Vampire Familiar': { primary: '#1f2937', secondary: '#374151', accent: '#6b7280', skin: '#4b5563', hair: '#111827' },
    'Hezrou': { primary: '#581c87', secondary: '#6b21a8', accent: '#a855f7', skin: '#c084fc', hair: '#3b0764' },
    'Manes': { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', skin: '#d1d5db', hair: '#374151' },
    'Marilith': { primary: '#6b21a8', secondary: '#7c3aed', accent: '#a855f7', skin: '#c084fc', hair: '#581c87' },
    'Nalfeshnee': { primary: '#581c87', secondary: '#6b21a8', accent: '#a855f7', skin: '#c084fc', hair: '#3b0764' },
    'Quasit': { primary: '#312e81', secondary: '#3730a3', accent: '#6366f1', skin: '#818cf8', hair: '#1e1b4b' },
    'Shadow Demon': { primary: '#111827', secondary: '#1f2937', accent: '#374151', skin: '#4b5563', hair: '#030712' },
    'Vrock': { primary: '#6b21a8', secondary: '#7c3aed', accent: '#a855f7', skin: '#c084fc', hair: '#581c87' },
    'Yochlol': { primary: '#581c87', secondary: '#6b21a8', accent: '#9333ea', skin: '#c084fc', hair: '#3b0764' },
    'Barbed Devil': { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    'Bearded Devil': { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    'Bone Devil': { primary: '#6b7280', secondary: '#9ca3af', accent: '#d1d5db', skin: '#f3f4f6', hair: '#4b5563' },
    'Chain Devil': { primary: '#374151', secondary: '#4b5563', accent: '#6b7280', skin: '#9ca3af', hair: '#1f2937' },
    'Erinyes': { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    'Dao': { primary: '#9a3412', secondary: '#c2410c', accent: '#ea580c', skin: '#fb923c', hair: '#7c2d12' },
    'Horned Devil': { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    'Ice Devil': { primary: '#0c4a6e', secondary: '#075985', accent: '#0284c7', skin: '#38bdf8', hair: '#082f49' },
    'Efreeti': { primary: '#9a3412', secondary: '#c2410c', accent: '#ea580c', skin: '#fb923c', hair: '#7c2d12' },
    'Imp': { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    'Marid': { primary: '#0c4a6e', secondary: '#075985', accent: '#0284c7', skin: '#38bdf8', hair: '#082f49' },
    'Lemure': { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', skin: '#d1d5db', hair: '#374151' },
    'Swarm of Lemures': { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', skin: '#d1d5db', hair: '#374151' },
    'Pit Fiend': { primary: '#991b1b', secondary: '#dc2626', accent: '#ef4444', skin: '#f87171', hair: '#7f1d1d' },
    'White Dragon': { primary: '#e0e7ff', secondary: '#c7d2fe', accent: '#a5b4fc', skin: '#818cf8', hair: '#6366f1' },
    'Blob of Annihilation': { primary: '#030712', secondary: '#111827', accent: '#1f2937', skin: '#374151', hair: '#000000' },
  };

  return colorMap[monsterName] || {
    primary: '#1c1917',
    secondary: '#292524',
    accent: '#78716c',
    skin: '#9ca3af',
    hair: '#1c1917',
  };
}

// Helper functions for drawing facial features
type PixelDrawer = (x: number, y: number, color: string) => void;

function drawXEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // More dramatic X pattern for dead eyes - larger and clearer
  pixel(eyeX - 1, eyeY - 1, '#000000'); // Top-left
  pixel(eyeX + 3, eyeY - 1, '#000000'); // Top-right
  pixel(eyeX - 1, eyeY + 1, '#000000'); // Mid-left
  pixel(eyeX + 1, eyeY + 1, '#000000'); // Center
  pixel(eyeX + 3, eyeY + 1, '#000000'); // Mid-right
  pixel(eyeX - 1, eyeY + 3, '#000000'); // Bottom-left
  pixel(eyeX + 3, eyeY + 3, '#000000'); // Bottom-right
}

function drawSimpleEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // More dramatic detailed eye for 64x64 grid - larger with better shine
  // Eye outline
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX - 1, eyeY + 1, '#000000');
  pixel(eyeX + 2, eyeY + 1, '#000000');
  pixel(eyeX - 1, eyeY + 2, '#000000');
  pixel(eyeX, eyeY + 2, '#000000');
  pixel(eyeX + 1, eyeY + 2, '#000000');
  pixel(eyeX + 2, eyeY + 2, '#000000');
  // White of eye
  pixel(eyeX, eyeY + 1, '#ffffff');
  pixel(eyeX + 1, eyeY + 1, '#ffffff');
  // Pupil
  pixel(eyeX + 1, eyeY + 1, '#000000');
  // Eye shine
  pixel(eyeX + 1, eyeY, '#ffffff');
}

function drawSquintedEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // More dramatic squinted eye - curved line
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX + 3, eyeY, '#000000');
  pixel(eyeX - 1, eyeY + 1, '#000000');
  pixel(eyeX + 3, eyeY + 1, '#000000');
}

function drawWideEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // More dramatic wide eye - larger and more expressive
  // Top outline
  pixel(eyeX - 2, eyeY, '#000000');
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX + 3, eyeY, '#000000');
  // Sides
  pixel(eyeX - 2, eyeY + 1, '#000000');
  pixel(eyeX + 3, eyeY + 1, '#000000');
  pixel(eyeX - 2, eyeY + 2, '#000000');
  pixel(eyeX + 3, eyeY + 2, '#000000');
  // Bottom outline
  pixel(eyeX - 2, eyeY + 3, '#000000');
  pixel(eyeX - 1, eyeY + 3, '#000000');
  pixel(eyeX, eyeY + 3, '#000000');
  pixel(eyeX + 1, eyeY + 3, '#000000');
  pixel(eyeX + 2, eyeY + 3, '#000000');
  pixel(eyeX + 3, eyeY + 3, '#000000');
  // White of eye
  pixel(eyeX - 1, eyeY + 1, '#ffffff');
  pixel(eyeX, eyeY + 1, '#ffffff');
  pixel(eyeX + 1, eyeY + 1, '#ffffff');
  pixel(eyeX + 2, eyeY + 1, '#ffffff');
  pixel(eyeX - 1, eyeY + 2, '#ffffff');
  pixel(eyeX, eyeY + 2, '#ffffff');
  pixel(eyeX + 1, eyeY + 2, '#ffffff');
  pixel(eyeX + 2, eyeY + 2, '#ffffff');
  // Pupil
  pixel(eyeX, eyeY + 1, '#000000');
  pixel(eyeX + 1, eyeY + 1, '#000000');
  pixel(eyeX, eyeY + 2, '#000000');
  pixel(eyeX + 1, eyeY + 2, '#000000');
  // Eye shine
  pixel(eyeX + 1, eyeY, '#ffffff');
  pixel(eyeX + 2, eyeY, '#ffffff');
}

function drawVeryWideEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // Very dramatic wide eye - extremely wide and expressive
  // Top outline
  pixel(eyeX - 3, eyeY, '#000000');
  pixel(eyeX - 2, eyeY, '#000000');
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX + 3, eyeY, '#000000');
  pixel(eyeX + 4, eyeY, '#000000');
  // Sides
  pixel(eyeX - 3, eyeY + 1, '#000000');
  pixel(eyeX + 4, eyeY + 1, '#000000');
  pixel(eyeX - 3, eyeY + 2, '#000000');
  pixel(eyeX + 4, eyeY + 2, '#000000');
  // Bottom outline
  pixel(eyeX - 3, eyeY + 3, '#000000');
  pixel(eyeX - 2, eyeY + 3, '#000000');
  pixel(eyeX - 1, eyeY + 3, '#000000');
  pixel(eyeX, eyeY + 3, '#000000');
  pixel(eyeX + 1, eyeY + 3, '#000000');
  pixel(eyeX + 2, eyeY + 3, '#000000');
  pixel(eyeX + 3, eyeY + 3, '#000000');
  pixel(eyeX + 4, eyeY + 3, '#000000');
  // White of eye
  pixel(eyeX - 2, eyeY + 1, '#ffffff');
  pixel(eyeX - 1, eyeY + 1, '#ffffff');
  pixel(eyeX, eyeY + 1, '#ffffff');
  pixel(eyeX + 1, eyeY + 1, '#ffffff');
  pixel(eyeX + 2, eyeY + 1, '#ffffff');
  pixel(eyeX + 3, eyeY + 1, '#ffffff');
  pixel(eyeX - 2, eyeY + 2, '#ffffff');
  pixel(eyeX - 1, eyeY + 2, '#ffffff');
  pixel(eyeX, eyeY + 2, '#ffffff');
  pixel(eyeX + 1, eyeY + 2, '#ffffff');
  pixel(eyeX + 2, eyeY + 2, '#ffffff');
  pixel(eyeX + 3, eyeY + 2, '#ffffff');
  // Pupil
  pixel(eyeX, eyeY + 1, '#000000');
  pixel(eyeX + 1, eyeY + 1, '#000000');
  pixel(eyeX, eyeY + 2, '#000000');
  pixel(eyeX + 1, eyeY + 2, '#000000');
  // Eye shine
  pixel(eyeX + 1, eyeY, '#ffffff');
  pixel(eyeX + 2, eyeY, '#ffffff');
}

function drawSurprisedEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // More dramatic surprised eye - very round and wide
  // Top border (rounded)
  pixel(eyeX - 3, eyeY, '#000000');
  pixel(eyeX - 2, eyeY, '#000000');
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX + 3, eyeY, '#000000');
  pixel(eyeX + 4, eyeY, '#000000');
  // Sides (curved)
  pixel(eyeX - 3, eyeY + 1, '#000000');
  pixel(eyeX - 3, eyeY + 2, '#000000');
  pixel(eyeX - 3, eyeY + 3, '#000000');
  pixel(eyeX + 4, eyeY + 1, '#000000');
  pixel(eyeX + 4, eyeY + 2, '#000000');
  pixel(eyeX + 4, eyeY + 3, '#000000');
  // White center
  pixel(eyeX - 2, eyeY + 1, '#ffffff');
  pixel(eyeX - 1, eyeY + 1, '#ffffff');
  pixel(eyeX, eyeY + 1, '#ffffff');
  pixel(eyeX + 1, eyeY + 1, '#ffffff');
  pixel(eyeX + 2, eyeY + 1, '#ffffff');
  pixel(eyeX + 3, eyeY + 1, '#ffffff');
  pixel(eyeX - 2, eyeY + 2, '#ffffff');
  pixel(eyeX - 1, eyeY + 2, '#ffffff');
  pixel(eyeX, eyeY + 2, '#ffffff');
  pixel(eyeX + 1, eyeY + 2, '#ffffff');
  pixel(eyeX + 2, eyeY + 2, '#ffffff');
  pixel(eyeX + 3, eyeY + 2, '#ffffff');
  // Pupil (smaller, showing more white)
  pixel(eyeX, eyeY + 1, '#000000');
  pixel(eyeX + 1, eyeY + 1, '#000000');
  pixel(eyeX, eyeY + 2, '#000000');
  pixel(eyeX + 1, eyeY + 2, '#000000');
  // Bottom border (rounded)
  pixel(eyeX - 3, eyeY + 4, '#000000');
  pixel(eyeX - 2, eyeY + 4, '#000000');
  pixel(eyeX - 1, eyeY + 4, '#000000');
  pixel(eyeX, eyeY + 4, '#000000');
  pixel(eyeX + 1, eyeY + 4, '#000000');
  pixel(eyeX + 2, eyeY + 4, '#000000');
  pixel(eyeX + 3, eyeY + 4, '#000000');
  pixel(eyeX + 4, eyeY + 4, '#000000');
  // Eye shine
  pixel(eyeX + 1, eyeY, '#ffffff');
  pixel(eyeX + 2, eyeY, '#ffffff');
}

function drawAngryEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // More dramatic angry eye - slanted downward, more intense
  // Angry slanted eye shape
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX + 3, eyeY, '#000000');
  pixel(eyeX - 1, eyeY + 1, '#000000');
  pixel(eyeX + 3, eyeY + 1, '#000000');
  pixel(eyeX, eyeY + 2, '#000000');
  pixel(eyeX + 1, eyeY + 2, '#000000');
  pixel(eyeX + 2, eyeY + 2, '#000000');
  pixel(eyeX + 3, eyeY + 2, '#000000');
  // Pupil
  pixel(eyeX + 1, eyeY + 1, '#000000');
  pixel(eyeX + 2, eyeY + 1, '#000000');
}

function drawSadEye(pixel: PixelDrawer, eyeX: number, eyeY: number) {
  // More dramatic sad eye - downturned shape
  // Top outline (slight curve)
  pixel(eyeX - 1, eyeY, '#000000');
  pixel(eyeX, eyeY, '#000000');
  pixel(eyeX + 1, eyeY, '#000000');
  pixel(eyeX + 2, eyeY, '#000000');
  pixel(eyeX + 3, eyeY, '#000000');
  // Sides
  pixel(eyeX - 1, eyeY + 1, '#000000');
  pixel(eyeX + 3, eyeY + 1, '#000000');
  // White of eye
  pixel(eyeX, eyeY + 1, '#ffffff');
  pixel(eyeX + 1, eyeY + 1, '#ffffff');
  pixel(eyeX + 2, eyeY + 1, '#ffffff');
  // Pupil
  pixel(eyeX + 1, eyeY + 1, '#000000');
  // Bottom outline (downturned)
  pixel(eyeX - 1, eyeY + 2, '#000000');
  pixel(eyeX, eyeY + 2, '#000000');
  pixel(eyeX + 1, eyeY + 2, '#000000');
  pixel(eyeX + 2, eyeY + 2, '#000000');
  pixel(eyeX + 3, eyeY + 2, '#000000');
  pixel(eyeX + 4, eyeY + 2, '#000000');
}

function drawSmile(pixel: PixelDrawer, mouthX: number, mouthY: number, width: number = 4) {
  // More dramatic smile - wider and more curved
  const actualWidth = Math.max(width, 6);
  // Top curve
  pixel(mouthX - 1, mouthY, '#000000');
  pixel(mouthX, mouthY, '#000000');
  for (let i = 1; i < actualWidth - 1; i++) {
    pixel(mouthX + i, mouthY, '#000000');
  }
  pixel(mouthX + actualWidth - 1, mouthY, '#000000');
  pixel(mouthX + actualWidth, mouthY, '#000000');
  // Bottom curve
  for (let i = 0; i < actualWidth + 2; i++) {
    pixel(mouthX + i - 1, mouthY + 2, '#000000');
  }
}

function drawBigSmile(pixel: PixelDrawer, mouthX: number, mouthY: number, width: number = 6) {
  // More dramatic big smile - very wide and expressive
  const actualWidth = Math.max(width, 8);
  // Top curve (wider)
  for (let i = -2; i < actualWidth + 1; i++) {
    pixel(mouthX + i, mouthY, '#000000');
  }
  // Middle (teeth visible)
  for (let i = -1; i < actualWidth; i++) {
    pixel(mouthX + i, mouthY + 1, '#ffffff'); // Teeth
  }
  // Bottom curve
  for (let i = -2; i < actualWidth + 1; i++) {
    pixel(mouthX + i, mouthY + 2, '#000000');
  }
  // Teeth detail
  pixel(mouthX, mouthY + 1, '#000000');
  pixel(mouthX + actualWidth - 2, mouthY + 1, '#000000');
}

function drawFrown(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  // More dramatic frown - deeper and more expressive
  // Top curve (downturned)
  pixel(mouthX - 1, mouthY - 1, '#000000');
  pixel(mouthX, mouthY - 1, '#000000');
  pixel(mouthX + 1, mouthY - 1, '#000000');
  pixel(mouthX + 2, mouthY - 1, '#000000');
  pixel(mouthX + 3, mouthY - 1, '#000000');
  pixel(mouthX + 4, mouthY - 1, '#000000');
  // Bottom curve (deeper)
  pixel(mouthX - 1, mouthY + 1, '#000000');
  pixel(mouthX, mouthY + 1, '#000000');
  pixel(mouthX + 1, mouthY + 1, '#000000');
  pixel(mouthX + 2, mouthY + 1, '#000000');
  pixel(mouthX + 3, mouthY + 1, '#000000');
  pixel(mouthX + 4, mouthY + 1, '#000000');
  // Sides
  pixel(mouthX - 1, mouthY, '#000000');
  pixel(mouthX + 4, mouthY, '#000000');
}

function drawNeutralMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  // More dramatic neutral mouth - wider line
  pixel(mouthX, mouthY, '#000000');
  pixel(mouthX + 1, mouthY, '#000000');
  pixel(mouthX + 2, mouthY, '#000000');
  pixel(mouthX + 3, mouthY, '#000000');
  pixel(mouthX + 4, mouthY, '#000000');
}

function drawOpenMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  // More dramatic open mouth - larger and more oval
  // Top
  pixel(mouthX, mouthY - 1, '#000000');
  pixel(mouthX + 1, mouthY - 1, '#000000');
  pixel(mouthX + 2, mouthY - 1, '#000000');
  pixel(mouthX + 3, mouthY - 1, '#000000');
  pixel(mouthX + 4, mouthY - 1, '#000000');
  // Sides
  pixel(mouthX, mouthY, '#000000');
  pixel(mouthX + 4, mouthY, '#000000');
  pixel(mouthX, mouthY + 1, '#000000');
  pixel(mouthX + 4, mouthY + 1, '#000000');
  pixel(mouthX, mouthY + 2, '#000000');
  pixel(mouthX + 4, mouthY + 2, '#000000');
  // Bottom
  pixel(mouthX, mouthY + 3, '#000000');
  pixel(mouthX + 1, mouthY + 3, '#000000');
  pixel(mouthX + 2, mouthY + 3, '#000000');
  pixel(mouthX + 3, mouthY + 3, '#000000');
  pixel(mouthX + 4, mouthY + 3, '#000000');
  // Interior (dark)
  pixel(mouthX + 1, mouthY, '#000000');
  pixel(mouthX + 2, mouthY, '#000000');
  pixel(mouthX + 3, mouthY, '#000000');
  pixel(mouthX + 1, mouthY + 1, '#000000');
  pixel(mouthX + 2, mouthY + 1, '#000000');
  pixel(mouthX + 3, mouthY + 1, '#000000');
  pixel(mouthX + 1, mouthY + 2, '#000000');
  pixel(mouthX + 2, mouthY + 2, '#000000');
  pixel(mouthX + 3, mouthY + 2, '#000000');
}

function drawLaughMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  // More dramatic laugh mouth - wider with more visible teeth
  // Top curve
  pixel(mouthX - 2, mouthY - 1, '#000000');
  pixel(mouthX - 1, mouthY - 1, '#000000');
  pixel(mouthX + 5, mouthY - 1, '#000000');
  pixel(mouthX + 6, mouthY - 1, '#000000');
  // Top teeth
  for (let i = 0; i < 6; i++) {
    pixel(mouthX + i, mouthY - 1, '#ffffff');
  }
  // Sides
  pixel(mouthX - 2, mouthY, '#000000');
  pixel(mouthX + 6, mouthY, '#000000');
  pixel(mouthX - 2, mouthY + 1, '#000000');
  pixel(mouthX + 6, mouthY + 1, '#000000');
  // Middle teeth
  for (let i = 0; i < 6; i++) {
    pixel(mouthX + i, mouthY, '#ffffff');
  }
  // Bottom curve
  pixel(mouthX - 2, mouthY + 2, '#000000');
  pixel(mouthX - 1, mouthY + 2, '#000000');
  for (let i = 0; i < 6; i++) {
    pixel(mouthX + i, mouthY + 2, '#000000');
  }
  pixel(mouthX + 5, mouthY + 2, '#000000');
  pixel(mouthX + 6, mouthY + 2, '#000000');
  // Teeth separators
  pixel(mouthX + 1, mouthY - 1, '#000000');
  pixel(mouthX + 3, mouthY - 1, '#000000');
  pixel(mouthX + 5, mouthY - 1, '#000000');
}

function drawAngryMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  // More dramatic angry mouth - wider with visible teeth
  // Top (teeth showing)
  pixel(mouthX - 1, mouthY - 1, '#000000');
  for (let i = 0; i < 5; i++) {
    pixel(mouthX + i, mouthY - 1, '#ffffff'); // Teeth
  }
  pixel(mouthX + 4, mouthY - 1, '#000000');
  // Bottom (frown)
  pixel(mouthX - 1, mouthY + 1, '#000000');
  pixel(mouthX, mouthY + 1, '#000000');
  pixel(mouthX + 1, mouthY + 1, '#000000');
  pixel(mouthX + 2, mouthY + 1, '#000000');
  pixel(mouthX + 3, mouthY + 1, '#000000');
  pixel(mouthX + 4, mouthY + 1, '#000000');
  // Sides
  pixel(mouthX - 1, mouthY, '#000000');
  pixel(mouthX + 4, mouthY, '#000000');
}

function drawDeadMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  // More dramatic dead mouth - wider open
  // Top
  pixel(mouthX - 1, mouthY - 1, '#000000');
  pixel(mouthX, mouthY - 1, '#000000');
  pixel(mouthX + 1, mouthY - 1, '#000000');
  pixel(mouthX + 2, mouthY - 1, '#000000');
  pixel(mouthX + 3, mouthY - 1, '#000000');
  pixel(mouthX + 4, mouthY - 1, '#000000');
  // Sides
  pixel(mouthX - 1, mouthY, '#000000');
  pixel(mouthX + 4, mouthY, '#000000');
  pixel(mouthX - 1, mouthY + 1, '#000000');
  pixel(mouthX + 4, mouthY + 1, '#000000');
  // Bottom
  pixel(mouthX - 1, mouthY + 2, '#000000');
  pixel(mouthX, mouthY + 2, '#000000');
  pixel(mouthX + 1, mouthY + 2, '#000000');
  pixel(mouthX + 2, mouthY + 2, '#000000');
  pixel(mouthX + 3, mouthY + 2, '#000000');
  pixel(mouthX + 4, mouthY + 2, '#000000');
  // Red tongue
  pixel(mouthX + 1, mouthY, '#dc2626');
  pixel(mouthX + 2, mouthY, '#dc2626');
  pixel(mouthX + 3, mouthY, '#dc2626');
  pixel(mouthX + 1, mouthY + 1, '#dc2626');
  pixel(mouthX + 2, mouthY + 1, '#dc2626');
  pixel(mouthX + 3, mouthY + 1, '#dc2626');
}

function drawExcitedMouth(pixel: PixelDrawer, mouthX: number, mouthY: number) {
  // More dramatic excited mouth - wider open oval
  // Top
  pixel(mouthX - 1, mouthY - 1, '#000000');
  pixel(mouthX, mouthY - 1, '#000000');
  pixel(mouthX + 1, mouthY - 1, '#000000');
  pixel(mouthX + 2, mouthY - 1, '#000000');
  pixel(mouthX + 3, mouthY - 1, '#000000');
  pixel(mouthX + 4, mouthY - 1, '#000000');
  // Sides
  pixel(mouthX - 1, mouthY, '#000000');
  pixel(mouthX + 4, mouthY, '#000000');
  pixel(mouthX - 1, mouthY + 1, '#000000');
  pixel(mouthX + 4, mouthY + 1, '#000000');
  // Bottom
  pixel(mouthX - 1, mouthY + 2, '#000000');
  pixel(mouthX, mouthY + 2, '#000000');
  pixel(mouthX + 1, mouthY + 2, '#000000');
  pixel(mouthX + 2, mouthY + 2, '#000000');
  pixel(mouthX + 3, mouthY + 2, '#000000');
  pixel(mouthX + 4, mouthY + 2, '#000000');
  // Interior
  pixel(mouthX, mouthY, '#000000');
  pixel(mouthX + 1, mouthY, '#000000');
  pixel(mouthX + 2, mouthY, '#000000');
  pixel(mouthX + 3, mouthY, '#000000');
  pixel(mouthX + 1, mouthY + 1, '#000000');
  pixel(mouthX + 2, mouthY + 1, '#000000');
  pixel(mouthX + 3, mouthY + 1, '#000000');
}

// Eyebrow drawing functions for more dramatic expressions
function drawNeutralEyebrow(pixel: PixelDrawer, eyebrowX: number, eyebrowY: number) {
  // Simple horizontal eyebrow
  for (let i = 0; i < 5; i++) {
    pixel(eyebrowX + i, eyebrowY, '#000000');
  }
}

function drawAngryEyebrow(pixel: PixelDrawer, eyebrowX: number, eyebrowY: number) {
  // Angry downward-slanting eyebrow (V shape)
  pixel(eyebrowX, eyebrowY, '#000000');
  pixel(eyebrowX + 1, eyebrowY, '#000000');
  pixel(eyebrowX + 2, eyebrowY + 1, '#000000');
  pixel(eyebrowX + 3, eyebrowY + 1, '#000000');
  pixel(eyebrowX + 4, eyebrowY + 2, '#000000');
  pixel(eyebrowX + 5, eyebrowY + 2, '#000000');
}

function drawWorriedEyebrow(pixel: PixelDrawer, eyebrowX: number, eyebrowY: number) {
  // Worried upward-slanting eyebrow (inverted V)
  pixel(eyebrowX, eyebrowY + 1, '#000000');
  pixel(eyebrowX + 1, eyebrowY + 1, '#000000');
  pixel(eyebrowX + 2, eyebrowY, '#000000');
  pixel(eyebrowX + 3, eyebrowY, '#000000');
  pixel(eyebrowX + 4, eyebrowY - 1, '#000000');
  pixel(eyebrowX + 5, eyebrowY - 1, '#000000');
}

function drawSurprisedEyebrow(pixel: PixelDrawer, eyebrowX: number, eyebrowY: number) {
  // Surprised raised eyebrow (arched)
  pixel(eyebrowX, eyebrowY + 1, '#000000');
  pixel(eyebrowX + 1, eyebrowY, '#000000');
  pixel(eyebrowX + 2, eyebrowY - 1, '#000000');
  pixel(eyebrowX + 3, eyebrowY - 1, '#000000');
  pixel(eyebrowX + 4, eyebrowY, '#000000');
  pixel(eyebrowX + 5, eyebrowY + 1, '#000000');
}

function drawHappyEyebrow(pixel: PixelDrawer, eyebrowX: number, eyebrowY: number) {
  // Happy slightly arched eyebrow
  pixel(eyebrowX, eyebrowY, '#000000');
  pixel(eyebrowX + 1, eyebrowY - 1, '#000000');
  pixel(eyebrowX + 2, eyebrowY - 1, '#000000');
  pixel(eyebrowX + 3, eyebrowY, '#000000');
  pixel(eyebrowX + 4, eyebrowY, '#000000');
}

// Draw facial expression based on emotion (updated for 64x64 grid)
export function drawFaceExpression(
  ctx: CanvasRenderingContext2D,
  pixelSize: number,
  emotion: CharacterEmotion,
  isDefeated: boolean
) {
  const GRID_SIZE = 64; // Updated grid size
  const centerX = GRID_SIZE / 2;
  const pixel: PixelDrawer = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  };

  // Eye positions (base) - updated for 64x64 grid (roughly 2x the 32x32 positions)
  const leftEyeX = 24;
  const rightEyeX = 38;
  const eyeY = 16;

  // Eyebrow positions (above eyes)
  const leftEyebrowX = 23;
  const rightEyebrowX = 37;
  const eyebrowY = 13;

  // Mouth positions
  const mouthX = 30;
  const mouthY = 22;

  if (isDefeated || emotion === 'dead') {
    drawXEye(pixel, leftEyeX, eyeY);
    drawXEye(pixel, rightEyeX - 2, eyeY);
    drawDeadMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'laughing') {
    drawSquintedEye(pixel, leftEyeX, eyeY);
    drawSquintedEye(pixel, rightEyeX - 1, eyeY);
    drawHappyEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawHappyEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawLaughMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'victorious') {
    drawWideEye(pixel, leftEyeX, eyeY);
    drawWideEye(pixel, rightEyeX - 1, eyeY);
    drawHappyEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawHappyEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawBigSmile(pixel, mouthX, mouthY, 6);
  } else if (emotion === 'happy') {
    drawSimpleEye(pixel, leftEyeX, eyeY);
    drawSimpleEye(pixel, rightEyeX, eyeY);
    drawHappyEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawHappyEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawSmile(pixel, mouthX, mouthY);
  } else if (emotion === 'hurt' || emotion === 'sad') {
    drawSadEye(pixel, leftEyeX, eyeY);
    drawSadEye(pixel, rightEyeX, eyeY);
    drawWorriedEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawWorriedEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawFrown(pixel, mouthX, mouthY);
  } else if (emotion === 'rage' || emotion === 'frustrated') {
    drawAngryEye(pixel, leftEyeX, eyeY);
    drawAngryEye(pixel, rightEyeX - 1, eyeY);
    drawAngryEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawAngryEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawAngryMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'worried') {
    drawWideEye(pixel, leftEyeX, eyeY);
    drawWideEye(pixel, rightEyeX - 1, eyeY);
    drawWorriedEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawWorriedEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawNeutralMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'determined') {
    drawSimpleEye(pixel, leftEyeX, eyeY);
    drawSimpleEye(pixel, rightEyeX, eyeY);
    drawNeutralEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawNeutralEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawNeutralMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'excited') {
    drawVeryWideEye(pixel, leftEyeX, eyeY);
    drawVeryWideEye(pixel, rightEyeX - 2, eyeY);
    drawSurprisedEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawSurprisedEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawExcitedMouth(pixel, mouthX, mouthY);
  } else if (emotion === 'triumphant') {
    drawWideEye(pixel, leftEyeX, eyeY);
    drawWideEye(pixel, rightEyeX - 2, eyeY);
    drawHappyEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawHappyEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawBigSmile(pixel, mouthX, mouthY, 7);
  } else if (emotion === 'confident') {
    drawSimpleEye(pixel, leftEyeX, eyeY);
    drawSimpleEye(pixel, rightEyeX, eyeY);
    drawNeutralEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawNeutralEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawSmile(pixel, mouthX, mouthY);
  } else if (emotion === 'surprised') {
    drawSurprisedEye(pixel, leftEyeX, eyeY);
    drawSurprisedEye(pixel, rightEyeX - 2, eyeY);
    drawSurprisedEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawSurprisedEyebrow(pixel, rightEyebrowX, eyebrowY);
    drawOpenMouth(pixel, mouthX, mouthY);
  } else {
    // Default: neutral eyes
    drawSimpleEye(pixel, leftEyeX, eyeY);
    drawSimpleEye(pixel, rightEyeX, eyeY);
    drawNeutralEyebrow(pixel, leftEyebrowX, eyebrowY);
    drawNeutralEyebrow(pixel, rightEyebrowX, eyebrowY);
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
  const GRID_SIZE = 64; // Base sprite is now 64x64 for more detail
  const scale = size / GRID_SIZE; // Scale to desired size
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

  // Base character shape (64x64 grid for more detail)
  // Head - larger and more detailed (roughly 2x the 32x32 size)
  rect(20, 8, 24, 20, colors.skin);
  // Head shape refinement
  pixel(19, 9, colors.skin);
  pixel(44, 9, colors.skin);
  pixel(19, 27, colors.skin);
  pixel(44, 27, colors.skin);
  
  // Hair/Helmet based on class
  if (playerClass.name === 'Wizard') {
    // Wizard hat - more detailed
    rect(18, 4, 28, 8, colors.primary);
    rect(16, 2, 32, 4, colors.primary);
    rect(14, 0, 36, 2, colors.primary);
    // Hat tip
    pixel(30, 0, colors.accent);
    pixel(31, 0, colors.accent);
    pixel(32, 0, colors.accent);
    pixel(33, 0, colors.accent);
    // Hat brim details
    pixel(12, 4, colors.primary);
    pixel(13, 5, colors.primary);
    pixel(50, 4, colors.primary);
    pixel(49, 5, colors.primary);
  } else if (playerClass.name === 'Fighter' || playerClass.name === 'Paladin') {
    // Helmet - more detailed with visor
    rect(20, 6, 24, 12, colors.secondary);
    rect(22, 4, 20, 4, colors.secondary);
    // Visor
    rect(24, 10, 16, 2, '#1c1917');
    // Helmet details
    pixel(22, 5, colors.accent);
    pixel(41, 5, colors.accent);
    rect(26, 8, 12, 1, colors.accent);
    // Paladin-specific: Holy symbol on helmet
    if (playerClass.name === 'Paladin') {
      pixel(30, 6, colors.accent);
      pixel(32, 6, colors.accent);
    }
  } else if (playerClass.name === 'Monk') {
    // Monk: Bald or simple headband
    rect(22, 6, 20, 2, colors.primary); // Headband
    pixel(24, 5, colors.accent);
    pixel(38, 5, colors.accent);
  } else if (playerClass.name === 'Druid') {
    // Druid: Nature-themed headpiece with leaves/antlers
    rect(18, 6, 28, 8, colors.primary);
    // Antler-like branches
    pixel(16, 4, colors.secondary);
    pixel(15, 3, colors.secondary);
    pixel(47, 4, colors.secondary);
    pixel(48, 3, colors.secondary);
    // Leaves
    pixel(20, 5, colors.accent);
    pixel(42, 5, colors.accent);
  } else if (playerClass.name === 'Bard') {
    // Bard: Feathered hat or decorative headpiece
    rect(20, 4, 24, 6, colors.primary);
    // Feather
    rect(44, 2, 2, 8, colors.accent);
    pixel(45, 1, colors.accent);
    pixel(45, 2, '#fbbf24');
    // Decorative band
    rect(22, 6, 20, 1, colors.accent);
  } else if (playerClass.name === 'Sorcerer') {
    // Sorcerer: Magical aura or crown
    rect(18, 6, 28, 6, colors.primary);
    // Magical points
    pixel(24, 4, colors.accent);
    pixel(30, 4, colors.accent);
    pixel(36, 4, colors.accent);
    pixel(28, 3, colors.accent);
    pixel(32, 3, colors.accent);
  } else if (playerClass.name === 'Warlock') {
    // Warlock: Dark hood or horns
    rect(18, 4, 28, 10, colors.primary);
    // Horns
    pixel(20, 2, colors.secondary);
    pixel(19, 1, colors.secondary);
    pixel(43, 2, colors.secondary);
    pixel(44, 1, colors.secondary);
    // Hood shadow
    rect(20, 8, 24, 4, '#1c1917');
  } else if (playerClass.name === 'Artificer') {
    // Artificer: Goggles or mechanical headpiece
    rect(20, 6, 24, 8, colors.primary);
    // Goggles
    rect(22, 8, 6, 4, colors.secondary);
    rect(36, 8, 6, 4, colors.secondary);
    pixel(24, 9, '#fbbf24'); // Lens shine
    pixel(38, 9, '#fbbf24');
    // Goggle strap
    rect(20, 10, 24, 1, colors.secondary);
  } else {
    // Default: Hair - more detailed
    rect(18, 6, 28, 10, colors.hair);
    rect(16, 8, 32, 4, colors.hair);
    // Hair texture/details
    pixel(17, 7, colors.hair);
    pixel(46, 7, colors.hair);
    pixel(15, 10, colors.hair);
    pixel(48, 10, colors.hair);
    // Class-specific hair styles
    if (playerClass.name === 'Rogue') {
      // Rogue: Hood or cap
      rect(18, 4, 28, 4, colors.primary);
      pixel(16, 5, colors.primary);
      pixel(45, 5, colors.primary);
    } else if (playerClass.name === 'Ranger') {
      // Ranger: Hood with leaf details
      rect(18, 4, 28, 6, colors.primary);
      pixel(20, 3, colors.accent);
      pixel(42, 3, colors.accent);
    } else if (playerClass.name === 'Barbarian') {
      // Barbarian: Wild, unkempt hair
      rect(16, 4, 32, 12, colors.hair);
      pixel(14, 5, colors.hair);
      pixel(15, 3, colors.hair);
      pixel(48, 5, colors.hair);
      pixel(49, 3, colors.hair);
    }
  }

  // Draw facial expression based on emotion
  drawFaceExpression(ctx, pixelSize, emotion, isDefeated);

  // Body/Torso - more detailed
  rect(22, 28, 20, 24, colors.primary);
  // Chest details
  rect(28, 30, 8, 4, colors.secondary);
  rect(26, 34, 12, 2, colors.secondary);
  
  // Arms - more detailed with better proportions
  rect(16, 30, 6, 16, colors.skin);
  rect(42, 30, 6, 16, colors.skin);
  // Shoulders
  rect(20, 28, 4, 4, colors.skin);
  rect(40, 28, 4, 4, colors.skin);
  
  // Shoulder pads/armor based on AC
  if (playerClass.armorClass >= 16) {
    rect(18, 28, 4, 8, colors.secondary);
    rect(42, 28, 4, 8, colors.secondary);
    // Armor details
    pixel(19, 30, colors.accent);
    pixel(20, 32, colors.accent);
    pixel(43, 30, colors.accent);
    pixel(42, 32, colors.accent);
  }

  // Legs - more detailed
  rect(24, 52, 8, 12, colors.primary);
  rect(32, 52, 8, 12, colors.primary);
  // Knees
  rect(25, 58, 6, 2, colors.secondary);
  rect(33, 58, 6, 2, colors.secondary);

  // Class-specific features - more detailed
  if (playerClass.name === 'Wizard') {
    // Staff - more detailed
    rect(44, 20, 2, 36, '#8b5cf6');
    // Staff top/crystal
    rect(42, 18, 6, 4, colors.accent);
    pixel(43, 17, colors.accent);
    pixel(44, 17, colors.accent);
    pixel(45, 17, colors.accent);
    // Staff details
    rect(44, 30, 2, 2, '#fbbf24');
    rect(44, 40, 2, 2, '#fbbf24');
  } else if (playerClass.name === 'Fighter') {
    // Sword - more detailed
    rect(46, 24, 2, 24, '#cbd5e1');
    // Sword hilt
    rect(45, 24, 4, 4, '#78350f');
    rect(44, 26, 6, 2, '#fbbf24');
    // Sword guard
    rect(43, 28, 2, 8, '#fbbf24');
    rect(47, 28, 2, 8, '#fbbf24');
    // Blade details
    pixel(46, 30, '#ffffff');
    pixel(46, 35, '#ffffff');
    pixel(46, 40, '#ffffff');
  } else if (playerClass.name === 'Paladin') {
    // Paladin: Holy sword with glowing effect
    rect(46, 24, 2, 24, '#cbd5e1');
    // Glowing blade
    pixel(45, 26, colors.accent);
    pixel(47, 26, colors.accent);
    pixel(45, 30, colors.accent);
    pixel(47, 30, colors.accent);
    // Sword hilt with holy symbol
    rect(45, 24, 4, 4, '#78350f');
    rect(44, 26, 6, 2, '#fbbf24');
    pixel(46, 25, colors.accent); // Holy symbol on hilt
    // Sword guard
    rect(43, 28, 2, 8, '#fbbf24');
    rect(47, 28, 2, 8, '#fbbf24');
    // Blade details
    pixel(46, 30, '#ffffff');
    pixel(46, 35, '#ffffff');
    pixel(46, 40, '#ffffff');
  } else if (playerClass.name === 'Rogue') {
    // Dagger - more detailed
    rect(44, 28, 2, 12, '#cbd5e1');
    rect(43, 28, 4, 2, '#fbbf24');
    pixel(44, 26, '#fbbf24');
    pixel(45, 26, '#fbbf24');
    // Second dagger (dual wielding)
    rect(40, 30, 2, 8, '#cbd5e1');
    pixel(40, 28, '#fbbf24');
  } else if (playerClass.name === 'Ranger') {
    // Bow - more detailed
    rect(44, 30, 4, 2, '#78350f');
    rect(46, 28, 2, 6, '#78350f');
    // Bowstring
    pixel(45, 29, '#ffffff');
    pixel(45, 33, '#ffffff');
    // Arrow
    rect(48, 30, 1, 4, '#1c1917');
    pixel(48, 29, '#fbbf24'); // Arrowhead
  } else if (playerClass.name === 'Cleric') {
    // Holy symbol - more detailed
    rect(26, 32, 12, 12, colors.accent);
    // Symbol details
    rect(28, 34, 8, 8, '#ffffff');
    pixel(30, 36, colors.accent);
    pixel(34, 36, colors.accent);
    pixel(32, 38, colors.accent);
    // Glowing effect
    pixel(29, 35, colors.accent);
    pixel(35, 35, colors.accent);
    pixel(32, 40, colors.accent);
  } else if (playerClass.name === 'Barbarian') {
    // Axe - more detailed
    rect(44, 24, 4, 20, '#1c1917');
    rect(46, 24, 4, 4, colors.accent);
    // Axe blade
    rect(48, 26, 2, 8, '#cbd5e1');
    pixel(49, 28, '#ffffff');
    pixel(49, 30, '#ffffff');
    // Battle damage on axe
    pixel(48, 27, '#78350f');
  } else if (playerClass.name === 'Bard') {
    // Lute or musical instrument
    rect(42, 28, 8, 12, '#78350f');
    // Instrument body
    rect(44, 30, 4, 8, colors.primary);
    // Strings
    for (let i = 0; i < 4; i++) {
      pixel(45 + i, 32, '#ffffff');
      pixel(45 + i, 36, '#ffffff');
    }
    // Decorative details
    pixel(43, 31, colors.accent);
    pixel(47, 31, colors.accent);
  } else if (playerClass.name === 'Sorcerer') {
    // Magical orb or wand
    rect(44, 24, 4, 4, colors.accent);
    // Orb glow
    pixel(45, 25, '#ffffff');
    pixel(46, 25, '#ffffff');
    // Magical energy trail
    rect(45, 28, 2, 20, colors.accent);
    pixel(44, 30, colors.accent);
    pixel(47, 30, colors.accent);
    pixel(44, 35, colors.accent);
    pixel(47, 35, colors.accent);
  } else if (playerClass.name === 'Warlock') {
    // Eldritch tome or dark staff
    rect(42, 26, 6, 8, '#1c1917');
    // Book details
    rect(43, 27, 4, 6, '#78350f');
    pixel(44, 28, '#fbbf24'); // Eye symbol
    pixel(45, 28, '#fbbf24');
    // Dark energy
    pixel(48, 30, colors.accent);
    pixel(48, 32, colors.accent);
    pixel(48, 34, colors.accent);
  } else if (playerClass.name === 'Monk') {
    // Unarmed or simple staff
    rect(44, 28, 2, 16, '#78350f');
    // Staff details
    rect(43, 28, 4, 2, colors.accent);
    // Energy aura (ki)
    pixel(46, 30, colors.accent);
    pixel(46, 35, colors.accent);
    pixel(46, 40, colors.accent);
  } else if (playerClass.name === 'Druid') {
    // Staff with nature elements
    rect(44, 20, 2, 28, '#78350f');
    // Staff top with leaves
    rect(42, 18, 6, 4, colors.accent);
    pixel(43, 17, colors.accent);
    pixel(45, 17, colors.accent);
    pixel(44, 16, colors.accent);
    // Nature details on staff
    pixel(44, 25, colors.accent);
    pixel(44, 30, colors.accent);
    pixel(44, 35, colors.accent);
  } else if (playerClass.name === 'Artificer') {
    // Mechanical tool or crossbow
    rect(42, 28, 8, 6, colors.secondary);
    // Crossbow body
    rect(44, 30, 4, 4, '#1c1917');
    // Bolt
    rect(48, 31, 2, 2, '#cbd5e1');
    // Mechanical details
    pixel(43, 29, colors.accent);
    pixel(47, 29, colors.accent);
    pixel(45, 32, '#fbbf24');
  }

  // Draw damage indicators (bruising/blood) based on HP loss
  if (hpPercent < 1 && !isDefeated) {
    const damageLevel = 1 - hpPercent; // 0 = full HP, 1 = critical
    
    // Draw bruises and cuts on face (only if not wearing helmet) - updated for 64x64
    if (playerClass.name !== 'Fighter' && playerClass.name !== 'Paladin') {
      const faceDamage = Math.min(damageLevel * 1.5, 1); // Face shows damage more prominently
      
      if (faceDamage > 0.2) {
        // Bruise on left cheek - more detailed
        pixel(22, 14, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.8, 0.7)})`); // Brown bruise
        pixel(22, 15, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.6, 0.5)})`);
        pixel(23, 14, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.5, 0.4)})`);
      }
      if (faceDamage > 0.3) {
        // Bruise on right cheek
        pixel(40, 14, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.8, 0.7)})`);
        pixel(40, 15, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.6, 0.5)})`);
        pixel(41, 14, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.5, 0.4)})`);
      }
      if (faceDamage > 0.5) {
        // Cut on forehead
        pixel(30, 10, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.9, 0.8)})`); // Dark red cut
        pixel(31, 10, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.9, 0.8)})`);
        pixel(32, 10, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.7, 0.6)})`);
      }
      if (faceDamage > 0.7) {
        // More cuts and bruises
        pixel(24, 12, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.7, 0.6)})`);
        pixel(38, 12, `rgba(139, 0, 0, ${Math.min(faceDamage * 0.7, 0.6)})`);
        pixel(28, 18, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.6, 0.5)})`);
        pixel(34, 18, `rgba(139, 69, 19, ${Math.min(faceDamage * 0.6, 0.5)})`);
      }
    }
    
    // Draw bruises and cuts on exposed arms - updated for 64x64
    if (damageLevel > 0.2) {
      // Left arm bruises
      const armDamage = Math.min(damageLevel * 1.2, 1);
      pixel(16, 32, `rgba(139, 69, 19, ${Math.min(armDamage * 0.7, 0.6)})`);
      pixel(17, 32, `rgba(139, 69, 19, ${Math.min(armDamage * 0.5, 0.4)})`);
      pixel(16, 33, `rgba(139, 69, 19, ${Math.min(armDamage * 0.6, 0.5)})`);
      if (damageLevel > 0.4) {
        pixel(17, 36, `rgba(139, 0, 0, ${Math.min(armDamage * 0.8, 0.7)})`); // Cut
        pixel(18, 36, `rgba(139, 0, 0, ${Math.min(armDamage * 0.6, 0.5)})`);
        pixel(17, 37, `rgba(139, 0, 0, ${Math.min(armDamage * 0.5, 0.4)})`);
      }
      
      // Right arm bruises
      pixel(42, 32, `rgba(139, 69, 19, ${Math.min(armDamage * 0.7, 0.6)})`);
      pixel(43, 32, `rgba(139, 69, 19, ${Math.min(armDamage * 0.5, 0.4)})`);
      pixel(42, 33, `rgba(139, 69, 19, ${Math.min(armDamage * 0.6, 0.5)})`);
      if (damageLevel > 0.4) {
        pixel(45, 36, `rgba(139, 0, 0, ${Math.min(armDamage * 0.8, 0.7)})`); // Cut
        pixel(44, 36, `rgba(139, 0, 0, ${Math.min(armDamage * 0.6, 0.5)})`);
        pixel(45, 37, `rgba(139, 0, 0, ${Math.min(armDamage * 0.5, 0.4)})`);
      }
    }
    
    // Draw blood on torso/body (scales with damage) - updated for 64x64
    if (damageLevel > 0.3) {
      const bodyDamage = Math.min(damageLevel * 1.1, 1);
      // Blood spots on torso
      pixel(24, 32, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.6, 0.5)})`);
      pixel(38, 32, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.6, 0.5)})`);
      if (damageLevel > 0.5) {
        pixel(26, 34, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.7, 0.6)})`);
        pixel(36, 34, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.7, 0.6)})`);
        pixel(30, 36, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.8, 0.7)})`); // Center wound
        pixel(32, 36, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.8, 0.7)})`);
      }
      if (damageLevel > 0.7) {
        // More severe wounds
        pixel(28, 38, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.9, 0.8)})`);
        pixel(32, 38, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.9, 0.8)})`);
        pixel(24, 40, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.7, 0.6)})`);
        pixel(38, 40, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.7, 0.6)})`);
      }
    }
    
    // Draw blood on legs if very damaged - updated for 64x64
    if (damageLevel > 0.6) {
      const legDamage = Math.min(damageLevel * 1.0, 1);
      pixel(26, 54, `rgba(139, 0, 0, ${Math.min(legDamage * 0.6, 0.5)})`);
      pixel(36, 54, `rgba(139, 0, 0, ${Math.min(legDamage * 0.6, 0.5)})`);
      if (damageLevel > 0.8) {
        pixel(26, 56, `rgba(139, 0, 0, ${Math.min(legDamage * 0.7, 0.6)})`);
        pixel(36, 56, `rgba(139, 0, 0, ${Math.min(legDamage * 0.7, 0.6)})`);
      }
    }
    
    // Subtle red overlay for overall damage (less intense than before, since we have detailed damage)
    const damageOverlay = Math.min(0.15, (1 - hpPercent) * 0.25);
    ctx.fillStyle = `rgba(220, 38, 38, ${damageOverlay})`;
    ctx.fillRect(0, 0, size, size);
  }

  // Stats-based visual indicators - updated for 64x64
  // High AC = more armor detail
  if (playerClass.armorClass >= 17) {
    rect(22, 36, 20, 4, colors.secondary);
    // Armor details
    pixel(24, 37, colors.accent);
    pixel(38, 37, colors.accent);
  }

  // High attack bonus = weapon glow
  if (playerClass.attackBonus >= 5) {
    ctx.fillStyle = `rgba(251, 191, 36, 0.3)`;
    ctx.fillRect(40 * pixelSize, 20 * pixelSize, 12 * pixelSize, 16 * pixelSize);
  }
}

// Get monster sprite size (grid dimensions) - updated for 64x64 grid
function getMonsterSpriteSize(monsterName: string): { width: number; height: number; offsetX: number; offsetY: number } {
  // Large monsters (dragons, giants, etc.) - use most of canvas
  const hugeMonsters = ['Dragon', 'White Dragon', 'Giant', 'Beholder', 'Sphinx of Wonder', 'Tough Boss', 'Blob of Annihilation'];
  if (hugeMonsters.includes(monsterName)) {
    return { width: 64, height: 64, offsetX: 0, offsetY: 0 }; // Full canvas
  }
  
  // Large monsters - use 56x56 area (2x the old 28x28)
  const largeMonsters = ['Troll', 'Ogre', 'Marilith', 'Nalfeshnee', 'Hezrou', 'Pit Fiend', 'Ice Devil', 'Allosaurus', 'Anklyosaurus'];
  if (largeMonsters.includes(monsterName)) {
    return { width: 56, height: 56, offsetX: 4, offsetY: 4 };
  }
  
  // Medium monsters - use 48x48 area (2x the old 24x24)
  const mediumMonsters = ['Orc', 'Vampire', 'Werewolf', 'Demon', 'Devil', 'Lich', 'Mind Flayer', 'Elemental', 'Undead', 'Beast', 'Aberration', 
    'Bugbear Stalker', 'Hobgoblin Captain', 'Pirate Captain', 'Pteradon', 'Vrock', 'Yochlol', 'Barbed Devil', 'Bearded Devil', 'Horned Devil', 
    'Erinyes', 'Bone Devil', 'Chain Devil', 'Dao', 'Efreeti', 'Marid', 'Shadow Demon'];
  if (mediumMonsters.includes(monsterName)) {
    return { width: 48, height: 48, offsetX: 8, offsetY: 8 };
  }
  
  // Small monsters - use 40x40 area (2x the old 20x20)
  const smallMonsters = ['Goblin', 'Kobold', 'Skeleton', 'Zombie', 'Goblin Boss', 'Goblin Minion', 'Pirate', 'Swarm of Crawling Claws', 
    'Troll Limb', 'Vampire Familiar', 'Quasit', 'Imp', 'Manes', 'Lemure', 'Swarm of Lemures'];
  if (smallMonsters.includes(monsterName)) {
    return { width: 40, height: 40, offsetX: 12, offsetY: 12 };
  }
  
  // Default medium size
  return { width: 48, height: 48, offsetX: 8, offsetY: 8 };
}

// Draw pixel art monster
export function drawMonsterPixelArt(
  ctx: CanvasRenderingContext2D,
  size: number,
  monsterClass: DnDClass,
  colors: ReturnType<typeof getMonsterColors>,
  hpPercent: number,
  isDefeated: boolean,
  emotion: CharacterEmotion // Not used for monsters, kept for compatibility
) {
  const spriteSize = getMonsterSpriteSize(monsterClass.name);
  const GRID_SIZE = 64; // Base grid is now 64x64
  const scale = size / GRID_SIZE; // Scale to desired size
  const pixelSize = scale;
  
  // Calculate offset for centering
  const offsetX = spriteSize.offsetX * pixelSize;
  const offsetY = spriteSize.offsetY * pixelSize;

  // Helper to draw a pixel (relative to sprite offset)
  const pixel = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect((spriteSize.offsetX + x) * pixelSize, (spriteSize.offsetY + y) * pixelSize, pixelSize, pixelSize);
  };

  // Helper to draw a rectangle of pixels (relative to sprite offset)
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect((spriteSize.offsetX + x) * pixelSize, (spriteSize.offsetY + y) * pixelSize, w * pixelSize, h * pixelSize);
  };

  const monsterName = monsterClass.name;
  const spriteW = spriteSize.width;
  const spriteH = spriteSize.height;
  
  // Center coordinates for the sprite
  const centerX = Math.floor(spriteW / 2);
  const centerY = Math.floor(spriteH / 2);

  // Monster-specific features
  if (monsterName === 'Goblin') {
    // Goblin: Small, green, pointy-eared - uses 40x40 sprite (2x detail)
    // Head - small and green (more detailed)
    rect(8, 4, 12, 12, colors.skin);
    // Head shape
    pixel(7, 5, colors.skin);
    pixel(20, 5, colors.skin);
    pixel(6, 7, colors.skin);
    pixel(21, 7, colors.skin);
    // Pointed ears - more detailed
    pixel(4, 6, colors.primary);
    pixel(5, 4, colors.primary);
    pixel(6, 3, colors.primary);
    pixel(22, 3, colors.primary);
    pixel(23, 4, colors.primary);
    pixel(24, 6, colors.primary);
    // Ear details
    pixel(5, 5, colors.secondary);
    pixel(23, 5, colors.secondary);
    // Eyes - beady and yellow (more detailed)
    rect(10, 8, 2, 2, '#fbbf24');
    rect(16, 8, 2, 2, '#fbbf24');
    pixel(9, 9, '#000000'); // Pupils
    pixel(17, 9, '#000000');
    // Nose - more detailed
    rect(13, 12, 2, 2, colors.primary);
    pixel(12, 13, colors.primary);
    pixel(15, 13, colors.primary);
    // Mouth - small fanged
    pixel(13, 14, '#000000');
    pixel(14, 15, '#ffffff'); // Small fang
    // Body - small torso (more detailed)
    rect(10, 16, 8, 12, colors.primary);
    // Chest details
    pixel(12, 18, colors.secondary);
    pixel(16, 18, colors.secondary);
    // Arms - thin (more detailed)
    rect(4, 18, 4, 8, colors.skin);
    rect(20, 18, 4, 8, colors.skin);
    // Hands/fingers
    pixel(3, 25, colors.skin);
    pixel(25, 25, colors.skin);
    // Legs - short (more detailed)
    rect(10, 28, 4, 8, colors.primary);
    rect(14, 28, 4, 8, colors.primary);
    // Feet
    pixel(10, 35, colors.accent);
    pixel(13, 35, colors.accent);
    pixel(14, 35, colors.accent);
    pixel(17, 35, colors.accent);
  } else if (monsterName === 'Orc') {
    // Orc: Large, muscular, gray-green skin, tusks - uses 48x48 sprite (2x detail)
    // Head - large and brutish (more detailed)
    rect(12, 4, 24, 20, colors.skin);
    // Head shape
    pixel(11, 5, colors.skin);
    pixel(35, 5, colors.skin);
    pixel(10, 7, colors.skin);
    pixel(36, 7, colors.skin);
    // Tusks - prominent (more detailed)
    rect(14, 16, 2, 4, '#ffffff');
    rect(32, 16, 2, 4, '#ffffff');
    pixel(13, 18, '#ffffff');
    pixel(35, 18, '#ffffff');
    // Eyes - red and angry (more detailed)
    rect(18, 10, 2, 2, '#dc2626');
    rect(28, 10, 2, 2, '#dc2626');
    pixel(19, 11, '#000000'); // Pupils
    pixel(29, 11, '#000000');
    // Nose - flat and wide (more detailed)
    rect(20, 14, 8, 4, colors.primary);
    pixel(19, 15, colors.primary);
    pixel(28, 15, colors.primary);
    // Body - muscular torso (more detailed)
    rect(14, 24, 20, 16, colors.primary);
    // Muscles (more detailed)
    rect(16, 26, 4, 4, colors.secondary);
    rect(28, 26, 4, 4, colors.secondary);
    rect(18, 30, 2, 2, colors.secondary);
    rect(30, 30, 2, 2, colors.secondary);
    // Arms - thick and powerful (more detailed)
    rect(6, 26, 6, 16, colors.skin);
    rect(36, 26, 6, 16, colors.skin);
    // Shoulders
    rect(12, 24, 4, 4, colors.skin);
    rect(32, 24, 4, 4, colors.skin);
    // Hands
    pixel(5, 40, colors.skin);
    pixel(37, 40, colors.skin);
    // Legs - thick (more detailed)
    rect(16, 40, 8, 8, colors.primary);
    rect(24, 40, 8, 8, colors.primary);
    // Feet
    pixel(16, 47, colors.accent);
    pixel(19, 47, colors.accent);
    pixel(24, 47, colors.accent);
    pixel(27, 47, colors.accent);
  } else if (monsterName === 'Dragon') {
    // Dragon: Actual dragon - quadrupedal, long neck, wings, tail - uses full 64x64 canvas
    // Head - reptilian, at end of long neck (more detailed)
    rect(8, 4, 16, 12, colors.skin);
    // Head shape refinement
    pixel(7, 5, colors.skin);
    pixel(24, 5, colors.skin);
    pixel(6, 7, colors.skin);
    pixel(25, 7, colors.skin);
    // Long neck connecting to body (more detailed)
    rect(12, 16, 8, 12, colors.skin);
    // Neck scales
    for (let y = 18; y < 26; y += 2) {
      pixel(14, y, colors.secondary);
      pixel(18, y, colors.secondary);
    }
    // Snout/jaw - more detailed
    rect(4, 8, 6, 6, colors.skin);
    rect(22, 8, 6, 6, colors.skin);
    // Teeth
    pixel(5, 10, '#ffffff');
    pixel(6, 11, '#ffffff');
    pixel(25, 10, '#ffffff');
    pixel(24, 11, '#ffffff');
    // Horns - more detailed
    pixel(10, 2, colors.accent);
    pixel(11, 1, colors.accent);
    pixel(20, 1, colors.accent);
    pixel(21, 2, colors.accent);
    pixel(12, 0, colors.accent);
    pixel(19, 0, colors.accent);
    // Eyes - larger and more detailed
    rect(10, 8, 2, 2, '#000000');
    rect(20, 8, 2, 2, '#000000');
    pixel(9, 9, '#fbbf24'); // Eye shine
    pixel(21, 9, '#fbbf24');
    // Body - large barrel chest, quadrupedal stance (more detailed)
    rect(16, 28, 32, 20, colors.primary);
    // Scales pattern - more detailed
    for (let y = 30; y < 46; y += 2) {
      for (let x = 18; x < 46; x += 2) {
        pixel(x, y, colors.secondary);
      }
    }
    // Scale highlights
    for (let y = 31; y < 45; y += 4) {
      for (let x = 19; x < 45; x += 4) {
        pixel(x, y, colors.accent);
      }
    }
    // Wings - large bat-like wings extending upward and outward (more detailed)
    rect(0, 24, 16, 24, colors.secondary);
    rect(48, 24, 16, 24, colors.secondary);
    // Wing membrane details - more detailed
    for (let y = 26; y < 46; y += 2) {
      pixel(2, y, colors.accent);
      pixel(62, y, colors.accent);
    }
    // Wing bones/fingers
    rect(4, 26, 2, 20, colors.accent);
    rect(58, 26, 2, 20, colors.accent);
    rect(6, 28, 2, 16, colors.accent);
    rect(56, 28, 2, 16, colors.accent);
    // Front legs - positioned forward (more detailed)
    rect(12, 40, 6, 16, colors.primary);
    rect(22, 40, 6, 16, colors.primary);
    // Front leg muscles
    rect(13, 44, 4, 4, colors.secondary);
    rect(23, 44, 4, 4, colors.secondary);
    // Hind legs - positioned back (more detailed)
    rect(36, 44, 6, 16, colors.primary);
    rect(46, 44, 6, 16, colors.primary);
    // Hind leg muscles
    rect(37, 48, 4, 4, colors.secondary);
    rect(47, 48, 4, 4, colors.secondary);
    // Claws on all feet - more detailed
    pixel(12, 55, colors.accent);
    pixel(14, 55, colors.accent);
    pixel(16, 55, colors.accent);
    pixel(22, 55, colors.accent);
    pixel(24, 55, colors.accent);
    pixel(26, 55, colors.accent);
    pixel(36, 59, colors.accent);
    pixel(38, 59, colors.accent);
    pixel(40, 59, colors.accent);
    pixel(46, 59, colors.accent);
    pixel(48, 59, colors.accent);
    pixel(50, 59, colors.accent);
    // Tail - long and tapering, curves behind (more detailed)
    rect(48, 48, 6, 12, colors.primary);
    rect(50, 60, 4, 4, colors.primary);
    pixel(52, 63, colors.primary);
    pixel(53, 63, colors.primary);
    // Tail spikes
    pixel(49, 50, colors.accent);
    pixel(51, 52, colors.accent);
    pixel(49, 54, colors.accent);
    pixel(51, 56, colors.accent);
  } else if (monsterName === 'Troll') {
    // Troll: Large, green, regenerating - uses 56x56 sprite (2x detail)
    // Head - large and ugly (more detailed)
    rect(16, 4, 24, 20, colors.skin);
    // Head shape
    pixel(15, 5, colors.skin);
    pixel(39, 5, colors.skin);
    pixel(14, 7, colors.skin);
    pixel(40, 7, colors.skin);
    // Warts (more detailed)
    rect(20, 8, 2, 2, colors.secondary);
    rect(36, 8, 2, 2, colors.secondary);
    rect(28, 12, 2, 2, colors.secondary);
    pixel(19, 9, colors.secondary);
    pixel(37, 9, colors.secondary);
    // Eyes - small and beady (more detailed)
    rect(22, 10, 2, 2, '#000000');
    rect(34, 10, 2, 2, '#000000');
    pixel(23, 11, '#fbbf24'); // Eye shine
    pixel(35, 11, '#fbbf24');
    // Nose - large and bulbous (more detailed)
    rect(24, 14, 8, 6, colors.primary);
    pixel(23, 15, colors.primary);
    pixel(32, 15, colors.primary);
    pixel(26, 16, colors.secondary); // Nostrils
    pixel(30, 16, colors.secondary);
    // Mouth - wide (more detailed)
    rect(22, 20, 12, 4, '#000000');
    pixel(24, 20, '#ffffff'); // Teeth
    pixel(28, 20, '#ffffff');
    pixel(32, 20, '#ffffff');
    // Body - large and muscular (more detailed)
    rect(18, 24, 20, 20, colors.primary);
    // Warts on body
    pixel(20, 26, colors.secondary);
    pixel(36, 26, colors.secondary);
    pixel(28, 30, colors.secondary);
    // Arms - long and powerful (more detailed)
    rect(8, 26, 6, 20, colors.skin);
    rect(42, 26, 6, 20, colors.skin);
    // Shoulders
    rect(16, 24, 4, 4, colors.skin);
    rect(36, 24, 4, 4, colors.skin);
    // Hands
    pixel(7, 44, colors.skin);
    pixel(41, 44, colors.skin);
    // Legs - thick (more detailed)
    rect(20, 44, 8, 12, colors.primary);
    rect(28, 44, 8, 12, colors.primary);
    // Feet
    pixel(20, 55, colors.accent);
    pixel(23, 55, colors.accent);
    pixel(28, 55, colors.accent);
    pixel(31, 55, colors.accent);
  } else if (monsterName === 'Ogre') {
    // Ogre: Large, gray, brutish - uses 56x56 sprite (2x detail)
    // Head - large and brutish (more detailed)
    rect(16, 4, 24, 20, colors.skin);
    // Head shape
    pixel(15, 5, colors.skin);
    pixel(39, 5, colors.skin);
    // Eyes - small and mean (more detailed)
    rect(20, 10, 2, 2, '#000000');
    rect(34, 10, 2, 2, '#000000');
    pixel(21, 11, '#dc2626'); // Red glow
    pixel(35, 11, '#dc2626');
    // Nose - flat (more detailed)
    rect(24, 14, 8, 4, colors.primary);
    pixel(23, 15, colors.primary);
    pixel(32, 15, colors.primary);
    // Mouth - wide with teeth (more detailed)
    rect(22, 18, 12, 4, '#000000');
    pixel(24, 18, '#ffffff'); // Teeth
    pixel(28, 18, '#ffffff');
    pixel(32, 18, '#ffffff');
    pixel(26, 19, '#ffffff');
    pixel(30, 19, '#ffffff');
    // Body - large torso (more detailed)
    rect(18, 24, 20, 20, colors.primary);
    // Chest details
    rect(24, 26, 8, 4, colors.secondary);
    // Arms - thick (more detailed)
    rect(8, 26, 6, 20, colors.skin);
    rect(42, 26, 6, 20, colors.skin);
    // Shoulders
    rect(16, 24, 4, 4, colors.skin);
    rect(36, 24, 4, 4, colors.skin);
    // Hands
    pixel(7, 44, colors.skin);
    pixel(41, 44, colors.skin);
    // Legs - thick (more detailed)
    rect(20, 44, 8, 12, colors.primary);
    rect(28, 44, 8, 12, colors.primary);
    // Feet
    pixel(20, 55, colors.accent);
    pixel(23, 55, colors.accent);
    pixel(28, 55, colors.accent);
    pixel(31, 55, colors.accent);
    // Club (more detailed)
    rect(46, 20, 4, 24, '#78350f');
    // Club head
    rect(48, 18, 4, 4, '#1c1917');
    pixel(50, 17, '#1c1917');
    // Club details
    pixel(47, 22, colors.accent);
    pixel(47, 30, colors.accent);
    pixel(47, 38, colors.accent);
  } else if (monsterName === 'Kobold') {
    // Kobold: Small, reptilian, yellow - uses 40x40 sprite (2x detail)
    // Head - small reptilian (more detailed)
    rect(8, 4, 12, 12, colors.skin);
    // Head shape
    pixel(7, 5, colors.skin);
    pixel(20, 5, colors.skin);
    // Eyes - reptilian slits (more detailed)
    rect(10, 8, 2, 1, '#000000');
    rect(16, 8, 2, 1, '#000000');
    pixel(11, 9, '#fbbf24'); // Eye shine
    pixel(17, 9, '#fbbf24');
    // Snout (more detailed)
    rect(12, 12, 4, 4, colors.primary);
    pixel(11, 13, colors.primary);
    pixel(16, 13, colors.primary);
    // Nostrils
    pixel(13, 14, '#000000');
    pixel(15, 14, '#000000');
    // Body - small torso (more detailed)
    rect(10, 16, 8, 12, colors.primary);
    // Scales
    pixel(12, 18, colors.secondary);
    pixel(16, 18, colors.secondary);
    // Arms - thin (more detailed)
    rect(4, 18, 4, 8, colors.skin);
    rect(20, 18, 4, 8, colors.skin);
    // Claws
    pixel(3, 25, colors.accent);
    pixel(25, 25, colors.accent);
    // Legs - short (more detailed)
    rect(10, 28, 4, 8, colors.primary);
    rect(14, 28, 4, 8, colors.primary);
    // Feet
    pixel(10, 35, colors.accent);
    pixel(13, 35, colors.accent);
    pixel(14, 35, colors.accent);
    pixel(17, 35, colors.accent);
    // Tail (more detailed)
    rect(22, 24, 4, 8, colors.primary);
    pixel(24, 32, colors.primary);
    pixel(25, 33, colors.primary);
  } else if (monsterName === 'Skeleton') {
    // Skeleton: Bone structure, no flesh - uses 40x40 sprite (2x detail)
    // Skull (more detailed)
    rect(8, 4, 12, 12, colors.skin);
    // Skull shape
    pixel(7, 5, colors.skin);
    pixel(20, 5, colors.skin);
    pixel(6, 7, colors.skin);
    pixel(21, 7, colors.skin);
    // Eye sockets (more detailed)
    rect(10, 8, 2, 2, '#000000');
    rect(16, 8, 2, 2, '#000000');
    // Nose hole (more detailed)
    rect(13, 12, 2, 2, '#000000');
    // Jaw (more detailed)
    rect(10, 14, 8, 2, colors.skin);
    pixel(9, 15, colors.skin);
    pixel(18, 15, colors.skin);
    // Spine/ribs (more detailed)
    rect(10, 16, 8, 16, colors.skin);
    // Rib details (more detailed)
    rect(6, 18, 2, 2, colors.secondary);
    rect(20, 18, 2, 2, colors.secondary);
    rect(6, 24, 2, 2, colors.secondary);
    rect(20, 24, 2, 2, colors.secondary);
    rect(6, 30, 2, 2, colors.secondary);
    rect(20, 30, 2, 2, colors.secondary);
    // Arms (more detailed)
    rect(4, 18, 4, 12, colors.skin);
    rect(24, 18, 4, 12, colors.skin);
    // Hands/fingers
    pixel(3, 28, colors.skin);
    pixel(25, 28, colors.skin);
    // Legs (more detailed)
    rect(10, 32, 4, 8, colors.skin);
    rect(14, 32, 4, 8, colors.skin);
    // Feet
    pixel(10, 39, colors.skin);
    pixel(13, 39, colors.skin);
    pixel(14, 39, colors.skin);
    pixel(17, 39, colors.skin);
  } else if (monsterName === 'Zombie') {
    // Zombie: Decayed, greenish - uses 40x40 sprite (2x detail)
    // Head - decayed (more detailed)
    rect(8, 4, 12, 12, colors.skin);
    // Head shape
    pixel(7, 5, colors.skin);
    pixel(20, 5, colors.skin);
    // Eyes - hollow (more detailed)
    rect(10, 8, 2, 2, '#000000');
    rect(16, 8, 2, 2, '#000000');
    // Decay spots (more detailed)
    rect(12, 10, 2, 2, colors.secondary);
    rect(14, 12, 2, 2, colors.secondary);
    pixel(11, 11, colors.secondary);
    pixel(15, 13, colors.secondary);
    // Missing flesh
    pixel(9, 7, '#1c1917');
    pixel(19, 7, '#1c1917');
    // Body (more detailed)
    rect(10, 16, 8, 12, colors.primary);
    // Decay on body
    pixel(12, 18, colors.secondary);
    pixel(16, 20, colors.secondary);
    // Arms (one hanging) (more detailed)
    rect(4, 18, 4, 8, colors.skin);
    rect(24, 20, 4, 6, colors.skin);
    // Hands (decayed)
    pixel(3, 25, colors.skin);
    pixel(27, 25, colors.skin);
    // Legs (shuffling) (more detailed)
    rect(10, 28, 4, 8, colors.primary);
    rect(14, 28, 4, 8, colors.primary);
    // Feet (dragging)
    pixel(10, 35, colors.primary);
    pixel(13, 35, colors.primary);
    pixel(14, 35, colors.primary);
    pixel(17, 35, colors.primary);
  } else if (monsterName === 'Vampire') {
    // Vampire: Pale, fangs, cape - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Fangs (more detailed)
    rect(26, 20, 2, 2, '#ffffff');
    rect(30, 20, 2, 2, '#ffffff');
    pixel(27, 22, '#ffffff');
    pixel(31, 22, '#ffffff');
    // Eyes - red
    rect(24, 12, 2, 2, '#dc2626');
    rect(30, 12, 2, 2, '#dc2626');
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Cape (more detailed)
    rect(18, 28, 4, 28, colors.secondary);
    rect(26, 28, 4, 28, colors.secondary);
    // Cape details
    pixel(17, 30, colors.accent);
    pixel(29, 30, colors.accent);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
  } else if (monsterName === 'Werewolf') {
    // Werewolf: Hybrid wolf-human form - uses 48x48 sprite (2x detail)
    // Head - wolf-like snout, humanoid structure (more detailed)
    rect(12, 4, 24, 20, colors.skin);
    // Snout - prominent wolf snout (more detailed)
    rect(16, 16, 16, 8, colors.skin);
    pixel(15, 18, colors.skin);
    pixel(32, 18, colors.skin);
    // Ears - pointed wolf ears (more detailed)
    pixel(14, 6, colors.primary);
    pixel(15, 4, colors.primary);
    pixel(16, 3, colors.primary);
    pixel(32, 3, colors.primary);
    pixel(33, 4, colors.primary);
    pixel(34, 6, colors.primary);
    // Eyes - glowing yellow (more detailed)
    rect(18, 10, 2, 2, '#fbbf24');
    rect(28, 10, 2, 2, '#fbbf24');
    pixel(19, 11, '#000000'); // Pupils
    pixel(29, 11, '#000000');
    // Mouth - fanged (more detailed)
    rect(20, 20, 8, 4, '#000000');
    pixel(22, 20, '#ffffff'); // Fangs
    pixel(26, 20, '#ffffff');
    pixel(24, 22, '#ffffff');
    // Body - humanoid torso but covered in fur (more detailed)
    rect(14, 24, 20, 16, colors.primary);
    // Fur texture (more detailed)
    for (let y = 26; y < 38; y += 2) {
      for (let x = 16; x < 32; x += 2) {
        pixel(x, y, colors.secondary);
      }
    }
    // Arms - humanoid but with claws (more detailed)
    rect(6, 26, 6, 16, colors.skin);
    rect(36, 26, 6, 16, colors.skin);
    // Claws (more detailed)
    pixel(5, 40, colors.accent);
    pixel(6, 41, colors.accent);
    pixel(37, 40, colors.accent);
    pixel(38, 41, colors.accent);
    // Legs - digitigrade (wolf-like stance) (more detailed)
    rect(16, 40, 8, 12, colors.primary);
    rect(24, 40, 8, 12, colors.primary);
    // Paws (more detailed)
    pixel(17, 51, colors.accent);
    pixel(19, 51, colors.accent);
    pixel(25, 51, colors.accent);
    pixel(27, 51, colors.accent);
  } else if (monsterName === 'Demon') {
    // Demon: Horns, red/purple, menacing - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Horns (more detailed)
    pixel(24, 6, colors.accent);
    pixel(25, 4, colors.accent);
    pixel(40, 4, colors.accent);
    pixel(41, 6, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
    // Tail
    rect(38, 48, 4, 8, colors.primary);
  } else if (monsterName === 'Devil') {
    // Devil: Similar to demon but red - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Horns
    pixel(24, 6, colors.accent);
    pixel(40, 6, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
    // Tail
    rect(38, 48, 4, 8, colors.primary);
  } else if (monsterName === 'Beholder') {
    // Beholder: Large floating eye with tentacles - uses full 64x64 canvas (2x detail)
    // Main body - large spherical eye (more detailed)
    rect(8, 8, 48, 48, colors.primary);
    // Eye shape refinement
    pixel(7, 9, colors.primary);
    pixel(55, 9, colors.primary);
    pixel(7, 55, colors.primary);
    pixel(55, 55, colors.primary);
    // Central eye - white with black pupil (more detailed)
    rect(24, 24, 16, 16, '#ffffff');
    rect(28, 28, 8, 8, '#000000');
    // Eye shine (more detailed)
    rect(30, 30, 2, 2, '#ffffff');
    pixel(29, 31, '#ffffff');
    // Tentacles around the body (more detailed)
    // Top tentacles
    rect(20, 4, 2, 8, colors.secondary);
    rect(28, 2, 2, 10, colors.secondary);
    rect(36, 2, 2, 10, colors.secondary);
    rect(44, 4, 2, 8, colors.secondary);
    // Side tentacles
    rect(4, 20, 8, 2, colors.secondary);
    rect(2, 28, 10, 2, colors.secondary);
    rect(2, 36, 10, 2, colors.secondary);
    rect(4, 44, 8, 2, colors.secondary);
    rect(52, 20, 8, 2, colors.secondary);
    rect(52, 28, 10, 2, colors.secondary);
    rect(52, 36, 10, 2, colors.secondary);
    rect(52, 44, 8, 2, colors.secondary);
    // Bottom tentacles
    rect(20, 52, 2, 8, colors.secondary);
    rect(28, 52, 2, 10, colors.secondary);
    rect(36, 52, 2, 10, colors.secondary);
    rect(44, 52, 2, 8, colors.secondary);
    // Tentacle tips
    pixel(21, 3, colors.accent);
    pixel(29, 1, colors.accent);
    pixel(37, 1, colors.accent);
    pixel(45, 3, colors.accent);
    // Mouth - toothy maw below eye (more detailed)
    rect(28, 48, 8, 8, '#000000');
    pixel(26, 50, '#ffffff'); // Teeth
    pixel(30, 50, '#ffffff');
    pixel(34, 50, '#ffffff');
    pixel(38, 50, '#ffffff');
  } else if (monsterName === 'Mind Flayer') {
    // Mind Flayer: Humanoid with tentacle face - uses 48x48 sprite (2x detail)
    // Head - large, bulbous, pale purple/blue (more detailed)
    rect(12, 4, 24, 20, colors.skin);
    // Head shape
    pixel(11, 5, colors.skin);
    pixel(35, 5, colors.skin);
    // Face tentacles - 4-6 tentacles hanging from where mouth would be (more detailed)
    // Left side tentacles
    rect(14, 18, 2, 4, colors.secondary);
    rect(16, 20, 2, 4, colors.secondary);
    rect(14, 22, 2, 2, colors.secondary);
    // Right side tentacles
    rect(30, 18, 2, 4, colors.secondary);
    rect(28, 20, 2, 4, colors.secondary);
    rect(30, 22, 2, 2, colors.secondary);
    // Center tentacles
    rect(20, 20, 2, 4, colors.secondary);
    rect(22, 22, 2, 2, colors.secondary);
    rect(24, 20, 2, 4, colors.secondary);
    rect(26, 22, 2, 2, colors.secondary);
    // Eyes - large, white with black pupils (mind flayer eyes) (more detailed)
    rect(16, 8, 4, 4, '#ffffff');
    rect(28, 8, 4, 4, '#ffffff');
    rect(17, 9, 2, 2, '#000000');
    rect(29, 9, 2, 2, '#000000');
    // Body - robes, humanoid torso (more detailed)
    rect(14, 24, 20, 16, colors.primary);
    // Robe details
    rect(20, 26, 8, 2, colors.secondary);
    // Arms - thin, three-fingered hands (more detailed)
    rect(6, 26, 6, 16, colors.skin);
    rect(36, 26, 6, 16, colors.skin);
    // Fingers (more detailed)
    pixel(5, 40, colors.skin);
    pixel(6, 41, colors.skin);
    pixel(5, 42, colors.skin);
    pixel(37, 40, colors.skin);
    pixel(38, 41, colors.skin);
    pixel(37, 42, colors.skin);
    // Legs - humanoid (more detailed)
    rect(16, 40, 8, 12, colors.primary);
    rect(24, 40, 8, 12, colors.primary);
  } else if (monsterName === 'Lich') {
    // Lich: Undead wizard, robes, skeletal - uses 48x48 sprite (2x detail)
    // Robes (more detailed)
    rect(20, 28, 24, 28, colors.primary);
    // Robe details
    rect(24, 30, 16, 4, colors.secondary);
    // Skull (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Skull shape
    pixel(19, 9, colors.skin);
    pixel(43, 9, colors.skin);
    // Eye sockets (more detailed)
    rect(26, 14, 2, 2, '#000000');
    rect(38, 14, 2, 2, '#000000');
    // Glowing eyes
    pixel(27, 15, colors.accent);
    pixel(39, 15, colors.accent);
    // Staff (more detailed)
    rect(44, 16, 2, 36, '#78350f');
    // Staff top
    rect(42, 14, 6, 4, colors.accent);
    pixel(43, 13, colors.accent);
    pixel(44, 12, colors.accent);
    pixel(45, 13, colors.accent);
  } else if (monsterName === 'Giant') {
    // Giant: Very large humanoid - uses 64x64 sprite (2x detail)
    // Head (larger) (more detailed)
    rect(18, 6, 28, 20, colors.skin);
    // Head shape
    pixel(17, 7, colors.skin);
    pixel(45, 7, colors.skin);
    // Eyes
    rect(24, 12, 2, 2, '#000000');
    rect(38, 12, 2, 2, '#000000');
    // Body (larger) (more detailed)
    rect(18, 24, 28, 28, colors.primary);
    // Chest details
    rect(26, 28, 12, 4, colors.secondary);
    // Arms (thicker) (more detailed)
    rect(12, 26, 6, 24, colors.skin);
    rect(46, 26, 6, 24, colors.skin);
    // Shoulders
    rect(16, 24, 4, 4, colors.skin);
    rect(44, 24, 4, 4, colors.skin);
    // Hands
    pixel(11, 48, colors.skin);
    pixel(47, 48, colors.skin);
    // Legs (thicker) (more detailed)
    rect(20, 52, 12, 12, colors.primary);
    rect(32, 52, 12, 12, colors.primary);
    // Feet
    pixel(20, 63, colors.accent);
    pixel(23, 63, colors.accent);
    pixel(32, 63, colors.accent);
    pixel(35, 63, colors.accent);
  } else if (monsterName === 'Elemental') {
    // Elemental: Swirling energy form - uses 48x48 sprite (2x detail)
    // No defined shape - swirling energy (more detailed)
    // Main body - amorphous energy
    rect(14, 16, 20, 24, colors.primary);
    // Energy swirls throughout (more detailed)
    pixel(12, 14, colors.accent);
    pixel(16, 12, colors.accent);
    pixel(34, 12, colors.accent);
    pixel(38, 14, colors.accent);
    pixel(20, 18, colors.accent);
    pixel(28, 18, colors.accent);
    pixel(16, 24, colors.accent);
    pixel(32, 24, colors.accent);
    pixel(18, 30, colors.accent);
    pixel(30, 30, colors.accent);
    pixel(20, 36, colors.accent);
    pixel(28, 36, colors.accent);
    pixel(22, 40, colors.accent);
    pixel(26, 40, colors.accent);
    // More energy swirls
    pixel(14, 20, colors.accent);
    pixel(34, 20, colors.accent);
    pixel(16, 28, colors.accent);
    pixel(32, 28, colors.accent);
    // No distinct head - energy coalesces (more detailed)
    pixel(22, 8, colors.accent);
    pixel(24, 6, colors.accent);
    pixel(26, 8, colors.accent);
    pixel(20, 10, colors.accent);
    pixel(28, 10, colors.accent);
  } else if (monsterName === 'Undead') {
    // Undead: Generic undead creature - uses 48x48 sprite (2x detail)
    // Head - decayed (more detailed)
    rect(12, 4, 24, 20, colors.skin);
    // Head shape
    pixel(11, 5, colors.skin);
    pixel(35, 5, colors.skin);
    // Eye sockets (more detailed)
    rect(18, 10, 2, 2, '#000000');
    rect(28, 10, 2, 2, '#000000');
    // Decay spots (more detailed)
    rect(20, 14, 2, 2, colors.secondary);
    rect(30, 14, 2, 2, colors.secondary);
    pixel(19, 15, colors.secondary);
    pixel(31, 15, colors.secondary);
    // Missing flesh
    pixel(17, 12, '#1c1917');
    pixel(33, 12, '#1c1917');
    // Body (more detailed)
    rect(14, 24, 20, 16, colors.primary);
    // Decay on body
    pixel(16, 26, colors.secondary);
    pixel(32, 28, colors.secondary);
    // Arms - one hanging (more detailed)
    rect(6, 26, 6, 16, colors.skin);
    rect(36, 28, 6, 14, colors.skin);
    // Hands
    pixel(5, 40, colors.skin);
    pixel(41, 40, colors.skin);
    // Legs (more detailed)
    rect(16, 40, 8, 8, colors.primary);
    rect(24, 40, 8, 8, colors.primary);
    // Feet
    pixel(16, 47, colors.primary);
    pixel(19, 47, colors.primary);
    pixel(24, 47, colors.primary);
    pixel(27, 47, colors.primary);
  } else if (monsterName === 'Beast') {
    // Beast: Four-legged animal - uses 48x48 sprite (2x detail)
    // Head - animal head, forward-facing (more detailed)
    rect(12, 4, 16, 16, colors.skin);
    // Head shape
    pixel(11, 5, colors.skin);
    pixel(27, 5, colors.skin);
    // Snout (more detailed)
    rect(8, 16, 8, 6, colors.skin);
    pixel(7, 18, colors.skin);
    pixel(16, 18, colors.skin);
    // Ears - pointed animal ears (more detailed)
    pixel(12, 4, colors.primary);
    pixel(14, 2, colors.primary);
    pixel(15, 1, colors.primary);
    pixel(26, 1, colors.primary);
    pixel(28, 2, colors.primary);
    pixel(30, 4, colors.primary);
    // Eyes (more detailed)
    rect(14, 10, 2, 2, '#000000');
    rect(24, 10, 2, 2, '#000000');
    pixel(15, 11, '#fbbf24'); // Eye shine
    pixel(25, 11, '#fbbf24');
    // Body - quadrupedal, horizontal (more detailed)
    rect(16, 24, 20, 12, colors.primary);
    // Fur texture
    pixel(18, 26, colors.secondary);
    pixel(22, 26, colors.secondary);
    pixel(30, 26, colors.secondary);
    // Front legs (more detailed)
    rect(12, 32, 6, 12, colors.primary);
    rect(30, 32, 6, 12, colors.primary);
    // Back legs (more detailed)
    rect(20, 36, 6, 12, colors.primary);
    rect(34, 36, 6, 12, colors.primary);
    // Paws
    pixel(13, 43, colors.accent);
    pixel(16, 43, colors.accent);
    pixel(31, 43, colors.accent);
    pixel(34, 43, colors.accent);
    pixel(21, 47, colors.accent);
    pixel(24, 47, colors.accent);
    pixel(35, 47, colors.accent);
    pixel(38, 47, colors.accent);
    // Tail (more detailed)
    rect(36, 28, 4, 8, colors.primary);
    pixel(38, 26, colors.primary);
    pixel(40, 36, colors.primary);
  } else if (monsterName === 'Aberration') {
    // Aberration: Alien, otherworldly - uses 48x48 sprite (2x detail)
    // Head (alien) (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Head shape - irregular
    pixel(19, 9, colors.skin);
    pixel(43, 9, colors.skin);
    pixel(18, 11, colors.skin);
    pixel(44, 11, colors.skin);
    // Multiple eyes (more detailed)
    rect(24, 14, 2, 2, '#000000');
    rect(30, 14, 2, 2, '#000000');
    rect(36, 14, 2, 2, '#000000');
    pixel(25, 15, colors.accent); // Eye glow
    pixel(31, 15, colors.accent);
    pixel(37, 15, colors.accent);
    // Body (irregular) (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Irregular body details
    pixel(20, 30, colors.primary);
    pixel(42, 30, colors.primary);
    // Arms (tentacle-like) (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Tentacle details
    pixel(15, 32, colors.skin);
    pixel(27, 32, colors.skin);
    // Legs (irregular) (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
    // Irregular feet
    pixel(24, 63, colors.accent);
    pixel(27, 63, colors.accent);
    pixel(32, 63, colors.accent);
    pixel(35, 63, colors.accent);
  } else if (monsterName === 'Allosaurus') {
    // Allosaurus: Bipedal carnivorous dinosaur - uses 56x56 sprite (2x detail)
    // Head - large, with jaws (more detailed)
    rect(16, 4, 24, 16, colors.skin);
    // Head shape
    pixel(15, 5, colors.skin);
    pixel(39, 5, colors.skin);
    // Snout/jaws (more detailed)
    rect(12, 16, 8, 6, colors.skin);
    rect(36, 16, 8, 6, colors.skin);
    // Eyes (more detailed)
    rect(20, 8, 2, 2, '#000000');
    rect(34, 8, 2, 2, '#000000');
    pixel(21, 9, '#fbbf24'); // Eye shine
    pixel(35, 9, '#fbbf24');
    // Teeth (more detailed)
    rect(14, 18, 2, 2, '#ffffff');
    rect(38, 18, 2, 2, '#ffffff');
    pixel(13, 19, '#ffffff');
    pixel(39, 19, '#ffffff');
    // Body - horizontal, balanced on two legs (more detailed)
    rect(18, 24, 20, 16, colors.primary);
    // Scales
    pixel(20, 26, colors.secondary);
    pixel(30, 26, colors.secondary);
    // Arms - small forelimbs (more detailed)
    rect(12, 26, 4, 12, colors.skin);
    rect(40, 26, 4, 12, colors.skin);
    // Claws on arms (more detailed)
    pixel(11, 36, colors.accent);
    pixel(12, 37, colors.accent);
    pixel(41, 36, colors.accent);
    pixel(42, 37, colors.accent);
    // Legs - powerful hind legs (more detailed)
    rect(20, 40, 8, 16, colors.primary);
    rect(28, 40, 8, 16, colors.primary);
    // Leg muscles
    rect(21, 44, 6, 4, colors.secondary);
    rect(29, 44, 6, 4, colors.secondary);
    // Feet/claws (more detailed)
    pixel(20, 55, colors.accent);
    pixel(23, 55, colors.accent);
    pixel(26, 55, colors.accent);
    pixel(28, 55, colors.accent);
    pixel(31, 55, colors.accent);
    pixel(34, 55, colors.accent);
    // Tail - long balancing tail (more detailed)
    rect(36, 44, 6, 12, colors.primary);
    rect(38, 56, 4, 4, colors.primary);
    pixel(40, 60, colors.primary);
    pixel(41, 61, colors.primary);
  } else if (monsterName === 'Anklyosaurus') {
    // Anklyosaurus: Armored four-legged dinosaur - uses 56x56 sprite (2x detail)
    // Head - small, low to ground (more detailed)
    rect(16, 8, 16, 12, colors.skin);
    // Head shape
    pixel(15, 9, colors.skin);
    pixel(31, 9, colors.skin);
    // Beak (more detailed)
    rect(12, 16, 6, 4, colors.skin);
    pixel(11, 17, colors.skin);
    // Eyes (more detailed)
    rect(18, 12, 2, 2, '#000000');
    rect(28, 12, 2, 2, '#000000');
    pixel(19, 13, '#fbbf24'); // Eye shine
    pixel(29, 13, '#fbbf24');
    // Body - low, wide, heavily armored (more detailed)
    rect(18, 20, 20, 16, colors.primary);
    // Armor plates on back (more detailed)
    rect(16, 20, 24, 4, colors.secondary);
    rect(18, 24, 20, 2, colors.secondary);
    rect(20, 28, 16, 2, colors.secondary);
    rect(22, 32, 12, 2, colors.secondary);
    // Spikes on armor (more detailed)
    pixel(18, 18, colors.accent);
    pixel(24, 18, colors.accent);
    pixel(30, 18, colors.accent);
    pixel(36, 18, colors.accent);
    pixel(20, 22, colors.accent);
    pixel(28, 22, colors.accent);
    pixel(22, 26, colors.accent);
    pixel(30, 26, colors.accent);
    // Tail - club tail (more detailed)
    rect(38, 24, 6, 12, colors.primary);
    rect(40, 36, 4, 8, colors.secondary);
    // Club details
    pixel(41, 44, colors.accent);
    pixel(42, 44, colors.accent);
    pixel(41, 46, colors.accent);
    pixel(42, 46, colors.accent);
    // Four legs - short and stocky (more detailed)
    rect(14, 32, 4, 12, colors.primary);
    rect(24, 32, 4, 12, colors.primary);
    rect(32, 32, 4, 12, colors.primary);
    rect(38, 32, 4, 12, colors.primary);
    // Feet
    pixel(14, 43, colors.accent);
    pixel(17, 43, colors.accent);
    pixel(24, 43, colors.accent);
    pixel(27, 43, colors.accent);
    pixel(32, 43, colors.accent);
    pixel(35, 43, colors.accent);
    pixel(38, 43, colors.accent);
    pixel(41, 43, colors.accent);
  } else if (monsterName === 'Bugbear Stalker') {
    // Bugbear Stalker: Large humanoid, furry - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Ears
    pixel(22, 8, colors.primary);
    pixel(42, 8, colors.primary);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Fur texture
    pixel(24, 30, colors.secondary);
    pixel(36, 30, colors.secondary);
    // Arms (more detailed)
    rect(14, 30, 6, 20, colors.skin);
    rect(28, 30, 6, 20, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 10, 12, colors.primary);
    rect(34, 52, 10, 12, colors.primary);
  } else if (monsterName === 'Goblin Boss' || monsterName === 'Goblin Minion') {
    // Goblin variants: Similar to goblin but with variations - uses 40x40 sprite (2x detail)
    // Head - similar to goblin
    rect(8, 4, 12, 12, colors.skin);
    // Pointed ears
    pixel(16, 8, colors.primary);
    pixel(18, 6, colors.primary);
    pixel(22, 6, colors.primary);
    pixel(24, 8, colors.primary);
    // Body (more detailed)
    rect(10, 16, 8, 12, colors.primary);
    // Arms (more detailed)
    rect(4, 18, 4, 8, colors.skin);
    rect(20, 18, 4, 8, colors.skin);
    // Legs (more detailed)
    rect(10, 28, 4, 8, colors.primary);
    rect(14, 28, 4, 8, colors.primary);
    if (monsterName === 'Goblin Boss') {
      // Crown or special marking
      rect(20, 32, 8, 4, colors.accent);
    }
  } else if (monsterName === 'Hobgoblin Captain') {
    // Hobgoblin Captain: Large goblinoid, armored - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Armor
    rect(24, 36, 16, 4, colors.secondary);
    // Arms (more detailed)
    rect(14, 30, 6, 20, colors.skin);
    rect(28, 30, 6, 20, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 10, 12, colors.primary);
    rect(34, 52, 10, 12, colors.primary);
  } else if (monsterName === 'Pirate' || monsterName === 'Pirate Captain') {
    // Pirate: Humanoid with hat/bandana - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Hat/bandana (more detailed)
    rect(18, 6, 28, 6, colors.secondary);
    if (monsterName === 'Pirate Captain') {
      // Fancy hat decoration
      pixel(30, 4, colors.accent);
      pixel(32, 4, colors.accent);
    }
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
  } else if (monsterName === 'Pteradon') {
    // Pteradon: Flying reptile with wings - uses 48x48 sprite (2x detail)
    // Head - long beak (more detailed)
    rect(16, 4, 16, 8, colors.skin);
    rect(12, 8, 8, 4, colors.skin); // Beak extension
    // Eyes (more detailed)
    rect(18, 6, 2, 2, '#000000');
    rect(26, 6, 2, 2, '#000000');
    pixel(19, 7, '#fbbf24'); // Eye shine
    pixel(27, 7, '#fbbf24');
    // Body - small, compact (more detailed)
    rect(18, 12, 12, 12, colors.primary);
    // Wings - large membrane wings (more detailed)
    rect(4, 16, 12, 20, colors.secondary);
    rect(32, 16, 12, 20, colors.secondary);
    // Wing fingers/claws (more detailed)
    pixel(2, 20, colors.accent);
    pixel(2, 28, colors.accent);
    pixel(2, 36, colors.accent);
    pixel(46, 20, colors.accent);
    pixel(46, 28, colors.accent);
    pixel(46, 36, colors.accent);
    // Wing membrane details
    pixel(6, 18, colors.accent);
    pixel(42, 18, colors.accent);
    // Legs - small, with claws (more detailed)
    rect(20, 24, 4, 12, colors.primary);
    rect(24, 24, 4, 12, colors.primary);
    pixel(20, 35, colors.accent);
    pixel(23, 35, colors.accent);
    pixel(24, 35, colors.accent);
    pixel(27, 35, colors.accent);
  } else if (monsterName === 'Sphinx of Wonder') {
    // Sphinx: Lion body with human head - uses full 64x64 canvas (2x detail)
    // Human head - on lion body (more detailed)
    rect(20, 4, 24, 20, colors.skin);
    // Human features (more detailed)
    rect(26, 10, 2, 2, '#000000'); // Eyes
    rect(38, 10, 2, 2, '#000000');
    rect(28, 14, 8, 4, colors.primary); // Nose
    rect(26, 18, 12, 2, '#000000'); // Mouth
    // Lion body - quadrupedal (more detailed)
    rect(16, 24, 32, 20, colors.primary);
    // Mane around human head (more detailed)
    pixel(16, 8, colors.hair);
    pixel(18, 6, colors.hair);
    pixel(44, 6, colors.hair);
    pixel(46, 8, colors.hair);
    pixel(14, 12, colors.hair);
    pixel(48, 12, colors.hair);
    // Front legs (more detailed)
    rect(12, 36, 8, 16, colors.primary);
    rect(28, 36, 8, 16, colors.primary);
    // Back legs (more detailed)
    rect(20, 40, 8, 16, colors.primary);
    rect(36, 40, 8, 16, colors.primary);
    // Paws
    pixel(13, 51, colors.accent);
    pixel(16, 51, colors.accent);
    pixel(29, 51, colors.accent);
    pixel(32, 51, colors.accent);
    pixel(21, 55, colors.accent);
    pixel(24, 55, colors.accent);
    pixel(37, 55, colors.accent);
    pixel(40, 55, colors.accent);
    // Tail - lion tail (more detailed)
    rect(40, 44, 4, 12, colors.primary);
    pixel(42, 54, colors.primary);
    pixel(43, 56, colors.primary);
  } else if (monsterName === 'Swarm of Crawling Claws') {
    // Swarm of Crawling Claws: Multiple animated severed hands - uses 40x40 sprite (2x detail)
    // Multiple hands scattered around - no central body (more detailed)
    // Hand 1 - top left
    rect(4, 4, 6, 8, colors.skin);
    pixel(2, 6, colors.skin); // Thumb
    pixel(8, 8, colors.skin); // Fingers
    pixel(8, 10, colors.skin);
    // Hand 2 - top right
    rect(30, 4, 6, 8, colors.skin);
    pixel(36, 6, colors.skin); // Thumb
    pixel(30, 8, colors.skin); // Fingers
    pixel(30, 10, colors.skin);
    // Hand 3 - middle left
    rect(4, 16, 6, 8, colors.skin);
    pixel(2, 18, colors.skin);
    pixel(8, 20, colors.skin);
    // Hand 4 - middle right
    rect(30, 16, 6, 8, colors.skin);
    pixel(36, 18, colors.skin);
    pixel(30, 20, colors.skin);
    // Hand 5 - bottom center
    rect(16, 28, 6, 8, colors.skin);
    pixel(14, 30, colors.skin);
    pixel(22, 32, colors.skin);
    pixel(22, 34, colors.skin);
    // Hand 6 - bottom left
    rect(4, 28, 6, 8, colors.skin);
    pixel(2, 30, colors.skin);
    // Hand 7 - bottom right
    rect(30, 28, 6, 8, colors.skin);
    pixel(36, 30, colors.skin);
  } else if (monsterName === 'Tough Boss') {
    // Tough Boss: Large, muscular, intimidating - uses 64x64 sprite (2x detail)
    // Head (more detailed)
    rect(18, 6, 28, 20, colors.skin);
    // Body (more detailed)
    rect(18, 24, 28, 28, colors.primary);
    // Chest armor
    rect(24, 36, 16, 4, colors.secondary);
    // Arms (more detailed)
    rect(12, 26, 6, 24, colors.skin);
    rect(46, 26, 6, 24, colors.skin);
    // Legs (more detailed)
    rect(20, 52, 12, 12, colors.primary);
    rect(32, 52, 12, 12, colors.primary);
  } else if (monsterName === 'Troll Limb') {
    // Troll Limb: Part of a troll, regenerating - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Warts
    pixel(26, 14, colors.secondary);
    pixel(38, 14, colors.secondary);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(14, 30, 6, 20, colors.skin);
    rect(28, 30, 6, 20, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 10, 12, colors.primary);
    rect(34, 52, 10, 12, colors.primary);
  } else if (monsterName === 'Vampire Familiar') {
    // Vampire Familiar: Small bat-like creature - uses 40x40 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Bat ears
    pixel(18, 10, colors.primary);
    pixel(46, 10, colors.primary);
    // Body (more detailed)
    rect(24, 28, 16, 20, colors.primary);
    // Wings
    rect(16, 30, 8, 16, colors.secondary);
    rect(24, 30, 8, 16, colors.secondary);
    // Legs (more detailed)
    rect(26, 48, 6, 8, colors.primary);
    rect(32, 48, 6, 8, colors.primary);
  } else if (monsterName === 'Hezrou' || monsterName === 'Nalfeshnee') {
    // Hezrou/Nalfeshnee: Large demon, toad-like - uses 56x56 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Horns
    pixel(24, 6, colors.accent);
    pixel(40, 6, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(14, 30, 6, 20, colors.skin);
    rect(28, 30, 6, 20, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 10, 12, colors.primary);
    rect(34, 52, 10, 12, colors.primary);
    // Tail
    rect(38, 48, 4, 8, colors.primary);
  } else if (monsterName === 'Manes' || monsterName === 'Lemure' || monsterName === 'Swarm of Lemures') {
    // Manes/Lemure: Weak undead/devil - uses 40x40 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Decay/features
    pixel(26, 16, colors.secondary);
    pixel(38, 16, colors.secondary);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
  } else if (monsterName === 'Marilith') {
    // Marilith: Snake body with upper torso and 6 arms - uses 56x56 sprite (2x detail)
    // Upper torso - humanoid female upper body (more detailed)
    rect(18, 4, 20, 16, colors.skin);
    // Head (more detailed)
    rect(20, 4, 16, 12, colors.skin);
    rect(24, 8, 2, 2, '#000000'); // Eyes
    rect(32, 8, 2, 2, '#000000');
    // Horns (more detailed)
    pixel(22, 2, colors.accent);
    pixel(34, 2, colors.accent);
    pixel(24, 1, colors.accent);
    pixel(32, 1, colors.accent);
    // Six arms - three on each side (more detailed)
    rect(8, 8, 4, 12, colors.skin);
    rect(12, 10, 4, 12, colors.skin);
    rect(16, 12, 4, 12, colors.skin);
    rect(40, 8, 4, 12, colors.skin);
    rect(44, 10, 4, 12, colors.skin);
    rect(36, 12, 4, 12, colors.skin);
    // Snake body - coils downward (more detailed)
    rect(22, 20, 12, 8, colors.primary);
    rect(24, 28, 8, 12, colors.primary);
    rect(26, 40, 4, 16, colors.primary);
    // Snake scales (more detailed)
    pixel(24, 24, colors.secondary);
    pixel(30, 24, colors.secondary);
    pixel(26, 32, colors.secondary);
    pixel(28, 36, colors.secondary);
  } else if (monsterName === 'Quasit') {
    // Quasit: Small demon - uses 40x40 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Horns
    pixel(24, 6, colors.accent);
    pixel(40, 6, colors.accent);
    // Body (more detailed)
    rect(24, 28, 16, 20, colors.primary);
    // Arms (more detailed)
    rect(18, 30, 6, 12, colors.skin);
    rect(24, 30, 6, 12, colors.skin);
    // Legs (more detailed)
    rect(26, 48, 6, 8, colors.primary);
    rect(32, 48, 6, 8, colors.primary);
  } else if (monsterName === 'Shadow Demon') {
    // Shadow Demon: Dark, shadowy - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Horns
    pixel(24, 6, colors.accent);
    pixel(40, 6, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Shadowy details
    pixel(24, 30, colors.secondary);
    pixel(38, 30, colors.secondary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
    // Tail
    rect(38, 48, 4, 8, colors.primary);
  } else if (monsterName === 'Vrock') {
    // Vrock: Vulture-like demon, wings - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Beak
    rect(18, 16, 4, 4, colors.primary);
    // Horns
    pixel(24, 6, colors.accent);
    pixel(40, 6, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 20, colors.primary);
    // Wings (more detailed)
    rect(10, 32, 8, 16, colors.secondary);
    rect(30, 32, 8, 16, colors.secondary);
    // Legs (more detailed)
    rect(24, 48, 8, 12, colors.primary);
    rect(32, 48, 8, 12, colors.primary);
  } else if (monsterName === 'Yochlol') {
    // Yochlol: Spider-like demon - uses 48x48 sprite (2x detail)
    // Body - spider abdomen (more detailed)
    rect(16, 24, 16, 16, colors.primary);
    // Abdomen details
    pixel(18, 26, colors.secondary);
    pixel(30, 26, colors.secondary);
    // Head/cephalothorax - smaller front section (more detailed)
    rect(18, 12, 12, 12, colors.skin);
    // Eyes - multiple spider eyes (more detailed)
    rect(20, 14, 2, 2, '#000000');
    rect(24, 14, 2, 2, '#000000');
    rect(28, 14, 2, 2, '#000000');
    rect(22, 16, 2, 2, '#000000');
    rect(26, 16, 2, 2, '#000000');
    // Eight legs - four on each side (more detailed)
    rect(8, 16, 4, 12, colors.skin);
    rect(10, 20, 4, 12, colors.skin);
    rect(34, 16, 4, 12, colors.skin);
    rect(36, 20, 4, 12, colors.skin);
    rect(12, 28, 4, 12, colors.skin);
    rect(14, 32, 4, 12, colors.skin);
    rect(30, 28, 4, 12, colors.skin);
    rect(32, 32, 4, 12, colors.skin);
    // Fangs (more detailed)
    rect(20, 22, 2, 2, colors.accent);
    rect(28, 22, 2, 2, colors.accent);
  } else if (monsterName === 'Barbed Devil' || monsterName === 'Bearded Devil' || monsterName === 'Horned Devil' || monsterName === 'Pit Fiend' || monsterName === 'Erinyes') {
    // Various devils: Similar structure, different details - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Horns
    pixel(24, 6, colors.accent);
    pixel(40, 6, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
    // Tail
    rect(38, 48, 4, 8, colors.primary);
    if (monsterName === 'Barbed Devil') {
      // Barbs
      pixel(26, 32, colors.accent);
      pixel(38, 32, colors.accent);
    }
  } else if (monsterName === 'Bone Devil') {
    // Bone Devil: Skeletal devil - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Eye sockets
    rect(26, 14, 2, 2, '#000000');
    rect(38, 14, 2, 2, '#000000');
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.skin);
    // Ribs
    rect(24, 32, 16, 4, colors.secondary);
    rect(24, 38, 16, 4, colors.secondary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.skin);
    rect(32, 52, 8, 12, colors.skin);
  } else if (monsterName === 'Chain Devil') {
    // Chain Devil: Wrapped in chains - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Chains
    rect(24, 32, 16, 2, colors.secondary);
    rect(24, 38, 16, 2, colors.secondary);
    rect(24, 44, 16, 2, colors.secondary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
  } else if (monsterName === 'Dao') {
    // Dao: Earth genie, rocky - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Rocky features
    pixel(26, 14, colors.secondary);
    pixel(38, 14, colors.secondary);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
  } else if (monsterName === 'Ice Devil') {
    // Ice Devil: Blue-white, icy - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Horns
    pixel(24, 6, colors.accent);
    pixel(40, 6, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
    // Tail
    rect(38, 48, 4, 8, colors.primary);
  } else if (monsterName === 'Efreeti') {
    // Efreeti: Fire genie - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Fire features
    pixel(26, 14, colors.accent);
    pixel(38, 14, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
  } else if (monsterName === 'Imp') {
    // Imp: Small devil - uses 40x40 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Horns
    pixel(24, 6, colors.accent);
    pixel(40, 6, colors.accent);
    // Body (more detailed)
    rect(24, 28, 16, 20, colors.primary);
    // Arms (more detailed)
    rect(18, 30, 6, 12, colors.skin);
    rect(24, 30, 6, 12, colors.skin);
    // Legs (more detailed)
    rect(26, 48, 6, 8, colors.primary);
    rect(32, 48, 6, 8, colors.primary);
    // Tail
    rect(38, 44, 4, 12, colors.primary);
  } else if (monsterName === 'Marid') {
    // Marid: Water genie - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Water features
    pixel(26, 14, colors.accent);
    pixel(38, 14, colors.accent);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
  } else if (monsterName === 'White Dragon') {
    // White Dragon: Ice dragon - same form as regular dragon but white/blue - uses full 64x64 canvas (2x detail)
    // Head - reptilian, at end of long neck (more detailed)
    rect(8, 4, 16, 12, colors.skin);
    // Head shape refinement
    pixel(7, 5, colors.skin);
    pixel(24, 5, colors.skin);
    pixel(6, 7, colors.skin);
    pixel(25, 7, colors.skin);
    // Long neck connecting to body (more detailed)
    rect(12, 16, 8, 12, colors.skin);
    // Neck scales
    for (let y = 18; y < 26; y += 2) {
      pixel(14, y, colors.secondary);
      pixel(18, y, colors.secondary);
    }
    // Snout/jaw (more detailed)
    rect(4, 8, 6, 6, colors.skin);
    rect(22, 8, 6, 6, colors.skin);
    // Teeth
    pixel(5, 10, '#ffffff');
    pixel(6, 11, '#ffffff');
    pixel(25, 10, '#ffffff');
    pixel(24, 11, '#ffffff');
    // Horns - ice crystals (more detailed)
    pixel(10, 2, colors.accent);
    pixel(11, 1, colors.accent);
    pixel(20, 1, colors.accent);
    pixel(21, 2, colors.accent);
    pixel(12, 0, colors.accent);
    pixel(19, 0, colors.accent);
    // Eyes (more detailed)
    rect(10, 8, 2, 2, '#000000');
    rect(20, 8, 2, 2, '#000000');
    pixel(9, 9, '#fbbf24'); // Eye shine
    pixel(21, 9, '#fbbf24');
    // Body - large barrel chest, quadrupedal stance (more detailed)
    rect(16, 28, 32, 20, colors.primary);
    // Ice scales pattern (more detailed)
    for (let y = 30; y < 46; y += 2) {
      for (let x = 18; x < 46; x += 2) {
        pixel(x, y, colors.secondary);
      }
    }
    // Scale highlights
    for (let y = 31; y < 45; y += 4) {
      for (let x = 19; x < 45; x += 4) {
        pixel(x, y, colors.accent);
      }
    }
    // Wings - large bat-like wings (more detailed)
    rect(0, 24, 16, 24, colors.secondary);
    rect(48, 24, 16, 24, colors.secondary);
    // Wing membrane details (more detailed)
    for (let y = 26; y < 46; y += 2) {
      pixel(2, y, colors.accent);
      pixel(62, y, colors.accent);
    }
    // Wing bones/fingers
    rect(4, 26, 2, 20, colors.accent);
    rect(58, 26, 2, 20, colors.accent);
    rect(6, 28, 2, 16, colors.accent);
    rect(56, 28, 2, 16, colors.accent);
    // Front legs (more detailed)
    rect(12, 40, 6, 16, colors.primary);
    rect(22, 40, 6, 16, colors.primary);
    // Front leg muscles
    rect(13, 44, 4, 4, colors.secondary);
    rect(23, 44, 4, 4, colors.secondary);
    // Hind legs (more detailed)
    rect(36, 44, 6, 16, colors.primary);
    rect(46, 44, 6, 16, colors.primary);
    // Hind leg muscles
    rect(37, 48, 4, 4, colors.secondary);
    rect(47, 48, 4, 4, colors.secondary);
    // Claws (more detailed)
    pixel(12, 55, colors.accent);
    pixel(14, 55, colors.accent);
    pixel(16, 55, colors.accent);
    pixel(22, 55, colors.accent);
    pixel(24, 55, colors.accent);
    pixel(26, 55, colors.accent);
    pixel(36, 59, colors.accent);
    pixel(38, 59, colors.accent);
    pixel(40, 59, colors.accent);
    pixel(46, 59, colors.accent);
    pixel(48, 59, colors.accent);
    pixel(50, 59, colors.accent);
    // Tail (more detailed)
    rect(48, 48, 6, 12, colors.primary);
    rect(50, 60, 4, 4, colors.primary);
    pixel(52, 63, colors.primary);
    pixel(53, 63, colors.primary);
    // Tail spikes
    pixel(49, 50, colors.accent);
    pixel(51, 52, colors.accent);
    pixel(49, 54, colors.accent);
    pixel(51, 56, colors.accent);
    // Ice breath effect
    pixel(6, 10, colors.accent);
    pixel(24, 10, colors.accent);
  } else if (monsterName === 'Blob of Annihilation') {
    // Blob of Annihilation: Dark, formless entity - uses full 64x64 canvas (2x detail)
    // Main blob - irregular shape (more detailed)
    rect(12, 12, 40, 40, colors.primary);
    // Irregular edges (more detailed)
    pixel(10, 16, colors.primary);
    pixel(10, 24, colors.primary);
    pixel(10, 32, colors.primary);
    pixel(10, 40, colors.primary);
    pixel(54, 16, colors.primary);
    pixel(54, 24, colors.primary);
    pixel(54, 32, colors.primary);
    pixel(54, 40, colors.primary);
    pixel(16, 10, colors.primary);
    pixel(24, 10, colors.primary);
    pixel(32, 10, colors.primary);
    pixel(40, 10, colors.primary);
    pixel(48, 10, colors.primary);
    pixel(16, 54, colors.primary);
    pixel(24, 54, colors.primary);
    pixel(32, 54, colors.primary);
    pixel(40, 54, colors.primary);
    pixel(48, 54, colors.primary);
    // More irregular edges
    pixel(11, 14, colors.primary);
    pixel(11, 18, colors.primary);
    pixel(11, 22, colors.primary);
    pixel(11, 26, colors.primary);
    pixel(11, 30, colors.primary);
    pixel(11, 34, colors.primary);
    pixel(11, 38, colors.primary);
    pixel(11, 42, colors.primary);
    pixel(53, 14, colors.primary);
    pixel(53, 18, colors.primary);
    pixel(53, 22, colors.primary);
    pixel(53, 26, colors.primary);
    pixel(53, 30, colors.primary);
    pixel(53, 34, colors.primary);
    pixel(53, 38, colors.primary);
    pixel(53, 42, colors.primary);
    // Void eyes - dark spots (more detailed)
    rect(22, 22, 2, 2, colors.secondary);
    rect(40, 22, 2, 2, colors.secondary);
    rect(30, 30, 2, 2, colors.secondary);
    rect(22, 40, 2, 2, colors.secondary);
    rect(40, 40, 2, 2, colors.secondary);
    // Swirling darkness (more detailed)
    pixel(26, 26, colors.accent);
    pixel(36, 26, colors.accent);
    pixel(26, 36, colors.accent);
    pixel(36, 36, colors.accent);
    pixel(28, 28, colors.accent);
    pixel(34, 28, colors.accent);
    pixel(28, 34, colors.accent);
    pixel(34, 34, colors.accent);
  } else {
    // Default monster shape - uses 48x48 sprite (2x detail)
    // Head (more detailed)
    rect(20, 8, 24, 20, colors.skin);
    // Body (more detailed)
    rect(22, 28, 20, 24, colors.primary);
    // Arms (more detailed)
    rect(16, 30, 6, 16, colors.skin);
    rect(26, 30, 6, 16, colors.skin);
    // Legs (more detailed)
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
  }

  // Monsters don't use facial expressions - they have fixed appearances

  // Draw damage indicators (bruising/blood) based on HP loss - updated for 64x64
  if (hpPercent < 1 && !isDefeated) {
    const damageLevel = 1 - hpPercent;
    
    // Draw damage on exposed areas (updated coordinates for 64x64)
    if (damageLevel > 0.2) {
      const bodyDamage = Math.min(damageLevel * 1.1, 1);
      pixel(26, 32, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.6, 0.5)})`);
      pixel(38, 32, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.6, 0.5)})`);
      if (damageLevel > 0.5) {
        pixel(30, 36, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.8, 0.7)})`);
        pixel(32, 36, `rgba(139, 0, 0, ${Math.min(bodyDamage * 0.8, 0.7)})`);
      }
    }
    
    // Subtle red overlay for overall damage
    const damageOverlay = Math.min(0.15, (1 - hpPercent) * 0.25);
    ctx.fillStyle = `rgba(220, 38, 38, ${damageOverlay})`;
    ctx.fillRect(0, 0, size, size);
  }

  // Stats-based visual indicators - updated for 64x64
  // High AC = more armor detail
  if (monsterClass.armorClass >= 17) {
    rect(22, 36, 20, 4, colors.secondary);
  }

  // High attack bonus = weapon/ability glow
  if (monsterClass.attackBonus >= 5) {
    ctx.fillStyle = `rgba(251, 191, 36, 0.3)`;
    ctx.fillRect(40 * pixelSize, 20 * pixelSize, 12 * pixelSize, 16 * pixelSize);
  }
}

