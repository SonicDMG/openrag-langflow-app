'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Types
import { DnDClass, BattleLog, AttackAbility, Ability } from '../dnd/types';

// Constants
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, CLASS_COLORS, FALLBACK_ABILITIES, MONSTER_ICONS, MONSTER_COLORS, selectRandomAbilities, FALLBACK_MONSTER_ABILITIES } from '../dnd/constants';

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
import { CharacterCard } from '../dnd/components/CharacterCard';

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
  const [createdMonsters, setCreatedMonsters] = useState<Array<DnDClass & { monsterId: string; imageUrl: string }>>([]);
  const [isLoadingCreatedMonsters, setIsLoadingCreatedMonsters] = useState(false);
  const [player1MonsterId, setPlayer1MonsterId] = useState<string | null>(null);
  const [player2MonsterId, setPlayer2MonsterId] = useState<string | null>(null);
  const [opponentType, setOpponentType] = useState<'class' | 'monster'>('class');
  const monsterScrollRef = useRef<HTMLDivElement>(null);
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
  const [castingPlayer, setCastingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [castTrigger, setCastTrigger] = useState({ player1: 0, player2: 0 });
  
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
  const battleCardsRef = useRef<HTMLDivElement>(null);
  const battleLogRef = useRef<HTMLDivElement>(null);


  // Load created monsters on mount
  useEffect(() => {
    const loadCreatedMonsters = async () => {
      setIsLoadingCreatedMonsters(true);
      try {
        const response = await fetch('/api/monsters');
        if (response.ok) {
          const data = await response.json();
          // Convert created monsters to DnDClass format
          const convertedMonsters = data.monsters.map((m: any) => {
            // Find matching class/monster from fallbacks to get stats and abilities
            const fallbackClass = FALLBACK_CLASSES.find(c => c.name === m.klass);
            const fallbackMonster = FALLBACK_MONSTERS.find(m2 => m2.name === m.klass);
            const fallback = fallbackClass || fallbackMonster;
            
            return {
              name: m.klass,
              hitPoints: m.stats?.hitPoints || fallback?.hitPoints || 30,
              maxHitPoints: m.stats?.maxHitPoints || m.stats?.hitPoints || fallback?.maxHitPoints || 30,
              armorClass: m.stats?.armorClass || fallback?.armorClass || 14,
              attackBonus: m.stats?.attackBonus || fallback?.attackBonus || 4,
              damageDie: m.stats?.damageDie || fallback?.damageDie || 'd8',
              abilities: fallback?.abilities || [],
              description: m.stats?.description || fallback?.description || `A ${m.klass} created in the monster creator.`,
              color: fallback?.color || 'bg-slate-900',
              monsterId: m.monsterId,
              imageUrl: m.imageUrl?.replace('/256.png', '/280x200.png').replace('/200.png', '/280x200.png') || m.imageUrl,
            } as DnDClass & { monsterId: string; imageUrl: string };
          });
          setCreatedMonsters(convertedMonsters);
        }
      } catch (error) {
        console.error('Failed to load created monsters:', error);
      } finally {
        setIsLoadingCreatedMonsters(false);
      }
    };
    loadCreatedMonsters();
  }, []);

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

  // Helper to find associated monster for a class/monster type
  const findAssociatedMonster = useCallback((className: string): (DnDClass & { monsterId: string; imageUrl: string }) | null => {
    // Find the most recently created monster associated with this class/monster type
    const associated = createdMonsters
      .filter(m => m.name === className)
      .sort((a, b) => {
        // Sort by monsterId (UUIDs) - most recent first (assuming newer UUIDs are later in sort)
        return b.monsterId.localeCompare(a.monsterId);
      });
    return associated.length > 0 ? associated[0] : null;
  }, [createdMonsters]);

  // Update monster IDs when createdMonsters loads or changes, if players already have classes selected
  useEffect(() => {
    if (player1Class && !player1MonsterId) {
      const associatedMonster = findAssociatedMonster(player1Class.name);
      if (associatedMonster) {
        setPlayer1MonsterId(associatedMonster.monsterId);
      }
    }
    if (player2Class && !player2MonsterId) {
      const associatedMonster = findAssociatedMonster(player2Class.name);
      if (associatedMonster) {
        setPlayer2MonsterId(associatedMonster.monsterId);
      }
    }
  }, [createdMonsters, player1Class, player2Class, player1MonsterId, player2MonsterId, findAssociatedMonster]);

  // Helper to set a player's class and automatically find associated monster
  const setPlayerClassWithMonster = useCallback((
    player: 'player1' | 'player2',
    dndClass: DnDClass & { monsterId?: string; imageUrl?: string },
    name?: string
  ) => {
    const setName = player === 'player1' ? setPlayer1Name : setPlayer2Name;
    const setClass = player === 'player1' ? setPlayer1Class : setPlayer2Class;
    const setMonsterId = player === 'player1' ? setPlayer1MonsterId : setPlayer2MonsterId;
    
    setClass(dndClass);
    
    // Set name if provided, otherwise generate it
    if (name) {
      setName(name);
    } else {
      const isMonster = MONSTER_ICONS[dndClass.name] !== undefined;
      setName(isMonster ? dndClass.name : generateCharacterName(dndClass.name));
    }
    
    // Check if this entity already has a monsterId (explicitly selected created monster)
    if (dndClass.monsterId) {
      setMonsterId(dndClass.monsterId);
    } else {
      // Otherwise, check if there's an associated monster for this class/monster type
      const associatedMonster = findAssociatedMonster(dndClass.name);
      if (associatedMonster) {
        setMonsterId(associatedMonster.monsterId);
      } else {
        setMonsterId(null);
      }
    }
  }, [findAssociatedMonster]);

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
      case 'cast':
        setCastingPlayer(effect.player);
        setCastTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
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

  // Memoized callback functions for animation completion to prevent unnecessary re-renders
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

  const handleCastComplete = useCallback(() => {
    setCastingPlayer(null);
  }, []);

  // Load all classes from OpenRAG (called manually via button)
  const loadClassesFromOpenRAG = async () => {
    setIsLoadingClasses(true);
    addLog('system', '🚀 Starting to load classes from OpenRAG...');
    try {
      const { classNames } = await fetchAvailableClasses(addLog);
      
      if (classNames.length === 0) {
        console.warn('No classes found, using fallback classes');
        addLog('system', '⚠️ No classes found in response, using fallback classes');
        setAvailableClasses(FALLBACK_CLASSES);
        setClassesLoaded(true);
        setIsLoadingClasses(false);
        return;
      }

      addLog('system', `✅ Found ${classNames.length} classes: ${classNames.join(', ')}`);
      addLog('system', `📋 Fetching stats and abilities for ${classNames.length} classes...`);

      // Create a map of fallback classes for quick lookup
      const fallbackClassMap = new Map(FALLBACK_CLASSES.map(c => [c.name, c]));
      
      // Fetch stats and abilities for each class, using fallback as default
      const classPromises = classNames.map(async (className) => {
        const fallback = fallbackClassMap.get(className);
        
        // Fetch abilities from OpenRAG for this class
        let abilities: Ability[] = [];
        try {
          abilities = await extractAbilities(className);
        } catch (error) {
          console.warn(`Failed to load abilities for ${className}, using fallback:`, error);
          abilities = fallback?.abilities || FALLBACK_ABILITIES[className] || [];
        }
        
        // If we have a fallback, use it as base but update with OpenRAG abilities if loaded
        if (fallback) {
          return {
            ...fallback,
            abilities: abilities.length > 0 ? abilities : fallback.abilities,
          };
        }
        
        // Only query OpenRAG for classes not in our fallback list
        const { stats } = await fetchClassStats(className, addLog);
        if (stats) {
          return {
            name: className,
            hitPoints: stats.hitPoints || 25,
            maxHitPoints: stats.maxHitPoints || stats.hitPoints || 25,
            armorClass: stats.armorClass || 14,
            attackBonus: stats.attackBonus || 4,
            damageDie: stats.damageDie || 'd8',
            abilities: abilities,
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
      const { monsterNames } = await fetchAvailableMonsters(addLog);
      
      if (monsterNames.length === 0) {
        console.warn('No monsters found, using fallback monsters');
        addLog('system', '⚠️ No monsters found in response, using fallback monsters');
        setAvailableMonsters(FALLBACK_MONSTERS);
        setMonstersLoaded(true);
        setIsLoadingMonsters(false);
        return;
      }

      addLog('system', `✅ Found ${monsterNames.length} monsters: ${monsterNames.join(', ')}`);
      addLog('system', `📋 Fetching stats and abilities for ${monsterNames.length} monsters...`);

      // Create a map of fallback monsters for quick lookup
      const fallbackMonsterMap = new Map(FALLBACK_MONSTERS.map(m => [m.name, m]));
      
      // Fetch stats and abilities for each monster, using fallback as default
      const monsterPromises = monsterNames.map(async (monsterName) => {
        const fallback = fallbackMonsterMap.get(monsterName);
        
        // Fetch abilities from OpenRAG for this monster
        let abilities: Ability[] = [];
        try {
          abilities = await extractMonsterAbilities(monsterName);
        } catch (error) {
          console.warn(`Failed to load abilities for ${monsterName}, using fallback:`, error);
          abilities = fallback?.abilities || FALLBACK_MONSTER_ABILITIES[monsterName] || [];
        }
        
        // If we have a fallback, use it as base but update with OpenRAG abilities if loaded
        if (fallback) {
          return {
            ...fallback,
            abilities: abilities.length > 0 ? abilities : fallback.abilities,
          };
        }
        
        // Only query OpenRAG for monsters not in our fallback list
        const { stats } = await fetchMonsterStats(monsterName, addLog);
        if (stats) {
          return {
            name: monsterName,
            hitPoints: stats.hitPoints || 30,
            maxHitPoints: stats.maxHitPoints || stats.hitPoints || 30,
            armorClass: stats.armorClass || 14,
            attackBonus: stats.attackBonus || 4,
            damageDie: stats.damageDie || 'd8',
            abilities: abilities,
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

    try {
      // Use default abilities from the class/monster and randomly select 5 for this battle
      // This avoids loading from OpenRAG on every battle start
      const p1IsMonster = MONSTER_ICONS[player1Class.name] !== undefined;
      const p2IsMonster = MONSTER_ICONS[player2Class.name] !== undefined;
      const p1AvailableAbilities = player1Class.abilities || (p1IsMonster ? FALLBACK_MONSTER_ABILITIES[player1Class.name] : FALLBACK_ABILITIES[player1Class.name]) || [];
      const p2AvailableAbilities = player2Class.abilities || (p2IsMonster ? FALLBACK_MONSTER_ABILITIES[player2Class.name] : FALLBACK_ABILITIES[player2Class.name]) || [];
      
      // Randomly select 5 abilities from available ones
      const p1Abilities = selectRandomAbilities(p1AvailableAbilities);
      const p2Abilities = selectRandomAbilities(p2AvailableAbilities);
      
      // Store empty class details (we don't need the full text anymore)
      setClassDetails({
        [player1Class.name]: '',
        [player2Class.name]: '',
      });

      // Reset classes to fresh instances with randomly selected abilities
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
      // Use helper to set player2 class with automatic monster association
      setPlayerClassWithMonster('player2', p2);
      
      // Ensure names are set for player1
      // For monsters, use the monster type name directly; for classes, generate a name
      if (!player1Name) {
        const isP1Monster = MONSTER_ICONS[p1.name] !== undefined;
        setPlayer1Name(isP1Monster ? p1.name : generateCharacterName(p1.name));
        // Also check for associated monster for player1
        const associatedMonster = findAssociatedMonster(p1.name);
        if (associatedMonster) {
          setPlayer1MonsterId(associatedMonster.monsterId);
        }
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
      
      // Create visual effects using helper function (includes cast effect for wizards)
      const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass);
      
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
        createMissVisualEffects(attacker, attackerClass),
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
      const visualEffects = createHitVisualEffects(attacker, defender, totalDamage, defenderClass, attackerClass);
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
      const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass);
      
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
    const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass);
    
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
  const handlePlayer1Select = useCallback((dndClass: DnDClass & { monsterId?: string; imageUrl?: string }) => {
    setPlayerClassWithMonster('player1', dndClass);
    
    // Auto-select a random opponent based on opponentType
    if (opponentType === 'monster') {
      const availableOpponents = availableMonsters;
      if (availableOpponents.length > 0) {
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        setPlayerClassWithMonster('player2', randomOpponent, randomOpponent.name);
      }
    } else {
      // Auto-select a random opponent that's different from the player's class
      const availableOpponents = availableClasses.filter(cls => cls.name !== dndClass.name);
      if (availableOpponents.length > 0) {
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        setPlayerClassWithMonster('player2', randomOpponent);
      } else {
        // Fallback: if no other classes available, use a fallback class
        const fallbackOpponent = availableClasses[0];
        if (fallbackOpponent) {
          setPlayerClassWithMonster('player2', fallbackOpponent);
        }
      }
    }
  }, [availableClasses, availableMonsters, opponentType, setPlayerClassWithMonster]);

  // Function to trigger drop animation manually (for testing)
  const triggerDropAnimation = useCallback(() => {
    const triggerAnimation = () => {
      if (battleCardsRef.current && battleLogRef.current) {
        // Remove any existing animation classes first
        battleCardsRef.current.classList.remove('battle-drop');
        battleLogRef.current.classList.remove('battle-log-drop');
        
        // Force reflow to restart animation
        void battleCardsRef.current.offsetWidth;
        void battleLogRef.current.offsetWidth;
        
        // Apply animation classes
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (battleCardsRef.current) {
              battleCardsRef.current.classList.add('battle-drop');
            }
            if (battleLogRef.current) {
              battleLogRef.current.classList.add('battle-log-drop');
            }
          });
        });
      } else {
        // If elements aren't ready yet, try again on next frame
        requestAnimationFrame(triggerAnimation);
      }
    };
    
    // Start the animation trigger
    requestAnimationFrame(triggerAnimation);
  }, []);

  // Trigger drop animation when battle starts
  useEffect(() => {
    if (!isBattleActive) return;
    triggerDropAnimation();
  }, [isBattleActive, triggerDropAnimation]);

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
    setPlayer1MonsterId(null);
    setPlayer2MonsterId(null);
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
    setCastingPlayer(null);
    setCastTrigger({ player1: 0, player2: 0 });
    setIsOpponentAutoPlaying(false);
    aiOpponentCleanup.cleanup();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D1C9BA' }}>
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
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Home Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-semibold">Home</span>
          </button>

          {/* Center Title with Dragon Emblem */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              Battle
            </h1>
            {/* Red Dragon/Phoenix Emblem */}
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8 2 5 5 5 9c0 2 1 4 3 5-1 1-2 3-2 5 0 3 2 5 5 5 1 0 2 0 3-1 1 1 2 1 3 1 3 0 5-2 5-5 0-2-1-4-2-5 2-1 3-3 3-5 0-4-3-7-7-7z"
                fill="#DC2626"
              />
              <path
                d="M12 4c-2 0-4 1-4 3 0 1 1 2 2 2 1 0 2-1 2-2 0-1 1-1 2-1 1 0 2 0 2 1 0 1 1 2 2 2 1 0 2-1 2-2 0-2-2-3-4-3z"
                fill="#EF4444"
              />
              <path
                d="M10 8c-1 0-2 1-2 2 0 1 1 2 2 2 1 0 2-1 2-2 0-1-1-2-2-2zm4 0c-1 0-2 1-2 2 0 1 1 2 2 2 1 0 2-1 2-2 0-1-1-2-2-2z"
                fill="#991B1B"
              />
            </svg>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              Arena
            </h1>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetBattle}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold">Reset</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-0">
        <div className="space-y-6 overflow-visible">
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
                  createdMonsters={createdMonsters}
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
                          setPlayer2MonsterId(null);
                          // Note: We don't use setPlayerClassWithMonster here since we're clearing the selection
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
                        setPlayer2Class(null);
                        setPlayer2Name('');
                        setPlayer2MonsterId(null);
                        // Note: We don't use setPlayerClassWithMonster here since we're clearing the selection
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
                      {(() => {
                        const associatedMonster = findAssociatedMonster(player2Class.name);
                        const imageUrl = associatedMonster 
                          ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                          : '/cdn/placeholder.png';
                        return (
                          <img
                            src={imageUrl}
                            alt={player2Class.name}
                            className="w-12 h-12 object-cover rounded"
                            style={{ imageRendering: 'pixelated' as const }}
                          />
                        );
                      })()}
                      <div>
                        <div className="font-bold text-amber-100">{player2Name || player2Class.name}</div>
                        <div className="text-sm text-amber-300 italic">{player2Class.name}</div>
                      </div>
                    </div>
                  )}
                  {opponentType === 'monster' ? (
                    <>
                      {/* Standard Monsters */}
                      {availableMonsters.length > 0 ? (
                        <div className="mt-3">
                          <h3 className="text-lg font-semibold mb-3 text-amber-200">Select Monster Opponent</h3>
                          <div className="relative">
                            {/* Left scroll button */}
                            <button
                              onClick={() => {
                                if (monsterScrollRef.current) {
                                  monsterScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' }); // Scaled for compact cards
                                }
                              }}
                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
                              aria-label="Scroll left"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>

                            {/* Scrollable container */}
                            <div
                              ref={monsterScrollRef}
                              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-10"
                              style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                              }}
                            >
                              {availableMonsters.map((monster) => {
                                const associatedMonster = findAssociatedMonster(monster.name);
                                const monsterImageUrl = associatedMonster 
                                  ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                                  : undefined;
                                
                                const isSelected = player2Class?.name === monster.name;
                                
                                return (
                                  <div
                                    key={monster.name}
                                    onClick={() => {
                                      setPlayerClassWithMonster('player2', monster, monster.name);
                                    }}
                                    className={`flex-shrink-0 cursor-pointer transition-all ${
                                      isSelected
                                        ? 'ring-4 ring-amber-400 shadow-2xl'
                                        : 'hover:shadow-lg'
                                    }`}
                                    style={{
                                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                                      padding: '4px', // Add padding to accommodate zoom without overflow
                                    }}
                                  >
                                    <CharacterCard
                                      playerClass={{ ...monster, hitPoints: monster.maxHitPoints }}
                                      characterName={monster.name}
                                      monsterImageUrl={monsterImageUrl}
                                      size="compact"
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            {/* Right scroll button */}
                            <button
                              onClick={() => {
                                if (monsterScrollRef.current) {
                                  monsterScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' }); // Scaled for compact cards
                                }
                              }}
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
                              aria-label="Scroll right"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-amber-300 text-sm italic text-center py-4">
                          {monstersLoaded ? 'No monsters available. Click "Load Monsters from OpenRAG" to load monsters.' : 'Click "Load Monsters from OpenRAG" to load monsters.'}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-3">
                      <ClassSelection
                        title="Select Class Opponent"
                        availableClasses={availableClasses}
                        selectedClass={player2Class}
                        onSelect={(cls) => {
                          setPlayerClassWithMonster('player2', cls);
                        }}
                        createdMonsters={createdMonsters}
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push('/dnd/test')}
                    className="w-full py-2 px-4 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg border-2 border-purple-700 transition-all shadow-md"
                  >
                    🧪 Test Game
                  </button>
                  <button
                    onClick={() => router.push('/dnd/monster-test')}
                    className="w-full py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg border-2 border-blue-700 transition-all shadow-md"
                  >
                    🎨 Monster Creator
                  </button>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* Battle Stats */}
          {isBattleActive && player1Class && player2Class && (
            <div ref={battleCardsRef} className="relative flex items-center justify-center gap-4 md:gap-8 py-12 -mx-4 sm:-mx-6 overflow-visible">
              {/* Darker band background */}
              <div 
                className="absolute rounded-lg"
                style={{ 
                  backgroundColor: '#BDB6A8',
                  top: '20%',
                  bottom: '20%',
                  left: '-60px',
                  right: '-60px',
                  width: 'calc(100% + 120px)',
                }}
              />
              {/* Left Card - Rotated counter-clockwise (outward) */}
              <div className="relative z-10" style={{ transform: 'rotate(-5deg)' }}>
                <CharacterCard
                  playerClass={player1Class}
                  characterName={player1Name || 'Loading...'}
                  monsterImageUrl={player1MonsterId ? `/cdn/monsters/${player1MonsterId}/280x200.png` : undefined}
                  onAttack={() => performAttack('player1')}
                  onUseAbility={(idx) => useAbility('player1', idx)}
                  shouldShake={shakingPlayer === 'player1'}
                  shouldSparkle={sparklingPlayer === 'player1'}
                  shouldMiss={missingPlayer === 'player1'}
                  shouldHit={hittingPlayer === 'player1'}
                  shouldSurprise={surprisedPlayer === 'player1'}
                  shouldCast={castingPlayer === 'player1'}
                  castTrigger={castTrigger.player1}
                  shakeTrigger={shakeTrigger.player1}
                  sparkleTrigger={sparkleTrigger.player1}
                  missTrigger={missTrigger.player1}
                  hitTrigger={hitTrigger.player1}
                  surpriseTrigger={surpriseTrigger.player1}
                  shakeIntensity={shakeIntensity.player1}
                  sparkleIntensity={sparkleIntensity.player1}
                  isMoveInProgress={isMoveInProgress}
                  isActive={currentTurn === 'player1'}
                  isDefeated={defeatedPlayer === 'player1'}
                  isVictor={victorPlayer === 'player1'}
                  confettiTrigger={confettiTrigger}
                  onShakeComplete={handleShakeComplete}
                  onSparkleComplete={handleSparkleComplete}
                  onMissComplete={handleMissComplete}
                  onHitComplete={handleHitComplete}
                  onSurpriseComplete={handleSurpriseComplete}
                  onCastComplete={handleCastComplete}
                />
              </div>
              {/* VS Graphic */}
              <div className="relative z-10 flex-shrink-0">
                <span className="text-5xl md:text-6xl font-bold" style={{ color: '#E0D9C9', fontFamily: 'serif' }}>
                  VS
                </span>
              </div>
              {/* Right Card - Rotated clockwise (outward) */}
              <div className="relative z-10" style={{ transform: 'rotate(5deg)' }}>
                <CharacterCard
                  playerClass={player2Class}
                  characterName={player2Name || 'Loading...'}
                  monsterImageUrl={player2MonsterId ? `/cdn/monsters/${player2MonsterId}/280x200.png` : undefined}
                  onAttack={() => performAttack('player2')}
                  onUseAbility={(idx) => useAbility('player2', idx)}
                  shouldShake={shakingPlayer === 'player2'}
                  shouldSparkle={sparklingPlayer === 'player2'}
                  shouldMiss={missingPlayer === 'player2'}
                  shouldHit={hittingPlayer === 'player2'}
                  shouldSurprise={surprisedPlayer === 'player2'}
                  shouldCast={castingPlayer === 'player2'}
                  castTrigger={castTrigger.player2}
                  shakeTrigger={shakeTrigger.player2}
                  sparkleTrigger={sparkleTrigger.player2}
                  missTrigger={missTrigger.player2}
                  hitTrigger={hitTrigger.player2}
                  surpriseTrigger={surpriseTrigger.player2}
                  shakeIntensity={shakeIntensity.player2}
                  sparkleIntensity={sparkleIntensity.player2}
                  isMoveInProgress={isMoveInProgress}
                  isActive={currentTurn === 'player2'}
                  isDefeated={defeatedPlayer === 'player2'}
                  isVictor={victorPlayer === 'player2'}
                  confettiTrigger={confettiTrigger}
                  onShakeComplete={handleShakeComplete}
                  onSparkleComplete={handleSparkleComplete}
                  onMissComplete={handleMissComplete}
                  onHitComplete={handleHitComplete}
                  onSurpriseComplete={handleSurpriseComplete}
                  onCastComplete={handleCastComplete}
                  isOpponent={true}
                />
              </div>
            </div>
          )}

          {/* Battle Log */}
          {isBattleActive && (
          <div 
            ref={battleLogRef}
            className="bg-white p-6 shadow-lg overflow-y-auto -mx-4 sm:-mx-6 border-t-4 border-l-4 border-r-4" 
            style={{ 
              borderColor: '#5C4033',
              borderTopLeftRadius: '0.5rem',
              borderTopRightRadius: '0.5rem',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
              marginBottom: '-1.5rem',
              marginLeft: '-1rem',
              marginRight: '-1rem',
              minHeight: 'calc(100vh - 500px)',
              paddingBottom: '2rem',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
                Battle Log
              </h2>
              <button
                onClick={triggerDropAnimation}
                className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg border-2 border-purple-700 transition-all shadow-md"
                title="Test the drop and slam animation"
              >
                🎬 Test Drop & Slam
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {battleLog.length === 0 && (
                <div className="text-gray-500 italic">The battle log is empty...</div>
              )}
              {[...battleLog].reverse().map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded ${
                    log.type === 'attack' ? 'bg-red-50 text-red-800 font-mono' :
                    log.type === 'ability' ? 'bg-purple-50 text-purple-800 font-mono' :
                    log.type === 'roll' ? 'text-red-600' :
                    log.type === 'narrative' ? 'text-gray-800' :
                    'bg-gray-50 text-gray-700 font-mono'
                  }`}
                >
                  {log.type === 'narrative' ? (
                    <div className="prose max-w-none text-sm" style={{ fontFamily: 'serif' }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: '#5C4033' }}>{children}</p>,
                          strong: ({ children }) => <strong className="font-bold" style={{ color: '#5C4033' }}>{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          h1: ({ children }) => <h1 className="text-lg mb-2" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base mb-2" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm mb-1" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h3>,
                          h4: ({ children }) => <h4 className="text-sm mb-1" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h4>,
                          h5: ({ children }) => <h5 className="text-sm mb-1" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h5>,
                          h6: ({ children }) => <h6 className="text-sm mb-1" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h6>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-2 italic">{children}</blockquote>,
                        }}
                      >
                        {log.message}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span style={log.type === 'roll' ? { color: '#DC2626', fontFamily: 'serif' } : {}}>
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
                <div className="p-2 rounded bg-gray-100 text-gray-700">
                  <span className="waiting-indicator">
                    Waiting for agent response
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                  </span>
                </div>
              )}
            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
}
