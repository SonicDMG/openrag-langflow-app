import { Ability, AttackAbility, HealingAbility } from '../../lib/types';

/**
 * Builds a tooltip string for a basic attack that includes dice information
 */
export function buildAttackTooltip(damageDie: string, attackType?: 'melee' | 'ranged'): string {
  const parts: string[] = [];
  
  // Add description based on attack type
  if (attackType === 'melee') {
    parts.push('Basic melee weapon attack');
  } else if (attackType === 'ranged') {
    parts.push('Basic ranged weapon attack');
  } else {
    parts.push('Basic melee or ranged attack');
  }
  
  // Add dice information with labels
  const diceInfo: string[] = [];
  diceInfo.push('d20 (attack roll)'); // Attack roll is always d20
  if (damageDie) {
    // Ensure damageDie has the "1" prefix if it's just "dX"
    const formattedDie = damageDie.startsWith('d') ? `1${damageDie}` : damageDie;
    diceInfo.push(`${formattedDie} (damage)`);
  }
  
  if (diceInfo.length > 0) {
    parts.push(`Dice: ${diceInfo.join(', ')}`);
  }
  
  return parts.join('\n');
}

/**
 * Builds a tooltip string for an ability that includes dice information
 */
export function buildAbilityTooltip(ability: Ability): string {
  const parts: string[] = [];
  
  // Add description
  if (ability.description) {
    parts.push(ability.description);
  }
  
  // Add dice information based on ability type
  if (ability.type === 'attack') {
    const attackAbility = ability as AttackAbility;
    const diceInfo: string[] = [];
    
    // Attack roll (d20) if required
    if (attackAbility.attackRoll) {
      diceInfo.push('d20');
    }
    
    // Damage dice
    if (attackAbility.damageDice) {
      diceInfo.push(attackAbility.damageDice);
    }
    
    // Bonus damage dice
    if (attackAbility.bonusDamageDice) {
      diceInfo.push(`+${attackAbility.bonusDamageDice}`);
    }
    
    // Number of attacks if > 1
    const numAttacks = attackAbility.attacks || 1;
    if (numAttacks > 1) {
      diceInfo.push(`(${numAttacks} attacks)`);
    }
    
    if (diceInfo.length > 0) {
      parts.push(`Dice: ${diceInfo.join(' ')}`);
    }
  } else if (ability.type === 'healing') {
    const healingAbility = ability as HealingAbility;
    
    // Healing dice
    if (healingAbility.healingDice) {
      parts.push(`Dice: ${healingAbility.healingDice}`);
    }
  }
  
  return parts.join('\n');
}

// Made with Bob
