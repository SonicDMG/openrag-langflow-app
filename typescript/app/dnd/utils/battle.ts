import { DnDClass } from '../types';

// Type for visual effects
export type PendingVisualEffect = {
  type: 'shake' | 'sparkle' | 'miss' | 'hit' | 'surprise';
  player: 'player1' | 'player2';
  intensity?: number; // Damage amount for shake, healing amount for sparkle
};

/**
 * Get the opponent player ID
 */
export function getOpponent(player: 'player1' | 'player2'): 'player1' | 'player2' {
  return player === 'player1' ? 'player2' : 'player1';
}

/**
 * Calculate if damage is surprising based on defender's HP
 * Surprise triggers if: damage >= 30% of max HP OR damage >= 50% of current HP
 */
export function isSurprisingDamage(damage: number, defenderClass: DnDClass): boolean {
  const damagePercentOfMax = damage / defenderClass.maxHitPoints;
  const damagePercentOfCurrent = defenderClass.hitPoints > 0 ? damage / defenderClass.hitPoints : 0;
  return damagePercentOfMax >= 0.3 || damagePercentOfCurrent >= 0.5;
}

/**
 * Create visual effects array for a successful hit
 * Includes hit effect for attacker, shake for defender, and surprise if damage is significant
 */
export function createHitVisualEffects(
  attacker: 'player1' | 'player2',
  defender: 'player1' | 'player2',
  damage: number,
  defenderClass: DnDClass
): PendingVisualEffect[] {
  const visualEffects: PendingVisualEffect[] = [
    { type: 'hit', player: attacker },
    { type: 'shake', player: defender, intensity: damage }
  ];
  
  // Add surprise effect if damage is significant
  if (isSurprisingDamage(damage, defenderClass)) {
    visualEffects.push({ type: 'surprise', player: defender });
  }
  
  return visualEffects;
}

/**
 * Create visual effects array for a miss
 */
export function createMissVisualEffects(attacker: 'player1' | 'player2'): PendingVisualEffect[] {
  return [{ type: 'miss', player: attacker }];
}

/**
 * Create visual effects array for healing
 */
export function createHealingVisualEffects(
  target: 'player1' | 'player2',
  healAmount: number
): PendingVisualEffect[] {
  return [{ type: 'sparkle', player: target, intensity: healAmount }];
}

/**
 * Build dice array for damage with optional bonus damage
 * Returns the dice array and total damage
 */
export function buildDamageDiceArray(
  baseDamageDice: string,
  rollDiceWithNotation: (notation: string) => number,
  parseDiceNotation: (notation: string) => { dice: string; modifier: number },
  bonusDamageDice?: string
): { diceArray: Array<{ diceType: string; result: number }>; totalDamage: number } {
  const { dice } = parseDiceNotation(baseDamageDice);
  let damage = rollDiceWithNotation(baseDamageDice);
  const diceArray: Array<{ diceType: string; result: number }> = [
    { diceType: dice, result: damage }
  ];
  
  // Add bonus damage if applicable
  if (bonusDamageDice) {
    const bonusDamage = rollDiceWithNotation(bonusDamageDice);
    const { dice: bonusDice } = parseDiceNotation(bonusDamageDice);
    diceArray.push({ diceType: bonusDice, result: bonusDamage });
    damage += bonusDamage;
  }
  
  return { diceArray, totalDamage: damage };
}

