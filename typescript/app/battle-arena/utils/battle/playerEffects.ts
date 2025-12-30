/**
 * Player effects extraction utilities
 */

import { PlayerId, PlayerEffects } from '../../lib/types';
import { ProjectileType } from './battle';

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

// Made with Bob
