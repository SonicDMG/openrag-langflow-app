/**
 * Constants for DnD Test Page
 * Extracted from page.tsx to improve maintainability
 */

/**
 * HP threshold for automatically adding support heroes
 * When opponent HP exceeds this value, support heroes are added
 */
export const SUPPORT_HERO_HP_THRESHOLD = 50;

/**
 * Delay in milliseconds before support hero AI takes action
 * Allows manual control while making them respond quickly
 */
export const SUPPORT_HERO_AI_DELAY = 500;

/**
 * Multiplier for low damage test (relative to max HP)
 */
export const TEST_DAMAGE_LOW_MIN = 1;
export const TEST_DAMAGE_LOW_MAX = 2;

/**
 * Multiplier for high damage test (percentage of max HP)
 */
export const TEST_DAMAGE_HIGH_PERCENT_MAX = 0.4;
export const TEST_DAMAGE_HIGH_PERCENT_CURRENT = 0.5;

/**
 * Multiplier for low heal test
 */
export const TEST_HEAL_LOW_MIN = 1;
export const TEST_HEAL_LOW_MAX = 2;

// Made with Bob
