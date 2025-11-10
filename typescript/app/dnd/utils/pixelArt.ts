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
    Cleric: { primary: '#78350f', secondary: '#92400e', accent: '#fbbf24', skin: '#fde68a', hair: '#92400e' },
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
  emotion: CharacterEmotion,
  animationFrame: number = 0,
  shouldCast: boolean = false,
  isHealing: boolean = false,
  isAttacking: boolean = false
) {
  const GRID_SIZE = 64; // Base sprite is now 64x64 for more detail
  const scale = size / GRID_SIZE; // Scale to desired size
  const pixelSize = scale;

  // Calculate animation progress (0 to 1, cycles smoothly)
  const animationProgress = (animationFrame / 60) * Math.PI * 2;
  const hasAnimation = animationFrame > 0;

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
    // Bard: Flamboyant feathered hat with multiple plumes
    rect(20, 4, 24, 6, '#dc2626'); // Red hat base
    // Multiple colorful plumes
    rect(44, 0, 2, 10, '#fbbf24'); // Yellow plume
    rect(46, 1, 2, 9, '#8b5cf6'); // Purple plume
    rect(48, 2, 2, 8, '#22c55e'); // Green plume
    pixel(45, 0, '#fbbf24');
    pixel(47, 1, '#8b5cf6');
    pixel(49, 2, '#22c55e');
    // Decorative band with gems
    rect(22, 6, 20, 1, '#fbbf24'); // Gold band
    pixel(26, 5, '#ffffff'); // Gem
    pixel(32, 5, '#ffffff'); // Gem
    pixel(38, 5, '#ffffff'); // Gem
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

  // Body/Torso - more detailed (moves with fighter animation)
  let torsoOffsetX = 0;
  let torsoOffsetY = 0;
  if (hasAnimation && playerClass.name === 'Fighter') {
    const swordOffsetX = Math.sin(animationProgress * 0.9) * 2.0;
    const swordOffsetY = Math.sin(animationProgress * 0.9) * -2.5;
    torsoOffsetX = swordOffsetX * 0.3;
    torsoOffsetY = swordOffsetY * 0.2;
  }
  
  // Cleric-specific: Make torso more visible with lighter color and highlights
  if (playerClass.name === 'Cleric') {
    const clericTorsoColor = '#a0522d'; // Sienna brown - lighter and more visible
    const clericTorsoSecondary = '#8b4513'; // Saddle brown
    const clericTorsoHighlight = '#cd853f'; // Peru - lighter highlight
    rect(22 + torsoOffsetX, 28 + torsoOffsetY, 20, 24, clericTorsoColor);
    // Chest details with highlights
    rect(28 + torsoOffsetX, 30 + torsoOffsetY, 8, 4, clericTorsoSecondary);
    rect(26 + torsoOffsetX, 34 + torsoOffsetY, 12, 2, clericTorsoSecondary);
    // Add highlights for visibility
    rect(24 + torsoOffsetX, 30 + torsoOffsetY, 4, 2, clericTorsoHighlight);
    rect(36 + torsoOffsetX, 30 + torsoOffsetY, 4, 2, clericTorsoHighlight);
    pixel(30 + torsoOffsetX, 32 + torsoOffsetY, clericTorsoHighlight);
    pixel(34 + torsoOffsetX, 32 + torsoOffsetY, clericTorsoHighlight);
  } else if (playerClass.name === 'Bard') {
    // Bard: Red flamboyant wardrobe
    rect(22 + torsoOffsetX, 28 + torsoOffsetY, 20, 24, '#dc2626'); // Red primary
    // Chest details with gold trim
    rect(28 + torsoOffsetX, 30 + torsoOffsetY, 8, 4, '#991b1b'); // Darker red
    rect(26 + torsoOffsetX, 34 + torsoOffsetY, 12, 2, '#991b1b');
    // Gold decorative trim
    pixel(24 + torsoOffsetX, 30 + torsoOffsetY, '#fbbf24'); // Gold trim
    pixel(40 + torsoOffsetX, 30 + torsoOffsetY, '#fbbf24');
    pixel(24 + torsoOffsetX, 48 + torsoOffsetY, '#fbbf24');
    pixel(40 + torsoOffsetX, 48 + torsoOffsetY, '#fbbf24');
  } else {
    rect(22 + torsoOffsetX, 28 + torsoOffsetY, 20, 24, colors.primary);
    // Chest details
    rect(28 + torsoOffsetX, 30 + torsoOffsetY, 8, 4, colors.secondary);
    rect(26 + torsoOffsetX, 34 + torsoOffsetY, 12, 2, colors.secondary);
  }
  
  // Shoulders (always drawn, move with fighter animation)
  let shoulderLeftOffsetX = 0;
  let shoulderLeftOffsetY = 0;
  let shoulderRightOffsetX = 0;
  let shoulderRightOffsetY = 0;
  if (hasAnimation && playerClass.name === 'Fighter') {
    const swordOffsetX = Math.sin(animationProgress * 0.9) * 2.0;
    const swordOffsetY = Math.sin(animationProgress * 0.9) * -2.5;
    shoulderLeftOffsetX = -swordOffsetX * 0.3;
    shoulderLeftOffsetY = swordOffsetY * 0.2;
    shoulderRightOffsetX = swordOffsetX * 0.4;
    shoulderRightOffsetY = swordOffsetY * 0.3;
  }
  rect(20 + shoulderLeftOffsetX, 28 + shoulderLeftOffsetY, 4, 4, colors.skin);
  rect(40 + shoulderRightOffsetX, 28 + shoulderRightOffsetY, 4, 4, colors.skin);
  
  // Arms - class-specific animations
  if (playerClass.name === 'Bard') {
    if (hasAnimation) {
      // Bard: Rocking motion - whole guitar and arms rock back and forth like playing
      const rockAngle = Math.sin(animationProgress * 1.5) * 0.15; // Rocking angle (radians)
      const rockOffsetX = Math.sin(animationProgress * 1.5) * 2.0; // Horizontal rocking
      const rockOffsetY = Math.cos(animationProgress * 1.5) * 1.5; // Vertical rocking
      // Left arm holding guitar neck at far left side (rocks with guitar)
      // Note: Right arm (strumming hand) is drawn after guitar in class-specific features section
      rect(10 + Math.round(rockOffsetX), 24 + Math.round(rockOffsetY), 6, 20, colors.skin);
    } else {
      // Static: Left arm holding guitar neck
      // Note: Right arm (strumming hand) is drawn after guitar in class-specific features section
      rect(10, 24, 6, 20, colors.skin);
    }
  } else if (hasAnimation && playerClass.name === 'Ranger') {
    // Ranger: Drawing bow - left arm holds bow steady, right arm pulls back
    const drawProgress = (Math.sin(animationProgress) + 1) / 2; // 0 to 1
    const pullBack = drawProgress * 4; // Pull back 0-4 pixels (more pronounced)
    // Left arm holding bow (steady)
    rect(16, 30, 6, 16, colors.skin);
    // Right arm pulling back bowstring
    rect(42 - pullBack, 30, 6, 16, colors.skin);
  } else if (hasAnimation && playerClass.name === 'Wizard') {
    // Wizard: Casting motion - hands move in arcane gesture
    const castOffset = Math.sin(animationProgress * 1.5) * 3.0;
    const castOffset2 = Math.sin(animationProgress * 1.5 + Math.PI / 2) * 2.5;
    // Left arm (casting gesture)
    rect(16, 30 + castOffset, 6, 16, colors.skin);
    // Right arm (holding staff, slight movement)
    rect(42, 30 + castOffset2, 6, 16, colors.skin);
  } else if (hasAnimation && playerClass.name === 'Sorcerer') {
    // Sorcerer: Magical gesture - hands channeling magic
    const magicOffset = Math.sin(animationProgress * 2) * 3.0;
    // Both arms channeling magic
    rect(16, 30 + magicOffset, 6, 16, colors.skin);
    rect(42, 30 - magicOffset, 6, 16, colors.skin);
  } else if (hasAnimation && playerClass.name === 'Monk') {
    // Monk: Meditative stance - breathing motion
    const breathOffset = Math.sin(animationProgress * 0.8) * 2.0;
    rect(16, 30 + breathOffset, 6, 16, colors.skin);
    rect(42, 30 + breathOffset, 6, 16, colors.skin);
  } else if (playerClass.name === 'Cleric') {
    // Cleric: Holding scepter with both hands in center, raising it high above head
    // When idle: animate raising and lowering
    // When attacking/healing: keep scepter at highest position (casting pose)
    let handRaise: number;
    if (hasAnimation) {
      // Idle animation: scepter raises and lowers
      const raiseProgress = (Math.sin(animationProgress * 0.8) + 1) / 2; // 0 to 1
      const scepterRaise = raiseProgress * -12; // Negative Y means up (raises from 0 to -12 pixels)
      handRaise = scepterRaise * 0.8; // Hands move 80% of scepter movement (up to -9.6 pixels)
    } else {
      // Not idle (attacking/healing): scepter at highest position (casting)
      handRaise = -12 * 0.8; // Maximum raise position (-9.6 pixels)
    }
    // Both hands positioned in center to hold scepter
    // Left hand (slightly left of center)
    rect(28, 30 + handRaise, 6, 16, colors.skin);
    // Right hand (slightly right of center)
    rect(30, 30 + handRaise, 6, 16, colors.skin);
  } else if (hasAnimation && playerClass.name === 'Druid') {
    // Druid: Nature connection - gentle sway
    const natureSway = Math.sin(animationProgress * 0.7) * 2.5;
    rect(16, 30 + natureSway, 6, 16, colors.skin);
    rect(42, 30 - natureSway, 6, 16, colors.skin);
  } else if (hasAnimation && playerClass.name === 'Fighter') {
    // Fighter: Sword arm moves diagonally up and away, with body following the motion
    const swordOffsetX = Math.sin(animationProgress * 0.9) * 2.0; // Horizontal movement
    const swordOffsetY = Math.sin(animationProgress * 0.9) * -2.5; // Upward movement (negative Y)
    // Body parts move together - torso and shoulders follow the sword arm motion
    const bodyOffsetX = swordOffsetX * 0.3; // Torso moves slightly with arm
    const bodyOffsetY = swordOffsetY * 0.2; // Torso moves slightly with arm
    const leftArmOffsetX = -swordOffsetX * 0.4; // Left arm counterbalances
    const leftArmOffsetY = swordOffsetY * 0.3; // Left arm moves slightly up
    rect(16 + leftArmOffsetX, 30 + leftArmOffsetY, 6, 16, colors.skin); // Left arm counterbalances
    rect(42 + swordOffsetX, 30 + swordOffsetY, 6, 16, colors.skin); // Right arm with sword moves diagonally
  } else if (hasAnimation && playerClass.name === 'Paladin') {
    // Paladin: Holding weapon with holy readiness
    const holyReady = Math.sin(animationProgress * 1.0) * 1.8;
    rect(16, 30 + holyReady, 6, 16, colors.skin);
    rect(42, 30 + holyReady * 0.6, 6, 16, colors.skin);
  } else if (playerClass.name === 'Rogue') {
    // Rogue: Crossed arms in X pattern with daggers
    if (hasAnimation) {
      // Animated: quick subtle movements
      const daggerCheck = Math.sin(animationProgress * 1.8) * 2.0;
      // Left arm crosses over to right side (X pattern)
      rect(28, 30 + daggerCheck, 6, 16, colors.skin);
      // Right arm crosses over to left side (X pattern)
      rect(30, 30 - daggerCheck * 0.7, 6, 16, colors.skin);
    } else {
      // Static: crossed arms in X pattern
      // Left arm crosses over to right side (X pattern)
      rect(28, 30, 6, 16, colors.skin);
      // Right arm crosses over to left side (X pattern)
      rect(30, 30, 6, 16, colors.skin);
    }
  } else if (hasAnimation && playerClass.name === 'Barbarian') {
    // Barbarian: Aggressive stance - ready to fight
    const battleReady = Math.sin(animationProgress * 1.1) * 2.2;
    rect(16, 30 + battleReady, 6, 16, colors.skin);
    rect(42, 30 + battleReady, 6, 16, colors.skin);
  } else if (hasAnimation && playerClass.name === 'Warlock') {
    // Warlock: Channeling dark magic
    const darkMagic = Math.sin(animationProgress * 1.6) * 2.5;
    rect(16, 30 + darkMagic, 6, 16, colors.skin);
    rect(42, 30 - darkMagic, 6, 16, colors.skin);
  } else if (hasAnimation && playerClass.name === 'Artificer') {
    // Artificer: Tinkering with tools
    const tinkerOffset = Math.sin(animationProgress * 1.4) * 2.0;
    rect(16, 30 + tinkerOffset, 6, 16, colors.skin);
    rect(42, 30 - tinkerOffset * 0.8, 6, 16, colors.skin);
  } else {
    // Default: Static arms (for any unhandled classes)
    rect(16, 30, 6, 16, colors.skin);
    rect(42, 30, 6, 16, colors.skin);
  }
  
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

  // Legs - more detailed (class-specific for Cleric with robe)
  if (playerClass.name === 'Cleric') {
    // Cleric: Robe swaying in the wind with visible legs underneath
    const robeSway = hasAnimation ? Math.sin(animationProgress * 0.6) * 3.0 : 0; // More pronounced sway
    const robeSwayLeft = robeSway * 0.8; // Left side sways less
    const robeSwayRight = robeSway * 1.2; // Right side sways more
    
    // Draw legs first (visible underneath robe) - use much brighter color for visibility
    const legColor = '#f4d03f'; // Bright yellow-gold for high visibility
    const legShadow = '#f39c12'; // Slightly darker for depth
    rect(24, 52, 8, 12, legColor);
    rect(32, 52, 8, 12, legColor);
    // Leg highlights for visibility
    rect(25, 54, 6, 2, '#fef9e7');
    rect(33, 54, 2, 2, '#fef9e7');
    // Knees
    rect(25, 58, 6, 2, legShadow);
    rect(33, 58, 6, 2, legShadow);
    // Feet (visible at bottom) - make them very visible
    rect(25, 63, 6, 1, legColor);
    rect(33, 63, 6, 1, legColor);
    pixel(26, 63, '#fef9e7');
    pixel(34, 63, '#fef9e7');
    
    // Robe - long flowing robe that sways in the wind
    // Use a more visible color - lighter brown with better contrast
    const robeColor = '#a0522d'; // Sienna brown - more visible than dark brown
    const robeSecondary = '#8b4513'; // Saddle brown for details
    const robeHighlight = '#cd853f'; // Peru - lighter highlight
    
    // Main robe body - starts from mid-torso (y=46) down to feet (y=64) to ensure visibility
    // Make it wider and more prominent, extending over bottom of torso
    const robeStartY = 46; // Start higher to overlap with bottom of torso
    const robeEndY = 64;
    const robeHeight = robeEndY - robeStartY;
    
    // Main robe body - draw as solid sections that sway
    // Left side of robe - wider and more visible
    for (let y = robeStartY; y < robeEndY; y++) {
      const progress = (y - robeStartY) / robeHeight; // 0 at top, 1 at bottom
      const swayAtY = robeSwayLeft * progress; // More sway at bottom
      const width = 10 + Math.floor(progress * 6); // Wider at bottom (10-16 pixels)
      const xPos = 20 + Math.round(swayAtY);
      // Draw solid rectangle for each row
      rect(xPos, y, width, 1, robeColor);
      // Add highlight on left edge for depth
      if (y % 3 === 0) {
        pixel(xPos, y, robeHighlight);
      }
    }
    
    // Right side of robe
    for (let y = robeStartY; y < robeEndY; y++) {
      const progress = (y - robeStartY) / robeHeight;
      const swayAtY = robeSwayRight * progress;
      const width = 10 + Math.floor(progress * 6);
      const xPos = 34 - Math.round(swayAtY);
      rect(xPos, y, width, 1, robeColor);
      // Add highlight on right edge
      if (y % 3 === 0) {
        pixel(xPos + width - 1, y, robeHighlight);
      }
    }
    
    // Center section of robe - connects left and right, sways less
    // Make this the main visible part
    for (let y = robeStartY; y < robeEndY; y++) {
      const progress = (y - robeStartY) / robeHeight;
      const swayAtY = robeSway * 0.5 * progress;
      const width = 14 + Math.floor(progress * 4); // 14-18 pixels wide - wider center
      const xPos = 25 + Math.round(swayAtY);
      rect(xPos, y, width, 1, robeColor);
      // Add center highlight
      if (y % 4 === 0) {
        pixel(xPos + Math.floor(width / 2), y, robeHighlight);
      }
    }
    
    // Robe hem - bottom edge that sways more dramatically (make it very visible)
    const hemSway = robeSway * 1.5;
    // Left hem - thicker and more visible
    rect(18 + Math.round(hemSway * 0.8), 62, 12, 2, robeColor);
    rect(18 + Math.round(hemSway * 0.8), 63, 12, 1, robeSecondary);
    // Right hem
    rect(34 + Math.round(hemSway * 1.2), 62, 12, 2, robeColor);
    rect(34 + Math.round(hemSway * 1.2), 63, 12, 1, robeSecondary);
    // Center hem
    rect(26 + Math.round(hemSway * 0.6), 62, 12, 2, robeColor);
    rect(26 + Math.round(hemSway * 0.6), 63, 12, 1, robeSecondary);
    
    // Robe details - vertical folds/seams that move with sway (more visible)
    for (let y = robeStartY + 2; y < robeEndY - 2; y += 3) {
      const progress = (y - robeStartY) / robeHeight;
      const swayAtY = robeSway * 0.5 * progress;
      pixel(28 + Math.round(swayAtY), y, robeSecondary);
      pixel(30 + Math.round(swayAtY), y, robeSecondary);
    }
    for (let y = robeStartY + 3; y < robeEndY - 3; y += 3) {
      const progress = (y - robeStartY) / robeHeight;
      const swayAtY = robeSwayRight * progress;
      pixel(38 + Math.round(swayAtY), y, robeSecondary);
    }
    for (let y = robeStartY + 3; y < robeEndY - 3; y += 3) {
      const progress = (y - robeStartY) / robeHeight;
      const swayAtY = robeSwayLeft * progress;
      pixel(22 + Math.round(swayAtY), y, robeSecondary);
    }
    
    // Robe opening at bottom (shows legs/feet) - wider gap in center
    pixel(30, 63, legColor);
    pixel(31, 63, legColor);
    pixel(32, 63, legColor);
    pixel(33, 63, legColor);
    pixel(29, 63, legColor);
    pixel(34, 63, legColor);
  } else {
    // Default legs for other classes
    rect(24, 52, 8, 12, colors.primary);
    rect(32, 52, 8, 12, colors.primary);
    // Knees
    rect(25, 58, 6, 2, colors.secondary);
    rect(33, 58, 6, 2, colors.secondary);
  }

  // Class-specific features - more detailed
  if (playerClass.name === 'Wizard') {
    // Staff - moves with right arm
    const castOffset2 = hasAnimation ? Math.sin(animationProgress * 1.5 + Math.PI / 2) * 2.5 : 0;
    rect(44, 20 + castOffset2, 2, 36, '#8b5cf6');
    // Staff top/crystal (glows when casting)
    const glowIntensity = hasAnimation ? (Math.sin(animationProgress * 2) + 1) / 2 : 0.5;
    
    // Determine casting color: green for healing, red for attack, blue/white for default
    const isCasting = shouldCast;
    const castColor = isHealing ? 'green' : (isAttacking ? 'red' : 'blue');
    
    // Color palettes for different spell types
    const greenColors = {
      outer: '#86efac', // Light green
      mid: '#4ade80',   // Medium green
      bright: '#22c55e', // Bright green
      core: '#10b981',  // Core green
      white: '#ffffff'   // White center
    };
    const redColors = {
      outer: '#fca5a5', // Light red
      mid: '#f87171',   // Medium red
      bright: '#ef4444', // Bright red
      core: '#dc2626',  // Core red
      white: '#ffffff'  // White center
    };
    const blueColors = {
      outer: '#bfdbfe', // Light blue
      mid: '#93c5fd',   // Medium blue
      bright: '#60a5fa', // Bright blue
      core: '#3b82f6',  // Core blue
      white: '#ffffff'  // White center
    };
    const castColors = castColor === 'green' ? greenColors : (castColor === 'red' ? redColors : blueColors);
    
    // Ball position (top of staff)
    const ballX = 44; // Center of staff
    const ballY = 18 + castOffset2; // Top of staff
    
    // Draw the ball/crystal with bright glow when casting
    if (shouldCast) {
      // Bright outer glow layer (drawn first, widest spread)
      pixel(40, 15 + castOffset2, castColors.outer); // Far outer glow
      pixel(47, 15 + castOffset2, castColors.outer);
      pixel(41, 14 + castOffset2, castColors.mid); // Outer glow top
      pixel(46, 14 + castOffset2, castColors.mid);
      pixel(41, 16 + castOffset2, castColors.mid); // Outer glow sides
      pixel(46, 16 + castOffset2, castColors.mid);
      pixel(42, 15 + castOffset2, castColors.bright); // Mid glow
      pixel(45, 15 + castOffset2, castColors.bright);
      pixel(43, 15 + castOffset2, castColors.white); // Bright center top
      pixel(44, 15 + castOffset2, castColors.white);
      // Main ball - bright colored
      rect(42, 18 + castOffset2, 6, 4, castColors.white);
      pixel(43, 17 + castOffset2, castColors.white);
      pixel(44, 17 + castOffset2, castColors.white);
      pixel(45, 17 + castOffset2, castColors.white);
      // Inner bright core
      pixel(43, 18 + castOffset2, castColors.bright);
      pixel(44, 18 + castOffset2, castColors.white); // Brightest center
      pixel(45, 18 + castOffset2, castColors.bright);
      pixel(43, 19 + castOffset2, castColors.bright);
      pixel(44, 19 + castOffset2, castColors.white); // Brightest center
      pixel(45, 19 + castOffset2, castColors.bright);
      // Additional bright glow pixels around the ball
      pixel(42, 16 + castOffset2, castColors.white); // Bright side glow
      pixel(46, 16 + castOffset2, castColors.white);
      pixel(42, 17 + castOffset2, castColors.outer); // Side glow
      pixel(46, 17 + castOffset2, castColors.outer);
      
      // Radiating power beams (like cleric's scepter)
      const beamCount = 16; // Many beams for powerful effect
      const maxBeamLength = 18; // Long beams radiating outward
      const beamCenterX = ballX + 1; // Center of ball
      const beamCenterY = ballY - 1; // Top of ball
      
      for (let i = 0; i < beamCount; i++) {
        const angle = (i / beamCount) * Math.PI * 2;
        const beamLength = maxBeamLength;
        const beamX = Math.round(beamCenterX + Math.cos(angle) * beamLength);
        const beamY = Math.round(beamCenterY + Math.sin(angle) * beamLength);
        
        // Draw beam trail (radiating outward)
        for (let j = 2; j <= beamLength; j += 2) {
          const trailX = Math.round(beamCenterX + Math.cos(angle) * j);
          const trailY = Math.round(beamCenterY + Math.sin(angle) * j);
          const trailIntensity = 1 - (j / beamLength) * 0.6; // Fade out along beam
          
          if (trailIntensity > 0.2 && trailX >= 0 && trailX < 64 && trailY >= 0 && trailY < 64) {
            // Use brighter colors closer to center, dimmer further out
            const trailColor = trailIntensity > 0.7 ? castColors.white : 
                              (trailIntensity > 0.5 ? castColors.bright : 
                              (trailIntensity > 0.3 ? castColors.mid : castColors.outer));
            pixel(trailX, trailY, trailColor);
          }
        }
        
        // Inner bright core beam (every other beam)
        if (i % 2 === 0) {
          const innerLength = beamLength * 0.6;
          const innerX = Math.round(beamCenterX + Math.cos(angle) * innerLength);
          const innerY = Math.round(beamCenterY + Math.sin(angle) * innerLength);
          if (innerX >= 0 && innerX < 64 && innerY >= 0 && innerY < 64) {
            pixel(innerX, innerY, castColors.white);
          }
        }
      }
      
      // Large magical aura emanating from the ball when casting
      const auraCenterX = beamCenterX;
      const auraCenterY = beamCenterY;
      const auraRadius = 16; // Large radius for powerful spell
      
      // Draw circular aura with multiple rings
      for (let ring = 1; ring <= 3; ring++) {
        const ringRadius = auraRadius - (ring * 2);
        const ringIntensity = 1.0 - (ring * 0.25); // Outer rings are dimmer
        const points = ring === 1 ? 24 : (ring === 2 ? 16 : 12); // More points for inner ring
        
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const auraX = Math.round(auraCenterX + Math.cos(angle) * ringRadius);
          const auraY = Math.round(auraCenterY + Math.sin(angle) * ringRadius);
          
          // Only draw if within bounds and at appropriate intensity
          if (auraX >= 0 && auraX < 64 && auraY >= 0 && auraY < 64) {
            const color = ringIntensity > 0.7 ? castColors.white : 
                         (ringIntensity > 0.5 ? castColors.bright : 
                         (ringIntensity > 0.3 ? castColors.mid : castColors.outer));
            pixel(auraX, auraY, color);
          }
        }
      }
      
      // Add sparkles/particles in the aura (emanating from ball)
      const sparkleCount = 16;
      for (let i = 0; i < sparkleCount; i++) {
        const sparkleAngle = (i / sparkleCount) * Math.PI * 2;
        const sparkleDist = 6 + (i % 4) * 2; // Varying distances
        const sparkleX = Math.round(auraCenterX + Math.cos(sparkleAngle) * sparkleDist);
        const sparkleY = Math.round(auraCenterY + Math.sin(sparkleAngle) * sparkleDist);
        
        if (sparkleX >= 0 && sparkleX < 64 && sparkleY >= 0 && sparkleY < 64) {
          pixel(sparkleX, sparkleY, castColors.white);
        }
      }
    } else {
      // Normal appearance when not casting
      rect(42, 18 + castOffset2, 6, 4, colors.accent);
      pixel(43, 17 + castOffset2, colors.accent);
      pixel(44, 17 + castOffset2, colors.accent);
      pixel(45, 17 + castOffset2, colors.accent);
      // Magical glow effect (only during idle animation)
      if (hasAnimation && glowIntensity > 0.7) {
        pixel(43, 16 + castOffset2, '#ffffff');
        pixel(45, 16 + castOffset2, '#ffffff');
      }
    }
    // Staff details
    rect(44, 30 + castOffset2, 2, 2, '#fbbf24');
    rect(44, 40 + castOffset2, 2, 2, '#fbbf24');
  } else if (playerClass.name === 'Fighter') {
    // Sword - moves with arm (diagonally up and away), longer and at 45-degree angle
    // Calculate offsets to match the arm position exactly
    const swordOffsetX = hasAnimation ? Math.sin(animationProgress * 0.9) * 2.0 : 0;
    const swordOffsetY = hasAnimation ? Math.sin(animationProgress * 0.9) * -2.5 : 0;
    
    // Sword base position (hand position) - must match the bottom of the right arm
    // Right arm is at: x=42+swordOffsetX, y=30+swordOffsetY, width=6, height=16
    // So the hand (bottom of arm) is at: x=45-46 (middle/end of arm), y=45-46 (bottom of arm)
    const handX = 45 + swordOffsetX; // Middle of the 6-pixel wide arm (42 + 3 = 45)
    const handY = 45 + swordOffsetY; // Bottom of the 16-pixel tall arm (30 + 16 - 1 = 45)
    
    // 45-degree angle: pointing up and to the right
    // At 45 degrees, x and y offsets are equal (cos(45°) = sin(45°) ≈ 0.707)
    const angle = Math.PI / 4; // 45 degrees
    const swordLength = 36; // Fixed sword length in pixels (longer sword)
    
    // Calculate the direction vector (constant, doesn't change with hand position)
    const dirX = Math.cos(angle);
    const dirY = -Math.sin(angle); // Negative because Y increases downward
    
    // Calculate end position based on fixed length
    const swordEndX = handX + dirX * swordLength;
    const swordEndY = handY + dirY * swordLength;
    
    // Draw sword blade at 45-degree angle with FIXED length
    // Use fixed number of steps to ensure consistent visual length
    const steps = Math.ceil(swordLength); // One step per pixel of length
    
    // Draw main blade line (thicker - 3 pixels wide)
    // Use fixed step count to ensure constant visual length
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Calculate position along the fixed-length diagonal
      const x = Math.round(handX + dirX * swordLength * t);
      const y = Math.round(handY + dirY * swordLength * t);
      // Draw center pixel
      pixel(x, y, '#cbd5e1');
      // Draw thickness - for 45-degree diagonal, add pixels to sides
      // Since it's 45°, we add pixels diagonally adjacent
      pixel(x + 1, y, '#cbd5e1'); // Right side
      pixel(x, y - 1, '#cbd5e1'); // Top side (for diagonal thickness)
      // Add highlight on the edge
      if (i % 3 === 0) {
        pixel(x + 1, y, '#ffffff');
      }
    }
    
    // Add blade shine/details along the length (fixed positions)
    for (let i = 4; i < steps - 2; i += 5) {
      const t = i / steps;
      const x = Math.round(handX + dirX * swordLength * t);
      const y = Math.round(handY + dirY * swordLength * t);
      pixel(x + 1, y, '#ffffff');
    }
    
    // Sword hilt (at hand position - aligned with hand)
    rect(44 + swordOffsetX, 44 + swordOffsetY, 4, 4, '#78350f');
    rect(43 + swordOffsetX, 46 + swordOffsetY, 6, 2, '#fbbf24');
    // Sword guard (more prominent - taller, positioned above hand)
    rect(42 + swordOffsetX, 40 + swordOffsetY, 2, 8, '#fbbf24');
    rect(46 + swordOffsetX, 40 + swordOffsetY, 2, 8, '#fbbf24');
    // Guard details and highlights
    pixel(42 + swordOffsetX, 42 + swordOffsetY, '#ffffff');
    pixel(46 + swordOffsetX, 42 + swordOffsetY, '#ffffff');
    pixel(42 + swordOffsetX, 44 + swordOffsetY, '#dc2626');
    pixel(46 + swordOffsetX, 44 + swordOffsetY, '#dc2626');
  } else if (playerClass.name === 'Paladin') {
    // Paladin: Holy sword with glowing effect - moves with arm
    const holyReady = hasAnimation ? Math.sin(animationProgress * 1.0) * 1.8 : 0;
    const holyOffsetY = holyReady * 0.6;
    // Sword blade
    rect(46, 24 + holyOffsetY, 2, 24, '#cbd5e1');
    // Glowing blade
    pixel(45, 26 + holyOffsetY, colors.accent);
    pixel(47, 26 + holyOffsetY, colors.accent);
    pixel(45, 30 + holyOffsetY, colors.accent);
    pixel(47, 30 + holyOffsetY, colors.accent);
    // Sword hilt with holy symbol
    rect(45, 24 + holyOffsetY, 4, 4, '#78350f');
    rect(44, 26 + holyOffsetY, 6, 2, '#fbbf24');
    pixel(46, 25 + holyOffsetY, colors.accent); // Holy symbol on hilt
    // Sword guard
    rect(43, 28 + holyOffsetY, 2, 8, '#fbbf24');
    rect(47, 28 + holyOffsetY, 2, 8, '#fbbf24');
    // Blade details
    pixel(46, 30 + holyOffsetY, '#ffffff');
    pixel(46, 35 + holyOffsetY, '#ffffff');
    pixel(46, 40 + holyOffsetY, '#ffffff');
  } else if (playerClass.name === 'Rogue') {
    // Crossed daggers in X pattern - moves with crossed arms
    const daggerCheck = hasAnimation ? Math.sin(animationProgress * 1.8) * 2.0 : 0;
    const daggerOffset2 = hasAnimation ? daggerCheck * -0.7 : 0;
    // Left dagger (in left hand, crossed to right side, pointing diagonally left/up)
    // Left arm ends at y=46 (30 + 16), hand is at bottom of arm
    const leftHandY = 30 + daggerCheck + 16; // End of left arm
    const leftHandX = 28 + 3; // Center of left arm (28-34, center at 31)
    // Dagger extends from hand diagonally up and left, crossing the body
    rect(leftHandX - 2, leftHandY - 10, 2, 10, '#cbd5e1');
    rect(leftHandX - 3, leftHandY - 10, 4, 2, '#fbbf24');
    pixel(leftHandX - 2, leftHandY - 12, '#fbbf24');
    pixel(leftHandX - 1, leftHandY - 12, '#fbbf24');
    // Right dagger (in right hand, crossed to left side, pointing diagonally right/up)
    // Right arm ends at y=46 (30 + 16), hand is at bottom of arm
    const rightHandY = 30 + daggerOffset2 + 16; // End of right arm
    const rightHandX = 30 + 3; // Center of right arm (30-36, center at 33)
    // Dagger extends from hand diagonally up and right, crossing the body
    rect(rightHandX + 2, rightHandY - 10, 2, 10, '#cbd5e1');
    rect(rightHandX + 3, rightHandY - 10, 4, 2, '#fbbf24');
    pixel(rightHandX + 4, rightHandY - 12, '#fbbf24');
    pixel(rightHandX + 5, rightHandY - 12, '#fbbf24');
  } else if (playerClass.name === 'Ranger') {
    // Bow - animated based on draw
    if (hasAnimation) {
      const drawProgress = (Math.sin(animationProgress) + 1) / 2; // 0 to 1
      const pullBack = drawProgress * 4; // More pronounced pull back
      // Bow body (moves slightly as arm pulls)
      rect(44 - pullBack * 0.3, 30, 4, 2, '#78350f');
      rect(46 - pullBack * 0.3, 28, 2, 6, '#78350f');
      // Bowstring (pulled back)
      pixel(45 - pullBack, 29, '#ffffff');
      pixel(45 - pullBack, 33, '#ffffff');
      // Arrow (pulled back with string)
      rect(48 - pullBack, 30, 1, 4, '#1c1917');
      pixel(48 - pullBack, 29, '#fbbf24'); // Arrowhead
    } else {
      // Static bow
      rect(44, 30, 4, 2, '#78350f');
      rect(46, 28, 2, 6, '#78350f');
      pixel(45, 29, '#ffffff');
      pixel(45, 33, '#ffffff');
      rect(48, 30, 1, 4, '#1c1917');
      pixel(48, 29, '#fbbf24');
    }
  } else if (playerClass.name === 'Cleric') {
    // Large scepter held with both hands in center, raised high above head
    // When idle: animate raising and lowering
    // When attacking/healing: keep scepter at highest position (casting pose)
    let scepterRaise: number;
    let handRaise: number;
    if (hasAnimation) {
      // Idle animation: scepter raises and lowers
      const raiseProgress = (Math.sin(animationProgress * 0.8) + 1) / 2; // 0 to 1
      scepterRaise = raiseProgress * -14; // Negative Y means up (raises from 0 to -14 pixels, high above head)
      handRaise = scepterRaise * 0.8; // Match the hand movement from arm animation
    } else {
      // Not idle (attacking/healing): scepter at highest position (casting)
      scepterRaise = -14; // Maximum raise position
      handRaise = scepterRaise * 0.8; // Hands at maximum raise position (-11.2 pixels)
    }
    
    // Scepter handle (held at center of body, extends upward)
    // Base of scepter is at hand position (around y=46, which is bottom of arms at y=30+16)
    const handY = 46 + handRaise; // Hands move up and down with scepter
    const scepterBaseY = handY;
    const scepterLength = 32; // Length of scepter shaft
    const scepterTopY = scepterBaseY - scepterLength + scepterRaise; // Scepter extends upward, raising high above head
    
    // Large scepter shaft (thicker than a staff - 4 pixels wide)
    const scepterX = 31; // Center of body (64/2 = 32, but offset slightly for visual balance)
    rect(scepterX, scepterTopY, 4, scepterLength, '#78350f'); // Scepter shaft
    
    // Scepter decorative bands
    rect(scepterX, scepterTopY + 8, 4, 2, '#fbbf24');
    rect(scepterX, scepterTopY + 16, 4, 2, '#fbbf24');
    rect(scepterX, scepterTopY + 24, 4, 2, '#fbbf24');
    
    // Scepter top ornament (larger, more ornate)
    const topY = scepterTopY;
    rect(scepterX - 1, topY - 2, 6, 4, colors.accent);
    rect(scepterX, topY - 4, 4, 2, colors.accent);
    pixel(scepterX + 1, topY - 5, colors.accent);
    pixel(scepterX + 2, topY - 5, colors.accent);
    
    // Brilliant white light emanating from top of scepter
    // When idle: pulse the light
    // When attacking/healing: light at maximum intensity (casting) with large radius
    const isCasting = !hasAnimation; // Casting when not idle
    const lightIntensity = hasAnimation ? (Math.sin(animationProgress * 2) + 1) / 2 : 1.0;
    
    // Core bright white light (always visible, larger when casting)
    pixel(scepterX + 1, topY - 6, '#ffffff');
    pixel(scepterX + 2, topY - 6, '#ffffff');
    pixel(scepterX + 1, topY - 7, '#ffffff');
    pixel(scepterX + 2, topY - 7, '#ffffff');
    if (isCasting) {
      // Larger core when casting
      pixel(scepterX, topY - 6, '#ffffff');
      pixel(scepterX + 3, topY - 6, '#ffffff');
      pixel(scepterX, topY - 7, '#ffffff');
      pixel(scepterX + 3, topY - 7, '#ffffff');
      pixel(scepterX + 1, topY - 8, '#ffffff');
      pixel(scepterX + 2, topY - 8, '#ffffff');
      pixel(scepterX + 1, topY - 9, '#ffffff');
      pixel(scepterX + 2, topY - 9, '#ffffff');
    }
    
    // Radiating light beams (brilliant white, pulsing)
    // When casting: many more beams with much longer range
    const beamCount = isCasting ? 16 : 8; // Double the beams when casting
    const maxBeamLength = isCasting ? 20 : 6; // Much longer beams when casting
    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2;
      const beamLength = isCasting ? maxBeamLength : (2 + Math.floor(lightIntensity * 4));
      const beamX = Math.round(scepterX + 2 + Math.cos(angle) * beamLength);
      const beamY = Math.round(topY - 6 + Math.sin(angle) * beamLength);
      
      // Draw beam trail when casting (more dramatic)
      if (isCasting) {
        // Draw multiple points along the beam for a trail effect
        for (let j = 1; j <= beamLength; j += 2) {
          const trailX = Math.round(scepterX + 2 + Math.cos(angle) * j);
          const trailY = Math.round(topY - 6 + Math.sin(angle) * j);
          const trailIntensity = 1 - (j / beamLength) * 0.5; // Fade out along beam
          if (trailIntensity > 0.3) {
            pixel(trailX, trailY, trailIntensity > 0.7 ? '#ffffff' : '#e5e5e5');
          }
        }
      } else {
        // Outer glow (lighter gray for softer appearance) - idle mode
        if (lightIntensity > 0.3) {
          pixel(beamX, beamY, lightIntensity > 0.7 ? '#ffffff' : '#e5e5e5');
        }
      }
      
      // Inner bright core (every other beam)
      if (i % 2 === 0 && (isCasting || lightIntensity > 0.5)) {
        const innerLength = isCasting ? beamLength * 0.7 : (beamLength * 0.6);
        const innerX = Math.round(scepterX + 2 + Math.cos(angle) * innerLength);
        const innerY = Math.round(topY - 6 + Math.sin(angle) * innerLength);
        pixel(innerX, innerY, '#ffffff');
      }
    }
    
    // Large magical aura emanating from the top of the scepter when casting
    if (isCasting) {
      // Use the scepter top position as the center of the aura
      const auraCenterX = scepterX + 2; // Center of scepter (scepterX is 31, so center is 33)
      const auraCenterY = topY - 6; // Top of scepter light (where the core light is)
      const auraRadius = 18; // Large radius for powerful spell
      
      // Draw circular aura with multiple rings
      for (let ring = 1; ring <= 3; ring++) {
        const ringRadius = auraRadius - (ring * 2);
        const ringIntensity = 1.0 - (ring * 0.2); // Outer rings are dimmer
        const points = ring === 1 ? 24 : (ring === 2 ? 16 : 12); // More points for inner ring
        
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const auraX = Math.round(auraCenterX + Math.cos(angle) * ringRadius);
          const auraY = Math.round(auraCenterY + Math.sin(angle) * ringRadius);
          
          // Only draw if within bounds and at appropriate intensity
          if (auraX >= 0 && auraX < 64 && auraY >= 0 && auraY < 64) {
            const color = ringIntensity > 0.7 ? '#ffffff' : (ringIntensity > 0.5 ? '#e5e5e5' : '#d1d5db');
            pixel(auraX, auraY, color);
          }
        }
      }
      
      // Add sparkles/particles in the aura (emanating from scepter top)
      const sparkleCount = 20;
      for (let i = 0; i < sparkleCount; i++) {
        const sparkleAngle = (i / sparkleCount) * Math.PI * 2;
        const sparkleDist = 8 + (i % 5) * 2; // Varying distances
        const sparkleX = Math.round(auraCenterX + Math.cos(sparkleAngle) * sparkleDist);
        const sparkleY = Math.round(auraCenterY + Math.sin(sparkleAngle) * sparkleDist);
        
        if (sparkleX >= 0 && sparkleX < 64 && sparkleY >= 0 && sparkleY < 64) {
          pixel(sparkleX, sparkleY, '#ffffff');
        }
      }
    }
    
    // Additional light particles around the top (rotating)
    const particleCount = isCasting ? 12 : 6; // More particles when casting
    for (let i = 0; i < particleCount; i++) {
      const particleAngle = (i / particleCount) * Math.PI * 2 + (hasAnimation ? animationProgress * 0.3 : 0);
      const particleDist = isCasting ? (4 + (i % 4) * 2) : (2 + Math.floor(lightIntensity * 3));
      const particleX = Math.round(scepterX + 2 + Math.cos(particleAngle) * particleDist);
      const particleY = Math.round(topY - 6 + Math.sin(particleAngle) * particleDist);
      if (isCasting || lightIntensity > 0.4) {
        pixel(particleX, particleY, '#ffffff');
      }
    }
    
    // Extra bright flash at peak intensity (or always when casting)
    if (isCasting || lightIntensity > 0.8) {
      pixel(scepterX, topY - 6, '#ffffff');
      pixel(scepterX + 3, topY - 6, '#ffffff');
      pixel(scepterX + 1, topY - 8, '#ffffff');
      pixel(scepterX + 2, topY - 8, '#ffffff');
      if (isCasting) {
        // Even more intense flash when casting
        pixel(scepterX - 1, topY - 7, '#ffffff');
        pixel(scepterX + 4, topY - 7, '#ffffff');
        pixel(scepterX + 1, topY - 10, '#ffffff');
        pixel(scepterX + 2, topY - 10, '#ffffff');
      }
    }
  } else if (playerClass.name === 'Barbarian') {
    // Axe - moves with arms
    const battleReady = hasAnimation ? Math.sin(animationProgress * 1.1) * 2.2 : 0;
    // Axe handle
    rect(44, 24 + battleReady, 4, 20, '#1c1917');
    rect(46, 24 + battleReady, 4, 4, colors.accent);
    // Axe blade
    rect(48, 26 + battleReady, 2, 8, '#cbd5e1');
    pixel(49, 28 + battleReady, '#ffffff');
    pixel(49, 30 + battleReady, '#ffffff');
    // Battle damage on axe
    pixel(48, 27 + battleReady, '#78350f');
  } else if (playerClass.name === 'Bard') {
    // Guitar held across body in playing position - lower on body, not covering face
    // Rocking motion for playing animation
    const rockAngle = hasAnimation ? Math.sin(animationProgress * 1.5) * 0.15 : 0;
    const rockOffsetX = hasAnimation ? Math.sin(animationProgress * 1.5) * 2.0 : 0;
    const rockOffsetY = hasAnimation ? Math.cos(animationProgress * 1.5) * 1.5 : 0;
    
    // Determine casting color: green for healing, purple for attack
    const isCasting = shouldCast;
    const castColor = isHealing ? 'green' : (isAttacking ? 'purple' : 'blue');
    
    // Color palettes for different spell types
    const greenColors = {
      outer: '#86efac', // Light green
      mid: '#4ade80',   // Medium green
      bright: '#22c55e', // Bright green
      core: '#10b981',  // Core green
      white: '#ffffff'   // White center
    };
    const purpleColors = {
      outer: '#c4b5fd', // Light purple
      mid: '#a78bfa',   // Medium purple
      bright: '#8b5cf6', // Bright purple
      core: '#7c3aed',  // Core purple
      white: '#ffffff'  // White center
    };
    const blueColors = {
      outer: '#bfdbfe', // Light blue
      mid: '#93c5fd',   // Medium blue
      bright: '#60a5fa', // Bright blue
      core: '#3b82f6',  // Core blue
      white: '#ffffff'  // White center
    };
    const castColors = castColor === 'green' ? greenColors : (castColor === 'purple' ? purpleColors : blueColors);
    
    // Guitar neck (extends from far left side to body) - drawn first so body can overlap
    // Neck extends from left side (x=8) diagonally to body, rocks with animation
    const neckX = 8 + Math.round(rockOffsetX);
    const neckY = 22 + Math.round(rockOffsetY);
    rect(neckX, neckY, 3, 24, '#92400e'); // Darker brown neck - extends from left side
    // Fretboard on top of neck
    rect(neckX + 1, neckY, 2, 24, '#1c1917'); // Black fretboard
    
    // Guitar body (held across body - lower position, not covering face) - rocks with animation
    const bodyX = 18 + Math.round(rockOffsetX);
    const bodyY = 32 + Math.round(rockOffsetY);
    // Main body (sound hole area) - positioned lower
    rect(bodyX, bodyY, 28, 14, '#78350f'); // Brown guitar body - lower on body
    // Sound hole (center of body)
    rect(bodyX + 10, bodyY + 4, 8, 6, '#1c1917'); // Dark center
    pixel(bodyX + 12, bodyY + 5, '#dc2626'); // Red inner ring (matches bard's red wardrobe)
    pixel(bodyX + 13, bodyY + 5, '#dc2626');
    pixel(bodyX + 14, bodyY + 5, '#dc2626');
    pixel(bodyX + 15, bodyY + 5, '#dc2626');
    pixel(bodyX + 12, bodyY + 8, '#dc2626');
    pixel(bodyX + 13, bodyY + 8, '#dc2626');
    pixel(bodyX + 14, bodyY + 8, '#dc2626');
    pixel(bodyX + 15, bodyY + 8, '#dc2626');
    
    // Strings removed - they were causing visual issues and aren't needed
    // The guitar is recognizable without visible strings
    
    // Decorative details on guitar body
    pixel(bodyX + 2, bodyY + 2, '#fbbf24'); // Gold accents
    pixel(bodyX + 24, bodyY + 2, '#fbbf24');
    pixel(bodyX + 2, bodyY + 10, '#fbbf24');
    pixel(bodyX + 24, bodyY + 10, '#fbbf24');
    
    // Strumming hand drawn after guitar so it appears in front
    // Right hand plucking strings over guitar body (rocks with guitar)
    if (hasAnimation) {
      const rockOffsetX = Math.sin(animationProgress * 1.5) * 2.0;
      const rockOffsetY = Math.cos(animationProgress * 1.5) * 1.5;
      // Hand positioned over strings, in front of guitar
      rect(30 + Math.round(rockOffsetX), 34 + Math.round(rockOffsetY), 6, 14, colors.skin);
      // Fingers plucking strings
      pixel(32 + Math.round(rockOffsetX), 36 + Math.round(rockOffsetY), colors.skin);
      pixel(33 + Math.round(rockOffsetX), 37 + Math.round(rockOffsetY), colors.skin);
      pixel(34 + Math.round(rockOffsetX), 38 + Math.round(rockOffsetY), colors.skin);
    } else {
      rect(30, 34, 6, 14, colors.skin);
      pixel(32, 36, colors.skin);
      pixel(33, 37, colors.skin);
      pixel(34, 38, colors.skin);
    }
    
    // Note: Casting glow effects are drawn at the end of the function to ensure visibility
  } else if (playerClass.name === 'Sorcerer') {
    // Magical orb or wand - moves with arms
    const magicOffset = hasAnimation ? Math.sin(animationProgress * 2) * 3.0 : 0;
    const magicOffset2 = -magicOffset; // Opposite direction
    // Left hand orb
    rect(44, 24 + magicOffset, 4, 4, colors.accent);
    pixel(45, 25 + magicOffset, '#ffffff');
    pixel(46, 25 + magicOffset, '#ffffff');
    // Right hand wand
    rect(45, 28 + magicOffset2, 2, 20, colors.accent);
    pixel(44, 30 + magicOffset2, colors.accent);
    pixel(47, 30 + magicOffset2, colors.accent);
    pixel(44, 35 + magicOffset2, colors.accent);
    pixel(47, 35 + magicOffset2, colors.accent);
  } else if (playerClass.name === 'Warlock') {
    // Eldritch tome or dark staff - moves with arms
    const darkMagic = hasAnimation ? Math.sin(animationProgress * 1.6) * 2.5 : 0;
    const darkMagic2 = -darkMagic; // Opposite direction
    // Left hand tome
    rect(42, 26 + darkMagic, 6, 8, '#1c1917');
    rect(43, 27 + darkMagic, 4, 6, '#78350f');
    pixel(44, 28 + darkMagic, '#fbbf24'); // Eye symbol
    pixel(45, 28 + darkMagic, '#fbbf24');
    // Right hand dark energy
    pixel(48, 30 + darkMagic2, colors.accent);
    pixel(48, 32 + darkMagic2, colors.accent);
    pixel(48, 34 + darkMagic2, colors.accent);
  } else if (playerClass.name === 'Monk') {
    // Unarmed or simple staff - moves with arms
    const breathOffset = hasAnimation ? Math.sin(animationProgress * 0.8) * 2.0 : 0;
    rect(44, 28 + breathOffset, 2, 16, '#78350f');
    // Staff details
    rect(43, 28 + breathOffset, 4, 2, colors.accent);
    // Energy aura (ki)
    pixel(46, 30 + breathOffset, colors.accent);
    pixel(46, 35 + breathOffset, colors.accent);
    pixel(46, 40 + breathOffset, colors.accent);
  } else if (playerClass.name === 'Druid') {
    // Staff with nature elements - moves with arms
    const natureSway = hasAnimation ? Math.sin(animationProgress * 0.7) * 2.5 : 0;
    const natureSway2 = -natureSway; // Opposite direction for right arm
    // Staff (held in right hand, moves opposite to left arm)
    rect(44, 20 + natureSway2, 2, 28, '#78350f');
    // Staff top with leaves
    rect(42, 18 + natureSway2, 6, 4, colors.accent);
    pixel(43, 17 + natureSway2, colors.accent);
    pixel(45, 17 + natureSway2, colors.accent);
    pixel(44, 16 + natureSway2, colors.accent);
    // Nature details on staff
    pixel(44, 25 + natureSway2, colors.accent);
    pixel(44, 30 + natureSway2, colors.accent);
    pixel(44, 35 + natureSway2, colors.accent);
  } else if (playerClass.name === 'Artificer') {
    // Mechanical tool or crossbow - moves with arms
    const tinkerOffset = hasAnimation ? Math.sin(animationProgress * 1.4) * 2.0 : 0;
    const tinkerOffset2 = tinkerOffset * -0.8; // Opposite direction for right arm
    // Crossbow (held in right hand)
    rect(42, 28 + tinkerOffset2, 8, 6, colors.secondary);
    rect(44, 30 + tinkerOffset2, 4, 4, '#1c1917');
    rect(48, 31 + tinkerOffset2, 2, 2, '#cbd5e1');
    // Mechanical details
    pixel(43, 29 + tinkerOffset2, colors.accent);
    pixel(47, 29 + tinkerOffset2, colors.accent);
    pixel(45, 32 + tinkerOffset2, '#fbbf24');
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
  
  // Draw bard casting effects after all other elements to ensure visibility
  if (playerClass.name === 'Bard' && shouldCast) {
    // Determine casting color: green for healing, purple for attack
    const castColor = isHealing ? 'green' : (isAttacking ? 'purple' : 'blue');
    
    // Color palettes for different spell types
    const greenColors = {
      outer: '#86efac', // Light green
      mid: '#4ade80',   // Medium green
      bright: '#22c55e', // Bright green
      core: '#10b981',  // Core green
      white: '#ffffff'   // White center
    };
    const purpleColors = {
      outer: '#c4b5fd', // Light purple
      mid: '#a78bfa',   // Medium purple
      bright: '#8b5cf6', // Bright purple
      core: '#7c3aed',  // Core purple
      white: '#ffffff'  // White center
    };
    const blueColors = {
      outer: '#bfdbfe', // Light blue
      mid: '#93c5fd',   // Medium blue
      bright: '#60a5fa', // Bright blue
      core: '#3b82f6',  // Core blue
      white: '#ffffff'  // White center
    };
    const castColors = castColor === 'green' ? greenColors : (castColor === 'purple' ? purpleColors : blueColors);
    
    // Calculate guitar position - use same calculation as guitar drawing
    // Base guitar body position: x=18, y=32
    // Sound hole is at bodyX + 10, bodyY + 4 with size 8x6, so center is at bodyX + 14, bodyY + 7
    // Use the same animationProgress that was calculated at the top of the function
    const rockOffsetX = hasAnimation ? Math.sin(animationProgress * 1.5) * 2.0 : 0;
    const rockOffsetY = hasAnimation ? Math.cos(animationProgress * 1.5) * 1.5 : 0;
    const bodyX = 18 + Math.round(rockOffsetX);
    const bodyY = 32 + Math.round(rockOffsetY);
    
    // Glow emanates from the sound hole (center of guitar body)
    const glowCenterX = bodyX + 14; // Center of sound hole (bodyX + 10 + 4)
    const glowCenterY = bodyY + 7; // Center of sound hole (bodyY + 4 + 3)
    
    // Bright outer glow layer (drawn first, widest spread) - relative to glow center
    // More extensive glow for better visibility
    for (let dx = -8; dx <= 8; dx++) {
      for (let dy = -6; dy <= 6; dy++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 8 && dist > 6) {
          pixel(glowCenterX + dx, glowCenterY + dy, castColors.outer);
        } else if (dist <= 6 && dist > 4) {
          pixel(glowCenterX + dx, glowCenterY + dy, castColors.mid);
        } else if (dist <= 4 && dist > 2) {
          pixel(glowCenterX + dx, glowCenterY + dy, castColors.bright);
        } else if (dist <= 2) {
          pixel(glowCenterX + dx, glowCenterY + dy, castColors.white);
        }
      }
    }
    
    // Additional bright center core for maximum visibility
    pixel(glowCenterX - 1, glowCenterY - 1, castColors.white);
    pixel(glowCenterX, glowCenterY - 1, castColors.white);
    pixel(glowCenterX + 1, glowCenterY - 1, castColors.white);
    pixel(glowCenterX - 1, glowCenterY, castColors.white);
    pixel(glowCenterX, glowCenterY, castColors.white);
    pixel(glowCenterX + 1, glowCenterY, castColors.white);
    pixel(glowCenterX - 1, glowCenterY + 1, castColors.white);
    pixel(glowCenterX, glowCenterY + 1, castColors.white);
    pixel(glowCenterX + 1, glowCenterY + 1, castColors.white);
    
    // Radiating power beams from sound hole
    const beamCount = 16; // Many beams for powerful effect
    const maxBeamLength = 18; // Long beams radiating outward
    
    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2;
      const beamLength = maxBeamLength;
      
      // Draw beam trail (radiating outward)
      for (let j = 2; j <= beamLength; j += 2) {
        const trailX = Math.round(glowCenterX + Math.cos(angle) * j);
        const trailY = Math.round(glowCenterY + Math.sin(angle) * j);
        const trailIntensity = 1 - (j / beamLength) * 0.6; // Fade out along beam
        
        if (trailIntensity > 0.2 && trailX >= 0 && trailX < 64 && trailY >= 0 && trailY < 64) {
          // Use brighter colors closer to center, dimmer further out
          const trailColor = trailIntensity > 0.7 ? castColors.white : 
                            (trailIntensity > 0.5 ? castColors.bright : 
                            (trailIntensity > 0.3 ? castColors.mid : castColors.outer));
          pixel(trailX, trailY, trailColor);
        }
      }
      
      // Inner bright core beam (every other beam)
      if (i % 2 === 0) {
        const innerLength = beamLength * 0.6;
        const innerX = Math.round(glowCenterX + Math.cos(angle) * innerLength);
        const innerY = Math.round(glowCenterY + Math.sin(angle) * innerLength);
        if (innerX >= 0 && innerX < 64 && innerY >= 0 && innerY < 64) {
          pixel(innerX, innerY, castColors.white);
        }
      }
    }
    
    // Large magical aura emanating from the sound hole when casting
    const auraCenterX = glowCenterX;
    const auraCenterY = glowCenterY;
    const auraRadius = 16; // Large radius for powerful spell
    
    // Draw circular aura with multiple rings
    for (let ring = 1; ring <= 3; ring++) {
      const ringRadius = auraRadius - (ring * 2);
      const ringIntensity = 1.0 - (ring * 0.25); // Outer rings are dimmer
      const points = ring === 1 ? 24 : (ring === 2 ? 16 : 12); // More points for inner ring
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const auraX = Math.round(auraCenterX + Math.cos(angle) * ringRadius);
        const auraY = Math.round(auraCenterY + Math.sin(angle) * ringRadius);
        
        // Only draw if within bounds and at appropriate intensity
        if (auraX >= 0 && auraX < 64 && auraY >= 0 && auraY < 64) {
          const color = ringIntensity > 0.7 ? castColors.white : 
                       (ringIntensity > 0.5 ? castColors.bright : 
                       (ringIntensity > 0.3 ? castColors.mid : castColors.outer));
          pixel(auraX, auraY, color);
        }
      }
    }
    
    // Add sparkles/particles in the aura (emanating from sound hole)
    const sparkleCount = 16;
    for (let i = 0; i < sparkleCount; i++) {
      const sparkleAngle = (i / sparkleCount) * Math.PI * 2;
      const sparkleDist = 6 + (i % 4) * 2; // Varying distances
      const sparkleX = Math.round(auraCenterX + Math.cos(sparkleAngle) * sparkleDist);
      const sparkleY = Math.round(auraCenterY + Math.sin(sparkleAngle) * sparkleDist);
      
      if (sparkleX >= 0 && sparkleX < 64 && sparkleY >= 0 && sparkleY < 64) {
        pixel(sparkleX, sparkleY, castColors.white);
      }
    }
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
  emotion: CharacterEmotion, // Not used for monsters, kept for compatibility
  animationFrame: number = 0
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

