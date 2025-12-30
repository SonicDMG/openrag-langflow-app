/**
 * Image position resolution utilities
 */

import { ImagePosition, FindAssociatedMonster } from '../lib/types';

/**
 * Resolves the image position for a character
 *
 * Priority order:
 * 1. Use imagePosition from the character itself (if stored in database)
 * 2. Look up by character name in created monsters
 * 3. Look up by class name in created monsters
 *
 * @param characterName - The character's display name
 * @param className - The character's class name
 * @param findAssociatedMonster - Function to find monster data
 * @param characterImagePosition - Image position stored directly on character (optional)
 * @returns Image position or undefined if not found
 */
export function resolveImagePosition(
  characterName: string,
  className: string,
  findAssociatedMonster: FindAssociatedMonster,
  characterImagePosition?: ImagePosition
): ImagePosition | undefined {
  // Priority 1: Use imagePosition from character itself if available
  if (characterImagePosition) {
    return characterImagePosition;
  }
  
  // Priority 2: Try character name lookup
  let monster = findAssociatedMonster(characterName);
  
  // Priority 3: Fall back to class name if character name doesn't match
  if (!monster && characterName !== className) {
    monster = findAssociatedMonster(className);
  }
  
  return monster?.imagePosition;
}

// Made with Bob
