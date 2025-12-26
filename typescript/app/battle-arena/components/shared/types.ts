/**
 * Shared type definitions for battle arena components
 * 
 * These types are used by both the main battle page and test page
 * to ensure consistency and enable code reuse.
 */

import { Character, ImagePosition } from '../../types';
import { ProjectileType } from '../../utils/battle';

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
  flashProjectileType: ProjectileType | null;
  castProjectileType: ProjectileType | null;
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

// Made with Bob
