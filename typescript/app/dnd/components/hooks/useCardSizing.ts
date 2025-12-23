import { useMemo } from 'react';

export type CardSize = 'normal' | 'compact';

export interface CardSizing {
  isCompact: boolean;
  maxWidth: string;
  padding: string;
  imageWidth: string;
  imageHeight: string;
  borderWidth: string;
  borderRadius: string;
  iconSize: string;
  titleSize: string;
  typeSize: string;
  abilityHeadingSize: string;
  abilityTextSize: string;
  abilityButtonPadding: string;
  statsTextSize: string;
  abilityGap: string;
  abilityLineHeight: string;
  hpBarMaxWidth: string;
  diamondSize: string;
  framePadding: string;
  innerBorderRadius: string;
}

/**
 * Custom hook to calculate all size-related values for the card
 * Memoizes calculations to prevent unnecessary recalculations
 */
export function useCardSizing(size: CardSize = 'normal'): CardSizing {
  return useMemo(() => {
    const isCompact = size === 'compact';
    
    return {
      isCompact,
      // Size scaling - compact is 60% of normal
      maxWidth: isCompact ? '192px' : '320px', // 320 * 0.6 = 192
      padding: isCompact ? '0.75rem' : '1rem', // p-3 vs p-4
      // For compact cards, make image larger since abilities section is hidden
      imageWidth: isCompact ? '180px' : '280px',
      imageHeight: isCompact ? '130px' : '200px',
      borderWidth: isCompact ? '2px' : '3px',
      borderRadius: isCompact ? '8px' : '12px',
      iconSize: isCompact ? 'w-6 h-6' : 'w-10 h-10',
      titleSize: isCompact ? 'text-base' : 'text-xl',
      typeSize: isCompact ? 'text-[10px]' : 'text-xs',
      abilityHeadingSize: isCompact ? 'text-[9px]' : 'text-xs',
      abilityTextSize: isCompact ? 'text-[8px]' : 'text-[10px]',
      abilityButtonPadding: isCompact ? '1px 4px' : '2px 6px',
      statsTextSize: isCompact ? 'text-[10px]' : 'text-sm',
      abilityGap: isCompact ? 'gap-0' : 'gap-1',
      abilityLineHeight: isCompact ? 'leading-tight' : 'leading-normal',
      hpBarMaxWidth: isCompact ? '84px' : '140px', // 140 * 0.6 = 84
      diamondSize: isCompact ? '6px' : '8px',
      framePadding: isCompact ? '6px' : '10px',
      innerBorderRadius: isCompact ? '8px' : '12px',
    };
  }, [size]);
}

// Made with Bob
