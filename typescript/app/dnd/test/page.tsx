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
  
  // Pagination for monster selection
  const [monsterPage, setMonsterPage] = useState(0);
  const monstersPerPage = 12;
  
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

  // Memoized callback functions for PlayerStats to prevent unnecessary re-renders
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
              🧪 D&D Battle Test Page
            </h1>
            <p className="text-sm text-amber-200 italic">
              Test dice rolls, attacks, heals, and visual effects without using agent tokens
            </p>
          </div>
          <button
            onClick={() => router.push('/dnd')}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold rounded-lg border-2 border-amber-700 transition-all"
          >
            ← Back to Battle
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
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
                        setMonsterPage(0);
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
                        setMonsterPage(0);
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3">
                      {FALLBACK_MONSTERS.slice(monsterPage * monstersPerPage, (monsterPage + 1) * monstersPerPage).map((monster) => {
                        const isSelected = player2Class?.name === monster.name;
                        const associatedMonster = findAssociatedMonster(monster.name);
                        const imageUrl = associatedMonster 
                          ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                          : '/cdn/placeholder.png';
                        return (
                          <button
                            key={monster.name}
                            onClick={() => handlePlayer2Select(createTestEntity(monster))}
                            className={`py-2 px-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'border-amber-400 bg-amber-800 shadow-lg scale-105'
                                : 'border-amber-700 bg-amber-900/50 hover:bg-amber-800 hover:border-amber-600'
                            }`}
                          >
                            <img
                              src={imageUrl}
                              alt={monster.name}
                              className="w-12 h-12 object-cover rounded"
                              style={{ imageRendering: 'pixelated' as const }}
                            />
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
                        Page {monsterPage + 1} of {Math.ceil(FALLBACK_MONSTERS.length / monstersPerPage)}
                      </span>
                      <button
                        onClick={() => setMonsterPage(prev => Math.min(Math.ceil(FALLBACK_MONSTERS.length / monstersPerPage) - 1, prev + 1))}
                        disabled={monsterPage >= Math.ceil(FALLBACK_MONSTERS.length / monstersPerPage) - 1}
                        className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-sm rounded border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
            <div className="space-y-3">
              <CharacterCard
                playerClass={player1Class}
                characterName={player1Name || 'Loading...'}
                monsterImageUrl={player1MonsterId ? `/cdn/monsters/${player1MonsterId}/280x200.png` : undefined}
                onUseAbility={(index) => {
                  testUseAbility('player1', index);
                }}
                onAttack={() => {
                  setIsMoveInProgress(true);
                  testAttackHit('player1');
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
                {/* Ability buttons */}
                {player1Class.abilities.map((ability, index) => (
                  <button
                    key={`p1-ability-${index}`}
                    onClick={() => testUseAbility('player1', index)}
                    className={ability.type === 'healing' 
                      ? 'px-2 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all'
                      : 'px-2 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all'}
                  >
                    {ability.type === 'healing' ? `💚 ${ability.name}` : `⚔️ ${ability.name}`}
                  </button>
                ))}
                {/* Test buttons */}
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
            <div className="space-y-3">
              <CharacterCard
                playerClass={player2Class}
                characterName={player2Name || 'Loading...'}
                monsterImageUrl={player2MonsterId ? `/cdn/monsters/${player2MonsterId}/280x200.png` : undefined}
                onUseAbility={(index) => {
                  if (isAIModeActive) return; // Don't allow manual control in AI mode
                  testUseAbility('player2', index);
                }}
                onAttack={() => {
                  setIsMoveInProgress(true);
                  testAttackHit('player2');
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
                {/* Ability buttons */}
                {player2Class.abilities.map((ability, index) => (
                  <button
                    key={`p2-ability-${index}`}
                    onClick={() => {
                      if (isAIModeActive) return;
                      testUseAbility('player2', index);
                    }}
                    disabled={isAIModeActive}
                    className={`${ability.type === 'healing' 
                      ? 'px-2 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all'
                      : 'px-2 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all'} ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {ability.type === 'healing' ? `💚 ${ability.name}` : `⚔️ ${ability.name}`}
                  </button>
                ))}
                {/* Test buttons */}
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
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Test Log 📜
            </h2>
            <div className="space-y-2 text-sm">
              {battleLog.length === 0 && (
                <div className="text-amber-400 italic">Test log is empty...</div>
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
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

