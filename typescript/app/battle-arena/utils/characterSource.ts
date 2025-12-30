import { Character } from '../lib/types';

/**
 * Character source types for badge display
 */
export type CharacterSource = 'openrag' | 'generated' | 'default' | null;

/**
 * Determine the source/origin of a character for badge display.
 * 
 * Priority order (highest to lowest):
 * 1. OpenRAG - Character loaded from OpenRAG knowledge base (persists through edits)
 * 2. Generated - Character created locally via Monster Creator
 * 3. Default - Character from default JSON files
 * 4. null - No badge (custom/edited characters without clear origin)
 * 
 * @param character - The character to check
 * @returns The character source type or null if no badge should be shown
 * 
 * @example
 * // Default character from JSON
 * const barbarian = { _id: 'fallback-hero-barbarian', name: 'Barbarian', ... };
 * getCharacterSource(barbarian); // Returns 'default'
 * 
 * @example
 * // Generated monster
 * const goblin = { name: 'Goblin Warrior', monsterId: 'abc123', ... };
 * getCharacterSource(goblin); // Returns 'generated'
 * 
 * @example
 * // Character from OpenRAG
 * const hero = { name: 'Custom Hero', fromOpenRAG: true, ... };
 * getCharacterSource(hero); // Returns 'openrag'
 */
export function getCharacterSource(character: Character): CharacterSource {
  // Priority 1: OpenRAG (highest priority - persists through edits)
  // Once a character is loaded from OpenRAG, it keeps this badge even if edited locally
  if ((character as any).fromOpenRAG === true) {
    return 'openrag';
  }
  
  // Priority 2: Default from JSON files
  // Check for fallback ID prefix (e.g., 'fallback-hero-barbarian', 'fallback-monster-goblin')
  // OR explicit isDefault flag
  // NOTE: This is checked BEFORE monsterId so that default characters with generated images
  // still show as DEFAULT, not GENERATED
  if (character._id?.startsWith('fallback-') || character.isDefault === true) {
    return 'default';
  }
  
  // Priority 3: Locally generated via Monster Creator
  // Characters created through the Monster Creator have a monsterId field
  // This only applies to characters that are NOT defaults
  if ((character as any).monsterId) {
    return 'generated';
  }
  
  // No badge - custom/edited characters without a clear origin marker
  return null;
}

/**
 * Get badge configuration for a character source
 */
export interface BadgeConfig {
  bg: string;
  border: string;
  text: string;
  tooltip: string;
}

export const BADGE_CONFIGS: Record<Exclude<CharacterSource, null>, BadgeConfig> = {
  default: {
    bg: 'bg-amber-600/90',
    border: 'border-amber-400/50',
    text: 'DEFAULT',
    tooltip: 'Default character - loaded from game defaults'
  },
  generated: {
    bg: 'bg-cyan-600/90',
    border: 'border-cyan-400/50',
    text: 'GENERATED',
    tooltip: 'AI-generated character created locally'
  },
  openrag: {
    bg: 'bg-purple-600/90',
    border: 'border-purple-400/50',
    text: 'OPENRAG',
    tooltip: 'Character retrieved from OpenRAG knowledge base'
  }
};

// Made with Bob