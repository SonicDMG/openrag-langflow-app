'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DnDClass, BattleLog, CharacterEmotion, Ability, AttackAbility } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, isMonster, FALLBACK_ABILITIES, FALLBACK_MONSTER_ABILITIES, selectRandomAbilities } from '../constants';
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../utils/dice';
import { generateCharacterName, generateDeterministicCharacterName } from '../utils/names';
import { createHitVisualEffects, createMissVisualEffects, createHealingVisualEffects, getOpponent, buildDamageDiceArray, getProjectileType, type PendingVisualEffect, type ProjectileType } from '../utils/battle';
import { FloatingNumber, FloatingNumberType } from '../components/FloatingNumber';
import { CharacterCard } from '../components/CharacterCard';
import { ClassSelection } from '../components/ClassSelection';
import { useAIOpponent } from '../hooks/useAIOpponent';
import { PageHeader } from '../components/PageHeader';
import { LandscapePrompt } from '../components/LandscapePrompt';
import { ProjectileEffect } from '../components/ProjectileEffect';

// Hooks
import { useBattleData } from '../hooks/useBattleData';
import { useBattleState } from '../hooks/useBattleState';
import { useBattleEffects } from '../hooks/useBattleEffects';
import { useProjectileEffects } from '../hooks/useProjectileEffects';
import { useBattleActions } from '../hooks/useBattleActions';
import { useBattleNarrative } from '../hooks/useBattleNarrative';

// Mock battle narrative generator (doesn't call agent)
const mockBattleNarrative = (eventDescription: string): string => {
  return `[MOCK] ${eventDescription}`;
};

export default function DnDTestPage() {
  const router = useRouter();
  
  // Data loading hook
  const {
    availableClasses,
    isLoadingClasses,
    classesLoaded,
    availableMonsters,
    isLoadingMonsters,
    monstersLoaded,
    createdMonsters,
    isLoadingCreatedMonsters,
  } = useBattleData();
  
  // Battle state hook
  const battleState = useBattleState();
  const {
    player1Class,
    player2Class,
    player1Name,
    player2Name,
    player1MonsterId,
    player2MonsterId,
    setPlayer1Class,
    setPlayer2Class,
    setPlayer1Name,
    setPlayer2Name,
    setPlayer1MonsterId,
    setPlayer2MonsterId,
    setPlayerClassWithMonster,
    isBattleActive,
    setIsBattleActive,
    currentTurn,
    setCurrentTurn,
    isMoveInProgress,
    setIsMoveInProgress,
    battleLog,
    setBattleLog,
    isOpponentAutoPlaying,
    setIsOpponentAutoPlaying,
    classDetails,
    setClassDetails,
    isLoadingClassDetails,
    setIsLoadingClassDetails,
    opponentType,
    setOpponentType,
    previousTurnRef,
    addLog,
    updatePlayerHP,
    switchTurn: switchTurnBase,
    resetBattle: resetBattleBase,
  } = battleState;
  
  // Visual effects hook
  const battleEffects = useBattleEffects();
  const {
    shakingPlayer,
    shakeTrigger,
    shakeIntensity,
    sparklingPlayer,
    sparkleTrigger,
    sparkleIntensity,
    missingPlayer,
    missTrigger,
    hittingPlayer,
    hitTrigger,
    castingPlayer,
    castTrigger,
    flashingPlayer,
    flashTrigger,
    flashProjectileType,
    castProjectileType,
    defeatedPlayer,
    victorPlayer,
    confettiTrigger,
    floatingNumbers,
    setDefeatedPlayer,
    setVictorPlayer,
    setConfettiTrigger,
    applyVisualEffect,
    triggerFlashEffect,
    showFloatingNumbers,
    handleFloatingNumberComplete,
    handleShakeComplete,
    handleSparkleComplete,
    handleMissComplete,
    handleHitComplete,
    handleCastComplete,
    handleFlashComplete,
    resetEffects,
  } = battleEffects;
  
  // Projectile effects hook
  const {
    projectileEffects,
    showProjectileEffect,
    removeProjectileEffect,
    clearProjectileTracking,
  } = useProjectileEffects();
  
  // Narrative hook (kept for compatibility, but not used for play-by-play)
  const narrative = useBattleNarrative(addLog);
  const {
    battleResponseId,
    setBattleResponseId,
    isWaitingForAgent,
    setIsWaitingForAgent,
    clearNarrativeQueue,
    resetNarrative,
  } = narrative;
  
  // Type selection for player 2 only (player 1 is always a class)
  const [player2Type, setPlayer2Type] = useState<'class' | 'monster'>('class');
  
  // Scroll ref for monster selection
  const monsterScrollRef = useRef<HTMLDivElement>(null);
  
  // Custom heroes and monsters from database (for filtering)
  const [customHeroes, setCustomHeroes] = useState<DnDClass[]>([]);
  const [customMonsters, setCustomMonsters] = useState<DnDClass[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);
  
  // Helper to find associated monster for a class/monster type
  const findAssociatedMonster = useCallback((className: string): (DnDClass & { monsterId: string; imageUrl: string }) | null => {
    const associated = createdMonsters
      .filter(m => {
        const monsterKlass = (m as any).klass;
        return monsterKlass ? monsterKlass === className : m.name === className;
      })
      .sort((a, b) => {
        const aTime = (a as any).lastAssociatedAt || (a as any).createdAt || '';
        const bTime = (b as any).lastAssociatedAt || (b as any).createdAt || '';
        if (aTime && bTime) {
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }
        return b.monsterId.localeCompare(a.monsterId);
      });
    return associated.length > 0 ? associated[0] : null;
  }, [createdMonsters]);
  
  // Helper to create a test class/monster preserving actual abilities and monster metadata
  const createTestEntity = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }): DnDClass & { monsterId?: string; imageUrl?: string } => {
    return {
      ...entity,
      hitPoints: entity.maxHitPoints,
      abilities: entity.abilities && entity.abilities.length > 0 ? entity.abilities : [],
      ...(entity.monsterId && { monsterId: entity.monsterId }),
      ...(entity.imageUrl && { imageUrl: entity.imageUrl }),
    };
  }, []);

  // Enhanced setPlayerClassWithMonster that includes findAssociatedMonster
  const setPlayerClassWithMonsterEnhanced = useCallback((
    player: 'player1' | 'player2',
    dndClass: DnDClass & { monsterId?: string; imageUrl?: string },
    name?: string
  ) => {
    setPlayerClassWithMonster(player, dndClass, name, findAssociatedMonster);
  }, [setPlayerClassWithMonster, findAssociatedMonster]);
  
  // Handle player 1 selection
  const handlePlayer1Select = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }) => {
    const testEntity = createTestEntity(entity);
    setPlayerClassWithMonsterEnhanced('player1', testEntity);
  }, [createTestEntity, setPlayerClassWithMonsterEnhanced]);
  
  // Handle player 2 selection
  const handlePlayer2Select = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }) => {
    const testEntity = createTestEntity(entity);
    setPlayerClassWithMonsterEnhanced('player2', testEntity);
  }, [createTestEntity, setPlayerClassWithMonsterEnhanced]);
  
  // Update monster IDs when createdMonsters loads or changes
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
  }, [createdMonsters, player1Class, player2Class, player1MonsterId, player2MonsterId, findAssociatedMonster, setPlayer1MonsterId, setPlayer2MonsterId]);
  
  // Initialize default classes on mount
  useEffect(() => {
    if (!player1Class && availableClasses.length > 0) {
      const defaultClass = createTestEntity(availableClasses[0]);
      setPlayerClassWithMonsterEnhanced('player1', defaultClass);
    }
    if (!player2Class && availableClasses.length > 1) {
      const defaultClass = createTestEntity(availableClasses[1]);
      setPlayerClassWithMonsterEnhanced('player2', defaultClass);
    }
  }, [availableClasses, player1Class, player2Class, createTestEntity, setPlayerClassWithMonsterEnhanced]);
  
  // Refs for character cards to position floating numbers
  const player1CardRef = useRef<HTMLDivElement | null>(null);
  const player2CardRef = useRef<HTMLDivElement | null>(null);
  
  const [manualEmotion1, setManualEmotion1] = useState<CharacterEmotion | null>(null);
  const [manualEmotion2, setManualEmotion2] = useState<CharacterEmotion | null>(null);
  const [isAIModeActive, setIsAIModeActive] = useState(false);
  const [particleEffectsEnabled, setParticleEffectsEnabled] = useState(true);
  const [flashEffectsEnabled, setFlashEffectsEnabled] = useState(true);
  const [shakeEffectsEnabled, setShakeEffectsEnabled] = useState(true);
  const [sparkleEffectsEnabled, setSparkleEffectsEnabled] = useState(true);
  const [hitEffectsEnabled, setHitEffectsEnabled] = useState(true);
  const [missEffectsEnabled, setMissEffectsEnabled] = useState(true);
  const [castEffectsEnabled, setCastEffectsEnabled] = useState(true);
  
  // Load custom heroes and monsters from database (for filtering in UI)
  useEffect(() => {
    const loadCustomCharacters = async () => {
      setIsLoadingCustom(true);
      try {
        // Load custom heroes
        const heroesResponse = await fetch('/api/heroes');
        if (heroesResponse.ok) {
          const heroesData = await heroesResponse.json();
          const custom = (heroesData.heroes || []).filter((h: DnDClass) => 
            !FALLBACK_CLASSES.some(fc => fc.name === h.name)
          );
          setCustomHeroes(custom);
        }

        // Load custom monsters
        const monstersResponse = await fetch('/api/monsters-db');
        if (monstersResponse.ok) {
          const monstersData = await monstersResponse.json();
          const custom = (monstersData.monsters || []).filter((m: DnDClass) => 
            !FALLBACK_MONSTERS.some(fm => fm.name === m.name)
          );
          setCustomMonsters(custom);
        }
      } catch (error) {
        console.error('Failed to load custom characters:', error);
      } finally {
        setIsLoadingCustom(false);
      }
    };

    loadCustomCharacters();
  }, []);
  // Enhanced switchTurn - no narrative processing during battle
  const switchTurn = useCallback(async (attacker: 'player1' | 'player2' | 'support1' | 'support2') => {
    await switchTurnBase(attacker, defeatedPlayer, async () => {});
  }, [switchTurnBase, defeatedPlayer]);
  
  // Helper function to handle victory condition (simplified for test page)
  const handleVictory = useCallback(async (
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    damage: number,
    attackerDetails: string = '',
    defenderDetails: string = '',
    eventDescription: string,
    defender: 'player1' | 'player2'
  ): Promise<void> => {
    setDefeatedPlayer(defender);
    const victor = defender === 'player1' ? 'player2' : 'player1';
    setVictorPlayer(victor);
    setConfettiTrigger(prev => prev + 1);
    
    showFloatingNumbers(
      [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: defender, persistent: true }],
      [],
      []
    );
    
    addLog('system', `🏆 ${attackerClass.name} wins! ${defenderClass.name} has been defeated!`);
  }, [addLog, showFloatingNumbers, setDefeatedPlayer, setVictorPlayer, setConfettiTrigger]);
  
  // Wrapper functions that respect test mode toggles
  const applyVisualEffectWithToggles = useCallback((effect: PendingVisualEffect) => {
    // Respect effect toggles in test mode
    switch (effect.type) {
      case 'shake':
        if (!shakeEffectsEnabled) return;
        break;
      case 'sparkle':
        if (!sparkleEffectsEnabled) return;
        break;
      case 'miss':
        if (!missEffectsEnabled) return;
        break;
      case 'hit':
        if (!hitEffectsEnabled) return;
        break;
      case 'cast':
        if (!castEffectsEnabled) return;
        break;
    }
    applyVisualEffect(effect);
  }, [shakeEffectsEnabled, sparkleEffectsEnabled, missEffectsEnabled, hitEffectsEnabled, castEffectsEnabled, applyVisualEffect]);
  
  const triggerFlashEffectWithToggles = useCallback((attacker: 'player1' | 'player2' | 'support1' | 'support2', projectileType?: ProjectileType) => {
    if (!flashEffectsEnabled) return;
    triggerFlashEffect(attacker, projectileType);
  }, [flashEffectsEnabled, triggerFlashEffect]);
  
  const showProjectileEffectWithToggles = useCallback((
    fromPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    toPlayer: 'player1' | 'player2' | 'support1' | 'support2',
    isHit: boolean,
    onHit?: () => void,
    onComplete?: () => void,
    fromCardRotation?: number,
    delay?: number,
    projectileType?: ProjectileType
  ) => {
    // If particle effects are disabled, execute callbacks immediately
    if (!particleEffectsEnabled) {
      if (isHit && onHit) {
        setTimeout(() => onHit(), 50);
      }
      if (onComplete) {
        setTimeout(() => onComplete(), isHit ? 100 : 150);
      }
      return;
    }
    showProjectileEffect(fromPlayer, toPlayer, isHit, onHit, onComplete, fromCardRotation, delay, projectileType);
  }, [particleEffectsEnabled, showProjectileEffect]);
  
  // Battle actions hook
  const battleActions = useBattleActions({
    player1Class,
    player2Class,
    supportHeroes: [],
    isBattleActive: true, // Always allow actions in test mode
    isMoveInProgress,
    classDetails,
    defeatedPlayer,
    setIsMoveInProgress,
    updatePlayerHP,
    addLog,
    applyVisualEffect: applyVisualEffectWithToggles,
    triggerFlashEffect: triggerFlashEffectWithToggles,
    showFloatingNumbers,
    showProjectileEffect: showProjectileEffectWithToggles,
    clearProjectileTracking,
    switchTurn,
    handleVictory,
    setDefeatedPlayer,
  });
  const { performAttack, useAbility } = battleActions;
  
  // Helper to safely get player class
  const getPlayerClass = useCallback((player: 'player1' | 'player2'): DnDClass | null => {
    return player === 'player1' ? player1Class : player2Class;
  }, [player1Class, player2Class]);
  
  // Test functions
  const testDiceRoll = () => {
    // Show random numbers floating on both cards
    const numbers: Array<{ value: number | string; type: FloatingNumberType; targetPlayer: 'player1' | 'player2' }> = [
      { value: Math.floor(Math.random() * 20) + 1, type: 'attack-roll', targetPlayer: 'player1' },
      { value: Math.floor(Math.random() * 10) + 1, type: 'damage', targetPlayer: 'player2' },
      { value: Math.floor(Math.random() * 8) + 1, type: 'damage', targetPlayer: 'player1' },
      { value: Math.floor(Math.random() * 6) + 1, type: 'healing', targetPlayer: 'player2' },
    ];
    showFloatingNumbers(numbers, [], []);
    addLog('system', '🎲 Test floating numbers triggered');
  };
  
  // Use shared performAttack for test attacks
  const testAttackHit = (attacker: 'player1' | 'player2') => {
    performAttack(attacker);
  };
  
  const testCast = (attacker: 'player1' | 'player2') => {
    const attackerClass = getPlayerClass(attacker);
    if (!attackerClass) return;
    // Directly trigger cast effect using hook
    applyVisualEffectWithToggles({ type: 'cast', player: attacker });
    addLog('system', `🔮 Cast effect triggered for ${attackerClass.name}`);
  };

  const testAttackMiss = (attacker: 'player1' | 'player2') => {
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    if (!attackerClass || !defenderClass) return;
    
    const defender = getOpponent(attacker);
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (misses AC ${defenderClass.armorClass})`);
    
    // Get projectile type for flash effect
    const projectileType = getProjectileType(null, undefined, attackerClass.name);
    // Trigger flash effect on attacking card with projectile type
    triggerFlashEffectWithToggles(attacker, projectileType);
    
    // Trigger cast effect immediately if present
    const missVisualEffects = createMissVisualEffects(attacker, attackerClass);
    const castEffect = missVisualEffects.find(effect => effect.type === 'cast');
    if (castEffect) {
      applyVisualEffectWithToggles(castEffect);
    }
    
    // Show projectile effect that misses the target
    const cardRotation = attacker === 'player1' ? -5 : 5;
    showProjectileEffectWithToggles(
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
            () => {
              addLog('attack', `❌ ${attackerClass.name} misses!`);
              addLog('narrative', mockBattleNarrative(`${attackerClass.name} attacks ${defenderClass.name} but misses.`));
              // Switch turns after miss
              switchTurn(attacker);
            }
          ]
        );
      },
      cardRotation,
      undefined, // delay
      projectileType
    );
  };
  
  const testHeal = (player: 'player1' | 'player2') => {
    const playerClass = getPlayerClass(player);
    if (!playerClass) return;
    
    const heal = rollDiceWithNotation('1d8+3');
    
    addLog('roll', `✨ ${playerClass.name} uses Test Heal!`);
    
    const newHP = Math.min(playerClass.maxHitPoints, playerClass.hitPoints + heal);
    
    // Build visual effects array using the proper helper function (includes cast effect for spell-casting classes)
    const visualEffects = createHealingVisualEffects(player, heal, playerClass);
    
    // Show floating healing number immediately
    showFloatingNumbers(
      [{ value: heal, type: 'healing', targetPlayer: player }],
      visualEffects,
      [
        () => updatePlayerHP(player, newHP),
        () => {
          addLog('ability', `💚 ${playerClass.name} heals for ${heal} HP!`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} uses Test Heal and recovers ${heal} HP.`));
          // Switch turns after heal
          switchTurn(player);
        }
      ]
    );
  };
  
  const testLowDamage = (target: 'player1' | 'player2') => {
    const targetClass = getPlayerClass(target);
    if (!targetClass) return;
    const attackerName = target === 'player1' ? 'Test Attacker' : 'Test Attacker';
    
    // Deal minimal damage (1-2 HP) to test low intensity shake
    const damage = Math.floor(Math.random() * 2) + 1; // 1 or 2 damage
    
    addLog('roll', `💥 ${attackerName} uses Low Damage Test!`);
    
    const newHP = Math.max(0, targetClass.hitPoints - damage);
    
    // Show floating damage number immediately
    showFloatingNumbers(
      [{ value: damage, type: 'damage', targetPlayer: target }],
      [{ type: 'shake', player: target, intensity: damage }],
      [
        () => updatePlayerHP(target, newHP),
        () => {
          addLog('attack', `💥 ${attackerName} deals ${damage} damage to ${targetClass.name}! (Low damage test)`);
          addLog('narrative', mockBattleNarrative(`${attackerName} deals minimal ${damage} damage to ${targetClass.name}!`));
          
          if (newHP <= 0) {
            setDefeatedPlayer(target);
            
            // Show floating "DEFEATED!" text (persistent - stays on card)
            showFloatingNumbers(
              [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: target, persistent: true }],
              [],
              []
            );
            
            addLog('system', `💀 ${targetClass.name} is defeated!`);
          }
        }
      ]
    );
  };

  const testLowHeal = (player: 'player1' | 'player2') => {
    const playerClass = getPlayerClass(player);
    if (!playerClass) return;
    const heal = Math.floor(Math.random() * 2) + 1; // 1 or 2 healing
    
    addLog('roll', `✨ ${playerClass.name} uses Low Heal!`);
    
    const newHP = Math.min(playerClass.maxHitPoints, playerClass.hitPoints + heal);
    
    // Show floating healing number immediately
    showFloatingNumbers(
      [{ value: heal, type: 'healing', targetPlayer: player }],
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
    const targetClass = getPlayerClass(target);
    if (!targetClass) return;
    const attackerName = target === 'player1' ? 'Test Attacker' : 'Test Attacker';
    
    // Calculate high damage (40% of max HP or 50% of current HP, whichever is larger)
    const damageFromMaxPercent = Math.ceil(targetClass.maxHitPoints * 0.4);
    const damageFromCurrentPercent = Math.ceil(targetClass.hitPoints * 0.5);
    const damage = Math.max(damageFromMaxPercent, damageFromCurrentPercent);
    
    addLog('roll', `💥 ${attackerName} uses High Damage Test!`);
    
    const newHP = Math.max(0, targetClass.hitPoints - damage);
    
    // Show floating damage number immediately
    showFloatingNumbers(
      [{ value: damage, type: 'damage', targetPlayer: target }],
      [{ type: 'shake', player: target, intensity: damage }],
      [
        () => updatePlayerHP(target, newHP),
        () => {
          addLog('attack', `💥 ${attackerName} deals ${damage} damage to ${targetClass.name}!`);
          addLog('narrative', mockBattleNarrative(`${attackerName} deals massive ${damage} damage to ${targetClass.name}!`));
          
          if (newHP <= 0) {
            setDefeatedPlayer(target);
            
            // Show floating "DEFEATED!" text (persistent - stays on card)
            showFloatingNumbers(
              [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: target, persistent: true }],
              [],
              []
            );
            
            addLog('system', `💀 ${targetClass.name} is defeated!`);
          }
        }
      ]
    );
  };
  
  const testFullHeal = (player: 'player1' | 'player2') => {
    const playerClass = getPlayerClass(player);
    if (!playerClass) return;
    const healAmount = playerClass.maxHitPoints - playerClass.hitPoints;
    
    if (healAmount <= 0) {
      addLog('system', `💚 ${playerClass.name} is already at full health!`);
      return;
    }
    
    addLog('roll', `✨ ${playerClass.name} uses Full Heal!`);
    
    // Show floating healing number immediately
    showFloatingNumbers(
      [{ value: healAmount, type: 'healing', targetPlayer: player }],
      [{ type: 'sparkle', player, intensity: healAmount }],
      [
        () => updatePlayerHP(player, playerClass.maxHitPoints),
        () => {
          addLog('ability', `💚 ${playerClass.name} fully heals to ${playerClass.maxHitPoints} HP!`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} is fully restored to maximum health!`));
        }
      ]
    );
  };

  // Test ability handler - uses shared useAbility from battle actions
  const testUseAbility = (player: 'player1' | 'player2', abilityIndex: number) => {
    useAbility(player, abilityIndex);
  };
  
  // Use AI opponent hook
  const aiOpponentCleanup = useAIOpponent({
    isActive: isAIModeActive,
    currentTurn,
    isMoveInProgress,
    defeatedPlayer,
    opponentClass: player2Class,
    playerId: 'player2', // Which player this AI controls
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
    if (player1Class) {
      updatePlayerHP('player1', player1Class.maxHitPoints);
    }
    if (player2Class) {
      updatePlayerHP('player2', player2Class.maxHitPoints);
    }
    setBattleLog([]);
    setDefeatedPlayer(null);
    setVictorPlayer(null);
    resetEffects();
    clearProjectileTracking();
    setManualEmotion1(null);
    setManualEmotion2(null);
    setCurrentTurn('player1');
    setIsMoveInProgress(false);
    setIsOpponentAutoPlaying(false);
    aiOpponentCleanup.cleanup();
    addLog('system', '🔄 Test reset');
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
        title="Test"
        title2="Page"
        decalImageUrl="/cdn/decals/test-page.png"
      />

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
                  availableClasses={[...FALLBACK_CLASSES, ...customHeroes]}
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
                        setPlayer2Name(generateDeterministicCharacterName(firstClass.name));
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
                    availableClasses={[...FALLBACK_CLASSES, ...customHeroes]}
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
                        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-4 px-10"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }}
                      >
                        {[...FALLBACK_MONSTERS, ...customMonsters].map((monster, index) => {
                          const isSelected = player2Class?.name === monster.name;
                          // For created monsters, use klass to find associated monster; for regular monsters, use name
                          const isCreatedMonster = !!(monster as any).klass && !!(monster as any).monsterId;
                          const lookupName = isCreatedMonster ? (monster as any).klass : monster.name;
                          const associatedMonster = findAssociatedMonster(lookupName);
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
                          
                          return (
                            <div
                              key={monster.name}
                              onClick={() => handlePlayer2Select(createTestEntity(monster))}
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
                                totalCards={FALLBACK_MONSTERS.length + customMonsters.length}
                                isSelected={isSelected}
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
            {player1Class && (
            <div ref={player1CardRef} className="relative z-10 space-y-3" style={{ transform: 'rotate(-5deg)', overflow: 'visible' }}>
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
                onAttack={() => {
                  setIsMoveInProgress(true);
                  testAttackHit('player1');
                }}
                onUseAbility={(index) => {
                  testUseAbility('player1', index);
                }}
                isOpponent={false}
                isMoveInProgress={isMoveInProgress}
                shouldShake={shakingPlayer === 'player1'}
                shouldSparkle={sparklingPlayer === 'player1'}
                shouldMiss={missingPlayer === 'player1'}
                shouldHit={hittingPlayer === 'player1'}
                shouldCast={castingPlayer === 'player1'}
                shouldFlash={flashingPlayer === 'player1'}
                castTrigger={castTrigger.player1}
                flashTrigger={flashTrigger.player1}
                flashProjectileType={flashProjectileType.player1}
                castProjectileType={castProjectileType.player1}
                shakeTrigger={shakeTrigger.player1}
                sparkleTrigger={sparkleTrigger.player1}
                missTrigger={missTrigger.player1}
                hitTrigger={hitTrigger.player1}
                shakeIntensity={shakeIntensity.player1}
                sparkleIntensity={sparkleIntensity.player1}
                isActive={currentTurn === 'player1'}
                isDefeated={defeatedPlayer === 'player1'}
                isVictor={victorPlayer === 'player1'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={handleShakeComplete}
                onSparkleComplete={handleSparkleComplete}
                onMissComplete={handleMissComplete}
                onHitComplete={handleHitComplete}
                onCastComplete={handleCastComplete}
                onFlashComplete={handleFlashComplete}
                allowAllTurns={!isAIModeActive}
                imageMarginBottom="1.75rem"
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
                <button
                  onClick={() => testCast('player1')}
                  className="px-2 py-1 bg-purple-800 hover:bg-purple-700 text-purple-100 text-xs rounded border border-purple-600 transition-all"
                >
                  🔮 Test Cast
                </button>
              </div>
            </div>
            )}
            {/* VS Graphic */}
            <div className="relative z-10 flex-shrink-0">
              <span className="text-5xl md:text-6xl font-bold" style={{ color: '#E0D9C9', fontFamily: 'serif' }}>
                VS
              </span>
            </div>
            {/* Right Card - Rotated clockwise (outward) */}
            {player2Class && (
            <div ref={player2CardRef} className="relative z-10 space-y-3" style={{ transform: 'rotate(5deg)', overflow: 'visible' }}>
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
                onAttack={() => {
                  if (isAIModeActive) return; // Don't allow manual control in AI mode
                  setIsMoveInProgress(true);
                  testAttackHit('player2');
                }}
                onUseAbility={(index) => {
                  if (isAIModeActive) return; // Don't allow manual control in AI mode
                  testUseAbility('player2', index);
                }}
                isOpponent={true}
                isMoveInProgress={isMoveInProgress}
                shouldShake={shakingPlayer === 'player2'}
                shouldSparkle={sparklingPlayer === 'player2'}
                shouldMiss={missingPlayer === 'player2'}
                shouldHit={hittingPlayer === 'player2'}
                shouldCast={castingPlayer === 'player2'}
                shouldFlash={flashingPlayer === 'player2'}
                castTrigger={castTrigger.player2}
                flashTrigger={flashTrigger.player2}
                flashProjectileType={flashProjectileType.player2}
                castProjectileType={castProjectileType.player2}
                shakeTrigger={shakeTrigger.player2}
                sparkleTrigger={sparkleTrigger.player2}
                missTrigger={missTrigger.player2}
                hitTrigger={hitTrigger.player2}
                shakeIntensity={shakeIntensity.player2}
                sparkleIntensity={sparkleIntensity.player2}
                isActive={currentTurn === 'player2'}
                isDefeated={defeatedPlayer === 'player2'}
                isVictor={victorPlayer === 'player2'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={handleShakeComplete}
                onSparkleComplete={handleSparkleComplete}
                onMissComplete={handleMissComplete}
                onHitComplete={handleHitComplete}
                onCastComplete={handleCastComplete}
                onFlashComplete={handleFlashComplete}
                allowAllTurns={!isAIModeActive}
                imageMarginBottom="1.75rem"
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
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testCast('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-purple-800 hover:bg-purple-700 text-purple-100 text-xs rounded border border-purple-600 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🔮 Test Cast
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Projectile Type Test Buttons */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <h3 className="text-lg font-bold text-amber-100" style={{ fontFamily: 'serif' }}>
                Test Projectile Types
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-amber-200 font-semibold">Effects:</label>
                {/* Particle Effects Toggle */}
                <button
                  onClick={() => {
                    setParticleEffectsEnabled(!particleEffectsEnabled);
                    addLog('system', `🎨 Particle effects ${!particleEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    particleEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Particle Effects"
                >
                  Particle: {particleEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Flash Effects Toggle */}
                <button
                  onClick={() => {
                    setFlashEffectsEnabled(!flashEffectsEnabled);
                    addLog('system', `⚡ Flash effects ${!flashEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    flashEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Flash/Glow Effects"
                >
                  Flash: {flashEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Shake Effects Toggle */}
                <button
                  onClick={() => {
                    setShakeEffectsEnabled(!shakeEffectsEnabled);
                    addLog('system', `💥 Shake effects ${!shakeEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    shakeEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Shake Effects"
                >
                  Shake: {shakeEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Sparkle Effects Toggle */}
                <button
                  onClick={() => {
                    setSparkleEffectsEnabled(!sparkleEffectsEnabled);
                    addLog('system', `✨ Sparkle effects ${!sparkleEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    sparkleEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Sparkle Effects"
                >
                  Sparkle: {sparkleEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Hit Effects Toggle */}
                <button
                  onClick={() => {
                    setHitEffectsEnabled(!hitEffectsEnabled);
                    addLog('system', `⚔️ Hit effects ${!hitEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    hitEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Hit Effects"
                >
                  Hit: {hitEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Miss Effects Toggle */}
                <button
                  onClick={() => {
                    setMissEffectsEnabled(!missEffectsEnabled);
                    addLog('system', `❌ Miss effects ${!missEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    missEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Miss Effects"
                >
                  Miss: {missEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Cast Effects Toggle */}
                <button
                  onClick={() => {
                    setCastEffectsEnabled(!castEffectsEnabled);
                    addLog('system', `🔮 Cast effects ${!castEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    castEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Cast Effects"
                >
                  Cast: {castEffectsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {(['fire', 'ice', 'water', 'earth', 'air', 'poison', 'psychic', 'necrotic', 'radiant', 'lightning', 'acid', 'melee', 'ranged', 'magic', 'shadow'] as ProjectileType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const attacker = 'player1';
                    const defender = 'player2';
                    const cardRotation = attacker === 'player1' ? -5 : 5;
                    // Trigger flash effect on attacking card with projectile type
                    triggerFlashEffectWithToggles(attacker, type);
                    // Trigger cast effect for spell-casting classes
                    if (player1Class && player2Class) {
                      const visualEffects = createHitVisualEffects(attacker, defender, 5, player2Class, player1Class);
                      const castEffect = visualEffects.find(effect => effect.type === 'cast');
                      if (castEffect) {
                        applyVisualEffectWithToggles(castEffect);
                      }
                    }
                    if (!player1Class || !player2Class) return;
                    showProjectileEffectWithToggles(
                      attacker,
                      defender,
                      true, // isHit
                      () => {
                        const damage = 5;
                        const defenderClass = player2Class;
                        const newHP = Math.max(0, defenderClass.hitPoints - damage);
                        const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, player1Class)
                          .find(effect => effect.type === 'shake');
                        if (shakeEffect) {
                          applyVisualEffectWithToggles(shakeEffect);
                        }
                        showFloatingNumbers(
                          [{ value: damage, type: 'damage', targetPlayer: defender }],
                          createHitVisualEffects(attacker, defender, damage, defenderClass, player1Class)
                            .filter(effect => effect.type !== 'shake'),
                          [
                            () => updatePlayerHP(defender, newHP),
                            () => addLog('system', `🧪 Test ${type} projectile`)
                          ]
                        );
                      },
                      undefined, // onComplete
                      cardRotation,
                      undefined, // delay
                      type
                    );
                  }}
                  className="py-2 px-3 bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold rounded border border-amber-600 transition-all capitalize"
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => {
                  if (!player1Class) return;
                  const attacker = 'player1';
                  const defender = 'player2';
                  const cardRotation = attacker === 'player1' ? -5 : 5;
                  // Trigger flash effect on attacking card with projectile type
                  triggerFlashEffectWithToggles(attacker, 'magic');
                  showProjectileEffectWithToggles(
                    attacker,
                    defender,
                    false, // isHit - miss
                    undefined, // onHit
                    () => {
                      showFloatingNumbers(
                        [{ value: 'MISS', type: 'miss', targetPlayer: attacker }],
                        createMissVisualEffects(attacker, player1Class),
                        [() => addLog('system', '🧪 Test projectile miss')]
                      );
                    },
                    cardRotation,
                    undefined, // delay
                    'magic'
                  );
                }}
                className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded border border-gray-500 transition-all"
              >
                Test Miss
              </button>
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


