'use client';

import { DnDClass } from '../types';
import { CharacterCard } from './CharacterCard';
import { getCharacterMetadata } from './utils/characterMetadata';
import { getCharacterImageUrl } from './utils/imageUtils';
import { ZoomCardData } from './hooks/useZoomModal';

type CreatedMonster = DnDClass & { monsterId: string; imageUrl: string };

interface SelectableClassCardProps {
  dndClass: DnDClass;
  index: number;
  totalCards: number;
  isSelected: boolean;
  createdMonsters: CreatedMonster[];
  selectionSyncTrigger: number;
  findAssociatedMonster: (className: string) => CreatedMonster | null;
  onSelect: (dndClass: DnDClass) => void;
  onZoom: (zoomData: ZoomCardData) => void;
}

/**
 * A selectable character card that handles all the logic for displaying
 * and interacting with a character/monster in the class selection carousel.
 * 
 * Extracted from ClassSelection to improve readability and maintainability.
 */
export function SelectableClassCard({
  dndClass,
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
  const metadata = getCharacterMetadata(dndClass, createdMonsters);
  const { isCreatedMonster, lookupName, displayName, editType, createdMonsterMatch } = metadata;
  
  // Find the associated monster for image display
  // Try character name first (for custom images), then fall back to class name (for default images)
  let associatedMonster = findAssociatedMonster(displayName);
  if (!associatedMonster && displayName !== dndClass.name) {
    // If no image found with character name, try class name as fallback
    associatedMonster = findAssociatedMonster(dndClass.name);
  }
  const monsterImageUrl = getCharacterImageUrl(associatedMonster?.monsterId);
  const imagePosition = (associatedMonster as any)?.imagePosition;
  
  const handleZoom = () => {
    // Priority order for getting prompt/setting:
    // 1. createdMonsterMatch (from createdMonsters array - most reliable)
    // 2. dndClass itself (if it's a created monster)
    // 3. associatedMonster (found via findAssociatedMonster)
    const prompt = (createdMonsterMatch as any)?.prompt 
      || (isCreatedMonster ? (dndClass as any)?.prompt : undefined)
      || (associatedMonster as any)?.prompt;
    const setting = (createdMonsterMatch as any)?.setting 
      || (isCreatedMonster ? (dndClass as any)?.setting : undefined)
      || (associatedMonster as any)?.setting;
    
    onZoom({
      playerClass: { ...dndClass, hitPoints: dndClass.maxHitPoints },
      characterName: displayName,
      monsterImageUrl,
      canEdit: true, // All characters can be edited
      editType,
      imagePrompt: prompt || undefined, // Convert null to undefined
      imageSetting: setting || undefined, // Convert null to undefined
    });
  };
  
  const handleSelect = () => {
    onSelect({ ...dndClass, hitPoints: dndClass.maxHitPoints });
  };
  
  return (
    <div
      className="flex-shrink-0 relative group"
      style={{
        transform: isSelected ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
        padding: '4px', // Add padding to accommodate zoom without overflow
      }}
    >
      <div
        onClick={handleSelect}
        className="cursor-pointer transition-all"
      >
        <CharacterCard
          playerClass={{ ...dndClass, hitPoints: dndClass.maxHitPoints }}
          characterName={displayName}
          monsterImageUrl={monsterImageUrl}
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
