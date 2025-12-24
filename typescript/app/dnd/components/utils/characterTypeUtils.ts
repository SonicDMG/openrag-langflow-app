import { DnDClass } from '../../types';

/**
 * Determines the character type display text based on the player class.
 *
 * Uses the _type marker and character metadata to determine the appropriate display text.
 * No longer relies on FALLBACK_* constants for runtime type checking.
 */
export function getCharacterType(playerClass: DnDClass): string {
  // If it's a created monster with a klass field, use that
  if ((playerClass as any).klass) {
    return (playerClass as any).klass;
  }
  
  // If it has a monsterId, it's a created monster
  if ((playerClass as any).monsterId) {
    return 'Monster';
  }
  
  // Check for _type marker (added when loading from database)
  // Monsters loaded from database will have _type: 'monster'
  if ((playerClass as any)._type === 'monster') {
    return playerClass.name;
  }
  
  // For heroes, use the class name if available, otherwise use character name
  // This handles both default heroes (e.g., "Fighter") and custom heroes (e.g., "Sylvan the Hunter")
  return playerClass.class || playerClass.name;
}

// Made with Bob
