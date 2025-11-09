'use client';

import { DnDClass } from '../types';
import { CLASS_ICONS } from '../constants';

interface ClassSelectionProps {
  title: string;
  availableClasses: DnDClass[];
  selectedClass: DnDClass | null;
  onSelect: (dndClass: DnDClass) => void;
}

export function ClassSelection({ title, availableClasses, selectedClass, onSelect }: ClassSelectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-amber-200">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {availableClasses.map((dndClass) => {
          const icon = CLASS_ICONS[dndClass.name] || '⚔️';
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
              <span 
                className="text-2xl leading-none"
                style={{ 
                  imageRendering: 'pixelated' as const,
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'
                }}
              >
                {icon}
              </span>
              <div className="font-bold text-xs text-amber-100 text-center">{dndClass.name}</div>
          </button>
          );
        })}
      </div>
    </div>
  );
}

