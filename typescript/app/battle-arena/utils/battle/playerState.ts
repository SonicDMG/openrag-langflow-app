/**
 * Player state utilities
 */

import { Character, PlayerId } from '../../lib/types';

/**
 * Determines if a player is defeated based on their HP
 * 
 * @param playerClass - The player's class data
 * @param defeatedPlayer - The explicitly defeated player (if any)
 * @param playerId - The player ID to check
 * @returns True if the player is defeated
 */
export function isPlayerDefeated(
  playerClass: Character | null,
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
