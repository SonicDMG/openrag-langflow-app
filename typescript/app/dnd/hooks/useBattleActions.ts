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
  isBattleActive: boolean;
  isMoveInProgress: boolean;
  classDetails: Record<string, string>;
  defeatedPlayer: 'player1' | 'player2' | null;
  
  // Setters
  setIsMoveInProgress: (value: boolean) => void;
  updatePlayerHP: (player: 'player1' | 'player2', newHP: number) => void;
  addLog: (type: 'attack' | 'ability' | 'roll' | 'narrative' | 'system', message: string) => void;
  
  // Effects
  applyVisualEffect: (effect: PendingVisualEffect) => void;
  triggerFlashEffect: (attacker: 'player1' | 'player2', projectileType?: ProjectileType) => void;
  showFloatingNumbers: (
    numbers: Array<{ value: number | string; type: FloatingNumberType; targetPlayer: 'player1' | 'player2'; persistent?: boolean }>,
    visualEffects: PendingVisualEffect[],
    callbacks: (() => void)[]
  ) => void;
  showProjectileEffect: (
    fromPlayer: 'player1' | 'player2',
    toPlayer: 'player1' | 'player2',
    isHit: boolean,
    onHit?: () => void,
    onComplete?: () => void,
    fromCardRotation?: number,
    delay?: number,
    projectileType?: ProjectileType
  ) => void;
  clearProjectileTracking: () => void;
  
  // Turn management
  switchTurn: (attacker: 'player1' | 'player2') => Promise<void>;
  
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
};

export function useBattleActions(deps: BattleActionsDependencies) {
  const {
    player1Class,
    player2Class,
    isBattleActive,
    isMoveInProgress,
    classDetails,
    defeatedPlayer,
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
  } = deps;

  // Helper function to calculate attack roll
  const calculateAttackRoll = useCallback((attackerClass: DnDClass): { d20Roll: number; attackRoll: number } => {
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    return { d20Roll, attackRoll };
  }, []);

  // Helper function to log attack roll
  const logAttackRoll = useCallback((attackerClass: DnDClass, d20Roll: number, attackRoll: number, defenderAC: number) => {
    const bonusText = attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus} (attack bonus)` : '';
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll}${bonusText} = ${attackRoll} (needs ${defenderAC})`);
  }, [addLog]);

  // Factory function to create post-damage callback
  const createPostDamageCallback = useCallback((
    newHP: number,
    damage: number,
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string,
    defenderDetails: string,
    eventDescription: string,
    defender: 'player1' | 'player2',
    attacker: 'player1' | 'player2'
  ) => {
    return async () => {
      if (newHP <= 0) {
        await handleVictory(
          attackerClass,
          defenderClass,
          damage,
          attackerDetails,
          defenderDetails,
          eventDescription,
          defender
        );
      } else {
        // No narrative during battle - only generate summary at the end
      }
      await switchTurn(attacker);
      setIsMoveInProgress(false);
      clearProjectileTracking();
    };
  }, [handleVictory, switchTurn, setIsMoveInProgress, clearProjectileTracking]);

  // Factory function to create post-miss callback
  const createPostMissCallback = useCallback((
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string,
    defenderDetails: string,
    eventDescription: string,
    attacker: 'player1' | 'player2'
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
    attacker: 'player1' | 'player2'
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
    attacker: 'player1' | 'player2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    ability: Ability,
    attackerDetails: string,
    defenderDetails: string
  ) => {
    if (ability.type !== 'healing') return;
    
    const heal = rollDiceWithNotation(ability.healingDice);
    const newHP = Math.min(attackerClass.maxHitPoints, attackerClass.hitPoints + heal);
    
    showFloatingNumbers(
      [{ value: heal, type: 'healing', targetPlayer: attacker }],
      createHealingVisualEffects(attacker, heal, attackerClass),
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
    attacker: 'player1' | 'player2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackAbility: AttackAbility,
    attackerDetails: string,
    defenderDetails: string
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
      
      if (hit) {
        const { totalDamage: damage } = buildDamageDiceArray(
          attackAbility.damageDice,
          rollDiceWithNotation,
          parseDiceNotation,
          attackAbility.bonusDamageDice
        );
        damages.push(damage);
        totalDamage += damage;
      } else {
        damages.push(0);
      }
    }
    
    const defender = getOpponent(attacker);
    const newHP = totalDamage > 0 ? Math.max(0, defenderClass.hitPoints - totalDamage) : defenderClass.hitPoints;
    
    const hitDetails = totalDamage > 0 ? hits.map((hit, i) => 
      hit ? `Attack ${i + 1} hits for ${damages[i]} damage.` : `Attack ${i + 1} misses.`
    ).join(' ') : '';

    const cardRotation = attacker === 'player1' ? -5 : 5;
    const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
    const successfulHits = hits.map((hit, i) => ({ hit, damage: damages[i], index: i })).filter(h => h.hit);
    
    if (successfulHits.length > 0) {
      const damageNumbers: Array<{ value: number; type: FloatingNumberType; targetPlayer: 'player1' | 'player2' }> = [];
      const completedHitsRef = { count: 0 };
      
      successfulHits.forEach((hitData, hitIndex) => {
        const delay = hitIndex * 100;
        
        showProjectileEffect(
          attacker,
          defender,
          true,
          () => {
            const shakeEffect = createHitVisualEffects(attacker, defender, hitData.damage, defenderClass, attackerClass)
              .find(effect => effect.type === 'shake');
            if (shakeEffect) {
              applyVisualEffect(shakeEffect);
            }
            
            damageNumbers.push({ value: hitData.damage, type: 'damage', targetPlayer: defender });
            completedHitsRef.count++;
            
            if (completedHitsRef.count === successfulHits.length) {
              const visualEffects = createHitVisualEffects(attacker, defender, totalDamage, defenderClass, attackerClass)
                .filter(effect => effect.type !== 'shake');
              
              showFloatingNumbers(
                damageNumbers,
                visualEffects,
                [
                  () => updatePlayerHP(defender, newHP),
                  async () => {
                    addLog('roll', `🎲 ${attackerClass.name} makes ${numAttacks} attacks: ${attackRolls.join(', ')}`);
                    await createPostDamageCallback(
                      newHP,
                      totalDamage,
                      attackerClass,
                      defenderClass,
                      attackerDetails,
                      defenderDetails,
                      newHP <= 0
                        ? `${attackerClass.name} uses ${attackAbility.name} and makes ${numAttacks} attacks. ${hitDetails} Total damage: ${totalDamage}. ${defenderClass.name} is defeated with 0 HP.`
                        : `${attackerClass.name} uses ${attackAbility.name} and makes ${numAttacks} attacks. ${hitDetails} Total damage: ${totalDamage}. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
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
        defender,
        false,
        undefined,
        () => {
          showFloatingNumbers(
            [{ value: 'MISS', type: 'miss', targetPlayer: attacker }],
            createMissVisualEffects(attacker, attackerClass),
            [
              async () => {
                addLog('roll', `🎲 ${attackerClass.name} makes ${numAttacks} attacks: ${attackRolls.join(', ')}`);
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
  }, [updatePlayerHP, createPostDamageCallback, createPostMissCallback, addLog, showFloatingNumbers, showProjectileEffect, applyVisualEffect]);

  // Helper function to handle single attack with roll
  const handleSingleAttackAbility = useCallback(async (
    attacker: 'player1' | 'player2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackAbility: AttackAbility,
    attackerDetails: string,
    defenderDetails: string
  ) => {
    const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
    logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass);

    const defender = getOpponent(attacker);
    
    if (attackRoll >= defenderClass.armorClass) {
      const { totalDamage: damage } = buildDamageDiceArray(
        attackAbility.damageDice,
        rollDiceWithNotation,
        parseDiceNotation,
        attackAbility.bonusDamageDice
      );
      
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      
      const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
        .filter(effect => effect.type !== 'shake');
      
      const cardRotation = attacker === 'player1' ? -5 : 5;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      showProjectileEffect(
        attacker,
        defender,
        true,
        () => {
          const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
            .find(effect => effect.type === 'shake');
          if (shakeEffect) {
            applyVisualEffect(shakeEffect);
          }
          
          showFloatingNumbers(
            [{ value: damage, type: 'damage', targetPlayer: defender }],
            visualEffects,
            [
              () => updatePlayerHP(defender, newHP),
              createPostDamageCallback(
                newHP,
                damage,
                attackerClass,
                defenderClass,
                attackerDetails,
                defenderDetails,
                newHP <= 0
                  ? `${attackerClass.name} uses ${attackAbility.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is defeated with 0 HP.`
                  : `${attackerClass.name} uses ${attackAbility.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
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
    } else {
      const cardRotation = attacker === 'player1' ? -5 : 5;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      showProjectileEffect(
        attacker,
        defender,
        false,
        undefined,
        () => {
          showFloatingNumbers(
            [{ value: 'MISS', type: 'miss', targetPlayer: attacker }],
            createMissVisualEffects(attacker, attackerClass),
            [
              createPostMissCallback(
                attackerClass,
                defenderClass,
                attackerDetails,
                defenderDetails,
                `${attackerClass.name} uses ${attackAbility.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
                attacker
              )
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
    attacker: 'player1' | 'player2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackAbility: AttackAbility,
    attackerDetails: string,
    defenderDetails: string
  ) => {
    const { totalDamage: damage } = buildDamageDiceArray(
      attackAbility.damageDice,
      rollDiceWithNotation,
      parseDiceNotation,
      attackAbility.bonusDamageDice
    );
    const defender = getOpponent(attacker);
    const newHP = Math.max(0, defenderClass.hitPoints - damage);
    
    const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
      .filter(effect => effect.type !== 'shake');
    
    const cardRotation = attacker === 'player1' ? -5 : 5;
    const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
    showProjectileEffect(
      attacker,
      defender,
      true,
      () => {
        const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
          .find(effect => effect.type === 'shake');
        if (shakeEffect) {
          applyVisualEffect(shakeEffect);
        }
        
        showFloatingNumbers(
          [{ value: damage, type: 'damage', targetPlayer: defender }],
          visualEffects,
          [
            () => updatePlayerHP(defender, newHP),
            createPostDamageCallback(
              newHP,
              damage,
              attackerClass,
              defenderClass,
              attackerDetails,
              defenderDetails,
              newHP <= 0
                ? `${attackerClass.name} uses ${attackAbility.name} and deals ${damage} damage to ${defenderClass.name}. ${defenderClass.name} is defeated with 0 HP.`
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
  const performAttack = useCallback(async (attacker: 'player1' | 'player2', attackType?: 'melee' | 'ranged') => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;

    setIsMoveInProgress(true);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
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
    logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass);

    const defender = getOpponent(attacker);
    const attackTypeLabel = attackType === 'melee' ? 'melee' : attackType === 'ranged' ? 'ranged' : '';
    const attackDescription = attackTypeLabel ? `${attackTypeLabel} attack` : 'attack';

    const projectileType = getProjectileType(null, attackType, attackerClass.name);
    triggerFlashEffect(attacker, projectileType);

    if (attackRoll >= defenderClass.armorClass) {
      const damage = rollDice(damageDie);
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      
      const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
        .filter(effect => effect.type !== 'shake');
      
      const cardRotation = attacker === 'player1' ? -5 : 5;
      showProjectileEffect(
        attacker,
        defender,
        true,
        () => {
          const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
            .find(effect => effect.type === 'shake');
          if (shakeEffect) {
            applyVisualEffect(shakeEffect);
          }
          
          showFloatingNumbers(
            [{ value: damage, type: 'damage', targetPlayer: defender }],
            visualEffects,
            [
              () => updatePlayerHP(defender, newHP),
              createPostDamageCallback(
                newHP,
                damage,
                attackerClass,
                defenderClass,
                attackerDetails,
                defenderDetails,
                newHP <= 0
                  ? `${attackerClass.name} ${attackDescription}s ${defenderClass.name} and deals ${damage} damage. ${defenderClass.name} is defeated with 0 HP remaining.`
                  : `${attackerClass.name} ${attackDescription}s ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack hits! ${defenderClass.name} takes ${damage} damage and is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
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
    } else {
      const cardRotation = attacker === 'player1' ? -5 : 5;
      const projectileType = getProjectileType(null, attackType, attackerClass.name);
      showProjectileEffect(
        attacker,
        defender,
        false,
        undefined,
        () => {
          showFloatingNumbers(
            [{ value: 'MISS', type: 'miss', targetPlayer: attacker }],
            createMissVisualEffects(attacker, attackerClass),
            [
              createPostMissCallback(
                attackerClass,
                defenderClass,
                attackerDetails,
                defenderDetails,
                `${attackerClass.name} ${attackDescription}s ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
                attacker
              )
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
  ]);

  // Main ability use function
  const useAbility = useCallback(async (attacker: 'player1' | 'player2', abilityIndex: number) => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;

    setIsMoveInProgress(true);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const ability = attackerClass.abilities[abilityIndex];
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    if (!ability) return;

    addLog('roll', `✨ ${attackerClass.name} uses ${ability.name}!`);

    if (ability.type === 'healing') {
      await handleHealingAbility(attacker, attackerClass, defenderClass, ability, attackerDetails, defenderDetails);
      return;
    } else if (ability.type === 'attack') {
      const attackAbility = ability as AttackAbility;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      triggerFlashEffect(attacker, projectileType);
      const numAttacks = attackAbility.attacks || 1;
      
      if (numAttacks > 1) {
        await handleMultiAttackAbility(attacker, attackerClass, defenderClass, attackAbility, attackerDetails, defenderDetails);
      } else if (attackAbility.attackRoll) {
        await handleSingleAttackAbility(attacker, attackerClass, defenderClass, attackAbility, attackerDetails, defenderDetails);
      } else {
        await handleAutomaticDamageAbility(attacker, attackerClass, defenderClass, attackAbility, attackerDetails, defenderDetails);
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
  ]);

  return {
    performAttack,
    useAbility,
    calculateAttackRoll,
    logAttackRoll,
  };
}

