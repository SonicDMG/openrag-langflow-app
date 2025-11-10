'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { DnDClass, BattleLog, CharacterEmotion } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, MONSTER_ICONS, CLASS_ICONS } from '../constants';
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../utils/dice';
import { generateCharacterName } from '../utils/names';
import { DiceRoll } from '../components/DiceRoll';
import { PlayerStats } from '../components/PlayerStats';
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
  
  // Test player setup
  const [player1Class, setPlayer1Class] = useState<DnDClass>(() => ({
    ...FALLBACK_CLASSES[0],
    hitPoints: FALLBACK_CLASSES[0].maxHitPoints,
    abilities: [
      {
        name: 'Test Attack',
        type: 'attack',
        damageDice: '2d6',
        attackRoll: true,
        description: 'A test attack ability',
      },
      {
        name: 'Test Heal',
        type: 'healing',
        healingDice: '1d8+3',
        description: 'A test healing ability',
      },
    ],
  }));
  
  const [player2Class, setPlayer2Class] = useState<DnDClass>(() => ({
    ...FALLBACK_CLASSES[1],
    hitPoints: FALLBACK_CLASSES[1].maxHitPoints,
    abilities: [
      {
        name: 'Test Attack',
        type: 'attack',
        damageDice: '2d6',
        attackRoll: true,
        description: 'A test attack ability',
      },
      {
        name: 'Test Heal',
        type: 'healing',
        healingDice: '1d8+3',
        description: 'A test healing ability',
      },
    ],
  }));
  
  // Helper to create a test class/monster with test abilities
  const createTestEntity = useCallback((entity: DnDClass): DnDClass => {
    return {
      ...entity,
      hitPoints: entity.maxHitPoints,
      abilities: [
        {
          name: 'Test Attack',
          type: 'attack',
          damageDice: '2d6',
          attackRoll: true,
          description: 'A test attack ability',
        },
        {
          name: 'Test Heal',
          type: 'healing',
          healingDice: '1d8+3',
          description: 'A test healing ability',
        },
      ],
    };
  }, []);
  
  // Handle player 1 selection
  const handlePlayer1Select = useCallback((entity: DnDClass) => {
    setPlayer1Class(createTestEntity(entity));
    // For monsters, use the monster type name directly; for classes, generate a name
    const isMonster = MONSTER_ICONS[entity.name] !== undefined;
    setPlayer1Name(isMonster ? entity.name : generateCharacterName(entity.name));
  }, [createTestEntity]);
  
  // Handle player 2 selection
  const handlePlayer2Select = useCallback((entity: DnDClass) => {
    setPlayer2Class(createTestEntity(entity));
    // For monsters, use the monster type name directly; for classes, generate a name
    const isMonster = MONSTER_ICONS[entity.name] !== undefined;
    setPlayer2Name(isMonster ? entity.name : generateCharacterName(entity.name));
  }, [createTestEntity]);
  
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
  
  // Queue for visual effects that should trigger after dice roll completes
  type PendingVisualEffect = {
    type: 'shake' | 'sparkle' | 'miss' | 'hit' | 'surprise' | 'cast';
    player: 'player1' | 'player2';
    intensity?: number; // Damage amount for shake, healing amount for sparkle
  };
  
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
    const defender = attacker === 'player1' ? 'player2' : 'player1';
    
    console.log('[TestPage] Attacker:', attackerClass.name, 'Defender:', defenderClass.name);
    
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    const damage = rollDice(attackerClass.damageDie);
    
    console.log('[TestPage] Attack roll:', attackRoll, 'Damage:', damage);
    
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (hits AC ${defenderClass.armorClass})`);
    
    const newHP = Math.max(0, defenderClass.hitPoints - damage);
    
    // Build visual effects array (includes cast effect for wizards)
    const visualEffects: PendingVisualEffect[] = [
      { type: 'hit', player: attacker },
      { type: 'shake', player: defender, intensity: damage }
    ];
    if (attackerClass.name === 'Wizard') {
      visualEffects.push({ type: 'cast', player: attacker });
    }
    
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
    
    // Build visual effects array (includes cast effect for wizards)
    const visualEffects: PendingVisualEffect[] = [{ type: 'miss', player: attacker }];
    if (attackerClass.name === 'Wizard') {
      visualEffects.push({ type: 'cast', player: attacker });
    }
    
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
    
    // Build visual effects array (includes cast effect for wizards)
    const visualEffects: PendingVisualEffect[] = [{ type: 'sparkle', player, intensity: heal }];
    if (playerClass.name === 'Wizard') {
      visualEffects.push({ type: 'cast', player });
    }
    
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
        const ability = player2Class.abilities[abilityIndex];
        if (ability?.type === 'healing') {
          testHeal('player2');
        } else if (ability?.type === 'attack') {
          testAttackHit('player2');
        }
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
                  />
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-amber-200">Select Monster</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3">
                      {FALLBACK_MONSTERS.slice(monsterPage * monstersPerPage, (monsterPage + 1) * monstersPerPage).map((monster) => {
                        const icon = MONSTER_ICONS[monster.name] || '👹';
                        return (
                          <button
                            key={monster.name}
                            onClick={() => handlePlayer2Select(createTestEntity(monster))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <PlayerStats
                playerClass={player1Class}
                playerId="player1"
                currentTurn={currentTurn}
                characterName={player1Name || 'Loading...'}
                onUseAbility={(index) => {
                  setIsMoveInProgress(true);
                  const ability = player1Class.abilities[index];
                  if (ability?.type === 'healing') {
                    testHeal('player1');
                  } else if (ability?.type === 'attack') {
                    // For test attack ability, just do a hit
                    testAttackHit('player1');
                  }
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
                isDefeated={defeatedPlayer === 'player1'}
                isVictor={victorPlayer === 'player1'}
                confettiTrigger={confettiTrigger}
                emotion={manualEmotion1 || undefined}
                onShakeComplete={handlePlayer1ShakeComplete}
                onSparkleComplete={handlePlayer1SparkleComplete}
                onMissComplete={handlePlayer1MissComplete}
                onHitComplete={handlePlayer1HitComplete}
                onSurpriseComplete={handlePlayer1SurpriseComplete}
                onCastComplete={handlePlayer1CastComplete}
                showEmotionControls={true}
                onEmotionChange={setManualEmotion1}
                allowAllTurns={!isAIModeActive}
                testButtons={[
                  {
                    label: '💥 High Damage',
                    onClick: () => testHighDamage('player1'),
                    className: 'px-3 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all'
                  },
                  {
                    label: '💥 Low Damage',
                    onClick: () => testLowDamage('player1'),
                    className: 'px-3 py-1 bg-orange-900 hover:bg-orange-800 text-white text-xs rounded border border-orange-700 transition-all'
                  },
                  {
                    label: '💚 Full Heal',
                    onClick: () => testFullHeal('player1'),
                    className: 'px-3 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all'
                  },
                  {
                    label: '💚 Low Heal',
                    onClick: () => testLowHeal('player1'),
                    className: 'px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-white text-xs rounded border border-emerald-700 transition-all'
                  },
                  {
                    label: '❌ Test Miss',
                    onClick: () => testAttackMiss('player1'),
                    className: 'px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all'
                  }
                ]}
              />
            </div>
            <div>
              <PlayerStats
                playerClass={player2Class}
                playerId="player2"
                currentTurn={currentTurn}
                characterName={player2Name || 'Loading...'}
                onUseAbility={(index) => {
                  if (isAIModeActive) return; // Don't allow manual control in AI mode
                  setIsMoveInProgress(true);
                  const ability = player2Class.abilities[index];
                  if (ability?.type === 'healing') {
                    testHeal('player2');
                  } else if (ability?.type === 'attack') {
                    // For test attack ability, just do a hit
                    testAttackHit('player2');
                  }
                }}
                onAttack={isAIModeActive ? undefined : () => {
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
                isDefeated={defeatedPlayer === 'player2'}
                isVictor={victorPlayer === 'player2'}
                confettiTrigger={confettiTrigger}
                emotion={manualEmotion2 || undefined}
                onShakeComplete={handlePlayer2ShakeComplete}
                onSparkleComplete={handlePlayer2SparkleComplete}
                onMissComplete={handlePlayer2MissComplete}
                onHitComplete={handlePlayer2HitComplete}
                onSurpriseComplete={handlePlayer2SurpriseComplete}
                onCastComplete={handlePlayer2CastComplete}
                showEmotionControls={true}
                onEmotionChange={setManualEmotion2}
                allowAllTurns={!isAIModeActive}
                testButtons={[
                  {
                    label: '💥 High Damage',
                    onClick: () => testHighDamage('player2'),
                    className: 'px-3 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all'
                  },
                  {
                    label: '💥 Low Damage',
                    onClick: () => testLowDamage('player2'),
                    className: 'px-3 py-1 bg-orange-900 hover:bg-orange-800 text-white text-xs rounded border border-orange-700 transition-all'
                  },
                  {
                    label: '💚 Full Heal',
                    onClick: () => testFullHeal('player2'),
                    className: 'px-3 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all'
                  },
                  {
                    label: '💚 Low Heal',
                    onClick: () => testLowHeal('player2'),
                    className: 'px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-white text-xs rounded border border-emerald-700 transition-all'
                  },
                  {
                    label: '❌ Test Miss',
                    onClick: () => testAttackMiss('player2'),
                    className: 'px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all'
                  }
                ]}
              />
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

