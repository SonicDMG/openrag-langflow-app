import { useCallback } from 'react';
import { DnDClass, Ability, AttackAbility } from '../types';
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../utils/dice';
import { 
  createHitVisualEffects, 
  createMissVisualEffects, 
  createHealingVisualEffects,
  getOpponent,
  buildDamageDiceArray,
  getProjectileType,
  PendingVisualEffect,
  ProjectileType
} from '../utils/battle';
import { FloatingNumberType } from '../components/FloatingNumber';

type BattleActionsDependencies = {
  // State
  player1Class: DnDClass | null;
  player2Class: DnDClass | null;
  supportHeroes?: Array<{ class: DnDClass; name: string; monsterId: string | null }>;
  isBattleActive: boolean;
  isMoveInProgress: boolean;
  classDetails: Record<string, string>;
  defeatedPlayer: 'player1' | 'player2' | null;
  // Target selection for monster attacks (optional - if not provided, monster targets randomly)
  monsterTarget?: 'player1' | 'support1' | 'support2';
  
  // Setters
  setIsMoveInProgress: (value: boolean) => void;
  updatePlayerHP: (player: 'player1' | 'player2' | 'support1' | 'support2', newHPOrDamage: number, isDamage?: boolean) => void;
  addLog: (type: 'attack' | 'ability' | 'roll' | 'narrative' | 'system', message: string) => void;
  
  // Effects
  applyVisualEffect: (effect: PendingVisualEffect) => void;
  triggerFlashEffect: (attacker: 'player1' | 'player2' | 'support1' | 'support2', projectileType?: ProjectileType) => void;
  showFloatingNumbers: (
    numbers: Array<{ value: number | string; type: FloatingNumberType; targetPlayer: 'player1' | 'player2' | 'support1' | 'support2'; persistent?: boolean }>,
    visualEffects: PendingVisualEffect[],
    callbacks: (() => void)[]
  ) => void;
  showProjectileEffect: (
    fromPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    toPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    isHit: boolean,
    onHit?: () => void,
    onComplete?: () => void,
    fromCardRotation?: number,
    delay?: number,
    projectileType?: ProjectileType
  ) => void;
  clearProjectileTracking: () => void;
  
  // Turn management
  switchTurn: (attacker: 'player1' | 'player2' | 'support1' | 'support2') => Promise<void>;
  
  // Victory
  handleVictory: (
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    damage: number,
    attackerDetails: string,
    defenderDetails: string,
    eventDescription: string,
    defender: 'player1' | 'player2'
  ) => Promise<void>;
  
  // Defeat state
  setDefeatedPlayer: (player: 'player1' | 'player2' | null) => void;
};

export function useBattleActions(deps: BattleActionsDependencies) {
  const {
    player1Class,
    player2Class,
    supportHeroes = [],
    isBattleActive,
    isMoveInProgress,
    classDetails,
    defeatedPlayer,
    monsterTarget,
    setIsMoveInProgress,
    updatePlayerHP,
    addLog,
    applyVisualEffect,
    triggerFlashEffect,
    showFloatingNumbers,
    showProjectileEffect,
    clearProjectileTracking,
    switchTurn,
    handleVictory,
    setDefeatedPlayer,
  } = deps;
  
  // Helper to get attacker class based on player ID
  const getAttackerClass = useCallback((attacker: 'player1' | 'player2' | 'support1' | 'support2'): DnDClass | null => {
    if (attacker === 'player1') return player1Class;
    if (attacker === 'player2') return player2Class;
    if (attacker === 'support1' && supportHeroes.length > 0) return supportHeroes[0].class;
    if (attacker === 'support2' && supportHeroes.length > 1) return supportHeroes[1].class;
    return null;
  }, [player1Class, player2Class, supportHeroes]);
  
  // Helper to get defender class based on target ID
  const getDefenderClass = useCallback((target: 'player1' | 'support1' | 'support2'): DnDClass | null => {
    if (target === 'player1') return player1Class;
    if (target === 'support1' && supportHeroes.length > 0) return supportHeroes[0].class;
    if (target === 'support2' && supportHeroes.length > 1) return supportHeroes[1].class;
    return null;
  }, [player1Class, supportHeroes]);
  
  // Helper to get available targets for monster (non-defeated heroes)
  const getAvailableTargets = useCallback((): Array<'player1' | 'support1' | 'support2'> => {
    const targets: Array<'player1' | 'support1' | 'support2'> = [];
    
    // Add player1 if not defeated
    if (player1Class && player1Class.hitPoints > 0) {
      targets.push('player1');
    }
    
    // Add support heroes if not defeated
    if (supportHeroes.length > 0 && supportHeroes[0].class.hitPoints > 0) {
      targets.push('support1');
    }
    if (supportHeroes.length > 1 && supportHeroes[1].class.hitPoints > 0) {
      targets.push('support2');
    }
    
    return targets;
  }, [player1Class, supportHeroes]);

  // Helper function to calculate attack roll
  const calculateAttackRoll = useCallback((attackerClass: DnDClass): { d20Roll: number; attackRoll: number } => {
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    return { d20Roll, attackRoll };
  }, []);

  // Helper function to log attack roll with hit/miss result
  const logAttackRoll = useCallback((attackerClass: DnDClass, d20Roll: number, attackRoll: number, defenderAC: number, isHit: boolean) => {
    const bonusText = attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus} (attack bonus)` : '';
    const hitMissText = isHit ? '**HIT**' : '**MISS**';
    addLog('roll', `🎲 ${attackerClass.name} rolls d20: ${d20Roll}${bonusText} = ${attackRoll} vs AC ${defenderAC} → ${hitMissText}`);
  }, [addLog]);

  // Helper function to check if all heroes are defeated
  // Uses newHP for the current defender (since state might not be updated yet)
  const checkAllHeroesDefeated = useCallback((
    defender: 'player1' | 'player2' | 'support1' | 'support2',
    defenderNewHP: number
  ): boolean => {
    // Only check for hero defeat (not monster defeat)
    if (defender === 'player2') {
      return false; // Monster defeat is handled separately
    }
    
    // Check if this is a team battle
    const isTeamBattle = supportHeroes.length > 0;
    if (!isTeamBattle) {
      // One-on-one battle - if player1 is defeated, battle is over
      return defender === 'player1' && defenderNewHP <= 0;
    }
    
    // Team battle - check if all heroes are defeated
    // Use newHP for the current defender, state values for others
    const player1Defeated = defender === 'player1' 
      ? defenderNewHP <= 0 
      : (!player1Class || player1Class.hitPoints <= 0);
    
    const support1Defeated = defender === 'support1'
      ? defenderNewHP <= 0
      : (supportHeroes.length > 0 ? supportHeroes[0].class.hitPoints <= 0 : true);
    
    const support2Defeated = defender === 'support2'
      ? defenderNewHP <= 0
      : (supportHeroes.length > 1 ? supportHeroes[1].class.hitPoints <= 0 : true);
    
    return player1Defeated && support1Defeated && support2Defeated;
  }, [player1Class, supportHeroes]);

  // Factory function to create post-damage callback
  const createPostDamageCallback = useCallback((
    newHP: number,
    damage: number,
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string,
    defenderDetails: string,
    eventDescription: string,
    defender: 'player1' | 'player2' | 'support1' | 'support2',
    attacker: 'player1' | 'player2' | 'support1' | 'support2'
  ) => {
    return async () => {
      // Trust the calculated newHP value (it's correct at the time of calculation)
      // Also check state as a fallback in case of timing issues
      let stateHP = newHP;
      if (defender === 'player1') {
        stateHP = player1Class?.hitPoints ?? newHP;
      } else if (defender === 'player2') {
        stateHP = player2Class?.hitPoints ?? newHP;
      } else if (defender === 'support1') {
        stateHP = supportHeroes.length > 0 ? supportHeroes[0].class.hitPoints : newHP;
      } else if (defender === 'support2') {
        stateHP = supportHeroes.length > 1 ? supportHeroes[1].class.hitPoints : newHP;
      }
      
      // Use the minimum to ensure we catch defeat - newHP is the source of truth
      const currentHP = Math.min(newHP, stateHP);
      
      if (currentHP <= 0) {
        // Check if defender is a support hero or main hero
        if (defender === 'support1' || defender === 'support2') {
          // Support hero knocked out - show knocked out effect on the support card
          showFloatingNumbers(
            [{ value: 'KNOCKED OUT!', type: 'knocked-out', targetPlayer: defender, persistent: true }],
            [],
            []
          );
          addLog('system', `💀 ${defenderClass.name} has been knocked out!`);
          
          // Check if all heroes are defeated using current HP values
          const allHeroesDefeated = checkAllHeroesDefeated(defender, currentHP);
          
          if (allHeroesDefeated) {
            // All heroes defeated, monster wins - show defeated on player1
            setDefeatedPlayer('player1');
            showFloatingNumbers(
              [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: 'player1', persistent: true }],
              [],
              []
            );
            await handleVictory(
              attackerClass,
              defenderClass,
              damage,
              attackerDetails,
              defenderDetails,
              eventDescription,
              'player1' // Pass player1 as defeated for victory handling
            );
            return;
          }
        } else {
          // Main hero or monster - check if battle is over
          if (defender === 'player1') {
            // Check if this is a team battle (has support heroes)
            const isTeamBattle = supportHeroes.length > 0;
            
            if (isTeamBattle) {
              // Team battle - check if all heroes are defeated using current HP values
              const allHeroesDefeated = checkAllHeroesDefeated(defender, currentHP);
              if (allHeroesDefeated) {
                // All heroes defeated, monster wins - show defeated on player1
                setDefeatedPlayer('player1');
                showFloatingNumbers(
                  [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: 'player1', persistent: true }],
                  [],
                  []
                );
                await handleVictory(
                  attackerClass,
                  defenderClass,
                  damage,
                  attackerDetails,
                  defenderDetails,
                  eventDescription,
                  'player1' // Pass player1 as defeated for victory handling
                );
                return;
              }
              // Player1 knocked out but support heroes are still alive - continue battle
              // Show "KNOCKED OUT!" visual effect for player1
              showFloatingNumbers(
                [{ value: 'KNOCKED OUT!', type: 'knocked-out', targetPlayer: 'player1', persistent: true }],
                [],
                []
              );
              addLog('system', `💀 ${defenderClass.name} has been knocked out! Support heroes continue the fight!`);
              
              // Ensure turn switches to a support hero if available (switchTurn will skip defeated player1)
              // Continue battle - switch turns (will skip defeated player1 and go to support heroes)
            } else {
              // One-on-one battle - player1 defeated, battle ends
              setDefeatedPlayer('player1');
              showFloatingNumbers(
                [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: 'player1', persistent: true }],
                [],
                []
              );
              await handleVictory(
                attackerClass,
                defenderClass,
                damage,
                attackerDetails,
                defenderDetails,
                eventDescription,
                'player1' // Pass player1 as defeated for victory handling
              );
              return;
            }
          } else if (defender === 'player2') {
            // Monster defeated, heroes win
            setDefeatedPlayer('player2');
            showFloatingNumbers(
              [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: 'player2', persistent: true }],
              [],
              []
            );
            await handleVictory(
              attackerClass,
              defenderClass,
              damage,
              attackerDetails,
              defenderDetails,
              eventDescription,
              defender
            );
            return;
          }
        }
      }
      // Continue battle - switch turns
      await switchTurn(attacker);
      setIsMoveInProgress(false);
      clearProjectileTracking();
    };
  }, [handleVictory, switchTurn, setIsMoveInProgress, clearProjectileTracking, addLog, supportHeroes, setDefeatedPlayer, checkAllHeroesDefeated, player1Class, player2Class]);

  // Factory function to create post-miss callback
  const createPostMissCallback = useCallback((
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string,
    defenderDetails: string,
    eventDescription: string,
    attacker: 'player1' | 'player2' | 'support1' | 'support2'
  ) => {
    return async () => {
      // No narrative during battle - only generate summary at the end
      await switchTurn(attacker);
      setIsMoveInProgress(false);
      clearProjectileTracking();
    };
  }, [switchTurn, setIsMoveInProgress, clearProjectileTracking]);

  // Factory function to create post-healing callback
  const createPostHealingCallback = useCallback((
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string,
    defenderDetails: string,
    eventDescription: string,
    attacker: 'player1' | 'player2' | 'support1' | 'support2'
  ) => {
    return async () => {
      // No narrative during battle - only generate summary at the end
      await switchTurn(attacker);
      setIsMoveInProgress(false);
      clearProjectileTracking();
    };
  }, [switchTurn, setIsMoveInProgress, clearProjectileTracking]);

  // Helper function to handle healing abilities
  const handleHealingAbility = useCallback(async (
    attacker: 'player1' | 'player2' | 'support1' | 'support2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    ability: Ability,
    attackerDetails: string,
    defenderDetails: string
  ) => {
    if (ability.type !== 'healing') return;
    
    const heal = rollDiceWithNotation(ability.healingDice);
    const newHP = Math.min(attackerClass.maxHitPoints, attackerClass.hitPoints + heal);
    
    // Use actual player ID for floating numbers (support heroes show on their own cards)
    const visualTargetPlayer: 'player1' | 'player2' | 'support1' | 'support2' = attacker;
    // For visual effects that only support player1/player2, map support heroes to player1
    const visualTargetForEffects: 'player1' | 'player2' = (attacker === 'player1' || attacker === 'support1' || attacker === 'support2') ? 'player1' : 'player2';
    
    showFloatingNumbers(
      [{ value: heal, type: 'healing', targetPlayer: visualTargetPlayer }],
      createHealingVisualEffects(visualTargetForEffects, heal, attackerClass),
      [
        () => updatePlayerHP(attacker, newHP),
        createPostHealingCallback(
          attackerClass,
          defenderClass,
          attackerDetails,
          defenderDetails,
          `${attackerClass.name} uses ${ability.name} and heals for ${heal} HP. ${attackerClass.name} is now at ${newHP}/${attackerClass.maxHitPoints} HP.`,
          attacker
        )
      ]
    );
  }, [updatePlayerHP, createPostHealingCallback, showFloatingNumbers]);

  // Helper function to handle multi-attack abilities
  const handleMultiAttackAbility = useCallback(async (
    attacker: 'player1' | 'player2' | 'support1' | 'support2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackAbility: AttackAbility,
    attackerDetails: string,
    defenderDetails: string,
    defender: 'player1' | 'player2' | 'support1' | 'support2'
  ) => {
    const numAttacks = attackAbility.attacks || 1;
    const attackRolls: number[] = [];
    const d20Rolls: number[] = [];
    const damages: number[] = [];
    const hits: boolean[] = [];
    let totalDamage = 0;
    
    for (let i = 0; i < numAttacks; i++) {
      const d20Roll = rollDice('d20');
      d20Rolls.push(d20Roll);
      const attackRoll = d20Roll + attackerClass.attackBonus;
      attackRolls.push(attackRoll);
      const hit = attackRoll >= defenderClass.armorClass;
      hits.push(hit);
      
      // Log each attack roll with hit/miss
      const bonusText = attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : '';
      const hitMissText = hit ? '**HIT**' : '**MISS**';
      addLog('roll', `🎲 Attack ${i + 1}: d20: ${d20Roll}${bonusText} = ${attackRoll} vs AC ${defenderClass.armorClass} → ${hitMissText}`);
      
      if (hit) {
        const { diceArray, totalDamage: damage } = buildDamageDiceArray(
          attackAbility.damageDice,
          rollDiceWithNotation,
          parseDiceNotation,
          attackAbility.bonusDamageDice
        );
        damages.push(damage);
        totalDamage += damage;
        
        // Log detailed damage dice rolls for this attack
        const damageDetails = diceArray.map(d => `${d.diceType}: ${d.result}`).join(', ');
        addLog('roll', `💥 Attack ${i + 1} damage: ${damageDetails} = ${damage} damage`);
      } else {
        damages.push(0);
      }
    }
    const newHP = totalDamage > 0 ? Math.max(0, defenderClass.hitPoints - totalDamage) : defenderClass.hitPoints;
    
    // Use actual player IDs for visual effects
    const visualDefender: 'player1' | 'player2' | 'support1' | 'support2' = defender;
    const visualAttacker: 'player1' | 'player2' | 'support1' | 'support2' = attacker;
    
    const cardRotation = (attacker === 'player1' || attacker === 'support1' || attacker === 'support2') ? -5 : 5;
    const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
    const successfulHits = hits.map((hit, i) => ({ hit, damage: damages[i], index: i })).filter(h => h.hit);
    
    if (successfulHits.length > 0) {
      const damageNumbers: Array<{ value: number; type: FloatingNumberType; targetPlayer: 'player1' | 'player2' | 'support1' | 'support2' }> = [];
      const completedHitsRef = { count: 0 };
      
      successfulHits.forEach((hitData, hitIndex) => {
        const delay = hitIndex * 100;
        
        showProjectileEffect(
          attacker,
          visualDefender,
          true,
          () => {
            const shakeEffect = createHitVisualEffects(visualAttacker, visualDefender, hitData.damage, defenderClass, attackerClass)
              .find(effect => effect.type === 'shake');
            if (shakeEffect) {
              applyVisualEffect(shakeEffect);
            }
            
            damageNumbers.push({ value: hitData.damage, type: 'damage', targetPlayer: visualDefender });
            completedHitsRef.count++;
            
            if (completedHitsRef.count === successfulHits.length) {
              const visualEffects = createHitVisualEffects(visualAttacker, visualDefender, totalDamage, defenderClass, attackerClass)
                .filter(effect => effect.type !== 'shake');
              
              showFloatingNumbers(
                damageNumbers,
                visualEffects,
                [
                  () => updatePlayerHP(defender, totalDamage, true),
                  async () => {
                    const hitCount = hits.filter(h => h).length;
                    const missCount = hits.filter(h => !h).length;
                    addLog('attack', `⚔️ ${attackerClass.name} uses ${attackAbility.name}: ${hitCount} hit(s), ${missCount} miss(es). Total damage: ${totalDamage}`);
                    await createPostDamageCallback(
                      newHP,
                      totalDamage,
                      attackerClass,
                      defenderClass,
                      attackerDetails,
                      defenderDetails,
                      newHP <= 0
                        ? `${attackerClass.name} uses ${attackAbility.name} and makes ${numAttacks} attacks. Total damage: ${totalDamage}. ${defenderClass.name} is ${defender === 'support1' || defender === 'support2' ? 'knocked out' : defender === 'player1' && supportHeroes.length > 0 && supportHeroes.some(sh => sh.class.hitPoints > 0) ? 'knocked out' : 'defeated'} with 0 HP.`
                        : `${attackerClass.name} uses ${attackAbility.name} and makes ${numAttacks} attacks. Total damage: ${totalDamage}. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
                      defender,
                      attacker
                    )();
                  }
                ]
              );
            }
          },
          undefined,
          cardRotation,
          delay,
          projectileType
        );
      });
    } else {
      showProjectileEffect(
        attacker,
        visualDefender,
        false,
        undefined,
        () => {
          showFloatingNumbers(
            [{ value: 'MISS', type: 'miss', targetPlayer: visualAttacker }],
            createMissVisualEffects(visualAttacker, attackerClass),
            [
              async () => {
                addLog('attack', `⚔️ ${attackerClass.name} uses ${attackAbility.name}: All ${numAttacks} attacks miss!`);
                await createPostMissCallback(
                  attackerClass,
                  defenderClass,
                  attackerDetails,
                  defenderDetails,
                  `${attackerClass.name} uses ${attackAbility.name} and makes ${numAttacks} attacks. All attacks miss. ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
                  attacker
                )();
              }
            ]
          );
        },
        cardRotation,
        undefined,
        projectileType
      );
    }
  }, [updatePlayerHP, createPostDamageCallback, createPostMissCallback, addLog, showFloatingNumbers, showProjectileEffect, applyVisualEffect, supportHeroes]);

  // Helper function to handle single attack with roll
  const handleSingleAttackAbility = useCallback(async (
    attacker: 'player1' | 'player2' | 'support1' | 'support2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackAbility: AttackAbility,
    attackerDetails: string,
    defenderDetails: string,
    defender: 'player1' | 'player2' | 'support1' | 'support2'
  ) => {
    const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
    const isHit = attackRoll >= defenderClass.armorClass;
    logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass, isHit);
    
    if (isHit) {
      const { diceArray, totalDamage: damage } = buildDamageDiceArray(
        attackAbility.damageDice,
        rollDiceWithNotation,
        parseDiceNotation,
        attackAbility.bonusDamageDice
      );
      
      // Log detailed damage dice rolls
      const damageDetails = diceArray.map(d => `${d.diceType}: ${d.result}`).join(', ');
      addLog('roll', `💥 Damage roll: ${damageDetails} = ${damage} total damage`);
      
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      
      // Use actual player IDs for visual effects
      const visualDefender: 'player1' | 'player2' | 'support1' | 'support2' = defender;
      const visualAttacker: 'player1' | 'player2' | 'support1' | 'support2' = attacker;
      
      const visualEffects = createHitVisualEffects(visualAttacker, visualDefender, damage, defenderClass, attackerClass)
        .filter(effect => effect.type !== 'shake');
      
      const cardRotation = (attacker === 'player1' || attacker === 'support1' || attacker === 'support2') ? -5 : 5;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      showProjectileEffect(
        attacker,
        visualDefender,
        true,
        () => {
          const shakeEffect = createHitVisualEffects(visualAttacker, visualDefender, damage, defenderClass, attackerClass)
            .find(effect => effect.type === 'shake');
          if (shakeEffect) {
            applyVisualEffect(shakeEffect);
          }
          
          showFloatingNumbers(
            [{ value: damage, type: 'damage', targetPlayer: visualDefender }],
            visualEffects,
            [
              () => updatePlayerHP(defender, damage, true),
              () => {
                addLog('attack', `⚔️ **HIT!** ${attackerClass.name} uses ${attackAbility.name} and hits ${defenderClass.name} for ${damage} damage. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`);
                createPostDamageCallback(
                  newHP,
                  damage,
                  attackerClass,
                  defenderClass,
                  attackerDetails,
                  defenderDetails,
                  newHP <= 0
                    ? `${attackerClass.name} uses ${attackAbility.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is ${defender === 'support1' || defender === 'support2' ? 'knocked out' : defender === 'player1' && supportHeroes.length > 0 && supportHeroes.some(sh => sh.class.hitPoints > 0) ? 'knocked out' : 'defeated'} with 0 HP.`
                    : `${attackerClass.name} uses ${attackAbility.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
                  defender,
                  attacker
                )();
              }
            ]
          );
        },
        undefined,
        cardRotation,
        undefined,
        projectileType
      );
    } else {
      // Use actual player IDs for visual effects
      const visualDefender: 'player1' | 'player2' | 'support1' | 'support2' = defender;
      const visualAttacker: 'player1' | 'player2' | 'support1' | 'support2' = attacker;
      
      const cardRotation = (attacker === 'player1' || attacker === 'support1' || attacker === 'support2') ? -5 : 5;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      showProjectileEffect(
        attacker,
        visualDefender,
        false,
        undefined,
        () => {
          showFloatingNumbers(
            [{ value: 'MISS', type: 'miss', targetPlayer: visualAttacker }],
            createMissVisualEffects(visualAttacker, attackerClass),
            [
              () => {
                addLog('attack', `⚔️ **MISS!** ${attackerClass.name} uses ${attackAbility.name} and misses ${defenderClass.name}! AC ${defenderClass.armorClass}.`);
                createPostMissCallback(
                  attackerClass,
                  defenderClass,
                  attackerDetails,
                  defenderDetails,
                  `${attackerClass.name} uses ${attackAbility.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
                  attacker
                )();
              }
            ]
          );
        },
        cardRotation,
        undefined,
        projectileType
      );
    }
  }, [calculateAttackRoll, logAttackRoll, updatePlayerHP, createPostDamageCallback, createPostMissCallback, showFloatingNumbers, showProjectileEffect, applyVisualEffect]);

  // Helper function to handle automatic damage abilities
  const handleAutomaticDamageAbility = useCallback(async (
    attacker: 'player1' | 'player2' | 'support1' | 'support2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackAbility: AttackAbility,
    attackerDetails: string,
    defenderDetails: string,
    defender: 'player1' | 'player2' | 'support1' | 'support2'
  ) => {
    const { diceArray, totalDamage: damage } = buildDamageDiceArray(
      attackAbility.damageDice,
      rollDiceWithNotation,
      parseDiceNotation,
      attackAbility.bonusDamageDice
    );
    
    // Log detailed damage dice rolls
    const damageDetails = diceArray.map(d => `${d.diceType}: ${d.result}`).join(', ');
    addLog('roll', `💥 ${attackerClass.name} uses ${attackAbility.name} - Damage roll: ${damageDetails} = ${damage} total damage`);
    const newHP = Math.max(0, defenderClass.hitPoints - damage);
    
    // Use actual player IDs for visual effects
    const visualDefender: 'player1' | 'player2' | 'support1' | 'support2' = defender;
    const visualAttacker: 'player1' | 'player2' | 'support1' | 'support2' = attacker;
    
    const visualEffects = createHitVisualEffects(visualAttacker, visualDefender, damage, defenderClass, attackerClass)
      .filter(effect => effect.type !== 'shake');
    
    const cardRotation = (attacker === 'player1' || attacker === 'support1' || attacker === 'support2') ? -5 : 5;
    const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
    showProjectileEffect(
      attacker,
      visualDefender,
      true,
      () => {
        const shakeEffect = createHitVisualEffects(visualAttacker, visualDefender, damage, defenderClass, attackerClass)
          .find(effect => effect.type === 'shake');
        if (shakeEffect) {
          applyVisualEffect(shakeEffect);
        }
        
        showFloatingNumbers(
          [{ value: damage, type: 'damage', targetPlayer: visualDefender }],
          visualEffects,
          [
            () => updatePlayerHP(defender, damage, true),
            createPostDamageCallback(
              newHP,
              damage,
              attackerClass,
              defenderClass,
              attackerDetails,
              defenderDetails,
              newHP <= 0
                ? `${attackerClass.name} uses ${attackAbility.name} and deals ${damage} damage to ${defenderClass.name}. ${defenderClass.name} is ${defender === 'support1' || defender === 'support2' ? 'knocked out' : defender === 'player1' && supportHeroes.length > 0 && supportHeroes.some(sh => sh.class.hitPoints > 0) ? 'knocked out' : 'defeated'} with 0 HP.`
                : `${attackerClass.name} uses ${attackAbility.name} and deals ${damage} damage to ${defenderClass.name}. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
              defender,
              attacker
            )
          ]
        );
      },
      undefined,
      cardRotation,
      undefined,
      projectileType
    );
  }, [updatePlayerHP, createPostDamageCallback, showFloatingNumbers, showProjectileEffect, applyVisualEffect]);

  // Main attack function
  const performAttack = useCallback(async (attacker: 'player1' | 'player2' | 'support1' | 'support2', attackType?: 'melee' | 'ranged') => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;
    
    setIsMoveInProgress(true);
    // Check if attacker is knocked out (HP <= 0)
    const attackerClass = getAttackerClass(attacker);
    if (!attackerClass || attackerClass.hitPoints <= 0) {
      setIsMoveInProgress(false);
      return; // Attacker is knocked out, can't attack
    }
    
    // Determine target: heroes/support attack monster, monster attacks a random hero/support
    let defender: 'player1' | 'player2' | 'support1' | 'support2';
    let defenderClass: DnDClass | null;
    
    if (attacker === 'player2') {
      // Monster's turn - choose target
      const availableTargets = getAvailableTargets();
      if (availableTargets.length === 0) {
        // No targets available, battle should be over
        setIsMoveInProgress(false);
        return;
      }
      
      // Use provided target or choose randomly
      if (monsterTarget && availableTargets.includes(monsterTarget)) {
        defender = monsterTarget;
      } else {
        defender = availableTargets[Math.floor(Math.random() * availableTargets.length)];
      }
      
      defenderClass = getDefenderClass(defender);
      if (!defenderClass) {
        setIsMoveInProgress(false);
        return;
      }
    } else {
      // Hero/support turn - always attack monster
      defender = 'player2';
      defenderClass = player2Class;
    }
    
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    let damageDie: string;
    if (attackType === 'melee' && attackerClass.meleeDamageDie) {
      damageDie = attackerClass.meleeDamageDie;
    } else if (attackType === 'ranged' && attackerClass.rangedDamageDie) {
      damageDie = attackerClass.rangedDamageDie;
    } else {
      damageDie = attackerClass.damageDie;
    }

    const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
    const isHit = attackRoll >= defenderClass.armorClass;
    logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass, isHit);

    const attackTypeLabel = attackType === 'melee' ? 'melee' : attackType === 'ranged' ? 'ranged' : '';
    const attackDescription = attackTypeLabel ? `${attackTypeLabel} attack` : 'attack';

    const projectileType = getProjectileType(null, attackType, attackerClass.name);
    triggerFlashEffect(attacker, projectileType);

    if (isHit) {
      const damage = rollDice(damageDie);
      addLog('roll', `💥 Damage roll: ${damageDie}: ${damage} damage`);
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      
      // Use actual player IDs for visual effects (don't map support heroes to player1)
      const visualDefender: 'player1' | 'player2' | 'support1' | 'support2' = defender;
      // For visual effects that only support player1/player2, map support heroes to player1
      const visualAttackerForEffects: 'player1' | 'player2' = (attacker === 'player1' || attacker === 'support1' || attacker === 'support2') ? 'player1' : 'player2';
      const visualDefenderForEffects: 'player1' | 'player2' = (defender === 'player1' || defender === 'support1' || defender === 'support2') ? 'player1' : 'player2';
      const visualEffects = createHitVisualEffects(visualAttackerForEffects, visualDefenderForEffects, damage, defenderClass, attackerClass)
        .filter(effect => effect.type !== 'shake');
      
      const cardRotation = (attacker === 'player1' || attacker === 'support1' || attacker === 'support2') ? -5 : 5;
      showProjectileEffect(
        attacker,
        visualDefender,
        true,
        () => {
          const shakeEffect = createHitVisualEffects(visualAttackerForEffects, visualDefenderForEffects, damage, defenderClass, attackerClass)
            .find(effect => effect.type === 'shake');
          if (shakeEffect) {
            applyVisualEffect(shakeEffect);
          }
          
          showFloatingNumbers(
            [{ value: damage, type: 'damage', targetPlayer: visualDefender }],
            visualEffects,
            [
              () => {
                // Pass damage to updatePlayerHP, which will calculate from current state
                updatePlayerHP(defender, damage, true);
              },
              () => {
                addLog('attack', `⚔️ **HIT!** ${attackerClass.name} ${attackDescription}s ${defenderClass.name} for ${damage} damage. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`);
                createPostDamageCallback(
                  newHP,
                  damage,
                  attackerClass,
                  defenderClass,
                  attackerDetails,
                  defenderDetails,
                  newHP <= 0
                    ? `${attackerClass.name} ${attackDescription}s ${defenderClass.name} and deals ${damage} damage. ${defenderClass.name} is ${defender === 'support1' || defender === 'support2' ? 'knocked out' : defender === 'player1' && supportHeroes.length > 0 && supportHeroes.some(sh => sh.class.hitPoints > 0) ? 'knocked out' : 'defeated'} with 0 HP remaining.`
                    : `${attackerClass.name} ${attackDescription}s ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack hits! ${defenderClass.name} takes ${damage} damage and is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
                  defender,
                  attacker
                )();
              }
            ]
          );
        },
        undefined,
        cardRotation,
        undefined,
        projectileType
      );
    } else {
      const cardRotation = (attacker === 'player1' || attacker === 'support1' || attacker === 'support2') ? -5 : 5;
      const projectileType = getProjectileType(null, attackType, attackerClass.name);
      // Use actual player IDs for visual effects
      const visualDefender: 'player1' | 'player2' | 'support1' | 'support2' = defender;
      const visualAttacker: 'player1' | 'player2' | 'support1' | 'support2' = attacker;
      
      showProjectileEffect(
        attacker,
        visualDefender,
        false,
        undefined,
        () => {
          const visualAttacker: 'player1' | 'player2' | 'support1' | 'support2' = attacker;
          
          showFloatingNumbers(
            [{ value: 'MISS', type: 'miss', targetPlayer: visualAttacker }],
            createMissVisualEffects(visualAttacker, attackerClass),
            [
              () => {
                addLog('attack', `⚔️ **MISS!** ${attackerClass.name} ${attackDescription}s ${defenderClass.name} but misses! AC ${defenderClass.armorClass}.`);
                createPostMissCallback(
                  attackerClass,
                  defenderClass,
                  attackerDetails,
                  defenderDetails,
                  `${attackerClass.name} ${attackDescription}s ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
                  attacker
                )();
              }
            ]
          );
        },
        cardRotation,
        undefined,
        projectileType
      );
    }
  }, [
    isBattleActive,
    player1Class,
    player2Class,
    isMoveInProgress,
    classDetails,
    setIsMoveInProgress,
    calculateAttackRoll,
    logAttackRoll,
    triggerFlashEffect,
    updatePlayerHP,
    createPostDamageCallback,
    createPostMissCallback,
    showFloatingNumbers,
    showProjectileEffect,
    applyVisualEffect,
    getAttackerClass,
    getDefenderClass,
    getAvailableTargets,
    monsterTarget,
  ]);

  // Main ability use function
  const useAbility = useCallback(async (attacker: 'player1' | 'player2' | 'support1' | 'support2', abilityIndex: number) => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;

    setIsMoveInProgress(true);
    const attackerClass = getAttackerClass(attacker);
    if (!attackerClass || attackerClass.hitPoints <= 0) {
      // Attacker is knocked out, can't use abilities
      setIsMoveInProgress(false);
      return;
    }
    
    // Determine target: heroes/support attack monster, monster attacks a selected hero/support
    let defender: 'player1' | 'player2' | 'support1' | 'support2';
    let defenderClass: DnDClass | null;
    
    if (attacker === 'player2') {
      // Monster's turn - choose target for abilities (same logic as attacks)
      const availableTargets = getAvailableTargets();
      if (availableTargets.length === 0) {
        // No targets available
        setIsMoveInProgress(false);
        return;
      }
      
      // Use selected target or choose randomly
      if (monsterTarget && availableTargets.includes(monsterTarget)) {
        defender = monsterTarget;
      } else {
        defender = availableTargets[Math.floor(Math.random() * availableTargets.length)];
      }
      
      defenderClass = getDefenderClass(defender);
      if (!defenderClass) {
        setIsMoveInProgress(false);
        return;
      }
    } else {
      // Hero/support turn - always attack monster
      defender = 'player2';
      defenderClass = player2Class;
    }
    
    const ability = attackerClass.abilities[abilityIndex];
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    if (!ability) return;

    addLog('roll', `✨ ${attackerClass.name} uses ${ability.name}!`);

    if (ability.type === 'healing') {
      // For healing, support heroes heal themselves, player1 heals themselves
      const healingTarget = attacker;
      await handleHealingAbility(healingTarget, attackerClass, defenderClass, ability, attackerDetails, defenderDetails);
      return;
    } else if (ability.type === 'attack') {
      const attackAbility = ability as AttackAbility;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      triggerFlashEffect(attacker, projectileType);
      const numAttacks = attackAbility.attacks || 1;
      
      if (numAttacks > 1) {
        await handleMultiAttackAbility(attacker, attackerClass, defenderClass, attackAbility, attackerDetails, defenderDetails, defender);
      } else if (attackAbility.attackRoll) {
        await handleSingleAttackAbility(attacker, attackerClass, defenderClass, attackAbility, attackerDetails, defenderDetails, defender);
      } else {
        await handleAutomaticDamageAbility(attacker, attackerClass, defenderClass, attackAbility, attackerDetails, defenderDetails, defender);
      }
      return;
    }
  }, [
    isBattleActive,
    player1Class,
    player2Class,
    isMoveInProgress,
    classDetails,
    setIsMoveInProgress,
    addLog,
    triggerFlashEffect,
    handleHealingAbility,
    handleMultiAttackAbility,
    handleSingleAttackAbility,
    handleAutomaticDamageAbility,
    getAttackerClass,
  ]);

  return {
    performAttack,
    useAbility,
    calculateAttackRoll,
    logAttackRoll,
  };
}

