import { useMemo } from 'react';

export type CardSize = 'normal' | 'compact';

/**
 * Simplified sizing interface - only values that need to be in inline styles
 * Tailwind classes are provided via getCardSizeClasses helper
 */
export interface CardSizing {
  isCompact: boolean;
  // Values used in inline styles (can't use Tailwind arbitrary values easily)
  maxWidth: string;
  padding: string;
  imageHeight: string;
  framePadding: string;
  hpBarMaxWidth: string;
  abilityButtonPadding: string;
}

/**
 * Tailwind class mappings for card sizes
 * Use this helper to get Tailwind classes instead of inline styles
 */
export const getCardSizeClasses = (isCompact: boolean) => ({
  // Text sizes
  titleSize: isCompact ? 'text-base' : 'text-xl',
  typeSize: isCompact ? 'text-[10px]' : 'text-xs',
  abilityHeadingSize: isCompact ? 'text-[9px]' : 'text-xs',
  abilityTextSize: isCompact ? 'text-[8px]' : 'text-[10px]',
  statsTextSize: isCompact ? 'text-[10px]' : 'text-sm',
  footerTextSize: isCompact ? 'text-[8px]' : 'text-xs',
  
  // Icon sizes
  iconSize: isCompact ? 'w-6 h-6' : 'w-10 h-10',
  iconSizeSmall: isCompact ? 'w-4 h-4' : 'w-5 h-5',
  
  // Spacing
  abilityGap: isCompact ? 'gap-0' : 'gap-1',
  abilityLineHeight: isCompact ? 'leading-tight' : 'leading-normal',
  
  // Padding (for use in className, not style)
  padding: isCompact ? 'p-3' : 'p-4',
});

/**
 * Simplified hook - only returns values needed for inline styles
 * Use getCardSizeClasses() for Tailwind classes
 */
export function useCardSizing(size: CardSize = 'normal'): CardSizing {
  return useMemo(() => {
    const isCompact = size === 'compact';
    
    return {
      isCompact,
      // Only values that must be in inline styles
      maxWidth: isCompact ? '192px' : '320px',
      padding: isCompact ? '0.75rem' : '1rem', // Used in calc() expressions
      imageHeight: isCompact ? '130px' : '200px',
      framePadding: isCompact ? '6px' : '10px',
      hpBarMaxWidth: isCompact ? '84px' : '140px',
      abilityButtonPadding: isCompact ? '1px 4px' : '2px 6px',
    };
  }, [size]);
}

// Made with Bob
