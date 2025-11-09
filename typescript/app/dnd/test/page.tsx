'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DnDClass, BattleLog, CharacterEmotion } from '../types';
import { FALLBACK_CLASSES } from '../constants';
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../utils/dice';
import { generateCharacterName } from '../utils/names';
import { DiceRoll } from '../components/DiceRoll';
import { PlayerStats } from '../components/PlayerStats';

// Mock battle narrative generator (doesn't call agent)
const mockBattleNarrative = (eventDescription: string): string => {
  return `[MOCK] ${eventDescription}`;
};

export default function DnDTestPage() {
  const router = useRouter();
  
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
  
  // Initialize names as null to prevent hydration mismatch
  // Names will be generated on the client side only
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  
  // Generate names only on client side to avoid hydration mismatch
  useEffect(() => {
    setPlayer1Name(generateCharacterName(player1Class.name));
    setPlayer2Name(generateCharacterName(player2Class.name));
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
  const [defeatedPlayer, setDefeatedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [victorPlayer, setVictorPlayer] = useState<'player1' | 'player2' | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  
  // Dice roll states
  const [diceRollTrigger, setDiceRollTrigger] = useState(0);
  const [diceRollData, setDiceRollData] = useState<Array<{ diceType: string; result: number }>>([]);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [manualEmotion1, setManualEmotion1] = useState<CharacterEmotion | null>(null);
  const [manualEmotion2, setManualEmotion2] = useState<CharacterEmotion | null>(null);
  const diceQueueRef = useRef<Array<Array<{ diceType: string; result: number }>>>([]);
  
  // Queue for visual effects that should trigger after dice roll completes
  type PendingVisualEffect = {
    type: 'shake' | 'sparkle' | 'miss' | 'hit';
    player: 'player1' | 'player2';
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
        break;
      case 'sparkle':
        setSparklingPlayer(effect.player);
        setSparkleTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'miss':
        setMissingPlayer(effect.player);
        setMissTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'hit':
        setHittingPlayer(effect.player);
        setHitTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
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
    
    // Apply visual effects and HP updates synchronously
    pendingEffects.forEach(effect => {
      applyVisualEffect(effect);
    });
    
    // Execute HP update callbacks at the same time as visual effects
    pendingCallbacks.forEach(callback => {
      callback();
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
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const defender = attacker === 'player1' ? 'player2' : 'player1';
    
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    const damage = rollDice(attackerClass.damageDie);
    
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (hits AC ${defenderClass.armorClass})`);
    
    const newHP = Math.max(0, defenderClass.hitPoints - damage);
    
    triggerDiceRoll(
      [
        { diceType: 'd20', result: d20Roll },
        { diceType: attackerClass.damageDie, result: damage }
      ],
      [
        { type: 'hit', player: attacker },
        { type: 'shake', player: defender }
      ],
      [
        () => updatePlayerHP(defender, newHP), // HP update happens after dice roll
        () => {
          addLog('attack', `⚔️ ${attackerClass.name} hits for ${damage} damage!`);
          addLog('narrative', mockBattleNarrative(`${attackerClass.name} attacks ${defenderClass.name} and deals ${damage} damage.`));
          
          if (newHP <= 0) {
            setDefeatedPlayer(defender);
            setVictorPlayer(attacker);
            setConfettiTrigger(prev => prev + 1);
            addLog('system', `🏆 ${attackerClass.name} wins!`);
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
    
    triggerDiceRoll(
      [{ diceType: 'd20', result: d20Roll }],
      [{ type: 'miss', player: attacker }]
    );
    
    addLog('attack', `❌ ${attackerClass.name} misses!`);
    addLog('narrative', mockBattleNarrative(`${attackerClass.name} attacks ${defenderClass.name} but misses.`));
  };
  
  const testHeal = (player: 'player1' | 'player2') => {
    const playerClass = player === 'player1' ? player1Class : player2Class;
    const heal = rollDiceWithNotation('1d8+3');
    const { dice } = parseDiceNotation('1d8+3');
    
    addLog('roll', `✨ ${playerClass.name} uses Test Heal!`);
    
    const newHP = Math.min(playerClass.maxHitPoints, playerClass.hitPoints + heal);
    
    triggerDiceRoll(
      [{ diceType: dice, result: heal }],
      [{ type: 'sparkle', player }],
      [
        () => updatePlayerHP(player, newHP), // HP update happens after dice roll
        () => {
          addLog('ability', `💚 ${playerClass.name} heals for ${heal} HP!`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} uses Test Heal and recovers ${heal} HP.`));
        }
      ]
    );
  };
  
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
    setManualEmotion1(null);
    setManualEmotion2(null);
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
                onClick={resetTest}
                className="py-2 px-4 bg-amber-800 hover:bg-amber-700 text-white font-semibold rounded-lg border-2 border-amber-700 transition-all"
              >
                🔄 Reset Test
              </button>
            </div>
          </div>

          {/* Player Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlayerStats
              playerClass={player1Class}
              playerId="player1"
              currentTurn="player1"
              characterName={player1Name || 'Loading...'}
              onAttack={() => testAttackHit('player1')}
              onUseAbility={(index) => {
                const ability = player1Class.abilities[index];
                if (ability?.type === 'healing') {
                  testHeal('player1');
                } else if (ability?.type === 'attack') {
                  // For test attack ability, just do a hit
                  testAttackHit('player1');
                }
              }}
              shouldShake={shakingPlayer === 'player1'}
              shouldSparkle={sparklingPlayer === 'player1'}
              shouldMiss={missingPlayer === 'player1'}
              shouldHit={hittingPlayer === 'player1'}
              shakeTrigger={shakeTrigger.player1}
              sparkleTrigger={sparkleTrigger.player1}
              missTrigger={missTrigger.player1}
              hitTrigger={hitTrigger.player1}
              isMoveInProgress={false}
              isDefeated={defeatedPlayer === 'player1'}
              isVictor={victorPlayer === 'player1'}
              confettiTrigger={confettiTrigger}
              emotion={manualEmotion1 || undefined}
              onShakeComplete={handlePlayer1ShakeComplete}
              onSparkleComplete={handlePlayer1SparkleComplete}
              onMissComplete={handlePlayer1MissComplete}
              onHitComplete={handlePlayer1HitComplete}
              showEmotionControls={true}
              onEmotionChange={setManualEmotion1}
            />
            <PlayerStats
              playerClass={player2Class}
              playerId="player2"
              currentTurn="player2"
              characterName={player2Name || 'Loading...'}
              onAttack={() => testAttackHit('player2')}
              onUseAbility={(index) => {
                const ability = player2Class.abilities[index];
                if (ability?.type === 'healing') {
                  testHeal('player2');
                } else if (ability?.type === 'attack') {
                  // For test attack ability, just do a hit
                  testAttackHit('player2');
                }
              }}
              shouldShake={shakingPlayer === 'player2'}
              shouldSparkle={sparklingPlayer === 'player2'}
              shouldMiss={missingPlayer === 'player2'}
              shouldHit={hittingPlayer === 'player2'}
              shakeTrigger={shakeTrigger.player2}
              sparkleTrigger={sparkleTrigger.player2}
              missTrigger={missTrigger.player2}
              hitTrigger={hitTrigger.player2}
              isMoveInProgress={false}
              isDefeated={defeatedPlayer === 'player2'}
              isVictor={victorPlayer === 'player2'}
              confettiTrigger={confettiTrigger}
              emotion={manualEmotion2 || undefined}
              onShakeComplete={handlePlayer2ShakeComplete}
              onSparkleComplete={handlePlayer2SparkleComplete}
              onMissComplete={handlePlayer2MissComplete}
              onHitComplete={handlePlayer2HitComplete}
              showEmotionControls={true}
              onEmotionChange={setManualEmotion2}
            />
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

