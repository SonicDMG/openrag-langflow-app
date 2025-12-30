/**
 * Centralized spell effect utilities for Battle Arena classes
 * Provides consistent color palettes and spell type determination
 */

export type SpellType = 'healing' | 'attack' | 'default';

export interface SpellColorPalette {
  outer: string;   // Lightest, outermost glow
  mid: string;      // Medium glow
  bright: string;   // Bright glow
  core: string;     // Core color
  white: string;    // White center
}

/**
 * Get spell color palette based on spell type
 * Healing spells use green, attack spells use red/purple, default uses blue
 */
export function getSpellColorPalette(spellType: SpellType, classSpecific?: 'bard' | 'wizard' | 'cleric'): SpellColorPalette {
  switch (spellType) {
    case 'healing':
      return {
        outer: '#86efac', // Light green
        mid: '#4ade80',   // Medium green
        bright: '#22c55e', // Bright green
        core: '#10b981',  // Core green
        white: '#ffffff'   // White center
      };
    case 'attack':
      // Bard uses purple for attacks, others use red
      if (classSpecific === 'bard') {
        return {
          outer: '#c4b5fd', // Light purple
          mid: '#a78bfa',   // Medium purple
          bright: '#8b5cf6', // Bright purple
          core: '#7c3aed',  // Core purple
          white: '#ffffff'  // White center
        };
      }
      return {
        outer: '#fca5a5', // Light red
        mid: '#f87171',   // Medium red
        bright: '#ef4444', // Bright red
        core: '#dc2626',  // Core red
        white: '#ffffff'  // White center
      };
    case 'default':
    default:
      return {
        outer: '#bfdbfe', // Light blue
        mid: '#93c5fd',   // Medium blue
        bright: '#60a5fa', // Bright blue
        core: '#3b82f6',  // Core blue
        white: '#ffffff'  // White center
      };
  }
}

/**
 * Determine spell type based on context
 * @param isHealing - Whether the spell is healing
 * @param isAttacking - Whether the spell is attacking
 * @returns The spell type
 */
export function determineSpellType(isHealing: boolean, isAttacking: boolean): SpellType {
  if (isHealing) return 'healing';
  if (isAttacking) return 'attack';
  return 'default';
}

/**
 * Get class-specific spell configuration
 * Returns which classes should show cast effects and their specific color preferences
 */
export function getClassSpellConfig(className: string): {
  showsCastEffect: boolean;
  classSpecific?: 'bard' | 'wizard' | 'cleric';
} {
  // Classes that show casting animations
  const castingClasses: Record<string, { showsCastEffect: boolean; classSpecific?: 'bard' | 'wizard' | 'cleric' }> = {
    'Wizard': { showsCastEffect: true, classSpecific: 'wizard' },
    'Bard': { showsCastEffect: true, classSpecific: 'bard' },
    'Cleric': { showsCastEffect: true, classSpecific: 'cleric' },
    'Sorcerer': { showsCastEffect: true },
    'Warlock': { showsCastEffect: true },
    'Druid': { showsCastEffect: true },
  };

  return castingClasses[className] || { showsCastEffect: false };
}

/**
 * Check if a class should show cast effects
 */
export function shouldShowCastEffect(className: string): boolean {
  return getClassSpellConfig(className).showsCastEffect;
}

