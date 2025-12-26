import { Character } from '../../types';

/**
 * Determines the character type display text based on the player class.
 *
 * Uses the _type marker and character metadata to determine the appropriate display text.
 * No longer relies on FALLBACK_* constants for runtime type checking.
 */
export function getCharacterType(playerClass: Character): string {
  // Priority 1: If it has a class field, use that (heroes with class names like "Rogue", "Wizard")
  // This must come BEFORE monsterId check because heroes can have images (monsterId) too
  if (playerClass.class) {
    return playerClass.class;
  }
  
  // Priority 2: If it's a created monster with a klass field, use that
  if ((playerClass as any).klass) {
    return (playerClass as any).klass;
  }
  
  // Priority 3: If it has a monsterId but no class, it's a created monster
  if ((playerClass as any).monsterId) {
    return 'Monster';
  }
  
  // Priority 4: Check for _type marker (added when loading from database)
  // Monsters loaded from database will have _type: 'monster'
  if ((playerClass as any)._type === 'monster') {
    return playerClass.name;
  }
  
  // Priority 5: Fallback to character name
  return playerClass.name;
}

// Made with Bob
