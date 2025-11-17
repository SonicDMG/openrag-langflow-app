'use client';

import { useRef } from 'react';
import { DnDClass } from '../types';
import { CharacterCard } from './CharacterCard';
import { ClassSelection } from './ClassSelection';

type OpponentSelectorProps = {
  opponentType: 'class' | 'monster';
  onOpponentTypeChange: (type: 'class' | 'monster') => void;
  player2Class: DnDClass | null;
  player2Name: string;
  availableClasses: DnDClass[];
  availableMonsters: DnDClass[];
  createdMonsters: Array<DnDClass & { monsterId: string; imageUrl: string }>;
  monstersLoaded: boolean;
  findAssociatedMonster: (className: string) => (DnDClass & { monsterId: string; imageUrl: string }) | null;
  onSelectClass: (cls: DnDClass & { monsterId?: string; imageUrl?: string }) => void;
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

  return (
    <div>
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg md:text-xl font-semibold" style={{ fontFamily: 'serif', color: '#5C4033' }}>Opponent (Auto-Play)</h3>
          {player2Class && (
            <>
              {(() => {
                const associatedMonster = findAssociatedMonster(player2Class.name);
                const imageUrl = associatedMonster 
                  ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                  : '/cdn/placeholder.png';
                return (
                  <img
                    src={imageUrl}
                    alt={player2Class.name}
                    className="w-10 h-10 object-cover rounded"
                    style={{ imageRendering: 'pixelated' as const }}
                  />
                );
              })()}
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-bold text-sm" style={{ color: '#5C4033' }}>{player2Name || player2Class.name}</div>
                  <div className="text-xs text-gray-600 italic">{player2Class.name}</div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                onOpponentTypeChange('class');
                onClearSelection();
              }}
              className={`px-3 py-1 text-xs rounded border transition-all ${
                opponentType === 'class'
                  ? 'bg-blue-800 text-white border-blue-600'
                  : 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
              }`}
            >
              Class
            </button>
            <button
              onClick={() => {
                onOpponentTypeChange('monster');
                onClearSelection();
              }}
              className={`px-3 py-1 text-xs rounded border transition-all ${
                opponentType === 'monster'
                  ? 'bg-red-800 text-white border-red-600'
                  : 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
              }`}
            >
              Monster
            </button>
          </div>
        </div>
      </div>
      {opponentType === 'monster' ? (
        <>
          {/* Standard Monsters */}
          {availableMonsters.length > 0 ? (
            <div className="mt-2 md:mt-3">
              <div className="relative">
                {/* Left scroll button */}
                <button
                  onClick={() => {
                    if (monsterScrollRef.current) {
                      monsterScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
                  aria-label="Scroll left"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Scrollable container */}
                <div
                  ref={monsterScrollRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-4 px-10"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {availableMonsters.map((monster, index) => {
                    const associatedMonster = findAssociatedMonster(monster.name);
                    const monsterImageUrl = associatedMonster 
                      ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                      : undefined;
                    const hasCutout = (associatedMonster as any)?.hasCutout;
                    const monsterCutOutImageUrl = associatedMonster && hasCutout !== false
                      ? `/cdn/monsters/${associatedMonster.monsterId}/280x200-cutout.png`
                      : undefined;
                    
                    const isSelected = player2Class?.name === monster.name;
                    
                    return (
                      <div
                        key={monster.name}
                        onClick={() => {
                          onSelectClass({ ...monster, monsterId: associatedMonster?.monsterId, imageUrl: monsterImageUrl });
                        }}
                        className="flex-shrink-0 cursor-pointer transition-all"
                        style={{
                          transform: isSelected ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
                          padding: '4px',
                        }}
                      >
                        <CharacterCard
                          playerClass={{ ...monster, hitPoints: monster.maxHitPoints }}
                          characterName={monster.name}
                          monsterImageUrl={monsterImageUrl}
                          monsterCutOutImageUrl={monsterCutOutImageUrl}
                          size="compact"
                          cardIndex={index}
                          totalCards={availableMonsters.length}
                          isSelected={isSelected}
                          selectionSyncTrigger={selectionSyncTrigger}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Right scroll button */}
                <button
                  onClick={() => {
                    if (monsterScrollRef.current) {
                      monsterScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
                  aria-label="Scroll right"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-600 text-sm italic text-center py-4">
              {monstersLoaded ? 'No monsters available. Click "Load Monsters from OpenRAG" to load monsters.' : 'Click "Load Monsters from OpenRAG" to load monsters.'}
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
          />
        </div>
      )}
    </div>
  );
}

