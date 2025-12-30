'use client';

import { useRef } from 'react';
import { Character } from '../../../lib/types';
import { CharacterCardZoom } from '../CharacterCardZoom';
import { ClassSelection } from '../ClassSelection';
import { AddMonsterCard } from '../../cards/AddMonsterCard';
import { SelectableClassCard } from '../../cards/SelectableClassCard';
import { ScrollButton } from '../../ui/ScrollButton';
import { OpponentHeader } from '../OpponentHeader';
import { OpponentTypeToggle } from '../OpponentTypeToggle';
import { useZoomModal } from '../../../hooks/ui/useZoomModal';

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
  const monsterScrollRef = useRef<HTMLDivElement>(null);
  const { zoomedCard, openZoom, closeZoom } = useZoomModal();

  const handleScroll = (direction: 'left' | 'right') => {
    if (monsterScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      monsterScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg md:text-xl font-semibold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
            Opponent (Auto-Play)
          </h3>
          <OpponentHeader
            player2Class={player2Class}
            player2Name={player2Name}
            findAssociatedMonster={findAssociatedMonster}
          />
        </div>
        <div className="flex items-center gap-4">
          <OpponentTypeToggle
            opponentType={opponentType}
            onOpponentTypeChange={onOpponentTypeChange}
            onClearSelection={onClearSelection}
          />
        </div>
      </div>
      {opponentType === 'monster' ? (
        <>
          {availableMonsters.length > 0 ? (
            <div className="mt-2 md:mt-3">
              <div className="relative">
                <ScrollButton direction="left" onClick={() => handleScroll('left')} />

                <div
                  ref={monsterScrollRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-4 px-10"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <div className="flex-shrink-0 relative group" style={{ padding: '4px' }}>
                    <AddMonsterCard size="compact" />
                  </div>
                  
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

                <ScrollButton direction="right" onClick={() => handleScroll('right')} />
              </div>
            </div>
          ) : (
            <div className="text-gray-600 text-sm italic text-center py-4">
              {monstersLoaded
                ? 'No monsters available. Click "Load Monsters from OpenRAG" to load monsters.'
                : 'Click "Load Monsters from OpenRAG" to load monsters.'}
            </div>
          )}
        </>
      ) : (
        <div className="mt-2 md:mt-3">
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

