'use client';

import { useRef, useCallback } from 'react';
import { Character } from '../../../lib/types';
import { CharacterCardZoom } from '../CharacterCardZoom';
import { AddHeroCard } from '../../action-cards/AddHeroCard';
import { LoadDefaultHeroesCard } from '../../action-cards/LoadDefaultHeroesCard';
import { ScrollButton } from '../../ui/ScrollButton';
import { SelectableClassCard } from '../../action-cards/SelectableClassCard';
import { useMonsterAssociation } from '../../../hooks/ui/useMonsterAssociation';
import { useZoomModal } from '../../../hooks/ui/useZoomModal';

// Constants
const SCROLL_CARDS_COUNT = 5;
const FALLBACK_SCROLL_AMOUNT = 1000;
const CARD_PADDING = '4px';

// Style constants - organized for easy modification
const STYLES = {
  container: {
    title: 'text-lg font-semibold mb-3 text-amber-200',
    carousel: 'flex items-center gap-4',
  },
  scrollable: {
    wrapper: 'relative flex-1 min-w-0',
    gradient: {
      base: 'absolute top-0 bottom-0 w-16 z-10 pointer-events-none',
      left: 'left-0 bg-gradient-to-r from-[var(--page-background)] to-transparent',
      right: 'right-0 bg-gradient-to-l from-[var(--page-background)] to-transparent',
    },
    container: 'flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 sm:pb-2 md:pb-3 pt-2 sm:pt-2 md:pt-3 px-6 sm:px-8 md:px-10',
    cardWrapper: 'flex-shrink-0 relative group',
  },
} as const;

interface ClassSelectionProps {
  title: string;
  availableClasses: Character[];
  selectedClass: Character | null;
  onSelect: (character: Character) => void;
  createdMonsters?: Array<Character & { monsterId: string; imageUrl: string }>;
  selectionSyncTrigger?: number;
  showAddHeroCard?: boolean;
}

/**
 * ClassSelection Component
 *
 * A horizontal scrollable carousel for selecting Battle Arena characters and monsters.
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
 * @param {Character[]} availableClasses - Array of character/monster classes to display
 * @param {Character | null} selectedClass - Currently selected character (highlighted)
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
export function ClassSelection({ title, availableClasses, selectedClass, onSelect, createdMonsters = [], selectionSyncTrigger = 0, showAddHeroCard = true }: ClassSelectionProps) {
  // ===== REFS =====
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // ===== HOOKS =====
  const { zoomedCard, openZoom, closeZoom, isOpen } = useZoomModal();
  const findAssociatedMonster = useMonsterAssociation(createdMonsters);

  // ===== HELPER FUNCTIONS =====
  /**
   * Calculates scroll amount based on card width
   * @param direction - 'left' or 'right'
   */
  const calculateScrollAmount = useCallback((direction: 'left' | 'right'): number => {
    if (!scrollContainerRef.current) return 0;
    
    const container = scrollContainerRef.current;
    const firstCard = container.querySelector('[class*="flex-shrink-0"]') as HTMLElement;
    
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth;
      return cardWidth * SCROLL_CARDS_COUNT;
    }
    
    return FALLBACK_SCROLL_AMOUNT;
  }, []);

  // ===== SCROLL HANDLERS =====
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollAmount = calculateScrollAmount('left');
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }, [calculateScrollAmount]);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollAmount = calculateScrollAmount('right');
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, [calculateScrollAmount]);
  
  // ===== RENDER HELPERS =====
  const cardWrapperStyle = { padding: CARD_PADDING };
  const scrollContainerStyle = {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  };

  return (
    <div>
      {/* Title */}
      {title && (
        <h3 className={STYLES.container.title}>{title}</h3>
      )}

      {/* Carousel */}
      <div className={STYLES.container.carousel}>
        <ScrollButton direction="left" onClick={scrollLeft} />

        {/* Scrollable container with gradient fade */}
        <div className={STYLES.scrollable.wrapper}>
          {/* Gradient overlays */}
          <div className={`${STYLES.scrollable.gradient.base} ${STYLES.scrollable.gradient.left}`} />
          <div className={`${STYLES.scrollable.gradient.base} ${STYLES.scrollable.gradient.right}`} />
          
          {/* Scrollable container */}
          <div
            ref={scrollContainerRef}
            className={STYLES.scrollable.container}
            style={scrollContainerStyle}
          >
            {/* Add Hero card */}
            {showAddHeroCard && (
              <div className={STYLES.scrollable.cardWrapper} style={cardWrapperStyle}>
                <AddHeroCard size="compact" />
              </div>
            )}
            
            {/* Load Default Heroes card (when no heroes exist) */}
            {availableClasses.length === 0 && (
              <div className={STYLES.scrollable.cardWrapper} style={cardWrapperStyle}>
                <LoadDefaultHeroesCard size="compact" />
              </div>
            )}
            
            {/* Hero cards */}
            {availableClasses.map((character, index) => (
              <SelectableClassCard
                key={character.name}
                character={character}
                index={index}
                totalCards={availableClasses.length}
                isSelected={selectedClass?.name === character.name}
                createdMonsters={createdMonsters}
                selectionSyncTrigger={selectionSyncTrigger}
                findAssociatedMonster={findAssociatedMonster}
                onSelect={onSelect}
                onZoom={openZoom}
              />
            ))}
          </div>
        </div>

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

