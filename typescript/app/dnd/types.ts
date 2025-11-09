// Ability type definitions
export interface AttackAbility {
  name: string;
  type: 'attack';
  damageDice: string; // e.g., "1d10", "3d6", "2d8"
  attackRoll: boolean; // Whether this requires an attack roll (true) or is automatic damage (false)
  attacks?: number; // Number of attacks (for multi-attack abilities, default: 1)
  bonusDamageDice?: string; // Optional bonus damage dice (e.g., "2d6" for sneak attack)
  description: string;
}

export interface HealingAbility {
  name: string;
  type: 'healing';
  healingDice: string; // e.g., "1d8+3", "2d4+2"
  description: string;
}

export type Ability = AttackAbility | HealingAbility;

// D&D Class definitions
export interface DnDClass {
  name: string;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  abilities: Ability[];
  description: string;
  color: string;
}

export interface BattleLog {
  type: 'attack' | 'ability' | 'roll' | 'narrative' | 'system';
  message: string;
  timestamp: number;
}

// Emotion types for character expressions
export type CharacterEmotion = 'happy' | 'sad' | 'hurt' | 'laughing' | 'rage' | 'determined' | 'worried' | 'frustrated' | 'dead' | 'victorious' | 'excited' | 'confident' | 'surprised' | 'triumphant';

