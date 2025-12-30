import { useEffect, useRef } from 'react';
import { Character, Ability } from '../../lib/types';

export interface AIOpponentCallbacks {
  onAttack: () => void;
  onUseAbility: (abilityIndex: number) => void;
  onHeal?: () => void; // Optional, for test mode
}

export interface UseAIOpponentOptions {
  isActive: boolean; // Whether AI mode is active (isBattleActive or isAIModeActive)
  currentTurn: 'player1' | 'player2' | 'support1' | 'support2';
  isMoveInProgress: boolean;
  defeatedPlayer: 'player1' | 'player2' | null;
  opponentClass: Character | null;
  playerId: 'player1' | 'player2' | 'support1' | 'support2'; // Which player this AI controls
  callbacks: AIOpponentCallbacks;
  delay?: number; // Delay before AI acts (default: 800ms)
  onStateChange?: (isAutoPlaying: boolean) => void; // Optional callback for state changes
  onMoveInProgressChange?: (inProgress: boolean) => void; // Optional callback to set isMoveInProgress
  debugLog?: (message: string) => void; // Optional debug logging
}

/**
 * Custom hook to handle AI opponent auto-play logic
 * Manages the decision-making and timing for AI-controlled opponents
 */
export function useAIOpponent(options: UseAIOpponentOptions) {
  const {
    isActive,
    currentTurn,
    isMoveInProgress,
    defeatedPlayer,
    opponentClass,
    playerId,
    callbacks,
    delay = 800,
    onStateChange,
    onMoveInProgressChange,
    debugLog
  } = options;

  const isOpponentAutoPlayingRef = useRef(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if this player is defeated (for support heroes, check their HP)
    const isDefeated = playerId === 'player1' || playerId === 'player2' 
      ? defeatedPlayer === playerId
      : (opponentClass?.hitPoints ?? 0) <= 0;
    
    // Only auto-play if:
    // - AI mode is active
    // - It's this player's turn
    // - No move is in progress
    // - This player is not defeated
    // - We're not already auto-playing (check ref to avoid dependency issues)
    // - We don't already have a timeout set up
    // - Opponent class is available
    if (
      isActive &&
      currentTurn === playerId &&
      !isMoveInProgress &&
      !isDefeated &&
      !isOpponentAutoPlayingRef.current &&
      !aiTimeoutRef.current &&
      opponentClass
    ) {
      debugLog?.(`[AIOpponent] AI auto-play triggered for ${playerId}`);
      isOpponentAutoPlayingRef.current = true;
      onStateChange?.(true);
      // Don't set move in progress yet - wait until we actually perform the action
      // This allows manual control during the delay period
      
      // Add a delay to make it feel more natural and allow manual control
      aiTimeoutRef.current = setTimeout(() => {
        // Check if a move is already in progress (user might have clicked manually)
        if (isMoveInProgress) {
          debugLog?.(`[AIOpponent] Move already in progress, cancelling AI for ${playerId}`);
          isOpponentAutoPlayingRef.current = false;
          onStateChange?.(false);
          aiTimeoutRef.current = null;
          return;
        }
        
        // Now set move in progress before performing the action
        onMoveInProgressChange?.(true);
        debugLog?.(
          `[AIOpponent] AI timeout fired, opponentClass: ${opponentClass.name}, abilities: ${opponentClass.abilities.length}`
        );
        
        // Separate attack and healing abilities
        const attackAbilities = opponentClass.abilities.filter((a: Ability) => a.type === 'attack');
        const healingAbilities = opponentClass.abilities.filter((a: Ability) => a.type === 'healing');
        
        // Calculate HP percentage
        const hpPercent = opponentClass.hitPoints / opponentClass.maxHitPoints;
        
        // Decision logic:
        // - If HP is below 30%, 30% chance to heal, 70% chance to attack
        // - If HP is below 50%, 20% chance to heal, 80% chance to attack
        // - Otherwise, 10% chance to heal, 90% chance to attack
        let shouldHeal = false;
        if (hpPercent < 0.3 && healingAbilities.length > 0) {
          shouldHeal = Math.random() < 0.3;
        } else if (hpPercent < 0.5 && healingAbilities.length > 0) {
          shouldHeal = Math.random() < 0.2;
        } else if (healingAbilities.length > 0) {
          shouldHeal = Math.random() < 0.1;
        }
        
        if (shouldHeal && healingAbilities.length > 0) {
          // Use a random healing ability
          const randomHealIndex = Math.floor(Math.random() * healingAbilities.length);
          const healAbility = healingAbilities[randomHealIndex];
          const healAbilityIndex = opponentClass.abilities.indexOf(healAbility);
          
          debugLog?.(
            `[AIOpponent] AI using healing ability: ${healAbility.name}, HP: ${hpPercent.toFixed(2)}`
          );
          
          if (healAbilityIndex >= 0) {
            callbacks.onUseAbility(healAbilityIndex);
          } else if (callbacks.onHeal) {
            // Fallback to onHeal if available (for test mode)
            callbacks.onHeal();
          } else if (attackAbilities.length > 0) {
            // Fallback to random attack ability if no heal available
            const randomAttackIndex = Math.floor(Math.random() * attackAbilities.length);
            const attackAbility = attackAbilities[randomAttackIndex];
            const attackAbilityIndex = opponentClass.abilities.indexOf(attackAbility);
            if (attackAbilityIndex >= 0) {
              callbacks.onUseAbility(attackAbilityIndex);
            } else {
              callbacks.onAttack();
            }
          } else {
            // Fallback to basic attack if no abilities available
            callbacks.onAttack();
          }
        } else if (attackAbilities.length > 0) {
          // Use a random attack ability (70% chance) or basic attack (30% chance)
          if (Math.random() < 0.7) {
            const randomAttackIndex = Math.floor(Math.random() * attackAbilities.length);
            const attackAbility = attackAbilities[randomAttackIndex];
            const attackAbilityIndex = opponentClass.abilities.indexOf(attackAbility);
            
            debugLog?.(`[AIOpponent] AI using attack ability: ${attackAbility.name}`);
            
            if (attackAbilityIndex >= 0) {
              callbacks.onUseAbility(attackAbilityIndex);
            } else {
              callbacks.onAttack();
            }
          } else {
            debugLog?.('[AIOpponent] AI using basic attack');
            callbacks.onAttack();
          }
        } else if (healingAbilities.length > 0) {
          // Fallback to healing if no attack abilities available
          const randomHealIndex = Math.floor(Math.random() * healingAbilities.length);
          const healAbility = healingAbilities[randomHealIndex];
          const healAbilityIndex = opponentClass.abilities.indexOf(healAbility);
          if (healAbilityIndex >= 0) {
            callbacks.onUseAbility(healAbilityIndex);
          } else {
            callbacks.onAttack();
          }
        } else {
          // No abilities available, use basic attack
          debugLog?.('[AIOpponent] AI using basic attack (no abilities available)');
          callbacks.onAttack();
        }
        
        // Clear the timeout ref
        aiTimeoutRef.current = null;
        
        // Reset the flag after a short delay to allow the move to complete
        setTimeout(() => {
          isOpponentAutoPlayingRef.current = false;
          onStateChange?.(false);
        }, 100);
      }, delay);
    }
    
    // Cleanup: only clear timeout if component unmounts or conditions change significantly
    return () => {
      // Only clear if we're no longer active or it's no longer this player's turn
      // Don't clear if isMoveInProgress changed - that's expected when AI is executing
      if (!isActive || currentTurn !== playerId) {
        if (aiTimeoutRef.current) {
          debugLog?.(`[AIOpponent] Clearing AI timeout due to condition change for ${playerId}`);
          clearTimeout(aiTimeoutRef.current);
          aiTimeoutRef.current = null;
          isOpponentAutoPlayingRef.current = false;
          onStateChange?.(false);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: isMoveInProgress is intentionally NOT in deps - we check it in the condition but don't want
    // the effect to re-run when it changes, as that would cancel the AI action in progress
  }, [isActive, currentTurn, defeatedPlayer, playerId, opponentClass]);

  // Return cleanup function for manual cleanup (e.g., on reset)
  return {
    cleanup: () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      isOpponentAutoPlayingRef.current = false;
      onStateChange?.(false);
    }
  };
}

