'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DnDClass } from '../types';
import { CharacterCard } from './CharacterCard';
import { CharacterCardZoom } from './CharacterCardZoom';
import { generateDeterministicCharacterName } from '../utils/names';
import { isMonster, FALLBACK_CLASSES } from '../constants';

interface ClassSelectionProps {
  title: string;
  availableClasses: DnDClass[];
  selectedClass: DnDClass | null;
  onSelect: (dndClass: DnDClass) => void;
  createdMonsters?: Array<DnDClass & { monsterId: string; imageUrl: string }>;
  selectionSyncTrigger?: number;
}

export function ClassSelection({ title, availableClasses, selectedClass, onSelect, createdMonsters = [], selectionSyncTrigger = 0 }: ClassSelectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [zoomedCard, setZoomedCard] = useState<{ playerClass: DnDClass; characterName: string; monsterImageUrl?: string; monsterCutOutImageUrl?: string; canEdit: boolean; editType?: 'hero' | 'monster' } | null>(null);
  
  // Helper to find associated monster for a class
  const findAssociatedMonster = (className: string): (DnDClass & { monsterId: string; imageUrl: string }) | null => {
    const associated = createdMonsters
      .filter(m => {
        // For created monsters, match by klass field; for regular monsters, match by name
        const monsterKlass = (m as any).klass;
        return monsterKlass ? monsterKlass === className : m.name === className;
      })
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
      {title && (
        <h3 className="text-lg font-semibold mb-3 text-amber-200">{title}</h3>
      )}
      <div className="relative">
        {/* Left scroll button */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-1 sm:p-1.5 md:p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

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
          {availableClasses.map((dndClass, index) => {
            // For created monsters, use klass to find associated monster; for regular classes, use name
            const isCreatedMonster = !!(dndClass as any).klass && !!(dndClass as any).monsterId;
            const lookupName = isCreatedMonster ? (dndClass as any).klass : dndClass.name;
            const associatedMonster = findAssociatedMonster(lookupName);
            const monsterImageUrl = associatedMonster 
              ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
              : undefined;
            // Generate cutout URL if monster has cutout images (hasCutout === true)
            // For backward compatibility, also try if hasCutout is undefined (old monsters)
            // CharacterCard will handle 404s gracefully if cutout doesn't exist
            const hasCutout = (associatedMonster as any)?.hasCutout;
            const monsterCutOutImageUrl = associatedMonster && hasCutout !== false
              ? `/cdn/monsters/${associatedMonster.monsterId}/280x200-cutout.png`
              : undefined;
            
            const isSelected = selectedClass?.name === dndClass.name;
            
            // Generate character name for display (deterministic so it matches what will be generated on selection)
            // For created monsters, dndClass.name is already the character name and dndClass.klass is the class type
            // For custom heroes (not in FALLBACK_CLASSES), dndClass.name is already the character name
            // For regular classes/monsters, check if it's a monster or generate a name
            const isCustomHero = !isCreatedMonster && !isMonster(dndClass.name) && !FALLBACK_CLASSES.some(fc => fc.name === dndClass.name);
            const displayName = isCreatedMonster
              ? dndClass.name // Created monsters already have the character name in the name field
              : isCustomHero
                ? dndClass.name // Custom heroes already have the character name in the name field
                : (isMonster(dndClass.name) 
                    ? dndClass.name 
                    : generateDeterministicCharacterName(dndClass.name));
            
            // Determine edit type - all characters can be edited
            const editType = isCreatedMonster ? 'monster' : (isMonster(dndClass.name) ? 'monster' : 'hero');
            
            const handleZoom = () => {
              setZoomedCard({
                playerClass: { ...dndClass, hitPoints: dndClass.maxHitPoints },
                characterName: displayName,
                monsterImageUrl,
                monsterCutOutImageUrl,
                canEdit: true, // All characters can be edited
                editType,
              });
            };
            
            return (
              <div
                key={dndClass.name}
                className="flex-shrink-0 relative group"
                style={{
                  transform: isSelected ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
                  padding: '4px', // Add padding to accommodate zoom without overflow
                }}
              >
                <div
                  onClick={() => onSelect({ ...dndClass, hitPoints: dndClass.maxHitPoints })}
                  className="cursor-pointer transition-all"
                >
                  <CharacterCard
                    playerClass={{ ...dndClass, hitPoints: dndClass.maxHitPoints }}
                    characterName={displayName}
                    monsterImageUrl={monsterImageUrl}
                    monsterCutOutImageUrl={monsterCutOutImageUrl}
                    size="compact"
                    cardIndex={index}
                    totalCards={availableClasses.length}
                    isSelected={isSelected}
                    selectionSyncTrigger={selectionSyncTrigger}
                    showZoomButton={true}
                    onZoom={handleZoom}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right scroll button */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-1 sm:p-1.5 md:p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Zoom Modal */}
      {zoomedCard && (
        <CharacterCardZoom
          playerClass={zoomedCard.playerClass}
          characterName={zoomedCard.characterName}
          monsterImageUrl={zoomedCard.monsterImageUrl}
          monsterCutOutImageUrl={zoomedCard.monsterCutOutImageUrl}
          isOpen={!!zoomedCard}
          onClose={() => setZoomedCard(null)}
          canEdit={zoomedCard.canEdit}
          editType={zoomedCard.editType}
        />
      )}
    </div>
  );
}

