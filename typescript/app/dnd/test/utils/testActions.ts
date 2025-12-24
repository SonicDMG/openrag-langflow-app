/**
 * Utility functions for DnD Test Page actions
 * Extracted from page.tsx to reduce code duplication
 */

import { DnDClass } from '../../types';
import { getCharacterImageUrl } from '../../components/utils/imageUtils';
import {
  TEST_DAMAGE_LOW_MIN,
  TEST_DAMAGE_LOW_MAX,
  TEST_DAMAGE_HIGH_PERCENT_MAX,
  TEST_DAMAGE_HIGH_PERCENT_CURRENT,
  TEST_HEAL_LOW_MIN,
  TEST_HEAL_LOW_MAX,
} from '../constants';

/**
 * Calculate low damage (1-2 HP)
 */
export function calculateLowDamage(): number {
  return Math.floor(Math.random() * TEST_DAMAGE_LOW_MAX) + TEST_DAMAGE_LOW_MIN;
}

/**
 * Calculate high damage (40% of max HP or 50% of current HP, whichever is larger)
 */
export function calculateHighDamage(targetClass: DnDClass): number {
  const damageFromMaxPercent = Math.ceil(targetClass.maxHitPoints * TEST_DAMAGE_HIGH_PERCENT_MAX);
  const damageFromCurrentPercent = Math.ceil(targetClass.hitPoints * TEST_DAMAGE_HIGH_PERCENT_CURRENT);
  return Math.max(damageFromMaxPercent, damageFromCurrentPercent);
}

/**
 * Calculate low heal (1-2 HP)
 */
export function calculateLowHeal(): number {
  return Math.floor(Math.random() * TEST_HEAL_LOW_MAX) + TEST_HEAL_LOW_MIN;
}

/**
 * Calculate full heal amount (difference between max and current HP)
 */
export function calculateFullHeal(playerClass: DnDClass): number {
  return playerClass.maxHitPoints - playerClass.hitPoints;
}

/**
 * Get monster image URL from associated monster.
 * Re-exported from imageUtils for backward compatibility in test code.
 *
 * @deprecated Use getCharacterImageUrl from imageUtils directly
 */
export function getMonsterImageUrl(
  monsterId: string | null | undefined
): string | undefined {
  return getCharacterImageUrl(monsterId);
}

/**
 * Check if a monster is a created monster (has klass and monsterId properties)
 */
export function isCreatedMonster(monster: any): boolean {
  return !!(monster.klass && monster.monsterId);
}

/**
 * Get the lookup name for finding associated monsters
 * For created monsters, use klass; for regular monsters, use name
 */
export function getMonsterLookupName(monster: DnDClass & { klass?: string }): string {
  return isCreatedMonster(monster) ? monster.klass! : monster.name;
}

/**
 * Create a test entity with full HP and preserved abilities
 */
export function createTestEntity<T extends DnDClass & { monsterId?: string; imageUrl?: string }>(
  entity: T
): T {
  return {
    ...entity,
    hitPoints: entity.maxHitPoints,
    abilities: entity.abilities && entity.abilities.length > 0 ? entity.abilities : [],
    ...(entity.monsterId && { monsterId: entity.monsterId }),
    ...(entity.imageUrl && { imageUrl: entity.imageUrl }),
  };
}

// Made with Bob
