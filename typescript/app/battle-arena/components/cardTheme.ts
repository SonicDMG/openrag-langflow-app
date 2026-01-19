/**
 * Card theme - minimal theme configuration
 * 
 * Colors are now used inline as Tailwind classes throughout components.
 * Only keeping font family and shadow utility here.
 */

export const CARD_THEME = {
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
