import React, { memo } from 'react';
import { Character } from '../../types';
import { CARD_THEME } from '../cardTheme';
import { CardSizing } from '../../hooks/ui/useCardSizing';

interface StatsSectionProps {
  playerClass: Character;
  isDefeated: boolean;
  sizing: CardSizing;
}

/**
 * Stats section displaying AC (Armor Class) and HP (Hit Points)
 */
export const StatsSection = memo(function StatsSection({
  playerClass,
  isDefeated,
  sizing,
}: StatsSectionProps) {
  const iconSize = sizing.isCompact ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className="mt-auto" style={{ paddingLeft: sizing.padding, paddingRight: sizing.padding, paddingBottom: sizing.padding }}>
      <div className="flex items-center justify-between">
        {/* AC (Armor Class) - left side */}
        <div className="flex items-center" style={{ gap: '0' }}>
          {/* Green shield icon */}
          <div className={iconSize} style={{ flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                fill={CARD_THEME.colors.shieldGreen}
                d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"
              />
              <path
                fill={CARD_THEME.colors.shieldGreenDark}
                d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"
                opacity="0.8"
              />
            </svg>
          </div>
          <span className={`font-bold ${sizing.statsTextSize}`} style={{ color: CARD_THEME.colors.text }}>
            {playerClass.armorClass}
          </span>
        </div>

        {/* HP with bar - right side */}
        <div className="flex items-center flex-1 justify-end" style={{ gap: '0' }}>
          {/* Heart icon */}
          <div className={iconSize} style={{ flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                fill={CARD_THEME.colors.heartRed}
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </div>
          <div 
            className="flex-1 rounded-sm overflow-hidden"
            style={{ 
              backgroundColor: CARD_THEME.colors.hpBarBg,
              height: sizing.isCompact ? '8px' : '12px',
              border: sizing.isCompact ? `0.5px solid ${CARD_THEME.colors.border}` : `1px solid ${CARD_THEME.colors.border}`,
              maxWidth: sizing.hpBarMaxWidth
            }}
          >
            <div
              className="h-full transition-all"
              style={{ 
                backgroundColor: CARD_THEME.colors.hpBar,
                width: `${isDefeated ? 0 : (playerClass.hitPoints / playerClass.maxHitPoints) * 100}%` 
              }}
            />
          </div>
          <span 
            className={`font-bold ${sizing.statsTextSize}`} 
            style={{ 
              color: CARD_THEME.colors.text, 
              marginLeft: sizing.isCompact ? '0.125rem' : '0.25rem' 
            }}
          >
            {isDefeated ? 0 : playerClass.hitPoints} / {playerClass.maxHitPoints}
          </span>
        </div>
      </div>
    </div>
  );
});

// Made with Bob
