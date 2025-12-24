import { DnDClass } from '../../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../../constants';

/**
 * Determines the character type display text based on the player class
 */
export function getCharacterType(playerClass: DnDClass): string {
  // If it's a created monster, use klass
  if ((playerClass as any).klass) {
    return (playerClass as any).klass;
  }
  
  // Check for _type marker (added when loading from database)
  if ((playerClass as any)._type === 'monster') {
    return playerClass.name;
  }
  
  // Check if it's a default monster or hero
  const isDefaultMonster = FALLBACK_MONSTERS.some(fm => fm.name === playerClass.name);
  const isDefaultHero = FALLBACK_CLASSES.some(fc => fc.name === playerClass.name);
  
  // If it has a monsterId, it's a created monster
  if ((playerClass as any).monsterId) {
    return 'Monster';
  }
  
  // If it's a default monster, use its name as the class
  if (isDefaultMonster) {
    return playerClass.name;
  }
  
  // If it's a custom hero (not in defaults and not a monster)
  if (!isDefaultHero && !isDefaultMonster) {
    return 'Hero';
  }
  
  // Otherwise, use name as class type (for default heroes)
  return playerClass.name;
}

// Made with Bob
