'use client';

import { useRef, useCallback } from 'react';
import { Character } from '../../../lib/types';
import { CharacterCardZoom } from '../CharacterCardZoom';
import { ClassSelection } from '../ClassSelection';
import { AddMonsterCard } from '../../action-cards/AddMonsterCard';
import { SelectableClassCard } from '../../action-cards/SelectableClassCard';
import { ScrollButton } from '../../ui/ScrollButton';
import { OpponentHeader } from '../OpponentHeader';
import { OpponentTypeToggle } from '../OpponentTypeToggle';
import { useZoomModal } from '../../../hooks/ui/useZoomModal';

// Constants
const SCROLL_CARDS_COUNT = 5;
const FALLBACK_SCROLL_AMOUNT = 1000;
const CARD_PADDING = '4px';

// Style constants - organized for easy modification
const STYLES = {
  container: {
    header: 'flex items-center justify-between mb-2 md:mb-3',
    headerLeft: 'flex items-center gap-3',
    headerRight: 'flex items-center gap-4',
    title: 'text-base text-stone-500 font-semibold',
    content: 'mt-2 md:mt-3',
  },
  carousel: {
    container: 'flex items-center gap-4',
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
  },
  emptyState: {
    container: 'text-gray-600 text-sm italic text-center py-4',
    messages: {
      noMonsters: 'No monsters available. Click "Load Monsters from OpenRAG" to load monsters.',
      loadMonsters: 'Click "Load Monsters from OpenRAG" to load monsters.',
    },
  },
} as const;

type OpponentSelectorProps = {
  opponentType: 'class' | 'monster';
  onOpponentTypeChange: (type: 'class' | 'monster') => void;
  player2Class: Character | null;
  player2Name: string;
  availableClasses: Character[];
  availableMonsters: Character[];
  createdMonsters: Array<Character & { monsterId: string; imageUrl: string }>;
  monstersLoaded: boolean;
  findAssociatedMonster: (className: string) => (Character & { monsterId: string; imageUrl: string }) | null;
  onSelectClass: (cls: Character & { monsterId?: string; imageUrl?: string }) => void;
  onClearSelection: () => void;
  selectionSyncTrigger: number;
};

export function OpponentSelector({
  opponentType,
  onOpponentTypeChange,
  player2Class,
  player2Name,
  availableClasses,
  availableMonsters,
  createdMonsters,
  monstersLoaded,
  findAssociatedMonster,
  onSelectClass,
  onClearSelection,
  selectionSyncTrigger,
}: OpponentSelectorProps) {
  // ===== REFS =====
  const monsterScrollRef = useRef<HTMLDivElement>(null);
  
  // ===== HOOKS =====
  const { zoomedCard, openZoom, closeZoom } = useZoomModal();

  // ===== HELPER FUNCTIONS =====
  /**
   * Calculates scroll amount based on card width
   * @param direction - 'left' or 'right'
   */
  const calculateScrollAmount = useCallback((direction: 'left' | 'right'): number => {
    if (!monsterScrollRef.current) return 0;
    
    const container = monsterScrollRef.current;
    const firstCard = container.querySelector('[class*="flex-shrink-0"]') as HTMLElement;
    
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth;
      return cardWidth * SCROLL_CARDS_COUNT;
    }
    
    return FALLBACK_SCROLL_AMOUNT;
  }, []);

  // ===== SCROLL HANDLERS =====
  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (monsterScrollRef.current) {
      const scrollAmount = calculateScrollAmount(direction);
      const scrollDirection = direction === 'left' ? -scrollAmount : scrollAmount;
      monsterScrollRef.current.scrollBy({ left: scrollDirection, behavior: 'smooth' });
    }
  }, [calculateScrollAmount]);

  // ===== RENDER HELPERS =====
  const cardWrapperStyle = { padding: CARD_PADDING };
  const scrollContainerStyle = {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  };

  // ===== RENDER =====
  return (
    <div>
      {/* Header */}
      <div className={STYLES.container.header}>
        <div className={STYLES.container.headerLeft}>
          <h3 className={STYLES.container.title}>
            Opponent (Auto-Play)
          </h3>
          <OpponentHeader
            player2Class={player2Class}
            player2Name={player2Name}
            findAssociatedMonster={findAssociatedMonster}
          />
        </div>
        <div className={STYLES.container.headerRight}>
          <OpponentTypeToggle
            opponentType={opponentType}
            onOpponentTypeChange={onOpponentTypeChange}
            onClearSelection={onClearSelection}
          />
        </div>
      </div>

      {/* Content - Monster or Hero selection */}
      {opponentType === 'monster' ? (
        <>
          {availableMonsters.length > 0 ? (
            <div className={STYLES.container.content}>
              <div className={STYLES.carousel.container}>
                <ScrollButton direction="left" onClick={() => handleScroll('left')} />

                {/* Scrollable container with gradient fade */}
                <div className={STYLES.carousel.scrollable.wrapper}>
                  {/* Gradient overlays */}
                  <div className={`${STYLES.carousel.scrollable.gradient.base} ${STYLES.carousel.scrollable.gradient.left}`} />
                  <div className={`${STYLES.carousel.scrollable.gradient.base} ${STYLES.carousel.scrollable.gradient.right}`} />
                  
                  {/* Scrollable container */}
                  <div
                    ref={monsterScrollRef}
                    className={STYLES.carousel.scrollable.container}
                    style={scrollContainerStyle}
                  >
                    {/* Add Monster card */}
                    <div className={STYLES.carousel.scrollable.cardWrapper} style={cardWrapperStyle}>
                      <AddMonsterCard size="compact" />
                    </div>
                    
                    {/* Monster cards */}
                    {availableMonsters.map((monster, index) => {
                      const isSelected = player2Class?.name === monster.name;
                      
                      return (
                        <SelectableClassCard
                          key={monster.name}
                          character={monster}
                          index={index}
                          totalCards={availableMonsters.length}
                          isSelected={isSelected}
                          createdMonsters={createdMonsters}
                          selectionSyncTrigger={selectionSyncTrigger}
                          findAssociatedMonster={findAssociatedMonster}
                          onSelect={onSelectClass}
                          onZoom={openZoom}
                        />
                      );
                    })}
                  </div>
                </div>

                <ScrollButton direction="right" onClick={() => handleScroll('right')} />
              </div>
            </div>
          ) : (
            <div className={STYLES.emptyState.container}>
              {monstersLoaded
                ? STYLES.emptyState.messages.noMonsters
                : STYLES.emptyState.messages.loadMonsters}
            </div>
          )}
        </>
      ) : (
        <div className={STYLES.container.content}>
          <ClassSelection
            title=""
            availableClasses={availableClasses}
            selectedClass={player2Class}
            onSelect={onSelectClass}
            createdMonsters={createdMonsters}
            selectionSyncTrigger={selectionSyncTrigger}
            showAddHeroCard={false}
          />
        </div>
      )}
      
      {/* Zoom Modal */}
      {zoomedCard && (
        <CharacterCardZoom
          playerClass={zoomedCard.playerClass}
          characterName={zoomedCard.characterName}
          monsterImageUrl={zoomedCard.monsterImageUrl}
          isOpen={!!zoomedCard}
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

// Made with Bob

