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
  class?: string; // Character class (e.g., "Fighter", "Wizard", "Rogue") - separate from name
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string; // Default/fallback damage die (used if meleeDamageDie/rangedDamageDie not specified)
  meleeDamageDie?: string; // Optional melee weapon damage die (e.g., "d8", "d10")
  rangedDamageDie?: string; // Optional ranged weapon damage die (e.g., "d6", "d8")
  abilities: Ability[];
  description: string;
  color: string;
  race?: string; // Character race (e.g., "Human", "Elf", "Dwarf") - use "n/a" if not applicable
  sex?: string; // Character sex (e.g., "male", "female", "other") - use "n/a" if not applicable
}

export interface BattleLog {
  type: 'attack' | 'ability' | 'roll' | 'narrative' | 'system';
  message: string;
  timestamp: number;
}

// Card setting/theme types for different genres
export type CardSetting = 'medieval' | 'futuristic' | 'modern' | 'cyberpunk' | 'steampunk' | 'post-apocalyptic' | 'fantasy' | 'sci-fi';

export interface SettingConfig {
  name: string;
  description: string;
  settingPhrase: string; // Phrase to use in prompts (e.g., "medieval high-fantasy", "futuristic sci-fi")
  backgroundPhrase: string; // Phrase for background generation
  technologyLevel: string; // Description of technology level
}

