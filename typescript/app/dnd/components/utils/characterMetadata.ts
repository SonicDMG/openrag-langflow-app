import { DnDClass } from '../../types';
import { FALLBACK_MONSTERS } from '../../constants';
import { getCharacterName } from '../../utils/names';

type CreatedMonster = DnDClass & { monsterId: string; imageUrl: string };

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
 * @param dndClass - The character/monster class
 * @param createdMonsters - Array of created monsters
 * @returns Complete metadata about the character
 */
export function getCharacterMetadata(
  dndClass: DnDClass,
  createdMonsters: CreatedMonster[]
): CharacterMetadata {
  // Check if this is a created monster (has both klass and monsterId fields)
  const isCreatedMonster = !!(dndClass as any).klass && !!(dndClass as any).monsterId;
  
  // Generate display name using centralized utility
  const displayName = getCharacterName('', dndClass);
  
  // For created monsters, use klass to find associated monster
  // For regular classes, use the display name (character name) instead of class name
  // This ensures we find images saved with character names like "Thorn the Wild" instead of class names like "Druid"
  const lookupName = isCreatedMonster ? (dndClass as any).klass : displayName;
  
  // Find if this class matches a created monster directly
  const createdMonsterMatch = createdMonsters.find(m =>
    m.name === dndClass.name ||
    ((m as any).klass && (m as any).klass === dndClass.name) ||
    (m.monsterId && (dndClass as any).monsterId === m.monsterId)
  ) || null;
  
  // Determine edit type
  const editType = determineEditType(isCreatedMonster, dndClass);
  
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
 * @param isCreatedMonster - Whether this is a created monster
 * @param dndClass - The character class object
 * @returns Edit type ('hero' or 'monster')
 */
function determineEditType(
  isCreatedMonster: boolean,
  dndClass: DnDClass
): 'hero' | 'monster' {
  if (isCreatedMonster) {
    return 'monster';
  }
  
  // Check if it has _type marker from database load
  if ((dndClass as any)._type === 'monster') {
    return 'monster';
  }
  
  // Check if it's in FALLBACK_MONSTERS to determine if it's a default monster
  const isDefaultMonster = FALLBACK_MONSTERS.some(fm => fm.name === dndClass.name);
  return isDefaultMonster ? 'monster' : 'hero';
}

// Made with Bob
