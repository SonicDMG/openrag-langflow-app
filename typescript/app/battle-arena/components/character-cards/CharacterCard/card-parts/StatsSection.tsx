import React, { memo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon } from '@hugeicons/core-free-icons';
import { Character } from '../../../../lib/types';
import { CardSizing, getCardSizeClasses } from '../../../../hooks/ui/useCardSizing';

// ============================================================================
// Type Definitions
// ============================================================================

interface StatsSectionProps {
  playerClass: Character;
  isDefeated: boolean;
  sizing: CardSizing;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Stats section displaying AC (Armor Class) and HP (Hit Points)
 */
export const StatsSection = memo(function StatsSection({
  playerClass,
  isDefeated,
  sizing,
}: StatsSectionProps) {
  // ===== DERIVED VALUES =====
  const sizeClasses = getCardSizeClasses(sizing.isCompact);
  const hpPercentage = isDefeated
    ? 0
    : (playerClass.hitPoints / playerClass.maxHitPoints) * 100;
  const currentHp = isDefeated ? 0 : playerClass.hitPoints;
  const iconSize = sizing.isCompact ? 14 : 18;

  // ===== STYLE CALCULATIONS =====
  // Container classes
  const containerClasses = [
    'mt-auto',
    sizing.isCompact ? 'px-3 pb-3' : 'px-4 pb-4',
  ].filter(Boolean).join(' ');

  // HP bar container style
  const hpBarContainerStyle = {
    height: sizing.isCompact ? '8px' : '12px',
    maxWidth: sizing.hpBarMaxWidth,
  };

  // HP bar fill style
  const hpBarFillStyle = {
    width: `${hpPercentage}%`,
  };

  // Text classes
  const statsTextClasses = [
    'font-bold',
    sizeClasses.statsTextSize,
    'text-stone-500',
  ].filter(Boolean).join(' ');

  // ===== RENDER =====
  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between gap-1">
        {/* AC (Armor Class) - left side */}
        <div className="text-stone-500 flex items-center flex-shrink-0">
          <HugeiconsIcon
            icon={Shield01Icon}
            size={iconSize}
            strokeWidth={2.5}
            fill="currentColor"
          />
        </div>
          <span className={statsTextClasses}>
            {playerClass.armorClass}
          </span>

        {/* HP with bar - right side */}
        <div className="flex items-center flex-1 justify-end gap-0 min-w-0">
          <div
            className="flex-1 rounded-sm overflow-hidden bg-stone-950/10 border-stone-100"
            style={hpBarContainerStyle}
          >
            <div
              className="h-full transition-all bg-amber-300"
              style={hpBarFillStyle}
            />
          </div>
          <span className={`${statsTextClasses} pl-1 whitespace-nowrap`}>
            {currentHp}/{playerClass.maxHitPoints}
          </span>
        </div>
      </div>
    </div>
  );
});

// Made with Bob
