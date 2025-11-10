'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Types
import { DnDClass, BattleLog, AttackAbility, CharacterEmotion, Ability } from '../dnd/types';

// Constants
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, CLASS_COLORS, FALLBACK_ABILITIES, CLASS_ICONS, MONSTER_ICONS, MONSTER_COLORS } from '../dnd/constants';

// Utilities
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../dnd/utils/dice';
import { generateCharacterName } from '../dnd/utils/names';
import { 
  isSurprisingDamage, 
  createHitVisualEffects, 
  createMissVisualEffects, 
  createHealingVisualEffects,
  getOpponent,
  buildDamageDiceArray,
  type PendingVisualEffect 
} from '../dnd/utils/battle';

// Hooks
import { useAIOpponent } from '../dnd/hooks/useAIOpponent';

// Services
import { fetchAvailableClasses, fetchClassStats, extractAbilities, getBattleNarrative, fetchAvailableMonsters, fetchMonsterStats, extractMonsterAbilities } from '../dnd/services/apiService';

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
  const [isOpponentAutoPlaying, setIsOpponentAutoPlaying] = useState(false);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [availableClasses, setAvailableClasses] = useState<DnDClass[]>(FALLBACK_CLASSES);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [availableMonsters, setAvailableMonsters] = useState<DnDClass[]>(FALLBACK_MONSTERS);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);
  const [monstersLoaded, setMonstersLoaded] = useState(false);
  const [opponentType, setOpponentType] = useState<'class' | 'monster'>('class');
  const [monsterPage, setMonsterPage] = useState(0);
  const monstersPerPage = 12;
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
  const [surprisedPlayer, setSurprisedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [surpriseTrigger, setSurpriseTrigger] = useState({ player1: 0, player2: 0 });
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const [isMoveInProgress, setIsMoveInProgress] = useState(false);
  const [defeatedPlayer, setDefeatedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [victorPlayer, setVictorPlayer] = useState<'player1' | 'player2' | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [diceRollTrigger, setDiceRollTrigger] = useState(0);
  const [diceRollData, setDiceRollData] = useState<Array<{ diceType: string; result: number }>>([]);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [manualEmotion1, setManualEmotion1] = useState<CharacterEmotion | null>(null);
  const [manualEmotion2, setManualEmotion2] = useState<CharacterEmotion | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // Queue for visual effects that should trigger after dice roll completes
  // (Type imported from battle utils)
  
  // Callback to execute after dice roll completes (for HP updates, etc.)
  type PostDiceRollCallback = () => void;
  
  // Dice queue now includes associated visual effects and callbacks
  type QueuedDiceRoll = {
    diceRolls: Array<{ diceType: string; result: number }>;
    visualEffects: PendingVisualEffect[];
    callbacks?: PostDiceRollCallback[];
  };
  const diceQueueRef = useRef<QueuedDiceRoll[]>([]);
  const currentVisualEffectsRef = useRef<PendingVisualEffect[]>([]);
  const currentCallbacksRef = useRef<PostDiceRollCallback[]>([]);

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
  // visualEffects and callbacks are queued to be applied after this dice roll completes
  const triggerDiceRoll = useCallback((
    diceRolls: Array<{ diceType: string; result: number }>,
    visualEffects: PendingVisualEffect[] = [],
    callbacks: PostDiceRollCallback[] = []
  ) => {
    if (isDiceRolling) {
      // Queue the dice rolls and their associated visual effects and callbacks if one is already in progress
      diceQueueRef.current.push({ diceRolls, visualEffects, callbacks });
      return;
    }
    
    // Store visual effects and callbacks for the current dice roll
    currentVisualEffectsRef.current = visualEffects;
    currentCallbacksRef.current = callbacks;
    setIsDiceRolling(true);
    setDiceRollData(diceRolls);
    setDiceRollTrigger(prev => prev + 1);
  }, [isDiceRolling]);
  
  // State to store intensity values for animations
  const [shakeIntensity, setShakeIntensity] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [sparkleIntensity, setSparkleIntensity] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });

  // Helper function to apply a visual effect
  const applyVisualEffect = useCallback((effect: PendingVisualEffect) => {
    switch (effect.type) {
      case 'shake':
        setShakingPlayer(effect.player);
        setShakeTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        if (effect.intensity !== undefined) {
          setShakeIntensity(prev => ({ ...prev, [effect.player]: effect.intensity! }));
        }
        break;
      case 'sparkle':
        setSparklingPlayer(effect.player);
        setSparkleTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        if (effect.intensity !== undefined) {
          setSparkleIntensity(prev => ({ ...prev, [effect.player]: effect.intensity! }));
        }
        break;
      case 'miss':
        setMissingPlayer(effect.player);
        setMissTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'hit':
        setHittingPlayer(effect.player);
        setHitTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'surprise':
        setSurprisedPlayer(effect.player);
        setSurpriseTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
    }
  }, []);

  // Process next dice in queue when current one completes
  const handleDiceRollComplete = useCallback(() => {
    setIsDiceRolling(false);
    
    // Apply visual effects associated with the dice roll that just completed
    const pendingEffects = currentVisualEffectsRef.current;
    currentVisualEffectsRef.current = []; // Clear current effects
    
    // Execute HP updates at the same time as visual effects
    const pendingCallbacks = currentCallbacksRef.current;
    currentCallbacksRef.current = []; // Clear current callbacks
    
    // Apply visual effects FIRST to ensure surprise state is set before HP update
    // Process surprise effects first, then other effects
    const surpriseEffects = pendingEffects.filter(e => e.type === 'surprise');
    const otherEffects = pendingEffects.filter(e => e.type !== 'surprise');
    
    // Apply surprise effects first and force synchronous state update
    // This ensures the surprise state is set before any HP updates
    surpriseEffects.forEach(effect => {
      flushSync(() => {
        applyVisualEffect(effect);
      });
    });
    
    // Then apply other effects (also flush to ensure state is set)
    otherEffects.forEach(effect => {
      flushSync(() => {
        applyVisualEffect(effect);
      });
    });
    
    // Use requestAnimationFrame to ensure state has propagated to DOM
    // Then execute HP updates in the next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pendingCallbacks.forEach(callback => {
          callback();
        });
      });
    });
    
    // Process next dice in queue after a short delay
    if (diceQueueRef.current.length > 0) {
      setTimeout(() => {
        const nextItem = diceQueueRef.current.shift();
        if (nextItem) {
          // Set up visual effects and callbacks for the next dice roll
          currentVisualEffectsRef.current = nextItem.visualEffects;
          currentCallbacksRef.current = nextItem.callbacks || [];
          setIsDiceRolling(true);
          setDiceRollData(nextItem.diceRolls);
          setDiceRollTrigger(prev => prev + 1);
        }
      }, 150);
    }
  }, [applyVisualEffect]);

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

  // Helper function to switch turns
  const switchTurn = useCallback((currentAttacker: 'player1' | 'player2') => {
    const nextPlayer = currentAttacker === 'player1' ? 'player2' : 'player1';
    // Don't switch to a defeated player - battle is over
    if (defeatedPlayer === nextPlayer) {
      return;
    }
    setCurrentTurn(nextPlayer);
  }, [defeatedPlayer]);

  // Helper function to handle victory condition
  // Note: HP update should happen via callback, not directly here
  const handleVictory = useCallback(async (
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    damage: number,
    attackerDetails: string = '',
    defenderDetails: string = '',
    eventDescription: string,
    defender: 'player1' | 'player2'
  ): Promise<void> => {
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
  }, [generateAndLogNarrative, addLog]);

  // Note: applyDamage and handlePostDamage helpers removed - logic now inlined with helper functions

  // Factory function to create post-damage callback (handles victory check, narrative, turn switching)
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
        await generateAndLogNarrative(
          eventDescription,
          attackerClass,
          { ...defenderClass, hitPoints: newHP },
          attackerDetails,
          defenderDetails
        );
      }
      switchTurn(attacker);
      setIsMoveInProgress(false);
    };
  }, [handleVictory, generateAndLogNarrative, switchTurn]);

  // Factory function to create post-miss callback (handles narrative, turn switching)
  const createPostMissCallback = useCallback((
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string,
    defenderDetails: string,
    eventDescription: string,
    attacker: 'player1' | 'player2'
  ) => {
    return async () => {
      await generateAndLogNarrative(
        eventDescription,
        attackerClass,
        defenderClass,
        attackerDetails,
        defenderDetails
      );
      switchTurn(attacker);
      setIsMoveInProgress(false);
    };
  }, [generateAndLogNarrative, switchTurn]);

  // Factory function to create post-healing callback (handles narrative, turn switching)
  const createPostHealingCallback = useCallback((
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string,
    defenderDetails: string,
    eventDescription: string,
    attacker: 'player1' | 'player2'
  ) => {
    return async () => {
      await generateAndLogNarrative(
        eventDescription,
        attackerClass,
        defenderClass,
        attackerDetails,
        defenderDetails
      );
      switchTurn(attacker);
      setIsMoveInProgress(false);
    };
  }, [generateAndLogNarrative, switchTurn]);

  // Memoized callback functions for PlayerStats to prevent unnecessary re-renders
  const handleShakeComplete = useCallback(() => {
    setShakingPlayer(null);
  }, []);

  const handleSparkleComplete = useCallback(() => {
    setSparklingPlayer(null);
  }, []);

  const handleMissComplete = useCallback(() => {
    setMissingPlayer(null);
  }, []);

  const handleHitComplete = useCallback(() => {
    setHittingPlayer(null);
  }, []);

  const handleSurpriseComplete = useCallback(() => {
    setSurprisedPlayer(null);
  }, []);

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

      // Create a map of fallback classes for quick lookup
      const fallbackClassMap = new Map(FALLBACK_CLASSES.map(c => [c.name, c]));
      
      // Fetch stats for each class, using fallback as default
      const classPromises = classNames.map(async (className) => {
        const fallback = fallbackClassMap.get(className);
        
        // If we have a fallback, use it as default (no need to query OpenRAG)
        if (fallback) {
          return fallback;
        }
        
        // Only query OpenRAG for classes not in our fallback list
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
      
      // Merge with fallback classes to ensure all known classes are available
      const allClasses = new Map<string, DnDClass>();
      FALLBACK_CLASSES.forEach(c => allClasses.set(c.name, c));
      loadedClasses.forEach(c => allClasses.set(c.name, c));
      
      const finalClasses = Array.from(allClasses.values());
      
      if (finalClasses.length > 0) {
        setAvailableClasses(finalClasses);
        addLog('system', `✅ Successfully loaded ${finalClasses.length} classes (${loadedClasses.length} from OpenRAG, ${FALLBACK_CLASSES.length} from defaults)`);
        console.log(`Loaded ${finalClasses.length} classes:`, finalClasses.map(c => c.name).join(', '));
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

  // Load all monsters from OpenRAG (called manually via button)
  const loadMonstersFromOpenRAG = async () => {
    setIsLoadingMonsters(true);
    addLog('system', '🚀 Starting to load monsters from OpenRAG...');
    try {
      const { monsterNames, response: monsterListResponse } = await fetchAvailableMonsters(addLog);
      
      if (monsterNames.length === 0) {
        console.warn('No monsters found, using fallback monsters');
        addLog('system', '⚠️ No monsters found in response, using fallback monsters');
        setAvailableMonsters(FALLBACK_MONSTERS);
        setMonstersLoaded(true);
        setIsLoadingMonsters(false);
        return;
      }

      addLog('system', `✅ Found ${monsterNames.length} monsters: ${monsterNames.join(', ')}`);
      addLog('system', `📋 Fetching stats for ${monsterNames.length} monsters...`);

      // Create a map of fallback monsters for quick lookup
      const fallbackMonsterMap = new Map(FALLBACK_MONSTERS.map(m => [m.name, m]));
      
      // Fetch stats for each monster, using fallback as default
      const monsterPromises = monsterNames.map(async (monsterName) => {
        const fallback = fallbackMonsterMap.get(monsterName);
        
        // If we have a fallback, use it as default (no need to query OpenRAG)
        if (fallback) {
          return fallback;
        }
        
        // Only query OpenRAG for monsters not in our fallback list
        const { stats, response: statsResponse } = await fetchMonsterStats(monsterName, addLog);
        if (stats) {
          return {
            name: monsterName,
            hitPoints: stats.hitPoints || 30,
            maxHitPoints: stats.maxHitPoints || stats.hitPoints || 30,
            armorClass: stats.armorClass || 14,
            attackBonus: stats.attackBonus || 4,
            damageDie: stats.damageDie || 'd8',
            abilities: [],
            description: stats.description || `A ${monsterName} monster.`,
            color: MONSTER_COLORS[monsterName] || 'bg-slate-900',
          } as DnDClass;
        }
        return null;
      });

      const loadedMonsters = (await Promise.all(monsterPromises)).filter((monster): monster is DnDClass => monster !== null);
      
      // Merge with fallback monsters to ensure all known monsters are available
      const allMonsters = new Map<string, DnDClass>();
      FALLBACK_MONSTERS.forEach(m => allMonsters.set(m.name, m));
      loadedMonsters.forEach(m => allMonsters.set(m.name, m));
      
      const finalMonsters = Array.from(allMonsters.values());
      
      if (finalMonsters.length > 0) {
        setAvailableMonsters(finalMonsters);
        addLog('system', `✅ Successfully loaded ${finalMonsters.length} monsters (${loadedMonsters.length} from OpenRAG, ${FALLBACK_MONSTERS.length} from defaults)`);
        console.log(`Loaded ${finalMonsters.length} monsters:`, finalMonsters.map(m => m.name).join(', '));
      } else {
        console.warn('No monsters could be loaded, using fallback monsters');
        addLog('system', '⚠️ No monsters could be loaded, using fallback monsters');
        setAvailableMonsters(FALLBACK_MONSTERS);
      }
      setMonstersLoaded(true);
    } catch (error) {
      console.error('Error loading monsters:', error);
      addLog('system', `❌ Error loading monsters: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailableMonsters(FALLBACK_MONSTERS);
      setMonstersLoaded(true);
    } finally {
      setIsLoadingMonsters(false);
    }
  };

  const startBattle = async () => {
    if (!player1Class || !player2Class) {
      addLog('system', 'Please select your character!');
      return;
    }

    // Prevent multiple clicks
    if (isLoadingClassDetails || isBattleActive) {
      return;
    }

    setIsLoadingClassDetails(true);
    addLog('system', 'Loading class abilities from knowledge base...');

    try {
      // Extract abilities directly from the knowledge base (with structured JSON)
      // Wrap in try-catch to ensure errors don't propagate - fallback abilities will be used
      let p1Abilities: Ability[] = [];
      let p2Abilities: Ability[] = [];
      
      try {
        // Use extractAbilities for player1 (always a class) and appropriate function for player2
        const p1Promise = extractAbilities(player1Class.name);
        const p2Promise = opponentType === 'monster' 
          ? extractMonsterAbilities(player2Class.name)
          : extractAbilities(player2Class.name);
        
        [p1Abilities, p2Abilities] = await Promise.all([p1Promise, p2Promise]);
      } catch (error) {
        // Silently use fallback abilities if extraction fails
        // extractAbilities should never throw, but this is a safety net
        p1Abilities = FALLBACK_ABILITIES[player1Class.name] || [];
        p2Abilities = FALLBACK_ABILITIES[player2Class.name] || [];
      }
      
      // Ensure we have abilities (fallback will be applied in extractAbilities, but double-check as safety net)
      if (!p1Abilities || p1Abilities.length === 0) {
        p1Abilities = FALLBACK_ABILITIES[player1Class.name] || [];
      }
      if (!p2Abilities || p2Abilities.length === 0) {
        p2Abilities = FALLBACK_ABILITIES[player2Class.name] || [];
      }
      
      // Store empty class details (we don't need the full text anymore)
      setClassDetails({
        [player1Class.name]: '',
        [player2Class.name]: '',
      });

      // Reset classes to fresh instances with updated abilities
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
      
      setPlayer1Class(p1);
      setPlayer2Class(p2);
      
      // Ensure names are set
      // For monsters, use the monster type name directly; for classes, generate a name
      if (!player1Name) {
        const isP1Monster = MONSTER_ICONS[p1.name] !== undefined;
        setPlayer1Name(isP1Monster ? p1.name : generateCharacterName(p1.name));
      }
      if (!player2Name) {
        const isP2Monster = MONSTER_ICONS[p2.name] !== undefined;
        setPlayer2Name(isP2Monster ? p2.name : generateCharacterName(p2.name));
      }
      
      const isP1Monster = MONSTER_ICONS[p1.name] !== undefined;
      const isP2Monster = MONSTER_ICONS[p2.name] !== undefined;
      const finalP1Name = player1Name || (isP1Monster ? p1.name : generateCharacterName(p1.name));
      const finalP2Name = player2Name || (isP2Monster ? p2.name : generateCharacterName(p2.name));
      
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
      const defender = getOpponent(attacker);
      
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      
      // Create visual effects using helper function
      const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass);
      
      triggerDiceRoll(
        [
          { diceType: 'd20', result: d20Roll },
          { diceType: attackerClass.damageDie, result: damage }
        ],
        visualEffects,
        [
          () => updatePlayerHP(defender, newHP), // HP update happens after dice roll
          createPostDamageCallback(
            newHP,
            damage,
            attackerClass,
            defenderClass,
            attackerDetails,
            defenderDetails,
            newHP <= 0
              ? `${attackerClass.name} attacks ${defenderClass.name} and deals ${damage} damage. ${defenderClass.name} is defeated with 0 HP remaining.`
              : `${attackerClass.name} attacks ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack hits! ${defenderClass.name} takes ${damage} damage and is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
            defender,
            attacker
          )
        ]
      );
    } else {
      // Miss - show the attack roll dice
      triggerDiceRoll(
        [{ diceType: 'd20', result: d20Roll }],
        createMissVisualEffects(attacker),
        [
          createPostMissCallback(
            attackerClass,
            defenderClass,
            attackerDetails,
            defenderDetails,
            `${attackerClass.name} attacks ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
            attacker
          )
        ]
      );
    }
  };

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
    const { dice } = parseDiceNotation(ability.healingDice);
    const newHP = Math.min(attackerClass.maxHitPoints, attackerClass.hitPoints + heal);
    
    triggerDiceRoll(
      [{ diceType: dice, result: heal }],
      createHealingVisualEffects(attacker, heal),
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
  }, [updatePlayerHP, createPostHealingCallback, rollDiceWithNotation, parseDiceNotation]);

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
    const diceToShow: Array<{ diceType: string; result: number }> = [];
    
    for (let i = 0; i < numAttacks; i++) {
      const d20Roll = rollDice('d20');
      d20Rolls.push(d20Roll);
      const attackRoll = d20Roll + attackerClass.attackBonus;
      attackRolls.push(attackRoll);
      const hit = attackRoll >= defenderClass.armorClass;
      hits.push(hit);
      
      if (hit) {
        diceToShow.push({ diceType: 'd20', result: d20Roll });
        const { diceArray, totalDamage: damage } = buildDamageDiceArray(
          attackAbility.damageDice,
          rollDiceWithNotation,
          parseDiceNotation,
          attackAbility.bonusDamageDice
        );
        diceToShow.push(...diceArray);
        damages.push(damage);
        totalDamage += damage;
      } else {
        diceToShow.push({ diceType: 'd20', result: d20Roll });
        damages.push(0);
      }
    }
    
    const defender = getOpponent(attacker);
    const newHP = totalDamage > 0 ? Math.max(0, defenderClass.hitPoints - totalDamage) : defenderClass.hitPoints;
    
    if (diceToShow.length === 0) return;
    
    const hitDetails = totalDamage > 0 ? hits.map((hit, i) => 
      hit ? `Attack ${i + 1} hits for ${damages[i]} damage.` : `Attack ${i + 1} misses.`
    ).join(' ') : '';

    if (totalDamage > 0) {
      const visualEffects = createHitVisualEffects(attacker, defender, totalDamage, defenderClass);
      triggerDiceRoll(
        diceToShow,
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
    } else {
      triggerDiceRoll(
        diceToShow,
        createMissVisualEffects(attacker),
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
    }
  }, [updatePlayerHP, createPostDamageCallback, createPostMissCallback, addLog, rollDice, rollDiceWithNotation, parseDiceNotation, buildDamageDiceArray, createHitVisualEffects, createMissVisualEffects, getOpponent]);

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

    if (attackRoll >= defenderClass.armorClass) {
      const { diceArray, totalDamage: damage } = buildDamageDiceArray(
        attackAbility.damageDice,
        rollDiceWithNotation,
        parseDiceNotation,
        attackAbility.bonusDamageDice
      );
      const diceToShow: Array<{ diceType: string; result: number }> = [
        { diceType: 'd20', result: d20Roll },
        ...diceArray
      ];
      
      const defender = getOpponent(attacker);
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass);
      
      triggerDiceRoll(
        diceToShow,
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
    } else {
      triggerDiceRoll(
        [{ diceType: 'd20', result: d20Roll }],
        createMissVisualEffects(attacker),
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
    }
  }, [calculateAttackRoll, logAttackRoll, updatePlayerHP, createPostDamageCallback, createPostMissCallback, rollDiceWithNotation, parseDiceNotation, buildDamageDiceArray, createHitVisualEffects, createMissVisualEffects, getOpponent, triggerDiceRoll]);

  // Helper function to handle automatic damage abilities
  const handleAutomaticDamageAbility = useCallback(async (
    attacker: 'player1' | 'player2',
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackAbility: AttackAbility,
    attackerDetails: string,
    defenderDetails: string
  ) => {
    const { diceArray, totalDamage: damage } = buildDamageDiceArray(
      attackAbility.damageDice,
      rollDiceWithNotation,
      parseDiceNotation,
      attackAbility.bonusDamageDice
    );
    const defender = getOpponent(attacker);
    const newHP = Math.max(0, defenderClass.hitPoints - damage);
    const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass);
    
    triggerDiceRoll(
      diceArray,
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
  }, [updatePlayerHP, createPostDamageCallback, rollDiceWithNotation, parseDiceNotation, buildDamageDiceArray, createHitVisualEffects, getOpponent, triggerDiceRoll]);

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

    // Route to appropriate handler based on ability type
    if (ability.type === 'healing') {
      await handleHealingAbility(attacker, attackerClass, defenderClass, ability, attackerDetails, defenderDetails);
      return;
    } else if (ability.type === 'attack') {
      const attackAbility = ability as AttackAbility;
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
  };

  // Wrapper function to generate name when player selects their class
  // Also auto-selects a random opponent based on opponentType
  const handlePlayer1Select = useCallback((dndClass: DnDClass) => {
    setPlayer1Class(dndClass);
    setPlayer1Name(generateCharacterName(dndClass.name));
    
    // Auto-select a random opponent based on opponentType
    if (opponentType === 'monster') {
      const availableOpponents = availableMonsters;
      if (availableOpponents.length > 0) {
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        setPlayer2Class(randomOpponent);
        setPlayer2Name(randomOpponent.name); // Monsters use their type name directly
      }
    } else {
      // Auto-select a random opponent that's different from the player's class
      const availableOpponents = availableClasses.filter(cls => cls.name !== dndClass.name);
      if (availableOpponents.length > 0) {
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        setPlayer2Class(randomOpponent);
        setPlayer2Name(generateCharacterName(randomOpponent.name));
      } else {
        // Fallback: if no other classes available, use a fallback class
        const fallbackOpponent = availableClasses[0];
        if (fallbackOpponent) {
          setPlayer2Class(fallbackOpponent);
          setPlayer2Name(generateCharacterName(fallbackOpponent.name));
        }
      }
    }
  }, [availableClasses, availableMonsters, opponentType]);

  // Use AI opponent hook
  const aiOpponentCleanup = useAIOpponent({
    isActive: isBattleActive,
    currentTurn,
    isMoveInProgress,
    defeatedPlayer,
    opponentClass: player2Class,
    callbacks: {
      onAttack: () => performAttack('player2'),
      onUseAbility: (abilityIndex: number) => useAbility('player2', abilityIndex),
    },
    onStateChange: setIsOpponentAutoPlaying,
    onMoveInProgressChange: setIsMoveInProgress,
  });

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
    setSurprisedPlayer(null);
    setSurpriseTrigger({ player1: 0, player2: 0 });
    setManualEmotion1(null);
    setManualEmotion2(null);
    setIsOpponentAutoPlaying(false);
    aiOpponentCleanup.cleanup();
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
              Choose your character and battle against an AI opponent
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
                Select Your Character
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
              {(!classesLoaded && !isLoadingClasses) || (!monstersLoaded && !isLoadingMonsters) ? (
                <div className="text-center py-8 mb-4">
                  <div className="text-amber-200 mb-4">
                    Click the buttons below to load D&D classes and monsters from OpenRAG.
                    <br />
                    <span className="text-sm text-amber-300">You can also use the fallback classes shown below.</span>
                  </div>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <button
                      onClick={loadClassesFromOpenRAG}
                      disabled={isLoadingClasses}
                      className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg border-2 border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isLoadingClasses ? 'Loading...' : 'Load Classes from OpenRAG'}
                    </button>
                    <button
                      onClick={loadMonstersFromOpenRAG}
                      disabled={isLoadingMonsters}
                      className="px-6 py-3 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isLoadingMonsters ? 'Loading...' : 'Load Monsters from OpenRAG'}
                    </button>
                  </div>
                </div>
              ) : null}
              {(isLoadingClasses || isLoadingMonsters) ? (
                <div className="text-center py-8">
                  <div className="text-amber-200 mb-4">
                    {isLoadingClasses && 'Loading available D&D classes from OpenRAG...'}
                    {isLoadingMonsters && 'Loading available D&D monsters from OpenRAG...'}
                  </div>
                  <div className="waiting-indicator">
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                  </div>
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 gap-4">
                <ClassSelection
                  title="Choose Your Character"
                  availableClasses={availableClasses}
                  selectedClass={player1Class}
                  onSelect={handlePlayer1Select}
                />
                <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-amber-200">Opponent (Auto-Play)</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setOpponentType('class');
                          setPlayer2Class(null);
                          setPlayer2Name('');
                        }}
                        className={`px-3 py-1 text-xs rounded border transition-all ${
                          opponentType === 'class'
                            ? 'bg-blue-800 text-white border-blue-600'
                            : 'bg-amber-800/50 text-amber-300 border-amber-700 hover:bg-amber-700'
                        }`}
                      >
                        Class
                      </button>
                      <button
                      onClick={() => {
                        setOpponentType('monster');
                        setMonsterPage(0);
                        setPlayer2Class(null);
                        setPlayer2Name('');
                      }}
                        className={`px-3 py-1 text-xs rounded border transition-all ${
                          opponentType === 'monster'
                            ? 'bg-red-800 text-white border-red-600'
                            : 'bg-amber-800/50 text-amber-300 border-amber-700 hover:bg-amber-700'
                        }`}
                      >
                        Monster
                      </button>
                    </div>
                  </div>
                  {player2Class && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl" style={{ imageRendering: 'pixelated' as const }}>
                        {opponentType === 'monster' 
                          ? (MONSTER_ICONS[player2Class.name] || '👹')
                          : (CLASS_ICONS[player2Class.name] || '⚔️')}
                      </span>
                      <div>
                        <div className="font-bold text-amber-100">{player2Name || player2Class.name}</div>
                        <div className="text-sm text-amber-300 italic">{player2Class.name}</div>
                      </div>
                    </div>
                  )}
                  {opponentType === 'monster' ? (
                    availableMonsters.length > 0 ? (
                      <div className="mt-3">
                        <h3 className="text-lg font-semibold mb-3 text-amber-200">Select Monster Opponent</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3">
                          {availableMonsters.slice(monsterPage * monstersPerPage, (monsterPage + 1) * monstersPerPage).map((monster) => {
                            const icon = MONSTER_ICONS[monster.name] || '👹';
                            return (
                              <button
                                key={monster.name}
                                onClick={() => {
                                  setPlayer2Class(monster);
                                  setPlayer2Name(monster.name); // Monsters use their type name directly
                                }}
                                className={`py-2 px-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                                  player2Class?.name === monster.name
                                    ? 'border-amber-400 bg-amber-800 shadow-lg scale-105'
                                    : 'border-amber-700 bg-amber-900/50 hover:bg-amber-800 hover:border-amber-600'
                                }`}
                              >
                                <span 
                                  className="text-2xl leading-none"
                                  style={{ 
                                    imageRendering: 'pixelated' as const,
                                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'
                                  }}
                                >
                                  {icon}
                                </span>
                                <div className="font-bold text-xs text-amber-100 text-center">{monster.name}</div>
                              </button>
                            );
                          })}
                        </div>
                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={() => setMonsterPage(prev => Math.max(0, prev - 1))}
                            disabled={monsterPage === 0}
                            className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-sm rounded border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            ← Previous
                          </button>
                          <span className="text-amber-300 text-sm">
                            Page {monsterPage + 1} of {Math.ceil(availableMonsters.length / monstersPerPage)}
                          </span>
                          <button
                            onClick={() => setMonsterPage(prev => Math.min(Math.ceil(availableMonsters.length / monstersPerPage) - 1, prev + 1))}
                            disabled={monsterPage >= Math.ceil(availableMonsters.length / monstersPerPage) - 1}
                            className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-sm rounded border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-amber-300 text-sm italic text-center py-4">
                        {monstersLoaded ? 'No monsters available. Click "Load Monsters from OpenRAG" to load monsters.' : 'Click "Load Monsters from OpenRAG" to load monsters.'}
                      </div>
                    )
                  ) : (
                    <div className="mt-3">
                      <ClassSelection
                        title="Select Class Opponent"
                        availableClasses={availableClasses}
                        selectedClass={player2Class}
                        onSelect={(cls) => {
                          setPlayer2Class(cls);
                          setPlayer2Name(generateCharacterName(cls.name));
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

                  {(classesLoaded || monstersLoaded) && (
                    <div className="mt-4 text-center flex gap-2 justify-center flex-wrap">
                      {classesLoaded && (
                        <button
                          onClick={loadClassesFromOpenRAG}
                          disabled={isLoadingClasses}
                          className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 text-sm font-semibold rounded-lg border-2 border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isLoadingClasses ? 'Refreshing...' : '🔄 Refresh Classes'}
                        </button>
                      )}
                      {monstersLoaded && (
                        <button
                          onClick={loadMonstersFromOpenRAG}
                          disabled={isLoadingMonsters}
                          className="px-4 py-2 bg-red-800 hover:bg-red-700 text-amber-100 text-sm font-semibold rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isLoadingMonsters ? 'Refreshing...' : '🔄 Refresh Monsters'}
                        </button>
                      )}
                    </div>
                  )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={startBattle}
                  disabled={!player1Class || !player2Class || isLoadingClassDetails || isBattleActive}
                  className="w-full py-3 px-6 bg-red-900 hover:bg-red-800 text-white font-bold text-lg rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  style={{ fontFamily: 'serif' }}
                >
                  {isLoadingClassDetails ? 'Starting Battle...' : 'Begin Battle! ⚔️'}
                </button>
                {player1Class && !player2Class && (
                  <p className="text-sm text-amber-300 text-center italic">
                    Select your character to automatically assign an opponent
                  </p>
                )}
                <button
                  onClick={() => router.push('/dnd/test')}
                  className="w-full py-2 px-4 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg border-2 border-purple-700 transition-all shadow-md"
                >
                  🧪 Test Game
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
                characterName={player1Name || 'Loading...'}
                onAttack={() => performAttack('player1')}
                onUseAbility={(idx) => useAbility('player1', idx)}
                shouldShake={shakingPlayer === 'player1'}
                shouldSparkle={sparklingPlayer === 'player1'}
                shouldMiss={missingPlayer === 'player1'}
                shouldHit={hittingPlayer === 'player1'}
                shouldSurprise={surprisedPlayer === 'player1'}
                shakeTrigger={shakeTrigger.player1}
                sparkleTrigger={sparkleTrigger.player1}
                missTrigger={missTrigger.player1}
                hitTrigger={hitTrigger.player1}
                surpriseTrigger={surpriseTrigger.player1}
                shakeIntensity={shakeIntensity.player1}
                sparkleIntensity={sparkleIntensity.player1}
                isMoveInProgress={isMoveInProgress}
                isDefeated={defeatedPlayer === 'player1'}
                isVictor={victorPlayer === 'player1'}
                confettiTrigger={confettiTrigger}
                emotion={manualEmotion1 || undefined}
                onShakeComplete={handleShakeComplete}
                onSparkleComplete={handleSparkleComplete}
                onMissComplete={handleMissComplete}
                onHitComplete={handleHitComplete}
                onSurpriseComplete={handleSurpriseComplete}
              />
              <PlayerStats
                playerClass={player2Class}
                playerId="player2"
                currentTurn={currentTurn}
                characterName={player2Name || 'Loading...'}
                onAttack={undefined}
                onUseAbility={(idx) => useAbility('player2', idx)}
                shouldShake={shakingPlayer === 'player2'}
                shouldSparkle={sparklingPlayer === 'player2'}
                shouldMiss={missingPlayer === 'player2'}
                shouldHit={hittingPlayer === 'player2'}
                shouldSurprise={surprisedPlayer === 'player2'}
                shakeTrigger={shakeTrigger.player2}
                sparkleTrigger={sparkleTrigger.player2}
                missTrigger={missTrigger.player2}
                hitTrigger={hitTrigger.player2}
                surpriseTrigger={surpriseTrigger.player2}
                isMoveInProgress={isMoveInProgress}
                isDefeated={defeatedPlayer === 'player2'}
                isVictor={victorPlayer === 'player2'}
                confettiTrigger={confettiTrigger}
                emotion={manualEmotion2 || undefined}
                onShakeComplete={handleShakeComplete}
                onSparkleComplete={handleSparkleComplete}
                onMissComplete={handleMissComplete}
                onHitComplete={handleHitComplete}
                onSurpriseComplete={handleSurpriseComplete}
                isOpponent={true}
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
