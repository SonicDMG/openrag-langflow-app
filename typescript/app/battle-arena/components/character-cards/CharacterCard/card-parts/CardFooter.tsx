import React, { memo } from 'react';
import { CARD_THEME } from '../../../cardTheme';
import { getCardSizeClasses } from '../../../../hooks/ui/useCardSizing';

// ============================================================================
// Type Definitions
// ============================================================================

interface CardFooterProps {
  cardIndex?: number;
  totalCards?: number;
  isCompact: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Card footer component displaying card number, dragon icon, and branding
 * Matches design reference layout
 */
export const CardFooter = memo(function CardFooter({
  cardIndex,
  totalCards,
  isCompact,
}: CardFooterProps) {
  // ===== DERIVED VALUES =====
  const sizeClasses = getCardSizeClasses(isCompact);
  const cardNumber = cardIndex !== undefined && totalCards !== undefined
    ? `${cardIndex + 1}/${totalCards}`
    : '1/12';
  const currentYear = new Date().getFullYear();

  // ===== STYLE CALCULATIONS =====
  // Container classes
  const containerClasses = [
    'relative',
    'flex',
    'items-center',
    'justify-between',
    'bg-stone-800',
    isCompact ? 'mt-1 h-4 px-2' : 'mt-1.5 h-5 px-2.5',
  ].filter(Boolean).join(' ');

  // Dragon icon size
  const dragonIconSize = isCompact
    ? { width: '14px', height: '10px' }
    : { width: '20px', height: '14px' };

  // Text classes
  const textClasses = [
    sizeClasses.footerTextSize,
    'text-stone-50/50',
    'font-semibold',
    'text-xs',
  ].filter(Boolean).join(' ');

  // ===== RENDER =====
  return (
    <div className={containerClasses}>
      {/* Card number in bottom left */}
      <span
        className={textClasses}
        style={{
          fontFamily: CARD_THEME.fonts.family,
        }}
      >
        {cardNumber}
      </span>

      {/* Dragon icon in center */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={dragonIconSize}
      >
        <svg
          width="20"
          height="14"
          viewBox="0 0 20 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full opacity-60"
        >
          <path
            d="M19.2762 6.32462C17.5746 6.61539 16.2792 8.09615 16.2792 9.88077C16.2792 10.0831 16.2969 10.2815 16.3292 10.4754C16.1985 10.4662 16.0662 10.4608 15.9331 10.4608C13.9977 10.4608 12.6838 11.5092 12.1538 13.0769H7.53846C7.02769 11.5092 5.69462 10.4608 3.75923 10.4608C3.62615 10.4608 3.49385 10.4662 3.36308 10.4754C3.39538 10.2815 3.41308 10.0831 3.41308 9.88077C3.41308 8.09615 2.11769 6.61539 0.416154 6.32462C1.27077 5.60846 1.81462 4.53385 1.81462 3.33154C1.81462 1.94462 1.09077 0.726154 0 0.0353846C0.249231 0.0115385 0.502308 0 0.757692 0C3.14615 0 5.29231 1.03538 6.77154 2.68308C6.28692 3.46077 6 4.42769 6 5.47538C6 7.07077 6.62985 8.52269 7.67923 9.31538C8.02615 9.57746 8.38262 9.498 8.59446 9.292C8.812 9.08046 8.81177 8.69369 8.56846 8.44C7.80577 7.64462 7.45462 7.21231 7.47923 6.09231C7.48769 5.68615 7.64385 5.30077 7.86769 4.97308C7.74692 4.96 7.62077 4.91385 7.50538 4.80539C7.14 4.46077 7.20385 3.89308 7.20769 3.86462C7.54 4.27077 8.08462 4.42077 8.56923 4.26231C8.58077 4.25385 8.59231 4.24615 8.60385 4.23769C7.84 3.68077 8.02462 2.80231 8.03154 2.77077C8.29923 3.43385 8.94538 3.85 9.63846 3.84538C10.3931 3.75462 10.9715 4.06308 10.9715 4.06308C10.9715 4.06308 11.1346 3.73846 11.1346 3.25154C11.1346 3.25154 11.5385 3.64308 11.8331 4.31C12.0362 4.76923 12.0677 5.22462 12.3285 5.53154L12.7046 5.89231C12.8023 5.98538 12.8038 6.14154 12.7069 6.23615L12.2385 6.69923L12.2854 6.30077L11.3462 5.83077C11.45 6.08923 11.7385 6.72231 11.7385 6.72231L12.0292 6.84769L11.6646 6.98385C11.5308 7.03308 11.3808 6.99462 11.2877 6.88692C11.07 6.63308 10.3831 5.82615 10.3469 5.78231C10.1062 5.48769 9.57077 5.43385 9.33077 5.90615C9.16154 6.24 9.38231 6.54077 9.47462 6.64692C9.92385 7.16385 11.5138 7.83308 12.39 8.96846C13.1931 8.11692 13.7 6.86769 13.7 5.47538C13.7 4.42462 13.4115 3.45615 12.9254 2.67769C14.4046 1.03385 16.5485 0 18.9346 0C19.19 0 19.4431 0.0115385 19.6923 0.0353846C18.6015 0.726154 17.8777 1.94462 17.8777 3.33154C17.8777 4.53385 18.4215 5.60846 19.2762 6.32462Z"
            className="fill-amber-50"
          />
        </svg>
      </div>

      {/* "{year} OpenRAG" in bottom right */}
      <span
        className={`${textClasses} ml-auto`}
        style={{
          fontFamily: CARD_THEME.fonts.family,
        }}
      >
        {currentYear} OpenRAG
      </span>
    </div>
  );
});

// Made with Bob
