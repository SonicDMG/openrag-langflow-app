'use client';

import { Character } from '../../../lib/types';
import { CharacterCard } from '../../character-cards/CharacterCard';
import { getCharacterMetadata } from '../../utils/characterMetadata';
import { getCharacterImageUrls } from '../../utils/imageUtils';
import { ZoomCardData } from '../../../hooks/ui/useZoomModal';

type CreatedMonster = Character & { monsterId: string; imageUrl: string };

interface SelectableClassCardProps {
  character: Character;
  index: number;
  totalCards: number;
  isSelected: boolean;
  createdMonsters: CreatedMonster[];
  selectionSyncTrigger: number;
  findAssociatedMonster: (className: string) => CreatedMonster | null;
  onSelect: (character: Character) => void;
  onZoom: (zoomData: ZoomCardData) => void;
}

/**
 * A selectable character card that handles all the logic for displaying
 * and interacting with a character/monster in the class selection carousel.
 * 
 * Extracted from ClassSelection to improve readability and maintainability.
 */
export function SelectableClassCard({
  character,
  index,
  totalCards,
  isSelected,
  createdMonsters,
  selectionSyncTrigger,
  findAssociatedMonster,
  onSelect,
  onZoom,
}: SelectableClassCardProps) {
  // Get comprehensive metadata about this character
  const metadata = getCharacterMetadata(character, createdMonsters);
  const { isCreatedMonster, lookupName, displayName, editType, createdMonsterMatch } = metadata;
  
  // Priority order for getting monsterId, imageUrl, and imagePosition:
  // 1. Check if the character itself has image data (for database-saved characters)
  // 2. Find associated monster by name lookup (for created monsters)
  const characterMonsterId = (character as any).monsterId;
  const characterEverartUrl = (character as any).imageUrl;
  const characterImagePosition = (character as any).imagePosition;
  
  let associatedMonster = null;
  let monsterImageUrl = null;
  let everartFallbackUrl = null;
  let imagePosition = null;
  
  if (characterMonsterId || characterEverartUrl) {
    // Character has image data stored directly - use it with fallback strategy
    const imageUrls = getCharacterImageUrls(characterMonsterId, characterEverartUrl);
    monsterImageUrl = imageUrls.primaryUrl;
    everartFallbackUrl = imageUrls.fallbackUrl;
    // Use character's imagePosition if available, otherwise try to find associated monster for position
    if (characterImagePosition) {
      imagePosition = characterImagePosition;
    } else {
      // Character has image but no imagePosition - look up the monster for position data
      associatedMonster = findAssociatedMonster(displayName);
      if (!associatedMonster && displayName !== character.name) {
        associatedMonster = findAssociatedMonster(character.name);
      }
      imagePosition = (associatedMonster as any)?.imagePosition;
    }
  } else {
    // Fall back to name-based lookup for created monsters
    // Try character name first (for custom images), then fall back to class name (for default images)
    associatedMonster = findAssociatedMonster(displayName);
    if (!associatedMonster && displayName !== character.name) {
      // If no image found with character name, try class name as fallback
      associatedMonster = findAssociatedMonster(character.name);
    }
    const imageUrls = getCharacterImageUrls(associatedMonster?.monsterId, (associatedMonster as any)?.imageUrl);
    monsterImageUrl = imageUrls.primaryUrl;
    everartFallbackUrl = imageUrls.fallbackUrl;
    imagePosition = (associatedMonster as any)?.imagePosition;
  }
  
  const handleZoom = () => {
    // Priority order for getting prompt/setting:
    // 1. createdMonsterMatch (from createdMonsters array - most reliable)
    // 2. character itself (if it's a created monster)
    // 3. associatedMonster (found via findAssociatedMonster)
    const prompt = (createdMonsterMatch as any)?.prompt 
      || (isCreatedMonster ? (character as any)?.prompt : undefined)
      || (associatedMonster as any)?.prompt;
    const setting = (createdMonsterMatch as any)?.setting 
      || (isCreatedMonster ? (character as any)?.setting : undefined)
      || (associatedMonster as any)?.setting;
    
    onZoom({
      playerClass: { ...character, hitPoints: character.maxHitPoints },
      characterName: displayName,
      monsterImageUrl,
      canEdit: true, // All characters can be edited
      editType,
      imagePrompt: prompt || undefined, // Convert null to undefined
      imageSetting: setting || undefined, // Convert null to undefined
    });
  };
  
  const handleSelect = () => {
    onSelect({ ...character, hitPoints: character.maxHitPoints });
  };
  
  return (
    <div
      className="flex-shrink-0 relative group overflow-visible"
      style={{
        transform: isSelected ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
      }}
    >
      <div
        onClick={handleSelect}
        className="cursor-pointer transition-all"
      >
        <CharacterCard
          playerClass={{ ...character, hitPoints: character.maxHitPoints }}
          characterName={displayName}
          monsterImageUrl={monsterImageUrl}
          everartFallbackUrl={everartFallbackUrl}
          imagePosition={imagePosition}
          size="compact"
          cardIndex={index}
          totalCards={totalCards}
          isSelected={isSelected}
          selectionSyncTrigger={selectionSyncTrigger}
          showZoomButton={true}
          onZoom={handleZoom}
        />
      </div>
    </div>
  );
}

// Made with Bob
