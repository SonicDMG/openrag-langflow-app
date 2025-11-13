'use client';

import { DnDClass } from '../types';

interface ClassSelectionProps {
  title: string;
  availableClasses: DnDClass[];
  selectedClass: DnDClass | null;
  onSelect: (dndClass: DnDClass) => void;
  createdMonsters?: Array<DnDClass & { monsterId: string; imageUrl: string }>;
}

export function ClassSelection({ title, availableClasses, selectedClass, onSelect, createdMonsters = [] }: ClassSelectionProps) {
  const placeholderImageUrl = '/cdn/placeholder.png';
  
  // Helper to find associated monster for a class
  const findAssociatedMonster = (className: string): (DnDClass & { monsterId: string; imageUrl: string }) | null => {
    const associated = createdMonsters
      .filter(m => m.name === className)
      .sort((a, b) => {
        // Sort by monsterId (UUIDs) - most recent first
        return b.monsterId.localeCompare(a.monsterId);
      });
    return associated.length > 0 ? associated[0] : null;
  };
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-amber-200">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {availableClasses.map((dndClass) => {
          const associatedMonster = findAssociatedMonster(dndClass.name);
          const imageUrl = associatedMonster 
            ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
            : placeholderImageUrl;
          
          return (
          <button
            key={dndClass.name}
            onClick={() => onSelect({ ...dndClass, hitPoints: dndClass.maxHitPoints })}
              className={`py-2 px-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
              selectedClass?.name === dndClass.name
                ? 'border-amber-400 bg-amber-800 shadow-lg scale-105'
                : 'border-amber-700 bg-amber-900/50 hover:bg-amber-800 hover:border-amber-600'
            }`}
          >
              <img
                src={imageUrl}
                alt={dndClass.name}
                className="w-12 h-12 object-cover rounded"
                style={{ imageRendering: 'pixelated' as const }}
              />
              <div className="font-bold text-xs text-amber-100 text-center">{dndClass.name}</div>
          </button>
          );
        })}
      </div>
    </div>
  );
}

