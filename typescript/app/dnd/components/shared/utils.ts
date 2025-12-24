/**
 * Shared utility functions for battle arena components
 * 
 * These utilities are used by both the main battle page and test page
 * to ensure consistent behavior across the application.
 */

import { DnDClass, ImagePosition } from '../../types';
import { ProjectileType } from '../../utils/battle';
import { getCharacterImageUrl } from '../utils/imageUtils';
import { PlayerId, PlayerEffects, FindAssociatedMonster } from './types';

/**
 * Resolves the image position for a character by checking both character name and class name
 * 
 * @param characterName - The character's display name
 * @param className - The character's class name
 * @param findAssociatedMonster - Function to find monster data
 * @returns Image position or undefined if not found
 */
export function resolveImagePosition(
  characterName: string,
  className: string,
  findAssociatedMonster: FindAssociatedMonster
): ImagePosition | undefined {
  // Try character name first
  let monster = findAssociatedMonster(characterName);
  
  // Fall back to class name if character name doesn't match
  if (!monster && characterName !== className) {
    monster = findAssociatedMonster(className);
  }
  
  return monster?.imagePosition;
}

/**
 * Extracts player-specific effects from the full effects state
 * 
 * @param playerId - The player to extract effects for
 * @param shakingPlayer - Currently shaking player
 * @param sparklingPlayer - Currently sparkling player
 * @param missingPlayer - Currently missing player
 * @param hittingPlayer - Currently hitting player
 * @param castingPlayer - Currently casting player
 * @param flashingPlayer - Currently flashing player
 * @param shakeTrigger - Shake trigger counters
 * @param sparkleTrigger - Sparkle trigger counters
 * @param missTrigger - Miss trigger counters
 * @param hitTrigger - Hit trigger counters
 * @param castTrigger - Cast trigger counters
 * @param flashTrigger - Flash trigger counters
 * @param shakeIntensity - Shake intensity values
 * @param sparkleIntensity - Sparkle intensity values
 * @param flashProjectileType - Flash projectile types
 * @param castProjectileType - Cast projectile types
 * @returns PlayerEffects object for the specified player
 */
export function extractPlayerEffects(
  playerId: PlayerId,
  shakingPlayer: PlayerId | null,
  sparklingPlayer: PlayerId | null,
  missingPlayer: PlayerId | null,
  hittingPlayer: PlayerId | null,
  castingPlayer: PlayerId | null,
  flashingPlayer: PlayerId | null,
  shakeTrigger: Record<PlayerId, number>,
  sparkleTrigger: Record<PlayerId, number>,
  missTrigger: Record<PlayerId, number>,
  hitTrigger: Record<PlayerId, number>,
  castTrigger: Record<PlayerId, number>,
  flashTrigger: Record<PlayerId, number>,
  shakeIntensity: Record<PlayerId, number>,
  sparkleIntensity: Record<PlayerId, number>,
  flashProjectileType: Record<PlayerId, ProjectileType | null>,
  castProjectileType: Record<PlayerId, ProjectileType | null>
): PlayerEffects {
  return {
    shouldShake: shakingPlayer === playerId,
    shouldSparkle: sparklingPlayer === playerId,
    shouldMiss: missingPlayer === playerId,
    shouldHit: hittingPlayer === playerId,
    shouldCast: castingPlayer === playerId,
    shouldFlash: flashingPlayer === playerId,
    shakeTrigger: shakeTrigger[playerId],
    sparkleTrigger: sparkleTrigger[playerId],
    missTrigger: missTrigger[playerId],
    hitTrigger: hitTrigger[playerId],
    castTrigger: castTrigger[playerId],
    flashTrigger: flashTrigger[playerId],
    shakeIntensity: shakeIntensity[playerId],
    sparkleIntensity: sparkleIntensity[playerId],
    flashProjectileType: flashProjectileType[playerId],
    castProjectileType: castProjectileType[playerId],
  };
}

/**
 * Gets the character image URL, resolving from monsterId
 * 
 * @param monsterId - The monster ID to get image for
 * @returns Image URL or undefined
 */
export function getCharacterImage(monsterId: string | null): string | undefined {
  return getCharacterImageUrl(monsterId);
}

/**
 * Determines if a player is defeated based on their HP
 * 
 * @param playerClass - The player's class data
 * @param defeatedPlayer - The explicitly defeated player (if any)
 * @param playerId - The player ID to check
 * @returns True if the player is defeated
 */
export function isPlayerDefeated(
  playerClass: DnDClass | null,
  defeatedPlayer: 'player1' | 'player2' | null,
  playerId: PlayerId
): boolean {
  // Check explicit defeat flag for main players
  if ((playerId === 'player1' || playerId === 'player2') && defeatedPlayer === playerId) {
    return true;
  }
  
  // Check HP
  return (playerClass?.hitPoints ?? 0) <= 0;
}

/**
 * Gets the turn indicator label for a player
 * 
 * @param playerId - The player ID
 * @param isOpponent - Whether this is an opponent
 * @returns The turn indicator label
 */
export function getTurnLabel(playerId: PlayerId, isOpponent: boolean): string {
  if (playerId === 'player2' && isOpponent) {
    return 'ENEMY TURN';
  }
  return 'YOUR TURN';
}

// Made with Bob
