/**
 * Card theme constants for consistent styling across all card components
 */
export const CARD_THEME = {
  colors: {
    frame: '#1a1a1a',
    innerCard: '#F2ECDE',
    imageFrame: '#E8E0D6',
    border: '#D4C4B0',
    text: '#5C4033',
    textLight: '#8B6F47',
    textOverlay: '#F2ECDE',
    textOverlaySecondary: '#D4C4B0',
    buttonBg: '#D1C9BA',
    buttonText: '#000000',
    hpBar: '#A66D28',
    hpBarBg: '#E8E0D6',
    shieldGreen: '#22c55e',
    shieldGreenDark: '#16a34a',
    heartRed: '#dc2626',
  },
  
  shadows: {
    selected: '0 0 12px rgba(127, 29, 29, 0.6), 0 0 6px rgba(185, 28, 28, 0.4), 0 8px 20px rgba(0, 0, 0, 0.3), 0 4px 10px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    active: '0 0 20px rgba(251, 191, 36, 0.5), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    default: '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    innerCard: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.15)',
    textOverlay: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6)',
    textOverlayLight: '1px 1px 3px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 0, 0, 0.6)',
  },
  
  textures: {
    outerFrame: `
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px),
      repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)
    `,
    innerCard: `
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.02) 0%, transparent 50%),
      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 0, 0, 0.03) 1px, rgba(0, 0, 0, 0.03) 2px),
      repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0, 0, 0, 0.03) 1px, rgba(0, 0, 0, 0.03) 2px)
    `,
    paperGrain: `
      repeating-linear-gradient(
        0deg,
        rgba(139, 111, 71, 0.02) 0px,
        transparent 0.5px,
        transparent 1px,
        rgba(139, 111, 71, 0.02) 1.5px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(139, 111, 71, 0.02) 0px,
        transparent 0.5px,
        transparent 1px,
        rgba(139, 111, 71, 0.02) 1.5px
      )
    `,
    overlay: `
      repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.03) 0px,
        transparent 1px,
        transparent 2px,
        rgba(0, 0, 0, 0.03) 3px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.03) 0px,
        transparent 1px,
        transparent 2px,
        rgba(0, 0, 0, 0.03) 3px
      )
    `,
  },
  
  gradients: {
    imageOverlay: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%)',
  },
  
  fonts: {
    family: 'serif',
  },
} as const;

/**
 * Helper function to get box shadow based on card state
 */
export function getCardBoxShadow(isSelected: boolean, isActive: boolean): string {
  if (isSelected) return CARD_THEME.shadows.selected;
  if (isActive) return CARD_THEME.shadows.active;
  return CARD_THEME.shadows.default;
}

// Made with Bob
