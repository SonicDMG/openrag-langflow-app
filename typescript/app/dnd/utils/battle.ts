import { DnDClass, AttackAbility } from '../types';
import { shouldShowCastEffect } from './spellEffects';

// Type for visual effects
export type PendingVisualEffect = {
  type: 'shake' | 'sparkle' | 'miss' | 'hit' | 'cast';
  player: 'player1' | 'player2';
  intensity?: number; // Damage amount for shake, healing amount for sparkle
};

// Projectile type definitions
export type ProjectileType = 
  | 'fire' 
  | 'ice' 
  | 'water' 
  | 'earth' 
  | 'air' 
  | 'poison' 
  | 'psychic' 
  | 'necrotic' 
  | 'radiant' 
  | 'lightning' 
  | 'acid' 
  | 'melee' 
  | 'ranged' 
  | 'magic' 
  | 'shadow';

/**
 * Check if a class should show cast effects (includes spellcasters and dragons)
 */
function shouldShowCastEffectForClass(className: string): boolean {
  return shouldShowCastEffect(className) || className === 'Dragon' || className === 'White Dragon';
}

/**
 * Get the opponent player ID
 */
export function getOpponent(player: 'player1' | 'player2'): 'player1' | 'player2' {
  return player === 'player1' ? 'player2' : 'player1';
}

/**
 * Create visual effects array for a successful hit
 * Includes hit effect for attacker, shake for defender
 */
export function createHitVisualEffects(
  attacker: 'player1' | 'player2',
  defender: 'player1' | 'player2',
  damage: number,
  defenderClass: DnDClass,
  attackerClass?: DnDClass
): PendingVisualEffect[] {
  const visualEffects: PendingVisualEffect[] = [
    { type: 'hit', player: attacker },
    { type: 'shake', player: defender, intensity: damage }
  ];
  
  // Add cast effect for spell-casting classes or dragons (for fire breath)
  if (attackerClass && shouldShowCastEffectForClass(attackerClass.name)) {
    visualEffects.push({ type: 'cast', player: attacker });
  }
  
  return visualEffects;
}

/**
 * Create visual effects array for a miss
 */
export function createMissVisualEffects(
  attacker: 'player1' | 'player2',
  attackerClass?: DnDClass
): PendingVisualEffect[] {
  const visualEffects: PendingVisualEffect[] = [{ type: 'miss', player: attacker }];
  
  // Add cast effect for spell-casting classes or dragons (they're still casting even on a miss)
  if (attackerClass && shouldShowCastEffectForClass(attackerClass.name)) {
    visualEffects.push({ type: 'cast', player: attacker });
  }
  
  return visualEffects;
}

/**
 * Create visual effects array for healing
 */
export function createHealingVisualEffects(
  target: 'player1' | 'player2',
  healAmount: number,
  casterClass?: DnDClass
): PendingVisualEffect[] {
  const visualEffects: PendingVisualEffect[] = [{ type: 'sparkle', player: target, intensity: healAmount }];
  
  // Add cast effect for spell-casting classes or dragons (for healing glow)
  if (casterClass && shouldShowCastEffectForClass(casterClass.name)) {
    visualEffects.push({ type: 'cast', player: target });
  }
  
  return visualEffects;
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

/**
 * Determine projectile type based on ability name, description, and attack context
 */
export function getProjectileType(
  ability: AttackAbility | null,
  attackType?: 'melee' | 'ranged',
  className?: string
): ProjectileType {
  if (!ability) {
    // Basic attacks - determine by attack type
    if (attackType === 'melee') return 'melee';
    if (attackType === 'ranged') return 'ranged';
    return 'melee'; // Default to melee
  }

  const nameLower = ability.name.toLowerCase();
  const descLower = ability.description.toLowerCase();
  const combined = `${nameLower} ${descLower}`;
  const classLower = className?.toLowerCase() || '';

  // Fire
  if (
    combined.includes('fire') || 
    combined.includes('flame') || 
    combined.includes('burn') ||
    nameLower.includes('fireball') ||
    nameLower.includes('fire bolt') ||
    nameLower.includes('hurl flame') ||
    nameLower.includes('searing') ||
    (nameLower.includes('breath') && (classLower.includes('dragon') || combined.includes('fire'))) ||
    classLower.includes('efreeti')
  ) {
    return 'fire';
  }

  // Ice/Cold
  if (
    combined.includes('ice') || 
    combined.includes('cold') || 
    combined.includes('frost') || 
    combined.includes('freeze') ||
    nameLower.includes('cold breath') ||
    classLower.includes('ice devil') ||
    classLower.includes('white dragon')
  ) {
    return 'ice';
  }

  // Water
  if (
    combined.includes('water') || 
    nameLower.includes('water blast') ||
    classLower.includes('marid')
  ) {
    return 'water';
  }

  // Earth/Stone
  if (
    combined.includes('earth') || 
    combined.includes('stone') || 
    combined.includes('rock') ||
    nameLower.includes('earth glide') ||
    classLower.includes('dao')
  ) {
    return 'earth';
  }

  // Air/Wind
  if (
    combined.includes('air') || 
    combined.includes('wind') || 
    combined.includes('gust') ||
    classLower.includes('air genasi')
  ) {
    return 'air';
  }

  // Poison
  if (
    combined.includes('poison') || 
    combined.includes('venom') || 
    combined.includes('toxic') ||
    nameLower.includes('sting') ||
    nameLower.includes('tail sting')
  ) {
    return 'poison';
  }

  // Psychic
  if (
    combined.includes('psychic') || 
    combined.includes('mind') ||
    nameLower.includes('mind blast') ||
    nameLower.includes('vicious mockery') ||
    (nameLower.includes('tentacle') && classLower.includes('mind flayer'))
  ) {
    return 'psychic';
  }

  // Necrotic
  if (
    combined.includes('necrotic') || 
    combined.includes('death') || 
    combined.includes('life drain') ||
    nameLower.includes('disrupt life') ||
    nameLower.includes('vampiric touch') ||
    (nameLower.includes('longsword') && classLower.includes('erinyes'))
  ) {
    return 'necrotic';
  }

  // Radiant
  if (
    combined.includes('radiant') || 
    combined.includes('divine') || 
    combined.includes('holy') ||
    nameLower.includes('divine smite') ||
    nameLower.includes('guided strike')
  ) {
    return 'radiant';
  }

  // Lightning/Thunder
  if (
    combined.includes('lightning') || 
    combined.includes('thunder') || 
    combined.includes('shock') ||
    (nameLower.includes('bolt') && !combined.includes('fire') && !combined.includes('chaos'))
  ) {
    return 'lightning';
  }

  // Acid
  if (
    combined.includes('acid') || 
    combined.includes('corrosive') || 
    combined.includes('melt')
  ) {
    return 'acid';
  }

  // Shadow/Dark
  if (
    combined.includes('shadow') || 
    combined.includes('dark') ||
    classLower.includes('shadow demon')
  ) {
    return 'shadow';
  }

  // Generic Magic
  if (
    nameLower.includes('magic missile') ||
    nameLower.includes('eldritch blast') ||
    nameLower.includes('chaos bolt') ||
    combined.includes('arcane') ||
    combined.includes('magical') ||
    combined.includes('spell')
  ) {
    return 'magic';
  }

  // Melee physical attacks
  if (
    nameLower.includes('bite') ||
    nameLower.includes('claw') ||
    nameLower.includes('slam') ||
    nameLower.includes('sword') ||
    nameLower.includes('axe') ||
    nameLower.includes('mace') ||
    nameLower.includes('fist') ||
    nameLower.includes('punch') ||
    nameLower.includes('strike') ||
    nameLower.includes('blow') ||
    nameLower.includes('horn') ||
    nameLower.includes('tail') ||
    nameLower.includes('pseudopod') ||
    nameLower.includes('beak') ||
    nameLower.includes('talon') ||
    nameLower.includes('glaive') ||
    nameLower.includes('spear') ||
    nameLower.includes('trident') ||
    nameLower.includes('scimitar') ||
    nameLower.includes('longsword') ||
    nameLower.includes('chain') ||
    nameLower.includes('beard')
  ) {
    return 'melee';
  }

  // Ranged physical attacks
  if (
    nameLower.includes('bow') ||
    nameLower.includes('arrow') ||
    nameLower.includes('javelin') ||
    nameLower.includes('sling') ||
    (nameLower.includes('rock') && !combined.includes('earth'))
  ) {
    return 'ranged';
  }

  // Default based on attack type if specified
  if (attackType === 'melee') return 'melee';
  if (attackType === 'ranged') return 'ranged';

  // Final fallback
  return 'magic';
}

