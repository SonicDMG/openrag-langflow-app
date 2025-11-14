'use client';

import { useRef } from 'react';
import { DnDClass } from '../types';
import { CharacterCard } from './CharacterCard';

interface ClassSelectionProps {
  title: string;
  availableClasses: DnDClass[];
  selectedClass: DnDClass | null;
  onSelect: (dndClass: DnDClass) => void;
  createdMonsters?: Array<DnDClass & { monsterId: string; imageUrl: string }>;
}

export function ClassSelection({ title, availableClasses, selectedClass, onSelect, createdMonsters = [] }: ClassSelectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Helper to find associated monster for a class
  const findAssociatedMonster = (className: string): (DnDClass & { monsterId: string; imageUrl: string }) | null => {
    const associated = createdMonsters
      .filter(m => m.name === className)
      .sort((a, b) => {
        // Sort by lastAssociatedAt (most recently associated first), then by createdAt (newest first)
        const aTime = (a as any).lastAssociatedAt || (a as any).createdAt || '';
        const bTime = (b as any).lastAssociatedAt || (b as any).createdAt || '';
        if (aTime && bTime) {
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }
        // Fallback to UUID sort if no timestamps
        return b.monsterId.localeCompare(a.monsterId);
      });
    return associated.length > 0 ? associated[0] : null;
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' }); // Scaled for compact cards (192px + gap)
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' }); // Scaled for compact cards
    }
  };
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-amber-200">{title}</h3>
      <div className="relative">
        {/* Left scroll button */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-10"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {availableClasses.map((dndClass, index) => {
            const associatedMonster = findAssociatedMonster(dndClass.name);
            const monsterImageUrl = associatedMonster 
              ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
              : undefined;
            const monsterCutOutImageUrl = associatedMonster 
              ? `/cdn/monsters/${associatedMonster.monsterId}/280x200-cutout.png`
              : undefined;
            
            const isSelected = selectedClass?.name === dndClass.name;
            
            return (
              <div
                key={dndClass.name}
                onClick={() => onSelect({ ...dndClass, hitPoints: dndClass.maxHitPoints })}
                className={`flex-shrink-0 cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-4 ring-amber-400 shadow-2xl'
                    : 'hover:shadow-lg'
                }`}
                style={{
                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                  padding: '4px', // Add padding to accommodate zoom without overflow
                }}
              >
                <CharacterCard
                  playerClass={{ ...dndClass, hitPoints: dndClass.maxHitPoints }}
                  characterName={dndClass.name}
                  monsterImageUrl={monsterImageUrl}
                  monsterCutOutImageUrl={monsterCutOutImageUrl}
                  size="compact"
                  cardIndex={index}
                  totalCards={availableClasses.length}
                />
              </div>
            );
          })}
        </div>

        {/* Right scroll button */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

