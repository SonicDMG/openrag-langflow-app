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

// Character definitions
export interface Character {
  _id?: string; // Database ID (optional - only present for database records, not fallback data)
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
  imagePrompt?: string; // Visual/appearance description for image generation (separate from character details description)
  isDefault?: boolean; // Flag to indicate if this hero was loaded from default heroes
  fromOpenRAG?: boolean; // Flag to indicate if this character was loaded from OpenRAG knowledge base
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

// Image positioning for character cards
export interface ImagePosition {
  offsetX: number; // Horizontal offset as percentage (0-100, default: 50)
  offsetY: number; // Vertical offset as percentage (0-100, default: 50)
}


// ============================================================================
// Battle Component Types
// ============================================================================
// These types are used by battle arena components for managing battle state,
// effects, and UI interactions.

/**
 * Player identifier type for all combatants in the battle
 */
export type PlayerId = 'player1' | 'player2' | 'support1' | 'support2';

/**
 * Visual effects state for a single player
 * Groups all animation and effect triggers for cleaner prop passing
 */
export type PlayerEffects = {
  // Effect states
  shouldShake: boolean;
  shouldSparkle: boolean;
  shouldMiss: boolean;
  shouldHit: boolean;
  shouldCast: boolean;
  shouldFlash: boolean;
  
  // Effect triggers (increment to trigger animation)
  shakeTrigger: number;
  sparkleTrigger: number;
  missTrigger: number;
  hitTrigger: number;
  castTrigger: number;
  flashTrigger: number;
  
  // Effect intensities
  shakeIntensity: number;
  sparkleIntensity: number;
  
  // Projectile types for effects
  flashProjectileType: any | null; // ProjectileType from utils/battle
  castProjectileType: any | null;  // ProjectileType from utils/battle
};

/**
 * Callback functions for effect completion events
 */
export type EffectCallbacks = {
  onShakeComplete: () => void;
  onSparkleComplete: () => void;
  onMissComplete: () => void;
  onHitComplete: () => void;
  onCastComplete: () => void;
  onFlashComplete: () => void;
};

/**
 * Function type for finding associated monster data
 */
export type FindAssociatedMonster = (
  className: string
) => (Character & { monsterId: string; imageUrl: string; imagePosition?: ImagePosition }) | null;

/**
 * Props for a battle character card wrapper component
 */
export type BattleCharacterCardProps = {
  playerId: PlayerId;
  playerClass: Character;
  characterName: string;
  monsterId: string | null;
  effects: PlayerEffects;
  isActive: boolean;
  isDefeated: boolean;
  isVictor: boolean;
  isOpponent?: boolean;
  allowAllTurns?: boolean;
  rotation: number;
  scale?: number;
  turnLabel?: string;
  showTurnIndicator?: boolean;
  findAssociatedMonster: FindAssociatedMonster;
  onAttack: () => void;
  onUseAbility: (idx: number) => void;
  effectCallbacks: EffectCallbacks;
  isMoveInProgress: boolean;
  confettiTrigger: number;
  cardRef?: React.RefObject<HTMLDivElement | null>;
};

/**
 * Support hero data structure
 */
export type SupportHero = {
  class: Character;
  name: string;
  monsterId: string | null;
};
