'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { DnDClass, BattleLog, CharacterEmotion, Ability, AttackAbility } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, MONSTER_ICONS, CLASS_ICONS } from '../constants';
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../utils/dice';
import { generateCharacterName } from '../utils/names';
import { createHitVisualEffects, createMissVisualEffects, createHealingVisualEffects, getOpponent, buildDamageDiceArray, type PendingVisualEffect } from '../utils/battle';
import { DiceRoll } from '../components/DiceRoll';
import { CharacterCard } from '../components/CharacterCard';
import { ClassSelection } from '../components/ClassSelection';
import { useAIOpponent } from '../hooks/useAIOpponent';

// Mock battle narrative generator (doesn't call agent)
const mockBattleNarrative = (eventDescription: string): string => {
  return `[MOCK] ${eventDescription}`;
};

export default function DnDTestPage() {
  const router = useRouter();
  
  // Type selection for player 2 only (player 1 is always a class)
  const [player2Type, setPlayer2Type] = useState<'class' | 'monster'>('class');
  
  // Scroll ref for monster selection
  const monsterScrollRef = useRef<HTMLDivElement>(null);
  
  // Monster IDs for displaying monster images
  const [player1MonsterId, setPlayer1MonsterId] = useState<string | null>(null);
  const [player2MonsterId, setPlayer2MonsterId] = useState<string | null>(null);
  
  // Created monsters (with IDs and images)
  const [createdMonsters, setCreatedMonsters] = useState<Array<DnDClass & { monsterId: string; imageUrl: string }>>([]);
  const [isLoadingCreatedMonsters, setIsLoadingCreatedMonsters] = useState(false);
  
  // Test player setup - preserve actual abilities from classes
  const [player1Class, setPlayer1Class] = useState<DnDClass>(() => ({
    ...FALLBACK_CLASSES[0],
    hitPoints: FALLBACK_CLASSES[0].maxHitPoints,
    abilities: FALLBACK_CLASSES[0].abilities || [],
  }));
  
  const [player2Class, setPlayer2Class] = useState<DnDClass>(() => ({
    ...FALLBACK_CLASSES[1],
    hitPoints: FALLBACK_CLASSES[1].maxHitPoints,
    abilities: FALLBACK_CLASSES[1].abilities || [],
  }));
  
  // Helper to create a test class/monster preserving actual abilities and monster metadata
  const createTestEntity = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }): DnDClass & { monsterId?: string; imageUrl?: string } => {
    return {
      ...entity,
      hitPoints: entity.maxHitPoints,
      // Preserve actual abilities from the entity, or use empty array if none
      abilities: entity.abilities && entity.abilities.length > 0 ? entity.abilities : [],
      // Preserve monsterId and imageUrl if they exist
      ...(entity.monsterId && { monsterId: entity.monsterId }),
      ...(entity.imageUrl && { imageUrl: entity.imageUrl }),
    };
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

  // Handle player 1 selection
  const handlePlayer1Select = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }) => {
    const testEntity = createTestEntity(entity);
    setPlayer1Class(testEntity);
    // For monsters, use the monster type name directly; for classes, generate a name
    const isMonster = MONSTER_ICONS[entity.name] !== undefined;
    setPlayer1Name(isMonster ? entity.name : generateCharacterName(entity.name));
    
    // Check if this entity already has a monsterId (explicitly selected created monster)
    if (testEntity.monsterId) {
      setPlayer1MonsterId(testEntity.monsterId);
    } else {
      // Otherwise, check if there's an associated monster for this class/monster type
      const associatedMonster = findAssociatedMonster(entity.name);
      if (associatedMonster) {
        setPlayer1MonsterId(associatedMonster.monsterId);
      } else {
        setPlayer1MonsterId(null);
      }
    }
  }, [createTestEntity, findAssociatedMonster]);
  
  // Handle player 2 selection
  const handlePlayer2Select = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }) => {
    const testEntity = createTestEntity(entity);
    setPlayer2Class(testEntity);
    // For monsters, use the monster type name directly; for classes, generate a name
    const isMonster = MONSTER_ICONS[entity.name] !== undefined;
    setPlayer2Name(isMonster ? entity.name : generateCharacterName(entity.name));
    
    // Check if this entity already has a monsterId (explicitly selected created monster)
    if (testEntity.monsterId) {
      setPlayer2MonsterId(testEntity.monsterId);
    } else {
      // Otherwise, check if there's an associated monster for this class/monster type
      const associatedMonster = findAssociatedMonster(entity.name);
      if (associatedMonster) {
        setPlayer2MonsterId(associatedMonster.monsterId);
      } else {
        setPlayer2MonsterId(null);
      }
    }
  }, [createTestEntity, findAssociatedMonster]);
  
  // Initialize names as null to prevent hydration mismatch
  // Names will be generated on the client side only
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  
  // Generate names only on client side to avoid hydration mismatch
  useEffect(() => {
    const isP1Monster = MONSTER_ICONS[player1Class.name] !== undefined;
    const isP2Monster = MONSTER_ICONS[player2Class.name] !== undefined;
    setPlayer1Name(isP1Monster ? player1Class.name : generateCharacterName(player1Class.name));
    setPlayer2Name(isP2Monster ? player2Class.name : generateCharacterName(player2Class.name));
  }, [player1Class.name, player2Class.name]);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  
  // Visual effect states
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
  const [castingPlayer, setCastingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [castTrigger, setCastTrigger] = useState({ player1: 0, player2: 0 });
  const [shakeIntensity, setShakeIntensity] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [sparkleIntensity, setSparkleIntensity] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [defeatedPlayer, setDefeatedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [victorPlayer, setVictorPlayer] = useState<'player1' | 'player2' | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  
  // Dice roll states
  const [diceRollTrigger, setDiceRollTrigger] = useState(0);
  const [diceRollData, setDiceRollData] = useState<Array<{ diceType: string; result: number }>>([]);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [manualEmotion1, setManualEmotion1] = useState<CharacterEmotion | null>(null);
  const [manualEmotion2, setManualEmotion2] = useState<CharacterEmotion | null>(null);
  const [isAIModeActive, setIsAIModeActive] = useState(false);
  const [isOpponentAutoPlaying, setIsOpponentAutoPlaying] = useState(false);
  const [isMoveInProgress, setIsMoveInProgress] = useState(false);
  const diceQueueRef = useRef<Array<Array<{ diceType: string; result: number }>>>([]);
  
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
            
            // Construct imageUrl from monsterId if not provided
            const imageUrl = m.imageUrl || `/cdn/monsters/${m.monsterId}/280x200.png`;
            
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
              imageUrl: imageUrl.replace('/256.png', '/280x200.png').replace('/200.png', '/280x200.png'),
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
  
  // Queue for visual effects that should trigger after dice roll completes
  // (PendingVisualEffect type imported from battle utils)
  
  // Callback to execute after dice roll completes (for HP updates, etc.)
  type PostDiceRollCallback = () => void;
  
  type QueuedDiceRoll = {
    diceRolls: Array<{ diceType: string; result: number }>;
    visualEffects: PendingVisualEffect[];
    callbacks?: PostDiceRollCallback[];
  };
  const diceQueueWithEffectsRef = useRef<QueuedDiceRoll[]>([]);
  const currentVisualEffectsRef = useRef<PendingVisualEffect[]>([]);
  const currentCallbacksRef = useRef<PostDiceRollCallback[]>([]);
  
  const addLog = useCallback((type: BattleLog['type'], message: string) => {
    setBattleLog((prev) => [...prev, { type, message, timestamp: Date.now() }]);
  }, []);
  
  const updatePlayerHP = useCallback((player: 'player1' | 'player2', newHP: number) => {
    if (player === 'player1') {
      setPlayer1Class((current) => current ? { ...current, hitPoints: newHP } : current);
    } else {
      setPlayer2Class((current) => current ? { ...current, hitPoints: newHP } : current);
    }
  }, []);
  
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
        console.log('[TestPage] Setting surprise effect for', effect.player);
        setSurprisedPlayer(effect.player);
        setSurpriseTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'cast':
        setCastingPlayer(effect.player);
        setCastTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
    }
  }, []);
  
  // Helper function to trigger dice roll animation
  const triggerDiceRoll = useCallback((
    diceRolls: Array<{ diceType: string; result: number }>,
    visualEffects: PendingVisualEffect[] = [],
    callbacks: PostDiceRollCallback[] = []
  ) => {
    if (isDiceRolling) {
      diceQueueWithEffectsRef.current.push({ diceRolls, visualEffects, callbacks });
      return;
    }
    
    currentVisualEffectsRef.current = visualEffects;
    currentCallbacksRef.current = callbacks;
    setIsDiceRolling(true);
    setDiceRollData(diceRolls);
    setDiceRollTrigger(prev => prev + 1);
  }, [isDiceRolling]);
  
  const handleDiceRollComplete = useCallback(() => {
    setIsDiceRolling(false);
    
    // Apply visual effects associated with the dice roll that just completed
    const pendingEffects = currentVisualEffectsRef.current;
    currentVisualEffectsRef.current = [];
    
    // Execute HP updates at the same time as visual effects
    const pendingCallbacks = currentCallbacksRef.current;
    currentCallbacksRef.current = [];
    
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
    
    // Process next dice in queue
    if (diceQueueWithEffectsRef.current.length > 0) {
      setTimeout(() => {
        const nextItem = diceQueueWithEffectsRef.current.shift();
        if (nextItem) {
          currentVisualEffectsRef.current = nextItem.visualEffects;
          currentCallbacksRef.current = nextItem.callbacks || [];
          setIsDiceRolling(true);
          setDiceRollData(nextItem.diceRolls);
          setDiceRollTrigger(prev => prev + 1);
        }
      }, 150);
    }
  }, [applyVisualEffect]);
  
  // Test functions
  const testDiceRoll = () => {
    const testRolls = [
      { diceType: 'd20', result: Math.floor(Math.random() * 20) + 1 },
      { diceType: 'd10', result: Math.floor(Math.random() * 10) + 1 },
      { diceType: 'd8', result: Math.floor(Math.random() * 8) + 1 },
      { diceType: 'd6', result: Math.floor(Math.random() * 6) + 1 },
    ];
    triggerDiceRoll(testRolls);
    addLog('system', '🎲 Test dice roll triggered');
  };
  
  const testAttackHit = (attacker: 'player1' | 'player2') => {
    console.log('[TestPage] testAttackHit called for', attacker);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const defender = getOpponent(attacker);
    
    console.log('[TestPage] Attacker:', attackerClass.name, 'Defender:', defenderClass.name);
    
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    const damage = rollDice(attackerClass.damageDie);
    
    console.log('[TestPage] Attack roll:', attackRoll, 'Damage:', damage);
    
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (hits AC ${defenderClass.armorClass})`);
    
    const newHP = Math.max(0, defenderClass.hitPoints - damage);
    
    // Build visual effects array using the proper helper function (includes cast effect for spell-casting classes)
    const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass);
    
    console.log('[TestPage] Triggering dice roll for', attacker);
    triggerDiceRoll(
      [
        { diceType: 'd20', result: d20Roll },
        { diceType: attackerClass.damageDie, result: damage }
      ],
      visualEffects,
      [
        () => {
          console.log('[TestPage] HP update callback for', defender, 'newHP:', newHP);
          updatePlayerHP(defender, newHP);
        },
        () => {
          console.log('[TestPage] Attack complete callback for', attacker);
          addLog('attack', `⚔️ ${attackerClass.name} hits for ${damage} damage!`);
          addLog('narrative', mockBattleNarrative(`${attackerClass.name} attacks ${defenderClass.name} and deals ${damage} damage.`));
          
          if (newHP <= 0) {
            setDefeatedPlayer(defender);
            setVictorPlayer(attacker);
            setConfettiTrigger(prev => prev + 1);
            addLog('system', `🏆 ${attackerClass.name} wins!`);
          } else {
            // Switch turns after attack completes
            // Wait for shake animation to complete (400ms) before switching turns
            // This ensures the visual feedback is visible before the turn changes
            const nextTurn = attacker === 'player1' ? 'player2' : 'player1';
            console.log('[TestPage] Switching turn from', attacker, 'to', nextTurn);
            // Delay turn switch to allow shake animation to complete (400ms) + small buffer
            // Keep isMoveInProgress true until turn actually switches to prevent AI from triggering again
            setTimeout(() => {
              setCurrentTurn(nextTurn);
              setIsMoveInProgress(false);
            }, 450);
            return; // Early return to prevent double execution
          }
        }
      ]
    );
  };
  
  const testAttackMiss = (attacker: 'player1' | 'player2') => {
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (misses AC ${defenderClass.armorClass})`);
    
    // Build visual effects array using the proper helper function (includes cast effect for spell-casting classes)
    const visualEffects = createMissVisualEffects(attacker, attackerClass);
    
    triggerDiceRoll(
      [{ diceType: 'd20', result: d20Roll }],
      visualEffects,
      [
        () => {
          addLog('attack', `❌ ${attackerClass.name} misses!`);
          addLog('narrative', mockBattleNarrative(`${attackerClass.name} attacks ${defenderClass.name} but misses.`));
          // Switch turns after miss
          // Miss animation is 600ms, so wait a bit longer
          // Keep isMoveInProgress true until turn actually switches to prevent AI from triggering again
          const nextTurn = attacker === 'player1' ? 'player2' : 'player1';
          setTimeout(() => {
            setCurrentTurn(nextTurn);
            setIsMoveInProgress(false);
          }, 650);
        }
      ]
    );
  };
  
  const testHeal = (player: 'player1' | 'player2') => {
    const playerClass = player === 'player1' ? player1Class : player2Class;
    
    const heal = rollDiceWithNotation('1d8+3');
    const { dice } = parseDiceNotation('1d8+3');
    
    addLog('roll', `✨ ${playerClass.name} uses Test Heal!`);
    
    const newHP = Math.min(playerClass.maxHitPoints, playerClass.hitPoints + heal);
    
    // Build visual effects array using the proper helper function (includes cast effect for spell-casting classes)
    const visualEffects = createHealingVisualEffects(player, heal, playerClass);
    
    triggerDiceRoll(
      [{ diceType: dice, result: heal }],
      visualEffects,
      [
        () => updatePlayerHP(player, newHP), // HP update happens after dice roll
        () => {
          addLog('ability', `💚 ${playerClass.name} heals for ${heal} HP!`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} uses Test Heal and recovers ${heal} HP.`));
          // Switch turns after heal
          // Sparkle animation is 1500ms, but we can switch sooner since it's just visual
          // Keep isMoveInProgress true until turn actually switches to prevent AI from triggering again
          const nextTurn = player === 'player1' ? 'player2' : 'player1';
          setTimeout(() => {
            setCurrentTurn(nextTurn);
            setIsMoveInProgress(false);
          }, 450);
        }
      ]
    );
  };
  
  const testLowDamage = (target: 'player1' | 'player2') => {
    const targetClass = target === 'player1' ? player1Class : player2Class;
    const attackerName = target === 'player1' ? 'Test Attacker' : 'Test Attacker';
    
    // Deal minimal damage (1-2 HP) to test low intensity shake
    const damage = Math.floor(Math.random() * 2) + 1; // 1 or 2 damage
    
    addLog('roll', `💥 ${attackerName} uses Low Damage Test!`);
    
    const newHP = Math.max(0, targetClass.hitPoints - damage);
    
    triggerDiceRoll(
      [{ diceType: 'd4', result: damage }],
      [{ type: 'shake', player: target, intensity: damage }],
      [
        () => updatePlayerHP(target, newHP),
        () => {
          addLog('attack', `💥 ${attackerName} deals ${damage} damage to ${targetClass.name}! (Low damage test)`);
          addLog('narrative', mockBattleNarrative(`${attackerName} deals minimal ${damage} damage to ${targetClass.name}!`));
          
          if (newHP <= 0) {
            setDefeatedPlayer(target);
            addLog('system', `💀 ${targetClass.name} is defeated!`);
          }
        }
      ]
    );
  };

  const testLowHeal = (player: 'player1' | 'player2') => {
    const playerClass = player === 'player1' ? player1Class : player2Class;
    const heal = Math.floor(Math.random() * 2) + 1; // 1 or 2 healing
    
    addLog('roll', `✨ ${playerClass.name} uses Low Heal!`);
    
    const newHP = Math.min(playerClass.maxHitPoints, playerClass.hitPoints + heal);
    
    triggerDiceRoll(
      [{ diceType: 'd4', result: heal }],
      [{ type: 'sparkle', player, intensity: heal }],
      [
        () => updatePlayerHP(player, newHP),
        () => {
          addLog('ability', `💚 ${playerClass.name} heals for ${heal} HP! (Low heal test)`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} uses Low Heal and recovers ${heal} HP.`));
        }
      ]
    );
  };

  const testHighDamage = (target: 'player1' | 'player2') => {
    const targetClass = target === 'player1' ? player1Class : player2Class;
    const attackerName = target === 'player1' ? 'Test Attacker' : 'Test Attacker';
    
    // Calculate damage that will ALWAYS trigger surprise
    // Surprise triggers if: damage >= 30% of max HP OR damage >= 50% of current HP
    // We ensure it meets at least one condition by using the larger of:
    // - 40% of max HP (guarantees >= 30% of max)
    // - 50% of current HP (guarantees >= 50% of current)
    const damageFromMaxPercent = Math.ceil(targetClass.maxHitPoints * 0.4);
    const damageFromCurrentPercent = Math.ceil(targetClass.hitPoints * 0.5);
    const damage = Math.max(damageFromMaxPercent, damageFromCurrentPercent);
    
    addLog('roll', `💥 ${attackerName} uses High Damage Test!`);
    
    const newHP = Math.max(0, targetClass.hitPoints - damage);
    
    // Check if this is a surprising amount of damage (same logic as battle system)
    const damagePercentOfMax = damage / targetClass.maxHitPoints;
    const damagePercentOfCurrent = targetClass.hitPoints > 0 ? damage / targetClass.hitPoints : 0;
    const isSurprising = damagePercentOfMax >= 0.3 || damagePercentOfCurrent >= 0.5;
    
    // Log the calculation for debugging
    addLog('system', `📊 Damage calc: ${damage} HP (${(damagePercentOfMax * 100).toFixed(1)}% of max, ${(damagePercentOfCurrent * 100).toFixed(1)}% of current) - ${isSurprising ? 'SURPRISING!' : 'not surprising'}`);
    
    const visualEffects: Array<{ type: 'shake' | 'sparkle' | 'miss' | 'hit' | 'surprise'; player: 'player1' | 'player2'; intensity?: number }> = [
      { type: 'shake', player: target, intensity: damage }
    ];
    
    if (isSurprising) {
      visualEffects.push({ type: 'surprise', player: target });
    }
    
    triggerDiceRoll(
      [{ diceType: 'd20', result: 20 }, { diceType: 'd12', result: damage }],
      visualEffects,
      [
        () => updatePlayerHP(target, newHP), // HP update happens after dice roll
        () => {
          addLog('attack', `💥 ${attackerName} deals ${damage} damage to ${targetClass.name}! ${isSurprising ? '😱 SURPRISING DAMAGE!' : ''}`);
          addLog('narrative', mockBattleNarrative(`${attackerName} deals massive ${damage} damage to ${targetClass.name}!`));
          
          if (newHP <= 0) {
            setDefeatedPlayer(target);
            addLog('system', `💀 ${targetClass.name} is defeated!`);
          }
        }
      ]
    );
  };
  
  const testFullHeal = (player: 'player1' | 'player2') => {
    const playerClass = player === 'player1' ? player1Class : player2Class;
    const healAmount = playerClass.maxHitPoints - playerClass.hitPoints;
    
    if (healAmount <= 0) {
      addLog('system', `💚 ${playerClass.name} is already at full health!`);
      return;
    }
    
    addLog('roll', `✨ ${playerClass.name} uses Full Heal!`);
    
    triggerDiceRoll(
      [{ diceType: 'd20', result: 20 }],
      [{ type: 'sparkle', player, intensity: healAmount }],
      [
        () => updatePlayerHP(player, playerClass.maxHitPoints), // HP update happens after dice roll
        () => {
          addLog('ability', `💚 ${playerClass.name} fully heals to ${playerClass.maxHitPoints} HP!`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} is fully restored to maximum health!`));
        }
      ]
    );
  };

  // Test ability handler - handles all ability types
  const testUseAbility = (player: 'player1' | 'player2', abilityIndex: number) => {
    if (isMoveInProgress) return;
    
    setIsMoveInProgress(true);
    const attackerClass = player === 'player1' ? player1Class : player2Class;
    const defenderClass = player === 'player1' ? player2Class : player1Class;
    const ability = attackerClass.abilities[abilityIndex];
    
    if (!ability) {
      setIsMoveInProgress(false);
      return;
    }
    
    addLog('roll', `✨ ${attackerClass.name} uses ${ability.name}!`);
    
    if (ability.type === 'healing') {
      // Handle healing ability
      const heal = rollDiceWithNotation(ability.healingDice);
      const { dice } = parseDiceNotation(ability.healingDice);
      const newHP = Math.min(attackerClass.maxHitPoints, attackerClass.hitPoints + heal);
      
      triggerDiceRoll(
        [{ diceType: dice, result: heal }],
        createHealingVisualEffects(player, heal, attackerClass),
        [
          () => updatePlayerHP(player, newHP),
          () => {
            addLog('ability', `💚 ${attackerClass.name} heals for ${heal} HP!`);
            addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} and heals for ${heal} HP.`));
            const nextTurn = player === 'player1' ? 'player2' : 'player1';
            setTimeout(() => {
              setCurrentTurn(nextTurn);
              setIsMoveInProgress(false);
            }, 450);
          }
        ]
      );
    } else if (ability.type === 'attack') {
      const attackAbility = ability as AttackAbility;
      const numAttacks = attackAbility.attacks || 1;
      const defender = getOpponent(player);
      
      if (numAttacks > 1) {
        // Handle multi-attack
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
        
        const newHP = totalDamage > 0 ? Math.max(0, defenderClass.hitPoints - totalDamage) : defenderClass.hitPoints;
        
        if (totalDamage > 0) {
          const visualEffects = createHitVisualEffects(player, defender, totalDamage, defenderClass, attackerClass);
          triggerDiceRoll(
            diceToShow,
            visualEffects,
            [
              () => updatePlayerHP(defender, newHP),
              () => {
                addLog('roll', `🎲 ${attackerClass.name} makes ${numAttacks} attacks: ${attackRolls.join(', ')}`);
                const hitDetails = hits.map((hit, i) => 
                  hit ? `Attack ${i + 1} hits for ${damages[i]} damage.` : `Attack ${i + 1} misses.`
                ).join(' ');
                addLog('attack', `⚔️ ${attackerClass.name} uses ${ability.name}: ${hitDetails} Total damage: ${totalDamage}!`);
                addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. Total damage: ${totalDamage}.`));
                
                if (newHP <= 0) {
                  setDefeatedPlayer(defender);
                  setVictorPlayer(player);
                  setConfettiTrigger(prev => prev + 1);
                  addLog('system', `🏆 ${attackerClass.name} wins!`);
                } else {
                  const nextTurn = player === 'player1' ? 'player2' : 'player1';
                  setTimeout(() => {
                    setCurrentTurn(nextTurn);
                    setIsMoveInProgress(false);
                  }, 450);
                }
              }
            ]
          );
        } else {
          triggerDiceRoll(
            diceToShow,
            createMissVisualEffects(player, attackerClass),
            [
              () => {
                addLog('roll', `🎲 ${attackerClass.name} makes ${numAttacks} attacks: ${attackRolls.join(', ')}`);
                addLog('attack', `❌ ${attackerClass.name} uses ${ability.name} but all attacks miss!`);
                addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} but all attacks miss.`));
                const nextTurn = player === 'player1' ? 'player2' : 'player1';
                setTimeout(() => {
                  setCurrentTurn(nextTurn);
                  setIsMoveInProgress(false);
                }, 650);
              }
            ]
          );
        }
      } else if (attackAbility.attackRoll) {
        // Handle single attack with roll
        const d20Roll = rollDice('d20');
        const attackRoll = d20Roll + attackerClass.attackBonus;
        
        addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (vs AC ${defenderClass.armorClass})`);
        
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
          
          const newHP = Math.max(0, defenderClass.hitPoints - damage);
          const visualEffects = createHitVisualEffects(player, defender, damage, defenderClass, attackerClass);
          
          triggerDiceRoll(
            diceToShow,
            visualEffects,
            [
              () => updatePlayerHP(defender, newHP),
              () => {
                addLog('attack', `⚔️ ${attackerClass.name} hits for ${damage} damage!`);
                addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} and hits for ${damage} damage.`));
                
                if (newHP <= 0) {
                  setDefeatedPlayer(defender);
                  setVictorPlayer(player);
                  setConfettiTrigger(prev => prev + 1);
                  addLog('system', `🏆 ${attackerClass.name} wins!`);
                } else {
                  const nextTurn = player === 'player1' ? 'player2' : 'player1';
                  setTimeout(() => {
                    setCurrentTurn(nextTurn);
                    setIsMoveInProgress(false);
                  }, 450);
                }
              }
            ]
          );
        } else {
          triggerDiceRoll(
            [{ diceType: 'd20', result: d20Roll }],
            createMissVisualEffects(player, attackerClass),
            [
              () => {
                addLog('attack', `❌ ${attackerClass.name} misses!`);
                addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} but misses.`));
                const nextTurn = player === 'player1' ? 'player2' : 'player1';
                setTimeout(() => {
                  setCurrentTurn(nextTurn);
                  setIsMoveInProgress(false);
                }, 650);
              }
            ]
          );
        }
      } else {
        // Handle automatic damage (no attack roll)
        const { diceArray, totalDamage: damage } = buildDamageDiceArray(
          attackAbility.damageDice,
          rollDiceWithNotation,
          parseDiceNotation,
          attackAbility.bonusDamageDice
        );
        const newHP = Math.max(0, defenderClass.hitPoints - damage);
        const visualEffects = createHitVisualEffects(player, defender, damage, defenderClass, attackerClass);
        
        triggerDiceRoll(
          diceArray,
          visualEffects,
          [
            () => updatePlayerHP(defender, newHP),
            () => {
              addLog('attack', `⚔️ ${attackerClass.name} deals ${damage} damage!`);
              addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} and deals ${damage} damage.`));
              
              if (newHP <= 0) {
                setDefeatedPlayer(defender);
                setVictorPlayer(player);
                setConfettiTrigger(prev => prev + 1);
                addLog('system', `🏆 ${attackerClass.name} wins!`);
              } else {
                const nextTurn = player === 'player1' ? 'player2' : 'player1';
                setTimeout(() => {
                  setCurrentTurn(nextTurn);
                  setIsMoveInProgress(false);
                }, 450);
              }
            }
          ]
        );
      }
    }
  };
  
  // Use AI opponent hook
  const aiOpponentCleanup = useAIOpponent({
    isActive: isAIModeActive,
    currentTurn,
    isMoveInProgress,
    defeatedPlayer,
    opponentClass: player2Class,
    callbacks: {
      onAttack: () => testAttackHit('player2'),
      onUseAbility: (abilityIndex: number) => {
        testUseAbility('player2', abilityIndex);
      },
      onHeal: () => testHeal('player2'),
    },
    onStateChange: setIsOpponentAutoPlaying,
    onMoveInProgressChange: setIsMoveInProgress,
    debugLog: (message: string) => console.log(message),
  });

  const resetTest = () => {
    setPlayer1Class(prev => ({ ...prev, hitPoints: prev.maxHitPoints }));
    setPlayer2Class(prev => ({ ...prev, hitPoints: prev.maxHitPoints }));
    setBattleLog([]);
    setDefeatedPlayer(null);
    setVictorPlayer(null);
    setShakingPlayer(null);
    setSparklingPlayer(null);
    setMissingPlayer(null);
    setHittingPlayer(null);
    setShakeTrigger({ player1: 0, player2: 0 });
    setSparkleTrigger({ player1: 0, player2: 0 });
    setMissTrigger({ player1: 0, player2: 0 });
    setHitTrigger({ player1: 0, player2: 0 });
    setSurprisedPlayer(null);
    setSurpriseTrigger({ player1: 0, player2: 0 });
    setCastingPlayer(null);
    setCastTrigger({ player1: 0, player2: 0 });
    setShakeIntensity({ player1: 0, player2: 0 });
    setSparkleIntensity({ player1: 0, player2: 0 });
    setManualEmotion1(null);
    setManualEmotion2(null);
    setCurrentTurn('player1');
    setIsMoveInProgress(false);
    setIsOpponentAutoPlaying(false);
    // Note: We don't reset monster IDs here - they should persist with the selected character
    aiOpponentCleanup.cleanup();
    addLog('system', '🔄 Test reset');
  };

  // Memoized callback functions for animation completion to prevent unnecessary re-renders
  const handlePlayer1ShakeComplete = useCallback(() => {
    setShakingPlayer(null);
  }, []);

  const handlePlayer1SparkleComplete = useCallback(() => {
    setSparklingPlayer(null);
  }, []);

  const handlePlayer1MissComplete = useCallback(() => {
    setMissingPlayer(null);
  }, []);

  const handlePlayer1HitComplete = useCallback(() => {
    setHittingPlayer(null);
  }, []);

  const handlePlayer1SurpriseComplete = useCallback(() => {
    setSurprisedPlayer(null);
  }, []);

  const handlePlayer2ShakeComplete = useCallback(() => {
    setShakingPlayer(null);
  }, []);

  const handlePlayer2SparkleComplete = useCallback(() => {
    setSparklingPlayer(null);
  }, []);

  const handlePlayer2MissComplete = useCallback(() => {
    setMissingPlayer(null);
  }, []);

  const handlePlayer2HitComplete = useCallback(() => {
    setHittingPlayer(null);
  }, []);

  const handlePlayer2SurpriseComplete = useCallback(() => {
    setSurprisedPlayer(null);
  }, []);

  const handlePlayer1CastComplete = useCallback(() => {
    setCastingPlayer(null);
  }, []);

  const handlePlayer2CastComplete = useCallback(() => {
    setCastingPlayer(null);
  }, []);
  
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
              Test
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
              Page
            </h1>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => router.push('/dnd')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-0">
        <div className="space-y-6 overflow-visible">
          {/* Global Test Controls */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-4 shadow-2xl">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={testDiceRoll}
                className="py-2 px-4 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg border-2 border-purple-700 transition-all"
              >
                🎲 Test Dice Roll
              </button>
              <button
                onClick={() => {
                  setIsAIModeActive(!isAIModeActive);
                  addLog('system', isAIModeActive ? '🤖 AI mode disabled' : '🤖 AI mode enabled - Player 2 will auto-play');
                }}
                className={`py-2 px-4 font-semibold rounded-lg border-2 transition-all ${
                  isAIModeActive
                    ? 'bg-green-900 hover:bg-green-800 text-white border-green-700'
                    : 'bg-blue-900 hover:bg-blue-800 text-white border-blue-700'
                }`}
              >
                {isAIModeActive ? '🤖 AI Mode: ON' : '🤖 AI Mode: OFF'}
              </button>
              <button
                onClick={resetTest}
                className="py-2 px-4 bg-amber-800 hover:bg-amber-700 text-white font-semibold rounded-lg border-2 border-amber-700 transition-all"
              >
                🔄 Reset Test
              </button>
            </div>
            {isAIModeActive && (
              <div className="mt-3 text-center">
                <p className="text-amber-200 text-sm italic">
                  🤖 AI Mode Active: Player 2 (opponent) will automatically play when it's their turn
                </p>
              </div>
            )}
          </div>

          {/* Character Selection */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Select Characters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player 1 Selection - Always a Class */}
              <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-amber-200">Player 1 (Class)</h3>
                <ClassSelection
                  title="Select Class"
                  availableClasses={FALLBACK_CLASSES}
                  selectedClass={player1Class}
                  onSelect={handlePlayer1Select}
                  createdMonsters={createdMonsters}
                />
              </div>

              {/* Player 2 Selection - Can be Class or Monster */}
              <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-amber-200">Player 2</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPlayer2Type('class');
                        const firstClass = FALLBACK_CLASSES[1];
                        setPlayer2Class(createTestEntity(firstClass));
                        setPlayer2Name(generateCharacterName(firstClass.name));
                      }}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        player2Type === 'class'
                          ? 'bg-blue-800 text-white border-blue-600'
                          : 'bg-amber-800/50 text-amber-300 border-amber-700 hover:bg-amber-700'
                      }`}
                    >
                      Class
                    </button>
                    <button
                      onClick={() => {
                        setPlayer2Type('monster');
                        const firstMonster = FALLBACK_MONSTERS[0];
                        setPlayer2Class(createTestEntity(firstMonster));
                        setPlayer2Name(firstMonster.name); // Monsters use their type name directly
                      }}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        player2Type === 'monster'
                          ? 'bg-red-800 text-white border-red-600'
                          : 'bg-amber-800/50 text-amber-300 border-amber-700 hover:bg-amber-700'
                      }`}
                    >
                      Monster
                    </button>
                  </div>
                </div>
                {player2Type === 'class' ? (
                  <ClassSelection
                    title="Select Class"
                    availableClasses={FALLBACK_CLASSES}
                    selectedClass={player2Class}
                    onSelect={handlePlayer2Select}
                    createdMonsters={createdMonsters}
                  />
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-amber-200">Select Monster</h3>
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
                        {FALLBACK_MONSTERS.map((monster) => {
                          const isSelected = player2Class?.name === monster.name;
                          const associatedMonster = findAssociatedMonster(monster.name);
                          const monsterImageUrl = associatedMonster 
                            ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                            : undefined;
                          
                          return (
                            <div
                              key={monster.name}
                              onClick={() => handlePlayer2Select(createTestEntity(monster))}
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
                )}
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className="relative flex items-center justify-center gap-4 md:gap-8 -mx-4 sm:-mx-6 overflow-visible">
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
            <div className="relative z-10 space-y-3" style={{ transform: 'rotate(-5deg)' }}>
              <CharacterCard
                playerClass={player1Class}
                characterName={player1Name || 'Loading...'}
                monsterImageUrl={player1MonsterId ? `/cdn/monsters/${player1MonsterId}/280x200.png` : undefined}
                onAttack={() => {
                  setIsMoveInProgress(true);
                  testAttackHit('player1');
                }}
                onUseAbility={(index) => {
                  testUseAbility('player1', index);
                }}
                isMoveInProgress={isMoveInProgress}
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
                isActive={currentTurn === 'player1'}
                isDefeated={defeatedPlayer === 'player1'}
                isVictor={victorPlayer === 'player1'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={handlePlayer1ShakeComplete}
                onSparkleComplete={handlePlayer1SparkleComplete}
                onMissComplete={handlePlayer1MissComplete}
                onHitComplete={handlePlayer1HitComplete}
                onSurpriseComplete={handlePlayer1SurpriseComplete}
                onCastComplete={handlePlayer1CastComplete}
                allowAllTurns={!isAIModeActive}
              />
              {/* Test buttons for Player 1 */}
              <div 
                className="flex flex-wrap gap-2"
                style={{ width: '100%', maxWidth: '320px' }}
              >
                <button
                  onClick={() => testHighDamage('player1')}
                  className="px-2 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all"
                >
                  💥 High Damage
                </button>
                <button
                  onClick={() => testLowDamage('player1')}
                  className="px-2 py-1 bg-orange-900 hover:bg-orange-800 text-white text-xs rounded border border-orange-700 transition-all"
                >
                  💥 Low Damage
                </button>
                <button
                  onClick={() => testFullHeal('player1')}
                  className="px-2 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all"
                >
                  💚 Full Heal
                </button>
                <button
                  onClick={() => testLowHeal('player1')}
                  className="px-2 py-1 bg-emerald-900 hover:bg-emerald-800 text-white text-xs rounded border border-emerald-700 transition-all"
                >
                  💚 Low Heal
                </button>
                <button
                  onClick={() => testAttackMiss('player1')}
                  className="px-2 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"
                >
                  ❌ Test Miss
                </button>
              </div>
            </div>
            {/* VS Graphic */}
            <div className="relative z-10 flex-shrink-0">
              <span className="text-5xl md:text-6xl font-bold" style={{ color: '#E0D9C9', fontFamily: 'serif' }}>
                VS
              </span>
            </div>
            {/* Right Card - Rotated clockwise (outward) */}
            <div className="relative z-10 space-y-3" style={{ transform: 'rotate(5deg)' }}>
              <CharacterCard
                playerClass={player2Class}
                characterName={player2Name || 'Loading...'}
                monsterImageUrl={player2MonsterId ? `/cdn/monsters/${player2MonsterId}/280x200.png` : undefined}
                onAttack={() => {
                  if (isAIModeActive) return; // Don't allow manual control in AI mode
                  setIsMoveInProgress(true);
                  testAttackHit('player2');
                }}
                onUseAbility={(index) => {
                  if (isAIModeActive) return; // Don't allow manual control in AI mode
                  testUseAbility('player2', index);
                }}
                isOpponent={isAIModeActive}
                isMoveInProgress={isMoveInProgress}
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
                isActive={currentTurn === 'player2'}
                isDefeated={defeatedPlayer === 'player2'}
                isVictor={victorPlayer === 'player2'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={handlePlayer2ShakeComplete}
                onSparkleComplete={handlePlayer2SparkleComplete}
                onMissComplete={handlePlayer2MissComplete}
                onHitComplete={handlePlayer2HitComplete}
                onSurpriseComplete={handlePlayer2SurpriseComplete}
                onCastComplete={handlePlayer2CastComplete}
                allowAllTurns={!isAIModeActive}
              />
              {/* Test buttons for Player 2 */}
              <div 
                className="flex flex-wrap gap-2"
                style={{ width: '100%', maxWidth: '320px' }}
              >
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testHighDamage('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💥 High Damage
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testLowDamage('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-orange-900 hover:bg-orange-800 text-white text-xs rounded border border-orange-700 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💥 Low Damage
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testFullHeal('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💚 Full Heal
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testLowHeal('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-emerald-900 hover:bg-emerald-800 text-white text-xs rounded border border-emerald-700 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💚 Low Heal
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testAttackMiss('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ❌ Test Miss
                </button>
              </div>
            </div>
          </div>

          {/* Test Log */}
          <div 
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
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              Test Log
            </h2>
            <div className="space-y-2 text-sm">
              {battleLog.length === 0 && (
                <div className="text-gray-500 italic">Test log is empty...</div>
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
                  <span style={log.type === 'roll' ? { color: '#DC2626', fontFamily: 'serif' } : {}}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

