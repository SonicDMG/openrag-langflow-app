'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Character } from '../../../lib/types';
import { CharacterCardZoom } from '../CharacterCardZoom';
import { ClassSelection } from '../ClassSelection';
import { AddCharacterCard } from '../../action-cards/AddCharacterCard';
import { SelectableClassCard } from '../../action-cards/SelectableClassCard';
import { ScrollButton } from '../../ui/ScrollButton';
import { OpponentTypeToggle } from '../OpponentTypeToggle';
import { useZoomModal } from '../../../hooks/ui/useZoomModal';

// Constants
const SCROLL_CARDS_COUNT = 5;
const FALLBACK_SCROLL_AMOUNT = 1000;
const CARD_PADDING = '4px';

// Style constants - organized for easy modification
const STYLES = {
  container: {
    header: 'grid grid-cols-3 items-center mb-2 md:mb-3',
    headerLeft: 'flex items-center justify-start',
    headerCenter: 'flex items-center justify-center gap-2 sm:gap-3',
    headerRight: 'flex items-center justify-end gap-4',
    title: 'text-base text-stone-500 font-semibold',
    content: 'mt-2 md:mt-3',
  },
      vsDisplay: {
        container: 'flex items-center gap-2 sm:gap-3',
        character: {
          name: 'text-lg text-stone-800 font-semibold',
        },
        vs: 'text-stone-500 font-semibold text-xs sm:text-sm',
      },
  carousel: {
    container: 'flex items-center gap-4',
    scrollable: {
      wrapper: 'relative flex-1 min-w-0 overflow-y-visible',
      gradient: {
        base: 'absolute top-0 bottom-0 w-16 z-10 pointer-events-none',
        left: 'left-0 bg-gradient-to-r from-[var(--page-background)] to-transparent',
        right: 'right-0 bg-gradient-to-l from-[var(--page-background)] to-transparent',
      },
      container: 'flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto overflow-y-visible scrollbar-hide pb-2 sm:pb-2 md:pb-3 pt-2 sm:pt-2 md:pt-3 px-6 sm:px-8 md:px-10',
      cardWrapper: 'flex-shrink-0 relative group overflow-visible',
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
  player1Class: Character | null;
  player1Name: string;
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
  player1Class,
  player1Name,
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
  
  // ===== SCROLL TO SELECTED CARD =====
  // Scroll to the selected opponent card when it's auto-selected
  useEffect(() => {
    if (!player2Class || !monsterScrollRef.current) return;
    
    // Only scroll for monster selection (class selection is handled by ClassSelection component)
    if (opponentType !== 'monster') return;
    
    // Find the index of the selected monster
    const selectedIndex = availableMonsters.findIndex(monster => monster.name === player2Class.name);
    if (selectedIndex === -1) return;
    
    // Small delay to ensure DOM is updated after selection
    const timeoutId = setTimeout(() => {
      const scrollContainer = monsterScrollRef.current;
      if (!scrollContainer) return;
      
      // Find all card wrapper elements (first is AddCharacterCard, rest are monster cards)
      const cardWrappers = Array.from(scrollContainer.querySelectorAll('[class*="flex-shrink-0"]'));
      
      // The selected card is at index + 1 (because AddCharacterCard is first)
      const selectedCardWrapper = cardWrappers[selectedIndex + 1];
      
      if (selectedCardWrapper) {
        // Scroll this card into view
        selectedCardWrapper.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [player2Class, opponentType, availableMonsters]);

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

  // ===== HELPER FUNCTIONS =====
  const getCharacterDisplay = (character: Character | null, name: string) => {
    if (!character) return null;
    
    const displayName = name || character.name;
    
    return {
      name: displayName,
      className: character.name,
    };
  };

  const heroDisplay = getCharacterDisplay(player1Class, player1Name);
  const opponentDisplay = getCharacterDisplay(player2Class, player2Name);

  // ===== RENDER =====
  return (
    <div className="overflow-visible">
      {/* Header */}
      <div className={STYLES.container.header}>
        {/* Left: Label */}
        <div className={STYLES.container.headerLeft}>
          <h3 className={STYLES.container.title}>
            Opponent (Auto-Play)
          </h3>
        </div>

        {/* Center: Hero vs. Opponent */}
        <div className={STYLES.container.headerCenter}>
          {heroDisplay && opponentDisplay ? (
            <div className={STYLES.vsDisplay.container}>
              {/* Hero */}
              <span className={STYLES.vsDisplay.character.name}>
                {heroDisplay.name}
              </span>
              
              {/* VS */}
              <span className={STYLES.vsDisplay.vs}>VS</span>
              
              {/* Opponent */}
              <span className={STYLES.vsDisplay.character.name}>
                {opponentDisplay.name}
              </span>
            </div>
          ) : (
            <div className={STYLES.vsDisplay.container}>
            </div>
          )}
        </div>

        {/* Right: Toggle */}
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
                      <AddCharacterCard type="monster" size="compact" />
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

