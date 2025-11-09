'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Types
import { DnDClass, BattleLog, AttackAbility } from '../dnd/types';

// Constants
import { FALLBACK_CLASSES, CLASS_COLORS } from '../dnd/constants';

// Utilities
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../dnd/utils/dice';
import { generateCharacterName } from '../dnd/utils/names';

// Services
import { fetchAvailableClasses, fetchClassStats, extractAbilities, getBattleNarrative } from '../dnd/services/apiService';

// Components
import { ClassSelection } from '../dnd/components/ClassSelection';
import { DiceRoll } from '../dnd/components/DiceRoll';
import { PlayerStats } from '../dnd/components/PlayerStats';

export default function DnDBattle() {
  const router = useRouter();
  const [player1Class, setPlayer1Class] = useState<DnDClass | null>(null);
  const [player2Class, setPlayer2Class] = useState<DnDClass | null>(null);
  const [player1Name, setPlayer1Name] = useState<string>('');
  const [player2Name, setPlayer2Name] = useState<string>('');
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [availableClasses, setAvailableClasses] = useState<DnDClass[]>(FALLBACK_CLASSES);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [classDetails, setClassDetails] = useState<Record<string, string>>({});
  const [isLoadingClassDetails, setIsLoadingClassDetails] = useState(false);
  const [battleResponseId, setBattleResponseId] = useState<string | null>(null);
  const [shakingPlayer, setShakingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState({ player1: 0, player2: 0 });
  const [sparklingPlayer, setSparklingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [sparkleTrigger, setSparkleTrigger] = useState({ player1: 0, player2: 0 });
  const [missingPlayer, setMissingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [missTrigger, setMissTrigger] = useState({ player1: 0, player2: 0 });
  const [hittingPlayer, setHittingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [hitTrigger, setHitTrigger] = useState({ player1: 0, player2: 0 });
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const [isMoveInProgress, setIsMoveInProgress] = useState(false);
  const [defeatedPlayer, setDefeatedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [victorPlayer, setVictorPlayer] = useState<'player1' | 'player2' | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [diceRollTrigger, setDiceRollTrigger] = useState(0);
  const [diceRollData, setDiceRollData] = useState<Array<{ diceType: string; result: number }>>([]);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const diceQueueRef = useRef<Array<Array<{ diceType: string; result: number }>>>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [battleLog]);

  // Helper function to add log entries (defined early as it's used by many functions)
  const addLog = useCallback((type: BattleLog['type'], message: string) => {
    setBattleLog((prev) => [...prev, { type, message, timestamp: Date.now() }]);
  }, []);

  // Helper function to update player HP
  const updatePlayerHP = useCallback((player: 'player1' | 'player2', newHP: number) => {
    if (player === 'player1') {
      setPlayer1Class((current) => current ? { ...current, hitPoints: newHP } : current);
    } else {
      setPlayer2Class((current) => current ? { ...current, hitPoints: newHP } : current);
    }
  }, []);

  // Helper function to trigger dice roll animation (supports multiple dice at once)
  const triggerDiceRoll = useCallback((diceRolls: Array<{ diceType: string; result: number }>) => {
    if (isDiceRolling) {
      // Queue the dice rolls if one is already in progress
      diceQueueRef.current.push(diceRolls);
      return;
    }
    
    setIsDiceRolling(true);
    setDiceRollData(diceRolls);
    setDiceRollTrigger(prev => prev + 1);
  }, [isDiceRolling]);
  
  // Process next dice in queue when current one completes
  const handleDiceRollComplete = useCallback(() => {
    setIsDiceRolling(false);
    
    // Process next dice in queue after a short delay
    if (diceQueueRef.current.length > 0) {
      setTimeout(() => {
        const nextDice = diceQueueRef.current.shift();
        if (nextDice) {
          setIsDiceRolling(true);
          setDiceRollData(nextDice);
          setDiceRollTrigger(prev => prev + 1);
        }
      }, 150);
    }
  }, []);

  // Helper function to calculate attack roll
  const calculateAttackRoll = useCallback((attackerClass: DnDClass): { d20Roll: number; attackRoll: number } => {
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    // Don't trigger dice roll here - will be triggered with damage dice together
    return { d20Roll, attackRoll };
  }, []);

  // Helper function to log attack roll
  const logAttackRoll = useCallback((attackerClass: DnDClass, d20Roll: number, attackRoll: number, defenderAC: number) => {
    const bonusText = attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus} (attack bonus)` : '';
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll}${bonusText} = ${attackRoll} (needs ${defenderAC})`);
  }, [addLog]);

  // Helper function to generate narrative and update response ID
  const generateAndLogNarrative = useCallback(async (
    eventDescription: string,
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string = '',
    defenderDetails: string = ''
  ): Promise<void> => {
    setIsWaitingForAgent(true);
    try {
      const { narrative, responseId } = await getBattleNarrative(
        eventDescription,
        attackerClass,
        defenderClass,
        attackerDetails,
        defenderDetails,
        battleResponseId
      );
      setBattleResponseId(responseId);
      addLog('narrative', narrative);
    } finally {
      setIsWaitingForAgent(false);
    }
  }, [battleResponseId, addLog]);

  // Helper function to handle victory condition
  const handleVictory = useCallback(async (
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    damage: number,
    attackerDetails: string = '',
    defenderDetails: string = '',
    eventDescription: string,
    defender: 'player1' | 'player2'
  ): Promise<void> => {
    // Set the defender's HP to 0
    updatePlayerHP(defender, 0);
    // Mark the defender as defeated
    setDefeatedPlayer(defender);
    // Mark the attacker as victor
    const victor = defender === 'player1' ? 'player2' : 'player1';
    setVictorPlayer(victor);
    setConfettiTrigger(prev => prev + 1);
    await generateAndLogNarrative(
      eventDescription,
      attackerClass,
      { ...defenderClass, hitPoints: 0 },
      attackerDetails,
      defenderDetails
    );
    addLog('system', `🏆 ${attackerClass.name} wins! ${defenderClass.name} has been defeated!`);
  }, [updatePlayerHP, generateAndLogNarrative, addLog]);

  // Helper function to switch turns
  const switchTurn = useCallback((currentAttacker: 'player1' | 'player2') => {
    const nextPlayer = currentAttacker === 'player1' ? 'player2' : 'player1';
    // Don't switch to a defeated player - battle is over
    if (defeatedPlayer === nextPlayer) {
      return;
    }
    setCurrentTurn(nextPlayer);
  }, [defeatedPlayer]);

  // Load all classes from OpenRAG (called manually via button)
  const loadClassesFromOpenRAG = async () => {
    setIsLoadingClasses(true);
    addLog('system', '🚀 Starting to load classes from OpenRAG...');
    try {
      const { classNames, response: classListResponse } = await fetchAvailableClasses(addLog);
      
      if (classNames.length === 0) {
        console.warn('No classes found, using fallback classes');
        addLog('system', '⚠️ No classes found in response, using fallback classes');
        setAvailableClasses(FALLBACK_CLASSES);
        setClassesLoaded(true);
        setIsLoadingClasses(false);
        return;
      }

      addLog('system', `✅ Found ${classNames.length} classes: ${classNames.join(', ')}`);
      addLog('system', `📋 Fetching stats for ${classNames.length} classes...`);

      // Fetch stats for each class
      const classPromises = classNames.map(async (className) => {
        const { stats, response: statsResponse } = await fetchClassStats(className, addLog);
        if (stats) {
          return {
            name: className,
            hitPoints: stats.hitPoints || 25,
            maxHitPoints: stats.maxHitPoints || stats.hitPoints || 25,
            armorClass: stats.armorClass || 14,
            attackBonus: stats.attackBonus || 4,
            damageDie: stats.damageDie || 'd8',
            abilities: [],
            description: stats.description || `A ${className} character.`,
            color: CLASS_COLORS[className] || 'bg-slate-900',
          } as DnDClass;
        }
        return null;
      });

      const loadedClasses = (await Promise.all(classPromises)).filter((cls): cls is DnDClass => cls !== null);
      
      if (loadedClasses.length > 0) {
        setAvailableClasses(loadedClasses);
        addLog('system', `✅ Successfully loaded ${loadedClasses.length} classes from OpenRAG: ${loadedClasses.map(c => c.name).join(', ')}`);
        console.log(`Loaded ${loadedClasses.length} classes from OpenRAG:`, loadedClasses.map(c => c.name).join(', '));
      } else {
        console.warn('No classes could be loaded, using fallback classes');
        addLog('system', '⚠️ No classes could be loaded, using fallback classes');
        setAvailableClasses(FALLBACK_CLASSES);
      }
      setClassesLoaded(true);
    } catch (error) {
      console.error('Error loading classes:', error);
      addLog('system', `❌ Error loading classes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailableClasses(FALLBACK_CLASSES);
      setClassesLoaded(true);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const startBattle = async () => {
    if (!player1Class || !player2Class) {
      addLog('system', 'Please select both combatants!');
      return;
    }

    setIsLoadingClassDetails(true);
    addLog('system', 'Loading class abilities from knowledge base...');

    try {
      // Extract abilities directly from the knowledge base (with structured JSON)
      const [p1Abilities, p2Abilities] = await Promise.all([
        extractAbilities(player1Class.name),
        extractAbilities(player2Class.name),
      ]);
      
      // Store empty class details (we don't need the full text anymore)
      setClassDetails({
        [player1Class.name]: '',
        [player2Class.name]: '',
      });

      // Reset classes to fresh instances with updated abilities
      console.log('Setting abilities:', { 
        p1Name: player1Class.name, 
        p1Abilities: p1Abilities.length,
        p2Name: player2Class.name,
        p2Abilities: p2Abilities.length 
      });
      
      const p1 = { 
        ...player1Class, 
        hitPoints: player1Class.maxHitPoints,
        abilities: p1Abilities,
      };
      const p2 = { 
        ...player2Class, 
        hitPoints: player2Class.maxHitPoints,
        abilities: p2Abilities,
      };
      
      console.log('Updated classes:', { 
        p1Abilities: p1.abilities.length, 
        p2Abilities: p2.abilities.length 
      });
      
      setPlayer1Class(p1);
      setPlayer2Class(p2);
      
      // Ensure names are set
      if (!player1Name) {
        setPlayer1Name(generateCharacterName(p1.name));
      }
      if (!player2Name) {
        setPlayer2Name(generateCharacterName(p2.name));
      }
      
      const finalP1Name = player1Name || generateCharacterName(p1.name);
      const finalP2Name = player2Name || generateCharacterName(p2.name);
      
      setIsBattleActive(true);
      setBattleLog([]);
      setCurrentTurn('player1');
      
      // Initialize battle conversation with opening narrative
      setIsWaitingForAgent(true);
      try {
        const { narrative: openingNarrative, responseId } = await getBattleNarrative(
          `The battle begins between ${finalP1Name} (${p1.name}) and ${finalP2Name} (${p2.name}). Both combatants are at full health and ready to fight.`,
          p1,
          p2,
          '', // Class details no longer needed
          '', // Class details no longer needed
          null // Start new conversation
        );
        setBattleResponseId(responseId);
        addLog('narrative', openingNarrative);
      } finally {
        setIsWaitingForAgent(false);
      }
    } finally {
      setIsLoadingClassDetails(false);
    }
  };

  const performAttack = async (attacker: 'player1' | 'player2') => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;

    setIsMoveInProgress(true);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    // Roll attack
    const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
    logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass);

    if (attackRoll >= defenderClass.armorClass) {
      // Hit! Show both attack roll and damage dice
      const damage = rollDice(attackerClass.damageDie);
      triggerDiceRoll([
        { diceType: 'd20', result: d20Roll },
        { diceType: attackerClass.damageDie, result: damage }
      ]);
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      
      // Update the defender's HP
      const defender = attacker === 'player1' ? 'player2' : 'player1';
      updatePlayerHP(defender, newHP);
      
      // Trigger hit animation on attacker (they're happy!)
      setHittingPlayer(attacker);
      setHitTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
      
      // Trigger shake animation on defender
      setShakingPlayer(defender);
      setShakeTrigger(prev => ({ ...prev, [defender]: prev[defender] + 1 }));

      if (newHP <= 0) {
        await handleVictory(
          attackerClass,
          defenderClass,
          damage,
          attackerDetails,
          defenderDetails,
          `${attackerClass.name} attacks ${defenderClass.name} and deals ${damage} damage. ${defenderClass.name} is defeated with 0 HP remaining.`,
          defender
        );
      } else {
        await generateAndLogNarrative(
          `${attackerClass.name} attacks ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack hits! ${defenderClass.name} takes ${damage} damage and is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
          attackerClass,
          { ...defenderClass, hitPoints: newHP },
          attackerDetails,
          defenderDetails
        );
      }
    } else {
      // Miss - show the attack roll dice
      triggerDiceRoll([{ diceType: 'd20', result: d20Roll }]);
      
      // Trigger miss animation on attacker
      setMissingPlayer(attacker);
      setMissTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
      
      await generateAndLogNarrative(
        `${attackerClass.name} attacks ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
        attackerClass,
        defenderClass,
        attackerDetails,
        defenderDetails
      );
    }

    // Switch turns
    switchTurn(attacker);
    setIsMoveInProgress(false);
  };

  const useAbility = async (attacker: 'player1' | 'player2', abilityIndex: number) => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;

    setIsMoveInProgress(true);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const ability = attackerClass.abilities[abilityIndex];
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    if (!ability) return;

    addLog('roll', `✨ ${attackerClass.name} uses ${ability.name}!`);

    // Handle healing abilities
    if (ability.type === 'healing') {
      const heal = rollDiceWithNotation(ability.healingDice);
      const { dice } = parseDiceNotation(ability.healingDice);
      triggerDiceRoll([{ diceType: dice, result: heal }]);
      const newHP = Math.min(attackerClass.maxHitPoints, attackerClass.hitPoints + heal);
      
      updatePlayerHP(attacker, newHP);
      
      // Trigger sparkle animation on healer
      setSparklingPlayer(attacker);
      setSparkleTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));

      await generateAndLogNarrative(
        `${attackerClass.name} uses ${ability.name} and heals for ${heal} HP. ${attackerClass.name} is now at ${newHP}/${attackerClass.maxHitPoints} HP.`,
        attackerClass,
        defenderClass,
        attackerDetails,
        defenderDetails
      );
    } 
    // Handle attack abilities
    else if (ability.type === 'attack') {
      const attackAbility = ability as AttackAbility;
      const numAttacks = attackAbility.attacks || 1;
      
      // Handle multi-attack abilities
      if (numAttacks > 1) {
        const attackRolls: number[] = [];
        const d20Rolls: number[] = [];
        const damages: number[] = [];
        const hits: boolean[] = [];
        let totalDamage = 0;

        // Roll all attacks and collect dice for display
        const diceToShow: Array<{ diceType: string; result: number }> = [];
        
        for (let i = 0; i < numAttacks; i++) {
          const d20Roll = rollDice('d20');
          d20Rolls.push(d20Roll);
          const attackRoll = d20Roll + attackerClass.attackBonus;
          attackRolls.push(attackRoll);
          const hit = attackRoll >= defenderClass.armorClass;
          hits.push(hit);
          
          if (hit) {
            const { dice } = parseDiceNotation(attackAbility.damageDice);
            let damage = rollDiceWithNotation(attackAbility.damageDice);
            diceToShow.push({ diceType: 'd20', result: d20Roll });
            diceToShow.push({ diceType: dice, result: damage });
            
            // Add bonus damage if applicable
            if (attackAbility.bonusDamageDice) {
              const { dice: bonusDice } = parseDiceNotation(attackAbility.bonusDamageDice);
              const bonusDamage = rollDiceWithNotation(attackAbility.bonusDamageDice);
              diceToShow.push({ diceType: bonusDice, result: bonusDamage });
              damage += bonusDamage;
            }
            damages.push(damage);
            totalDamage += damage;
          } else {
            diceToShow.push({ diceType: 'd20', result: d20Roll });
            damages.push(0);
          }
        }
        
        // Show all dice at once
        if (diceToShow.length > 0) {
          triggerDiceRoll(diceToShow);
        }

        addLog('roll', `🎲 ${attackerClass.name} makes ${numAttacks} attacks: ${attackRolls.join(', ')}`);

        if (totalDamage > 0) {
          const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
          const defender = attacker === 'player1' ? 'player2' : 'player1';
          updatePlayerHP(defender, newHP);
          
          // Trigger hit animation on attacker (they're happy!)
          setHittingPlayer(attacker);
          setHitTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
          
          // Trigger shake animation on defender
          setShakingPlayer(defender);

          const hitDetails = hits.map((hit, i) => 
            hit ? `Attack ${i + 1} hits for ${damages[i]} damage.` : `Attack ${i + 1} misses.`
          ).join(' ');

          if (newHP <= 0) {
            await handleVictory(
              attackerClass,
              defenderClass,
              totalDamage,
              attackerDetails,
              defenderDetails,
              `${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. ${hitDetails} Total damage: ${totalDamage}. ${defenderClass.name} is defeated with 0 HP.`,
              defender
            );
            switchTurn(attacker);
            setIsMoveInProgress(false);
            return;
          } else {
            await generateAndLogNarrative(
              `${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. ${hitDetails} Total damage: ${totalDamage}. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
              attackerClass,
              { ...defenderClass, hitPoints: newHP },
              attackerDetails,
              defenderDetails
            );
          }
        } else {
          // All attacks missed - trigger miss animation on attacker
          setMissingPlayer(attacker);
          setMissTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
          
          await generateAndLogNarrative(
            `${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. All attacks miss. ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
            attackerClass,
            defenderClass,
            attackerDetails,
            defenderDetails
          );
        }
      }
      // Single attack with attack roll
      else if (attackAbility.attackRoll) {
        const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
        logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass);

        if (attackRoll >= defenderClass.armorClass) {
          // Hit - show both attack and damage dice
          let damage = rollDiceWithNotation(attackAbility.damageDice);
          const { dice } = parseDiceNotation(attackAbility.damageDice);
          const diceToShow: Array<{ diceType: string; result: number }> = [
            { diceType: 'd20', result: d20Roll },
            { diceType: dice, result: damage }
          ];
          
          // Add bonus damage if applicable
          if (attackAbility.bonusDamageDice) {
            const bonusDamage = rollDiceWithNotation(attackAbility.bonusDamageDice);
            const { dice: bonusDice } = parseDiceNotation(attackAbility.bonusDamageDice);
            diceToShow.push({ diceType: bonusDice, result: bonusDamage });
            damage += bonusDamage;
          }
          
          triggerDiceRoll(diceToShow);
          
          const newHP = Math.max(0, defenderClass.hitPoints - damage);
          const defender = attacker === 'player1' ? 'player2' : 'player1';
          updatePlayerHP(defender, newHP);
          
          // Trigger hit animation on attacker (they're happy!)
          setHittingPlayer(attacker);
          setHitTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
          
          // Trigger shake animation on defender
          setShakingPlayer(defender);
      
          if (newHP <= 0) {
            await handleVictory(
              attackerClass,
              defenderClass,
              damage,
              attackerDetails,
              defenderDetails,
              `${attackerClass.name} uses ${ability.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is defeated with 0 HP.`,
              defender
            );
            switchTurn(attacker);
            setIsMoveInProgress(false);
            return;
          } else {
            await generateAndLogNarrative(
              `${attackerClass.name} uses ${ability.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
              attackerClass,
              { ...defenderClass, hitPoints: newHP },
              attackerDetails,
              defenderDetails
            );
          }
        } else {
          // Miss - show the attack roll dice
          triggerDiceRoll([{ diceType: 'd20', result: d20Roll }]);
          
          // Trigger miss animation on attacker
          setMissingPlayer(attacker);
          setMissTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
          
          await generateAndLogNarrative(
            `${attackerClass.name} uses ${ability.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
            attackerClass,
            defenderClass,
            attackerDetails,
            defenderDetails
          );
        }
      }
      // Automatic damage (no attack roll, like Fireball)
      else {
        const { dice } = parseDiceNotation(attackAbility.damageDice);
        const damage = rollDiceWithNotation(attackAbility.damageDice);
        triggerDiceRoll([{ diceType: dice, result: damage }]);
        const newHP = Math.max(0, defenderClass.hitPoints - damage);
        const defender = attacker === 'player1' ? 'player2' : 'player1';
        updatePlayerHP(defender, newHP);
        
        // Trigger hit animation on attacker (they're happy!)
        setHittingPlayer(attacker);
        setHitTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
        
        // Trigger shake animation on defender
        setShakingPlayer(defender);

        if (newHP <= 0) {
          await handleVictory(
            attackerClass,
            defenderClass,
            damage,
            attackerDetails,
            defenderDetails,
            `${attackerClass.name} uses ${ability.name} and deals ${damage} damage to ${defenderClass.name}. ${defenderClass.name} is defeated with 0 HP.`,
            defender
          );
          switchTurn(attacker);
          setIsMoveInProgress(false);
          return;
        } else {
          await generateAndLogNarrative(
            `${attackerClass.name} uses ${ability.name} and deals ${damage} damage to ${defenderClass.name}. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
            attackerClass,
            { ...defenderClass, hitPoints: newHP },
            attackerDetails,
            defenderDetails
          );
        }
      }
    }

    // Switch turns
    switchTurn(attacker);
    setIsMoveInProgress(false);
  };

  // Wrapper functions to generate names when classes are selected
  const handlePlayer1Select = useCallback((dndClass: DnDClass) => {
    setPlayer1Class(dndClass);
    setPlayer1Name(generateCharacterName(dndClass.name));
  }, []);

  const handlePlayer2Select = useCallback((dndClass: DnDClass) => {
    setPlayer2Class(dndClass);
    setPlayer2Name(generateCharacterName(dndClass.name));
  }, []);

  const resetBattle = () => {
    setIsBattleActive(false);
    setBattleLog([]);
    setPlayer1Class(null);
    setPlayer2Class(null);
    setPlayer1Name('');
    setPlayer2Name('');
    setClassDetails({});
    setBattleResponseId(null);
    setIsMoveInProgress(false);
    setDefeatedPlayer(null);
    setVictorPlayer(null);
    setMissingPlayer(null);
    setMissTrigger({ player1: 0, player2: 0 });
    setHittingPlayer(null);
    setHitTrigger({ player1: 0, player2: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 text-amber-50">
      {/* Dice Roll Animation */}
      {diceRollData.length > 0 && (
        <DiceRoll
          key={diceRollTrigger}
          trigger={diceRollTrigger}
          diceRolls={diceRollData}
          onComplete={handleDiceRollComplete}
        />
      )}
      
      {/* Header */}
      <div className="border-b-4 border-amber-800 px-4 sm:px-6 py-4 bg-amber-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-100 mb-2" style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              ⚔️ D&D Battle Arena ⚔️
            </h1>
            <p className="text-sm text-amber-200 italic">
              Choose your champions and engage in epic one-on-one combat
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold rounded-lg border-2 border-amber-700 transition-all"
          >
            ← Back to Chat
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Character Selection */}
          {!isBattleActive && (
            <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
                Select Combatants
                {isLoadingClasses && (
                  <span className="ml-2 text-sm text-amber-300 italic">
                    (Loading classes from OpenRAG...)
                    <span className="waiting-indicator ml-2 inline-block">
                      <span className="waiting-dot"></span>
                      <span className="waiting-dot"></span>
                      <span className="waiting-dot"></span>
                    </span>
                  </span>
                )}
                {isLoadingClassDetails && !isLoadingClasses && (
                  <span className="ml-2 text-sm text-amber-300 italic">(Loading class information from knowledge base...)</span>
                )}
              </h2>
              {!classesLoaded && !isLoadingClasses && (
                <div className="text-center py-8 mb-4">
                  <div className="text-amber-200 mb-4">
                    Click the button below to load all available D&D classes from OpenRAG.
                    <br />
                    <span className="text-sm text-amber-300">You can also use the fallback classes shown below.</span>
                  </div>
                  <button
                    onClick={loadClassesFromOpenRAG}
                    disabled={isLoadingClasses}
                    className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg border-2 border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    {isLoadingClasses ? 'Loading...' : 'Load Classes from OpenRAG'}
                  </button>
                </div>
              )}
              {isLoadingClasses ? (
                <div className="text-center py-8">
                  <div className="text-amber-200 mb-4">Loading available D&D classes from OpenRAG...</div>
                  <div className="waiting-indicator">
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                  </div>
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClassSelection
                  title="Combatant 1"
                  availableClasses={availableClasses}
                  selectedClass={player1Class}
                  onSelect={handlePlayer1Select}
                />
                <ClassSelection
                  title="Combatant 2"
                  availableClasses={availableClasses}
                  selectedClass={player2Class}
                  onSelect={handlePlayer2Select}
                />
              </div>

                  {classesLoaded && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={loadClassesFromOpenRAG}
                        disabled={isLoadingClasses}
                        className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 text-sm font-semibold rounded-lg border-2 border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isLoadingClasses ? 'Refreshing...' : '🔄 Refresh Classes from OpenRAG'}
                      </button>
                    </div>
                  )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={startBattle}
                  disabled={!player1Class || !player2Class}
                  className="w-full py-3 px-6 bg-red-900 hover:bg-red-800 text-white font-bold text-lg rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  style={{ fontFamily: 'serif' }}
                >
                  Begin Battle! ⚔️
                </button>
                <button
                  onClick={() => {
                    // Test dice roll with various dice types
                    const testRolls = [
                      { diceType: 'd20', result: Math.floor(Math.random() * 20) + 1 },
                      { diceType: 'd10', result: Math.floor(Math.random() * 10) + 1 },
                      { diceType: 'd8', result: Math.floor(Math.random() * 8) + 1 },
                      { diceType: 'd6', result: Math.floor(Math.random() * 6) + 1 },
                    ];
                    triggerDiceRoll(testRolls);
                  }}
                  className="w-full py-2 px-4 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg border-2 border-purple-700 transition-all shadow-md"
                >
                  🎲 Test Dice Roll
                </button>
              </div>
                </>
              )}
            </div>
          )}

          {/* Battle Stats */}
          {isBattleActive && player1Class && player2Class && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlayerStats
                playerClass={player1Class}
                playerId="player1"
                currentTurn={currentTurn}
                characterName={player1Name || generateCharacterName(player1Class.name)}
                onAttack={() => performAttack('player1')}
                onUseAbility={(idx) => useAbility('player1', idx)}
                shouldShake={shakingPlayer === 'player1'}
                shouldSparkle={sparklingPlayer === 'player1'}
                shouldMiss={missingPlayer === 'player1'}
                shouldHit={hittingPlayer === 'player1'}
                shakeTrigger={shakeTrigger.player1}
                sparkleTrigger={sparkleTrigger.player1}
                missTrigger={missTrigger.player1}
                hitTrigger={hitTrigger.player1}
                isMoveInProgress={isMoveInProgress}
                isDefeated={defeatedPlayer === 'player1'}
                isVictor={victorPlayer === 'player1'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={() => setShakingPlayer(null)}
                onSparkleComplete={() => setSparklingPlayer(null)}
                onMissComplete={() => setMissingPlayer(null)}
                onHitComplete={() => setHittingPlayer(null)}
              />
              <PlayerStats
                playerClass={player2Class}
                playerId="player2"
                currentTurn={currentTurn}
                characterName={player2Name || generateCharacterName(player2Class.name)}
                onAttack={() => performAttack('player2')}
                onUseAbility={(idx) => useAbility('player2', idx)}
                shouldShake={shakingPlayer === 'player2'}
                shouldSparkle={sparklingPlayer === 'player2'}
                shouldMiss={missingPlayer === 'player2'}
                shouldHit={hittingPlayer === 'player2'}
                shakeTrigger={shakeTrigger.player2}
                sparkleTrigger={sparkleTrigger.player2}
                missTrigger={missTrigger.player2}
                hitTrigger={hitTrigger.player2}
                isMoveInProgress={isMoveInProgress}
                isDefeated={defeatedPlayer === 'player2'}
                isVictor={victorPlayer === 'player2'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={() => setShakingPlayer(null)}
                onSparkleComplete={() => setSparklingPlayer(null)}
                onMissComplete={() => setMissingPlayer(null)}
                onHitComplete={() => setHittingPlayer(null)}
              />
            </div>
          )}

          {/* Battle Log */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Battle Log 📜
            </h2>
            <div className="space-y-2 text-sm">
              {battleLog.length === 0 && (
                <div className="text-amber-400 italic">The battle log is empty...</div>
              )}
              {battleLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded ${
                    log.type === 'attack' ? 'bg-red-900/30 text-red-200 font-mono' :
                    log.type === 'ability' ? 'bg-purple-900/30 text-purple-200 font-mono' :
                    log.type === 'roll' ? 'bg-blue-900/30 text-blue-200 font-mono' :
                    log.type === 'narrative' ? 'bg-amber-800/50 text-amber-100' :
                    'bg-amber-950/50 text-amber-300 font-mono'
                  }`}
                >
                  {log.type === 'narrative' ? (
                    <div className="prose prose-invert prose-amber max-w-none text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-amber-50">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-amber-50">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-amber-50">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-amber-50">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          code: ({ children }) => <code className="bg-amber-900/50 px-1 rounded text-xs font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-amber-600 pl-2 italic">{children}</blockquote>,
                        }}
                      >
                        {log.message}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>
                      {log.message}
                      {log.type === 'system' && 
                       log.message === 'Loading class abilities from knowledge base...' && 
                       isLoadingClassDetails && (
                        <span className="waiting-indicator ml-2">
                          <span className="waiting-dot"></span>
                          <span className="waiting-dot"></span>
                          <span className="waiting-dot"></span>
                        </span>
                      )}
                    </span>
                  )}
                </div>
              ))}
              {isWaitingForAgent && (
                <div className="p-2 rounded bg-amber-800/50 text-amber-100">
                  <span className="waiting-indicator">
                    Waiting for agent response
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                  </span>
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {isBattleActive && (
            <button
              onClick={resetBattle}
              className="w-full py-2 px-4 bg-amber-800 hover:bg-amber-700 text-amber-100 font-bold rounded-lg border-2 border-amber-700 transition-all"
            >
              Reset Battle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
