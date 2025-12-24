'use client';

import { useRef, useCallback } from 'react';
import { DnDClass } from '../types';
import { CharacterCardZoom } from './CharacterCardZoom';
import { AddHeroCard } from './AddHeroCard';
import { LoadDefaultHeroesCard } from './LoadDefaultHeroesCard';
import { ScrollButton } from './ScrollButton';
import { SelectableClassCard } from './SelectableClassCard';
import { useMonsterAssociation } from './hooks/useMonsterAssociation';
import { useZoomModal } from './hooks/useZoomModal';

interface ClassSelectionProps {
  title: string;
  availableClasses: DnDClass[];
  selectedClass: DnDClass | null;
  onSelect: (dndClass: DnDClass) => void;
  createdMonsters?: Array<DnDClass & { monsterId: string; imageUrl: string }>;
  selectionSyncTrigger?: number;
}

/**
 * ClassSelection Component
 *
 * A horizontal scrollable carousel for selecting D&D characters and monsters.
 * Displays character cards in a compact format with scroll navigation and zoom capabilities.
 *
 * @component
 *
 * ## Features
 * - Horizontal scrollable carousel with left/right navigation buttons
 * - Displays "Add Hero" and "Load Default Heroes" cards alongside character cards
 * - Visual selection indicator with scale and position transform
 * - Click-to-select functionality for each character
 * - Zoom modal for detailed character view with edit capabilities
 * - Automatic monster image association for created monsters
 * - Performance optimized with memoized callbacks and custom hooks
 *
 * ## Architecture
 * - Uses `useMonsterAssociation` hook for efficient monster lookup
 * - Uses `useZoomModal` hook for clean zoom state management
 * - Delegates card rendering to `SelectableClassCard` component
 * - Scroll buttons extracted to reusable `ScrollButton` component
 *
 * ## Props
 * @param {string} title - Header title displayed above the carousel
 * @param {DnDClass[]} availableClasses - Array of character/monster classes to display
 * @param {DnDClass | null} selectedClass - Currently selected character (highlighted)
 * @param {function} onSelect - Callback when a character is selected
 * @param {Array} [createdMonsters=[]] - Array of created monsters with image metadata
 * @param {number} [selectionSyncTrigger=0] - Trigger value for syncing selection animations
 *
 * ## Usage Example
 * ```tsx
 * <ClassSelection
 *   title="Choose Your Hero"
 *   availableClasses={heroes}
 *   selectedClass={selectedHero}
 *   onSelect={handleHeroSelect}
 *   createdMonsters={customMonsters}
 *   selectionSyncTrigger={syncTrigger}
 * />
 * ```
 *
 * @see SelectableClassCard - Individual card component
 * @see useMonsterAssociation - Monster lookup hook
 * @see useZoomModal - Zoom state management hook
 */
export function ClassSelection({ title, availableClasses, selectedClass, onSelect, createdMonsters = [], selectionSyncTrigger = 0 }: ClassSelectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks for cleaner state management
  const { zoomedCard, openZoom, closeZoom, isOpen } = useZoomModal();
  const findAssociatedMonster = useMonsterAssociation(createdMonsters);

  // Memoized scroll functions to prevent unnecessary re-renders
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }, []);
  
  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold mb-3 text-amber-200">{title}</h3>
      )}
      <div className="relative">
        {/* Left scroll button */}
        <ScrollButton direction="left" onClick={scrollLeft} />

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 sm:pb-2 md:pb-3 pt-2 sm:pt-2 md:pt-3 px-6 sm:px-8 md:px-10"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            // On small screens, limit visible area to show ~2 cards (192px * 2 + gap + padding)
            maxWidth: '100%',
          }}
        >
          {/* Always show "Add your Hero" card at the beginning */}
          <div
            className="flex-shrink-0 relative group"
            style={{
              padding: '4px',
            }}
          >
            <AddHeroCard size="compact" />
          </div>
          
          {/* Show "Load Default Heroes" card if no heroes exist */}
          {availableClasses.length === 0 && (
            <div
              className="flex-shrink-0 relative group"
              style={{
                padding: '4px',
              }}
            >
              <LoadDefaultHeroesCard size="compact" />
            </div>
          )}
          
          {/* Hero cards */}
          {availableClasses.map((dndClass, index) => (
            <SelectableClassCard
              key={dndClass.name}
              dndClass={dndClass}
              index={index}
              totalCards={availableClasses.length}
              isSelected={selectedClass?.name === dndClass.name}
              createdMonsters={createdMonsters}
              selectionSyncTrigger={selectionSyncTrigger}
              findAssociatedMonster={findAssociatedMonster}
              onSelect={onSelect}
              onZoom={openZoom}
            />
          ))}
        </div>

        {/* Right scroll button */}
        <ScrollButton direction="right" onClick={scrollRight} />
      </div>
      
      {/* Zoom Modal */}
      {isOpen && zoomedCard && (
        <CharacterCardZoom
          playerClass={zoomedCard.playerClass}
          characterName={zoomedCard.characterName}
          monsterImageUrl={zoomedCard.monsterImageUrl}
          isOpen={isOpen}
          onClose={closeZoom}
          canEdit={zoomedCard.canEdit}
          editType={zoomedCard.editType}
          imagePrompt={zoomedCard.imagePrompt}
          imageSetting={zoomedCard.imageSetting}
        />
      )}
    </div>
  );
}

