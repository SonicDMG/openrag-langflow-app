/**
 * Card theme - CSS variable references for use in components
 * 
 * Colors: Use Tailwind classes (bg-card-frame, text-card-text, etc.)
 * Shadows: Use Tailwind shadow utilities (see getCardBoxShadowClass)
 */

export const CARD_THEME = {
  colors: {
    frame: 'var(--card-frame)',
    innerCard: 'var(--card-inner)',
    imageFrame: 'var(--card-image-frame)',
    border: 'var(--card-border)',
    text: 'var(--card-text)',
    textLight: 'var(--card-text-light)',
    textOverlay: 'var(--card-text-overlay)',
    textOverlaySecondary: 'var(--card-text-overlay-secondary)',
    buttonBg: 'var(--card-button-bg)',
    buttonText: 'var(--card-button-text)',
    hpBar: 'var(--card-hp-bar)',
    hpBarBg: 'var(--card-hp-bar-bg)',
    shieldGreen: 'var(--card-shield-green)',
    shieldGreenDark: 'var(--card-shield-green-dark)',
    heartRed: 'var(--card-heart-red)',
  },
  
  fonts: {
    family: 'var(--font-sans)',
  },
} as const;

/**
 * Helper function to get Tailwind shadow class based on card state
 */
export function getCardBoxShadowClass(isSelected: boolean, isActive: boolean): string {
  if (isSelected) return 'shadow-md/30';
  if (isActive) return 'shadow-none';
  return 'shadow-none ring-0'; // No shadow on default state
}

// Made with Bob
