'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Types
import { DnDClass, BattleLog, AttackAbility, Ability } from '../dnd/types';

// Constants
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, FALLBACK_ABILITIES, selectRandomAbilities, FALLBACK_MONSTER_ABILITIES, isMonster } from '../dnd/constants';

// Utilities
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../dnd/utils/dice';
import { generateCharacterName } from '../dnd/utils/names';
import { 
  createHitVisualEffects, 
  createMissVisualEffects, 
  createHealingVisualEffects,
  getOpponent,
  buildDamageDiceArray,
  getProjectileType,
  type PendingVisualEffect,
  type ProjectileType
} from '../dnd/utils/battle';

// Hooks
import { useAIOpponent } from '../dnd/hooks/useAIOpponent';

// Services
import { getBattleNarrative } from '../dnd/services/apiService';

// Components
import { ClassSelection } from '../dnd/components/ClassSelection';
import { FloatingNumber, FloatingNumberType } from '../dnd/components/FloatingNumber';
import { CharacterCard } from '../dnd/components/CharacterCard';
import { PageHeader } from '../dnd/components/PageHeader';
import { LandscapePrompt } from '../dnd/components/LandscapePrompt';
import { ProjectileEffect } from '../dnd/components/ProjectileEffect';

export default function DnDBattle() {
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
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const [isMoveInProgress, setIsMoveInProgress] = useState(false);
  const [defeatedPlayer, setDefeatedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [victorPlayer, setVictorPlayer] = useState<'player1' | 'player2' | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [castingPlayer, setCastingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [castTrigger, setCastTrigger] = useState({ player1: 0, player2: 0 });
  const [selectionSyncTrigger, setSelectionSyncTrigger] = useState(0);
  
  // Floating numbers state - replaces dice roll system
  type FloatingNumberData = {
    id: string;
    value: number | string;
    type: FloatingNumberType;
    targetPlayer: 'player1' | 'player2';
    persistent?: boolean;
  };
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumberData[]>([]);
  
  // Projectile effects state
  type ProjectileData = {
    id: string;
    fromPlayer: 'player1' | 'player2';
    toPlayer: 'player1' | 'player2';
    isHit: boolean;
    onHit?: () => void;
    onComplete?: () => void;
    fromCardRotation?: number;
    delay?: number;
    projectileType?: ProjectileType;
  };
  const [projectileEffects, setProjectileEffects] = useState<ProjectileData[]>([]);
  
  // Refs for character cards to position floating numbers
  const player1CardRef = useRef<HTMLDivElement | null>(null);
  const player2CardRef = useRef<HTMLDivElement | null>(null);
  const battleCardsRef = useRef<HTMLDivElement>(null);
  const battleLogRef = useRef<HTMLDivElement>(null);

  // Queue for narrative events to batch them per round
  type QueuedNarrativeEvent = {
    eventDescription: string;
    attackerClass: DnDClass;
    defenderClass: DnDClass;
    attackerDetails: string;
    defenderDetails: string;
  };
  const narrativeQueueRef = useRef<QueuedNarrativeEvent[]>([]);
  const previousTurnRef = useRef<'player1' | 'player2' | null>(null);
  const currentPlayer1ClassRef = useRef<DnDClass | null>(null);
  const currentPlayer2ClassRef = useRef<DnDClass | null>(null);


  // Load data from Astra DB, localStorage, and created monsters on mount
  useEffect(() => {
    // Load classes from Astra DB (with fallback to localStorage)
    const loadClasses = async () => {
      try {
        // Try Astra DB first
        const response = await fetch('/api/heroes');
        if (response.ok) {
          const data = await response.json();
          if (data.heroes && data.heroes.length > 0) {
            setAvailableClasses(data.heroes);
            setClassesLoaded(true);
            console.log(`Loaded ${data.heroes.length} classes from Astra DB`);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load classes from Astra DB, trying localStorage:', error);
      }

      // Fallback to localStorage
      try {
        const savedClasses = localStorage.getItem('dnd_loaded_classes');
        if (savedClasses) {
          const parsedClasses = JSON.parse(savedClasses) as DnDClass[];
          setAvailableClasses(parsedClasses);
          setClassesLoaded(true);
          console.log(`Loaded ${parsedClasses.length} classes from localStorage`);
        }
      } catch (error) {
        console.error('Failed to load classes from localStorage:', error);
      }
    };

    // Load monsters from Astra DB (with fallback to localStorage)
    const loadMonsters = async () => {
      try {
        // Try Astra DB first
        const response = await fetch('/api/monsters-db');
        if (response.ok) {
          const data = await response.json();
          if (data.monsters && data.monsters.length > 0) {
            setAvailableMonsters(data.monsters);
            setMonstersLoaded(true);
            console.log(`Loaded ${data.monsters.length} monsters from Astra DB`);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load monsters from Astra DB, trying localStorage:', error);
      }

      // Fallback to localStorage
      try {
        const savedMonsters = localStorage.getItem('dnd_loaded_monsters');
        if (savedMonsters) {
          const parsedMonsters = JSON.parse(savedMonsters) as DnDClass[];
          setAvailableMonsters(parsedMonsters);
          setMonstersLoaded(true);
          console.log(`Loaded ${parsedMonsters.length} monsters from localStorage`);
        }
      } catch (error) {
        console.error('Failed to load monsters from localStorage:', error);
      }
    };

    loadClasses();
    loadMonsters();

    // Load created monsters from API
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
              hasCutout: m.hasCutout ?? false, // Preserve hasCutout flag from API
              lastAssociatedAt: m.lastAssociatedAt, // Preserve last association time
            } as DnDClass & { monsterId: string; imageUrl: string; hasCutout?: boolean; lastAssociatedAt?: string };
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
    // Find the most recently associated monster for this class/monster type
    const associated = createdMonsters
      .filter(m => m.name === className)
      .sort((a, b) => {
        // Sort by lastAssociatedAt (most recently associated first), then by createdAt (newest first)
        const aTime = (a as any).lastAssociatedAt || (a as any).createdAt || '';
        const bTime = (b as any).lastAssociatedAt || (b as any).createdAt || '';
        if (aTime && bTime) {
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }
        // Fallback to UUID sort if no timestamps
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

  // Keep refs in sync with current player classes for narrative processing
  useEffect(() => {
    currentPlayer1ClassRef.current = player1Class;
    currentPlayer2ClassRef.current = player2Class;
  }, [player1Class, player2Class]);

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
      const isMonsterCheck = isMonster(dndClass.name);
      setName(isMonsterCheck ? dndClass.name : generateCharacterName(dndClass.name));
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
    
    // Increment selection sync trigger to sync pulse animations across all selected cards
    setSelectionSyncTrigger(prev => prev + 1);
  }, [findAssociatedMonster]);

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
      case 'cast':
        setCastingPlayer(effect.player);
        setCastTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
    }
  }, []);

  // Ref to track recent projectile creations to prevent duplicates
  const lastProjectileTimeRef = useRef<{ [key: string]: number }>({});
  
  // Helper function to show projectile effect
  const showProjectileEffect = useCallback((
    fromPlayer: 'player1' | 'player2',
    toPlayer: 'player1' | 'player2',
    isHit: boolean,
    onHit?: () => void,
    onComplete?: () => void,
    fromCardRotation?: number,
    delay?: number,
    projectileType?: ProjectileType
  ) => {
    // Create a unique key for this attack (fromPlayer + toPlayer + delay)
    // This prevents duplicate projectiles for the same attack within 200ms
    const attackKey = `${fromPlayer}-${toPlayer}-${delay || 0}`;
    const now = Date.now();
    const lastTime = lastProjectileTimeRef.current[attackKey] || 0;
    
    // Prevent duplicate projectiles within 200ms for the same attack
    if (now - lastTime < 200) {
      return;
    }
    
    lastProjectileTimeRef.current[attackKey] = now;
    
    const projectileId = `projectile-${now}-${Math.random()}`;
    setProjectileEffects(prev => [...prev, {
      id: projectileId,
      fromPlayer,
      toPlayer,
      isHit,
      onHit,
      onComplete,
      fromCardRotation,
      delay,
      projectileType,
    }]);
  }, []);

  // Helper function to remove projectile effect
  const removeProjectileEffect = useCallback((id: string) => {
    setProjectileEffects(prev => prev.filter(p => p.id !== id));
  }, []);

  // Helper function to show floating numbers and apply effects immediately
  const showFloatingNumbers = useCallback((
    numbers: Array<{ value: number | string; type: FloatingNumberType; targetPlayer: 'player1' | 'player2'; persistent?: boolean }>,
    visualEffects: PendingVisualEffect[] = [],
    callbacks: (() => void)[] = []
  ) => {
    // Show floating numbers immediately
    const numberData: FloatingNumberData[] = numbers.map((n, idx) => ({
      id: `${Date.now()}-${idx}`,
      ...n,
    }));
    setFloatingNumbers(prev => [...prev, ...numberData]);
    
    // Apply visual effects immediately
    visualEffects.forEach(effect => {
      applyVisualEffect(effect);
    });
    
    // Execute callbacks immediately (with a tiny delay to ensure state updates)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        callbacks.forEach(callback => callback());
      });
    });
  }, [applyVisualEffect]);

  // Handle floating number completion (cleanup)
  const handleFloatingNumberComplete = useCallback((id: string) => {
    setFloatingNumbers(prev => prev.filter(n => n.id !== id));
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

  // Helper function to process queued narrative events (batched per round)
  const processNarrativeQueue = useCallback(async (
    currentPlayer1Class: DnDClass | null,
    currentPlayer2Class: DnDClass | null
  ) => {
    if (narrativeQueueRef.current.length === 0) {
      return;
    }

    const events = narrativeQueueRef.current;
    narrativeQueueRef.current = []; // Clear the queue

    // Combine all events into a single description
    const combinedDescription = events.map(e => e.eventDescription).join(' ');

    // Use current player classes from state (they have the most up-to-date HP)
    // Fall back to last event's classes if current classes aren't available
    const lastEvent = events[events.length - 1];
    
    // Determine which classes to use - prefer current state, fall back to last event
    let attackerClass = lastEvent.attackerClass;
    let defenderClass = lastEvent.defenderClass;
    
    if (currentPlayer1Class && currentPlayer2Class) {
      // Use current classes from state (they have up-to-date HP)
      // The narrative is about the round, so we'll use player1 and player2 as they are now
      attackerClass = currentPlayer1Class;
      defenderClass = currentPlayer2Class;
    }
    
    setIsWaitingForAgent(true);
    try {
      const { narrative, responseId } = await getBattleNarrative(
        combinedDescription,
        attackerClass,
        defenderClass,
        lastEvent.attackerDetails,
        lastEvent.defenderDetails,
        battleResponseId
      );
      setBattleResponseId(responseId);
      addLog('narrative', narrative);
    } finally {
      setIsWaitingForAgent(false);
    }
  }, [battleResponseId, addLog]);

  // Helper function to switch turns
  const switchTurn = useCallback(async (currentAttacker: 'player1' | 'player2') => {
    const nextPlayer = currentAttacker === 'player1' ? 'player2' : 'player1';
    // Don't switch to a defeated player - battle is over
    if (defeatedPlayer === nextPlayer) {
      return;
    }

    // Check if we've completed a full round (player2 just moved → switching to player1)
    // This means both players have made their moves in this round
    const isFullRoundComplete = currentAttacker === 'player2' && nextPlayer === 'player1';
    
    // Update the previous turn reference
    previousTurnRef.current = currentAttacker;
    
    // If a full round is complete and we have queued events, process them
    if (isFullRoundComplete && narrativeQueueRef.current.length > 0) {
      await processNarrativeQueue(
        currentPlayer1ClassRef.current,
        currentPlayer2ClassRef.current
      );
    }
    
    setCurrentTurn(nextPlayer);
  }, [defeatedPlayer, processNarrativeQueue]);

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
    
    // Show floating "DEFEATED!" text (persistent - stays on card)
    showFloatingNumbers(
      [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: defender, persistent: true }],
      [],
      []
    );
    
    await generateAndLogNarrative(
      eventDescription,
      attackerClass,
      { ...defenderClass, hitPoints: 0 },
      attackerDetails,
      defenderDetails
    );
    addLog('system', `🏆 ${attackerClass.name} wins! ${defenderClass.name} has been defeated!`);
  }, [generateAndLogNarrative, addLog, showFloatingNumbers]);

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
        // Victory conditions should still call immediately (battle ends)
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
        // Queue the narrative event instead of calling immediately
        // It will be processed when the full round completes
        narrativeQueueRef.current.push({
          eventDescription: eventDescription,
          attackerClass: attackerClass,
          defenderClass: { ...defenderClass, hitPoints: newHP },
          attackerDetails,
          defenderDetails
        });
      }
      await switchTurn(attacker);
      setIsMoveInProgress(false);
      // Clear projectile tracking ref when move completes to allow new attacks
      lastProjectileTimeRef.current = {};
    };
  }, [handleVictory, switchTurn]);

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
      // Queue the narrative event instead of calling immediately
      // It will be processed when the full round completes
      narrativeQueueRef.current.push({
        eventDescription: eventDescription,
        attackerClass: attackerClass,
        defenderClass: defenderClass,
        attackerDetails,
        defenderDetails
      });
      await switchTurn(attacker);
      setIsMoveInProgress(false);
      // Clear projectile tracking ref when move completes to allow new attacks
      lastProjectileTimeRef.current = {};
    };
  }, [switchTurn]);

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
      // Queue the narrative event instead of calling immediately
      // It will be processed when the full round completes
      narrativeQueueRef.current.push({
        eventDescription: eventDescription,
        attackerClass: attackerClass,
        defenderClass: defenderClass,
        attackerDetails,
        defenderDetails
      });
      await switchTurn(attacker);
      setIsMoveInProgress(false);
      // Clear projectile tracking ref when move completes to allow new attacks
      lastProjectileTimeRef.current = {};
    };
  }, [switchTurn]);

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

  const handleCastComplete = useCallback(() => {
    setCastingPlayer(null);
  }, []);

  // Note: Load functionality has been moved to /dnd/load-data page

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
      const p1IsMonster = isMonster(player1Class.name);
      const p2IsMonster = isMonster(player2Class.name);
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
        const isP1Monster = isMonster(p1.name);
        setPlayer1Name(isP1Monster ? p1.name : generateCharacterName(p1.name));
        // Also check for associated monster for player1
        const associatedMonster = findAssociatedMonster(p1.name);
        if (associatedMonster) {
          setPlayer1MonsterId(associatedMonster.monsterId);
        }
      }
      
      const isP1Monster = isMonster(p1.name);
      const isP2Monster = isMonster(p2.name);
      const finalP1Name = player1Name || (isP1Monster ? p1.name : generateCharacterName(p1.name));
      const finalP2Name = player2Name || (isP2Monster ? p2.name : generateCharacterName(p2.name));
      
      setIsBattleActive(true);
      setBattleLog([]);
      setCurrentTurn('player1');
      
      // Initialize turn tracking for round detection
      previousTurnRef.current = null;
      narrativeQueueRef.current = [];
      
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

  const performAttack = async (attacker: 'player1' | 'player2', attackType?: 'melee' | 'ranged') => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;

    setIsMoveInProgress(true);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    // Determine which damage die to use based on attack type
    let damageDie: string;
    if (attackType === 'melee' && attackerClass.meleeDamageDie) {
      damageDie = attackerClass.meleeDamageDie;
    } else if (attackType === 'ranged' && attackerClass.rangedDamageDie) {
      damageDie = attackerClass.rangedDamageDie;
    } else {
      // Fallback to default damageDie
      damageDie = attackerClass.damageDie;
    }

    // Roll attack
    const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
    logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass);

    const defender = getOpponent(attacker);
    const attackTypeLabel = attackType === 'melee' ? 'melee' : attackType === 'ranged' ? 'ranged' : '';
    const attackDescription = attackTypeLabel ? `${attackTypeLabel} attack` : 'attack';

    if (attackRoll >= defenderClass.armorClass) {
      // Hit! Show projectile effect first, then damage on impact
      const damage = rollDice(damageDie);
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      
      // Create visual effects, but exclude shake (will be triggered by projectile hit)
      const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
        .filter(effect => effect.type !== 'shake'); // Remove shake, will be triggered on projectile hit
      
      // Show projectile effect with card rotation angle
      const cardRotation = attacker === 'player1' ? -5 : 5;
      const projectileType = getProjectileType(null, attackType, attackerClass.name);
      showProjectileEffect(
        attacker,
        defender,
        true, // isHit
        () => {
          // On projectile hit: trigger shake and show damage
          const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
            .find(effect => effect.type === 'shake');
          if (shakeEffect) {
            applyVisualEffect(shakeEffect);
          }
          
          // Show floating damage number when projectile hits
          showFloatingNumbers(
            [{ value: damage, type: 'damage', targetPlayer: defender }],
            visualEffects, // Other effects (hit, cast) shown immediately
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
        undefined, // onComplete
        cardRotation,
        undefined, // delay
        projectileType
      );
    } else {
      // Miss - show projectile effect that misses the target
      const cardRotation = attacker === 'player1' ? -5 : 5;
      const projectileType = getProjectileType(null, attackType, attackerClass.name);
      showProjectileEffect(
        attacker,
        defender,
        false, // isHit
        undefined, // onHit
        () => {
          // After projectile misses, show miss effects
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
        undefined, // delay
        projectileType
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
    const newHP = Math.min(attackerClass.maxHitPoints, attackerClass.hitPoints + heal);
    
    // Show floating healing number immediately
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
  }, [updatePlayerHP, createPostHealingCallback, rollDiceWithNotation, showFloatingNumbers]);

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
      // Show one projectile per successful hit with staggered delays
      const damageNumbers: Array<{ value: number; type: FloatingNumberType; targetPlayer: 'player1' | 'player2' }> = [];
      const completedHitsRef = { count: 0 };
      
      successfulHits.forEach((hitData, hitIndex) => {
        const delay = hitIndex * 100; // 100ms delay between each projectile
        
        showProjectileEffect(
          attacker,
          defender,
          true, // isHit
          () => {
            // On projectile hit: trigger shake and show individual damage
            const shakeEffect = createHitVisualEffects(attacker, defender, hitData.damage, defenderClass, attackerClass)
              .find(effect => effect.type === 'shake');
            if (shakeEffect) {
              applyVisualEffect(shakeEffect);
            }
            
            // Add this hit's damage to the numbers array
            damageNumbers.push({ value: hitData.damage, type: 'damage', targetPlayer: defender });
            completedHitsRef.count++;
            
            // If this is the last hit, show all damage numbers and complete
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
          undefined, // onComplete - handled in onHit for last projectile
          cardRotation,
          delay,
          projectileType
        );
      });
    } else {
      // All attacks missed - show projectile effect that misses the target
      showProjectileEffect(
        attacker,
        defender,
        false, // isHit
        undefined, // onHit
        () => {
          // After projectile misses, show miss effects
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
        undefined, // delay
        projectileType
      );
    }
  }, [updatePlayerHP, createPostDamageCallback, createPostMissCallback, addLog, rollDice, rollDiceWithNotation, parseDiceNotation, buildDamageDiceArray, createHitVisualEffects, createMissVisualEffects, getOpponent, showFloatingNumbers, showProjectileEffect, applyVisualEffect]);

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
      
      // Create visual effects, but exclude shake (will be triggered by projectile hit)
      const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
        .filter(effect => effect.type !== 'shake'); // Remove shake, will be triggered on projectile hit
      
      // Show projectile effect with card rotation angle
      const cardRotation = attacker === 'player1' ? -5 : 5;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      showProjectileEffect(
        attacker,
        defender,
        true, // isHit
        () => {
          // On projectile hit: trigger shake and show damage
          const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
            .find(effect => effect.type === 'shake');
          if (shakeEffect) {
            applyVisualEffect(shakeEffect);
          }
          
          // Show floating damage number when projectile hits
          showFloatingNumbers(
            [{ value: damage, type: 'damage', targetPlayer: defender }],
            visualEffects, // Other effects (hit, cast) shown immediately
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
        undefined, // onComplete
        cardRotation,
        undefined, // delay
        projectileType
      );
    } else {
      // Miss - show projectile effect that misses the target
      const cardRotation = attacker === 'player1' ? -5 : 5;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      showProjectileEffect(
        attacker,
        defender,
        false, // isHit
        undefined, // onHit
        () => {
          // After projectile misses, show miss effects
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
        undefined, // delay
        projectileType
      );
    }
  }, [calculateAttackRoll, logAttackRoll, updatePlayerHP, createPostDamageCallback, createPostMissCallback, rollDiceWithNotation, parseDiceNotation, buildDamageDiceArray, createHitVisualEffects, createMissVisualEffects, getOpponent, showFloatingNumbers, showProjectileEffect, applyVisualEffect]);

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
    
    // Create visual effects, but exclude shake (will be triggered by projectile hit)
    const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
      .filter(effect => effect.type !== 'shake'); // Remove shake, will be triggered on projectile hit
    
    // Show projectile effect
    const cardRotation = attacker === 'player1' ? -5 : 5;
    const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
    showProjectileEffect(
      attacker,
      defender,
      true, // isHit
      () => {
        // On projectile hit: trigger shake and show damage
        const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
          .find(effect => effect.type === 'shake');
        if (shakeEffect) {
          applyVisualEffect(shakeEffect);
        }
        
        // Show floating damage number when projectile hits
        showFloatingNumbers(
          [{ value: damage, type: 'damage', targetPlayer: defender }],
          visualEffects, // Other effects (hit, cast) shown immediately
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
      undefined, // onComplete
      cardRotation,
      undefined, // delay
      projectileType
    );
  }, [updatePlayerHP, createPostDamageCallback, rollDiceWithNotation, parseDiceNotation, buildDamageDiceArray, createHitVisualEffects, getOpponent, showFloatingNumbers, showProjectileEffect, applyVisualEffect]);

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
    setCastingPlayer(null);
    setCastTrigger({ player1: 0, player2: 0 });
    setIsOpponentAutoPlaying(false);
    // Clear floating numbers
    setFloatingNumbers([]);
    // Clear projectile effects
    setProjectileEffects([]);
    // Clear narrative queue and turn tracking
    narrativeQueueRef.current = [];
    previousTurnRef.current = null;
    aiOpponentCleanup.cleanup();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D1C9BA' }}>
      {/* Landscape Orientation Prompt */}
      <LandscapePrompt />
      
      {/* Floating Numbers */}
      {floatingNumbers.map((number) => (
        <FloatingNumber
          key={number.id}
          value={number.value}
          type={number.type}
          targetCardRef={number.targetPlayer === 'player1' ? player1CardRef : player2CardRef}
          onComplete={() => handleFloatingNumberComplete(number.id)}
          persistent={number.persistent}
        />
      ))}
      
      {/* Projectile Effects */}
      {projectileEffects.map((projectile) => (
        <ProjectileEffect
          key={projectile.id}
          fromCardRef={projectile.fromPlayer === 'player1' ? player1CardRef : player2CardRef}
          toCardRef={projectile.toPlayer === 'player1' ? player1CardRef : player2CardRef}
          isHit={projectile.isHit}
          onHit={projectile.onHit}
          onComplete={() => {
            if (projectile.onComplete) {
              projectile.onComplete();
            }
            removeProjectileEffect(projectile.id);
          }}
          fromCardRotation={projectile.fromCardRotation}
          delay={projectile.delay}
          projectileType={projectile.projectileType}
        />
      ))}
      
      {/* Header */}
      <PageHeader
        title="Battle"
        title2="Arena"
        decalImageUrl="/cdn/decals/battle-arena.png"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-0">
        <div className="space-y-6 overflow-visible">
          {/* Character Selection */}
          {!isBattleActive && (
            <div className="space-y-8">
              {/* Main Title */}
              <div className="text-center">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2" style={{ 
                  fontFamily: 'serif', 
                  color: '#E4DDCD', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.1), 1px 1px 0px rgba(0,0,0,0.15)',
                  fontWeight: 700
                }}>
                  Choose Your Hero
                </h2>
                {isLoadingClasses && (
                  <p className="text-sm text-gray-600 italic mt-2">
                    Loading classes from OpenRAG...
                    <span className="waiting-indicator ml-2 inline-block">
                      <span className="waiting-dot"></span>
                      <span className="waiting-dot"></span>
                      <span className="waiting-dot"></span>
                    </span>
                  </p>
                )}
                {isLoadingClassDetails && !isLoadingClasses && (
                  <p className="text-sm text-gray-600 italic mt-2">Loading class information from knowledge base...</p>
                )}
              </div>

              {!isLoadingClasses && !isLoadingMonsters && (
                <>
              <div className="space-y-8">
                <ClassSelection
                  title=""
                  availableClasses={availableClasses}
                  selectedClass={player1Class}
                  onSelect={handlePlayer1Select}
                  createdMonsters={createdMonsters}
                  selectionSyncTrigger={selectionSyncTrigger}
                />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold" style={{ fontFamily: 'serif', color: '#5C4033' }}>Opponent (Auto-Play)</h3>
                      {player2Class && (
                        <>
                          {(() => {
                            const associatedMonster = findAssociatedMonster(player2Class.name);
                            const imageUrl = associatedMonster 
                              ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                              : '/cdn/placeholder.png';
                            return (
                              <img
                                src={imageUrl}
                                alt={player2Class.name}
                                className="w-10 h-10 object-cover rounded"
                                style={{ imageRendering: 'pixelated' as const }}
                              />
                            );
                          })()}
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold text-sm" style={{ color: '#5C4033' }}>{player2Name || player2Class.name}</div>
                              <div className="text-xs text-gray-600 italic">{player2Class.name}</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
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
                              : 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
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
                              : 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
                          }`}
                        >
                          Monster
                        </button>
                      </div>
                    </div>
                  </div>
                  {opponentType === 'monster' ? (
                    <>
                      {/* Standard Monsters */}
                      {availableMonsters.length > 0 ? (
                        <div className="mt-3">
                          <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'serif', color: '#5C4033' }}>Select Monster Opponent</h3>
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
                              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-4 px-10"
                              style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                              }}
                            >
                              {availableMonsters.map((monster, index) => {
                                const associatedMonster = findAssociatedMonster(monster.name);
                                const monsterImageUrl = associatedMonster 
                                  ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                                  : undefined;
                                // Generate cutout URL if monster has cutout images (hasCutout === true)
                                // For backward compatibility, also try if hasCutout is undefined (old monsters)
                                // CharacterCard will handle 404s gracefully if cutout doesn't exist
                                const hasCutout = (associatedMonster as any)?.hasCutout;
                                const monsterCutOutImageUrl = associatedMonster && hasCutout !== false
                                  ? `/cdn/monsters/${associatedMonster.monsterId}/280x200-cutout.png`
                                  : undefined;
                                
                                const isSelected = player2Class?.name === monster.name;
                                
                                return (
                                  <div
                                    key={monster.name}
                                    onClick={() => {
                                      setPlayerClassWithMonster('player2', monster, monster.name);
                                    }}
                                    className="flex-shrink-0 cursor-pointer transition-all"
                                    style={{
                                      transform: isSelected ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
                                      padding: '4px', // Add padding to accommodate zoom without overflow
                                    }}
                                  >
                                    <CharacterCard
                                      playerClass={{ ...monster, hitPoints: monster.maxHitPoints }}
                                      characterName={monster.name}
                                      monsterImageUrl={monsterImageUrl}
                                      monsterCutOutImageUrl={monsterCutOutImageUrl}
                                      size="compact"
                                      cardIndex={index}
                                      totalCards={availableMonsters.length}
                                      isSelected={isSelected}
                                      selectionSyncTrigger={selectionSyncTrigger}
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
                        <div className="text-gray-600 text-sm italic text-center py-4">
                          {monstersLoaded ? 'No monsters available. Click "Load Monsters from OpenRAG" to load monsters.' : 'Click "Load Monsters from OpenRAG" to load monsters.'}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-4">
                      <ClassSelection
                        title=""
                        availableClasses={availableClasses}
                        selectedClass={player2Class}
                        onSelect={(cls) => {
                          setPlayerClassWithMonster('player2', cls);
                        }}
                        createdMonsters={createdMonsters}
                        selectionSyncTrigger={selectionSyncTrigger}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Begin Battle and Reset Buttons */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={startBattle}
                  disabled={!player1Class || !player2Class || isLoadingClassDetails || isBattleActive}
                  className="flex-1 py-4 px-6 bg-red-900 hover:bg-red-800 text-white font-bold text-xl rounded-lg border-4 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl"
                  style={{ fontFamily: 'serif' }}
                >
                  {isLoadingClassDetails ? 'Starting Battle...' : 'Begin Battle! ⚔️'}
                </button>
                <button
                  onClick={resetBattle}
                  className="flex items-center gap-2 px-6 py-4 text-gray-700 hover:text-gray-900 transition-colors font-semibold text-lg border-2 border-gray-400 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
              {player1Class && !player2Class && (
                <p className="text-sm text-gray-600 text-center italic mt-2">
                  Select your character to automatically assign an opponent
                </p>
              )}
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
              <div ref={player1CardRef} className="relative z-10" style={{ transform: 'rotate(-5deg)' }}>
                <CharacterCard
                  playerClass={player1Class}
                  characterName={player1Name || 'Loading...'}
                  monsterImageUrl={player1MonsterId ? `/cdn/monsters/${player1MonsterId}/280x200.png` : undefined}
                  monsterCutOutImageUrl={(() => {
                    if (!player1MonsterId || !player1Class) return undefined;
                    const associatedMonster = findAssociatedMonster(player1Class.name);
                    // For backward compatibility, try if hasCutout is not explicitly false
                    const hasCutout = (associatedMonster as any)?.hasCutout;
                    return associatedMonster && hasCutout !== false
                      ? `/cdn/monsters/${player1MonsterId}/280x200-cutout.png`
                      : undefined;
                  })()}
                  onAttack={() => performAttack('player1')}
                  onUseAbility={(idx) => useAbility('player1', idx)}
                  shouldShake={shakingPlayer === 'player1'}
                  shouldSparkle={sparklingPlayer === 'player1'}
                  shouldMiss={missingPlayer === 'player1'}
                  shouldHit={hittingPlayer === 'player1'}
                  shouldCast={castingPlayer === 'player1'}
                  castTrigger={castTrigger.player1}
                  shakeTrigger={shakeTrigger.player1}
                  sparkleTrigger={sparkleTrigger.player1}
                  missTrigger={missTrigger.player1}
                  hitTrigger={hitTrigger.player1}
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
              <div ref={player2CardRef} className="relative z-10" style={{ transform: 'rotate(5deg)' }}>
                <CharacterCard
                  playerClass={player2Class}
                  characterName={player2Name || 'Loading...'}
                  monsterImageUrl={player2MonsterId ? `/cdn/monsters/${player2MonsterId}/280x200.png` : undefined}
                  monsterCutOutImageUrl={(() => {
                    if (!player2MonsterId || !player2Class) return undefined;
                    const associatedMonster = findAssociatedMonster(player2Class.name);
                    // For backward compatibility, try if hasCutout is not explicitly false
                    const hasCutout = (associatedMonster as any)?.hasCutout;
                    return associatedMonster && hasCutout !== false
                      ? `/cdn/monsters/${player2MonsterId}/280x200-cutout.png`
                      : undefined;
                  })()}
                  onAttack={() => performAttack('player2')}
                  onUseAbility={(idx) => useAbility('player2', idx)}
                  shouldShake={shakingPlayer === 'player2'}
                  shouldSparkle={sparklingPlayer === 'player2'}
                  shouldMiss={missingPlayer === 'player2'}
                  shouldHit={hittingPlayer === 'player2'}
                  shouldCast={castingPlayer === 'player2'}
                  castTrigger={castTrigger.player2}
                  shakeTrigger={shakeTrigger.player2}
                  sparkleTrigger={sparkleTrigger.player2}
                  missTrigger={missTrigger.player2}
                  hitTrigger={hitTrigger.player2}
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
                Battle Log
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetBattle}
                  className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white font-semibold rounded-lg border-2 border-red-700 transition-all shadow-md"
                  title="Start a new battle"
                >
                  New Battle
                </button>
                <button
                  onClick={triggerDropAnimation}
                  className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg border-2 border-purple-700 transition-all shadow-md"
                  title="Test the drop and slam animation"
                >
                  🎬 Test Drop & Slam
                </button>
              </div>
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
