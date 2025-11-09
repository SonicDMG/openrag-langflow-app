import { useEffect, useRef } from 'react';
import { DnDClass, Ability } from '../types';

export interface AIOpponentCallbacks {
  onAttack: () => void;
  onUseAbility: (abilityIndex: number) => void;
  onHeal?: () => void; // Optional, for test mode
}

export interface UseAIOpponentOptions {
  isActive: boolean; // Whether AI mode is active (isBattleActive or isAIModeActive)
  currentTurn: 'player1' | 'player2';
  isMoveInProgress: boolean;
  defeatedPlayer: 'player1' | 'player2' | null;
  opponentClass: DnDClass | null;
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
    callbacks,
    delay = 800,
    onStateChange,
    onMoveInProgressChange,
    debugLog
  } = options;

  const isOpponentAutoPlayingRef = useRef(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only auto-play if:
    // - AI mode is active
    // - It's player2's turn
    // - No move is in progress
    // - Player2 is not defeated
    // - We're not already auto-playing (check ref to avoid dependency issues)
    // - We don't already have a timeout set up
    // - Opponent class is available
    if (
      isActive &&
      currentTurn === 'player2' &&
      !isMoveInProgress &&
      defeatedPlayer !== 'player2' &&
      !isOpponentAutoPlayingRef.current &&
      !aiTimeoutRef.current &&
      opponentClass
    ) {
      debugLog?.('[AIOpponent] AI auto-play triggered for player2');
      isOpponentAutoPlayingRef.current = true;
      onStateChange?.(true);
      onMoveInProgressChange?.(true); // Set move in progress to prevent other actions
      
      // Add a small delay to make it feel more natural
      aiTimeoutRef.current = setTimeout(() => {
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
          } else {
            // Fallback to attack if no heal callback
            callbacks.onAttack();
          }
        } else if (attackAbilities.length > 0 && Math.random() < 0.4) {
          // 40% chance to use an attack ability if available
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
          // Use basic attack (most common)
          debugLog?.('[AIOpponent] AI using basic attack');
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
      // Only clear if we're no longer active or it's no longer player2's turn
      if (!isActive || currentTurn !== 'player2') {
        if (aiTimeoutRef.current) {
          debugLog?.('[AIOpponent] Clearing AI timeout due to condition change');
          clearTimeout(aiTimeoutRef.current);
          aiTimeoutRef.current = null;
          isOpponentAutoPlayingRef.current = false;
          onStateChange?.(false);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentTurn, isMoveInProgress, defeatedPlayer]);

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

