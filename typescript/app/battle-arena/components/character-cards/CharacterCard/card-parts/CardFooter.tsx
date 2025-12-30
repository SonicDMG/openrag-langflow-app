import React, { memo } from 'react';
import { CARD_THEME } from '../../../cardTheme';

interface CardFooterProps {
  cardIndex?: number;
  totalCards?: number;
  isCompact: boolean;
}

/**
 * Card footer component displaying card number and branding
 */
export const CardFooter = memo(function CardFooter({
  cardIndex,
  totalCards,
  isCompact,
}: CardFooterProps) {
  const textSize = isCompact ? 'text-[8px]' : 'text-[10px]';
  const diamondSize = isCompact ? '8px' : '10px';
  
  return (
    <div 
      className="relative flex items-center justify-between"
      style={{ 
        marginTop: isCompact ? '4px' : '6px',
        paddingTop: '0',
        paddingBottom: '0',
        height: isCompact ? '16px' : '20px'
      }}
    >
      {/* Card number in bottom left */}
      <span 
        className={textSize}
        style={{ 
          color: CARD_THEME.colors.textOverlay,
          fontFamily: CARD_THEME.fonts.family,
          fontWeight: 'bold'
        }}
      >
        {cardIndex !== undefined && totalCards !== undefined 
          ? `${cardIndex + 1}/${totalCards}`
          : '1/12'
        }
      </span>

      {/* Small symbol in center bottom - absolutely centered */}
      <div 
        className="absolute"
        style={{
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: diamondSize,
          height: diamondSize,
          backgroundColor: CARD_THEME.colors.textOverlay,
          opacity: 0.6
        }}
      />

      {/* "2025 OpenRAG" in bottom right */}
      <span 
        className={textSize}
        style={{ 
          color: CARD_THEME.colors.textOverlay,
          fontFamily: CARD_THEME.fonts.family,
          fontWeight: 'bold'
        }}
      >
        2025 OpenRAG
      </span>
    </div>
  );
});

// Made with Bob
