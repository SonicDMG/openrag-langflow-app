import { Character } from '../../lib/types';
import { getCharacterName } from '../../utils/names';

type CreatedMonster = Character & { monsterId: string; imageUrl: string };

export interface CharacterMetadata {
  isCreatedMonster: boolean;
  lookupName: string;
  displayName: string;
  editType: 'hero' | 'monster';
  createdMonsterMatch: CreatedMonster | null;
}

/**
 * Calculate comprehensive metadata for a character/monster.
 * Consolidates all character type detection and metadata extraction logic.
 * 
 * @param character - The character/monster class
 * @param createdMonsters - Array of created monsters
 * @returns Complete metadata about the character
 */
export function getCharacterMetadata(
  character: Character,
  createdMonsters: CreatedMonster[]
): CharacterMetadata {
  // Check if this is a created monster (has both klass and monsterId fields)
  const isCreatedMonster = !!(character as any).klass && !!(character as any).monsterId;
  
  // Generate display name using centralized utility
  const displayName = getCharacterName('', character);
  
  // For created monsters, use klass to find associated monster
  // For regular classes, use the display name (character name) instead of class name
  // This ensures we find images saved with character names like "Thorn the Wild" instead of class names like "Druid"
  const lookupName = isCreatedMonster ? (character as any).klass : displayName;
  
  // Find if this class matches a created monster directly
  const createdMonsterMatch = createdMonsters.find(m =>
    m.name === character.name ||
    ((m as any).klass && (m as any).klass === character.name) ||
    (m.monsterId && (character as any).monsterId === m.monsterId)
  ) || null;
  
  // Determine edit type
  const editType = determineEditType(isCreatedMonster, character);
  
  return {
    isCreatedMonster,
    lookupName,
    displayName,
    editType,
    createdMonsterMatch,
  };
}

/**
 * Determine whether a character should be edited as a hero or monster.
 *
 * Uses multiple strategies to determine character type:
 * 1. Created monsters (with klass and monsterId)
 * 2. _type marker (added during database load)
 * 3. _id prefix (for fallback data: 'fallback-monster-' or 'fallback-hero-')
 * 4. Default to 'hero'
 *
 * @param isCreatedMonster - Whether this is a created monster
 * @param character - The character class object
 * @returns Edit type ('hero' or 'monster')
 */
function determineEditType(
  isCreatedMonster: boolean,
  character: Character
): 'hero' | 'monster' {
  // Strategy 1: Created monsters (with klass and monsterId) are always monsters
  if (isCreatedMonster) {
    return 'monster';
  }
  
  // Strategy 2: Check for _type marker added during database load
  // This marker is set in dataLoader.ts when loading monsters from database
  if ((character as any)._type === 'monster') {
    return 'monster';
  }
  
  // Strategy 3: Infer from _id prefix (for fallback data)
  const characterId = (character as any)._id;
  if (characterId && typeof characterId === 'string') {
    if (characterId.startsWith('fallback-monster-')) {
      return 'monster';
    }
    if (characterId.startsWith('fallback-hero-')) {
      return 'hero';
    }
  }
  
  // Strategy 4: Default to hero if no monster indicators present
  return 'hero';
}

// Made with Bob
