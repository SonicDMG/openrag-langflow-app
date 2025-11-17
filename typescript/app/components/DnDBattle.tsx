'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

// Types
import { DnDClass } from '../dnd/types';

// Constants
import { FALLBACK_ABILITIES, FALLBACK_MONSTER_ABILITIES, selectRandomAbilities, isMonster } from '../dnd/constants';

// Utilities
import { generateCharacterName } from '../dnd/utils/names';
import { getOpponent } from '../dnd/utils/battle';

// Hooks
import { useAIOpponent } from '../dnd/hooks/useAIOpponent';
import { useBattleData } from '../dnd/hooks/useBattleData';
import { useBattleState } from '../dnd/hooks/useBattleState';
import { useBattleEffects } from '../dnd/hooks/useBattleEffects';
import { useProjectileEffects } from '../dnd/hooks/useProjectileEffects';
import { useBattleNarrative } from '../dnd/hooks/useBattleNarrative';
import { useBattleActions } from '../dnd/hooks/useBattleActions';

// Services
import { getBattleSummary } from '../dnd/services/apiService';

// Components
import { ClassSelection } from '../dnd/components/ClassSelection';
import { FloatingNumber } from '../dnd/components/FloatingNumber';
import { PageHeader } from '../dnd/components/PageHeader';
import { LandscapePrompt } from '../dnd/components/LandscapePrompt';
import { ProjectileEffect } from '../dnd/components/ProjectileEffect';
import { BattleArena } from '../dnd/components/BattleArena';
import { BattleLog } from '../dnd/components/BattleLog';
import { OpponentSelector } from '../dnd/components/OpponentSelector';
import { BattleSummaryOverlay } from '../dnd/components/BattleSummaryOverlay';

export default function DnDBattle() {
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
    currentPlayer1ClassRef,
    currentPlayer2ClassRef,
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
    selectionSyncTrigger,
    floatingNumbers,
    setDefeatedPlayer,
    setVictorPlayer,
    setConfettiTrigger,
    setSelectionSyncTrigger,
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

  // Battle summary overlay state
  const [battleSummary, setBattleSummary] = useState<string>('');
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Helper to find associated monster for a class/monster type
  const findAssociatedMonster = useCallback((className: string): (DnDClass & { monsterId: string; imageUrl: string }) | null => {
    const associated = createdMonsters
      .filter(m => m.name === className)
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

  // Enhanced setPlayerClassWithMonster that includes findAssociatedMonster
  const setPlayerClassWithMonsterEnhanced = useCallback((
    player: 'player1' | 'player2',
    dndClass: DnDClass & { monsterId?: string; imageUrl?: string },
    name?: string
  ) => {
    setPlayerClassWithMonster(player, dndClass, name, findAssociatedMonster);
  }, [setPlayerClassWithMonster, findAssociatedMonster]);

  // Enhanced switchTurn - no narrative processing during battle
  const switchTurn = useCallback(async (attacker: 'player1' | 'player2') => {
    await switchTurnBase(attacker, defeatedPlayer, async () => {});
  }, [switchTurnBase, defeatedPlayer]);

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
    
    // Show overlay immediately
    setIsSummaryVisible(true);
    setBattleSummary(''); // Start with empty summary
    
    // Generate battle summary with streaming
    setIsGeneratingSummary(true);
    try {
      const victorName = victor === 'player1' ? (player1Name || attackerClass.name) : (player2Name || attackerClass.name);
      const defeatedName = defender === 'player1' ? (player1Name || defenderClass.name) : (player2Name || defenderClass.name);
      
      await getBattleSummary(
        battleLog,
        attackerClass,
        { ...defenderClass, hitPoints: 0 },
        attackerDetails,
        defenderDetails,
        victorName,
        defeatedName,
        (chunk: string) => {
          // Stream the summary as it arrives
          setBattleSummary(chunk);
        }
      );
    } catch (error) {
      console.error('Error generating battle summary:', error);
      addLog('system', 'Failed to generate battle summary.');
      setBattleSummary('The battle concluded with a decisive victory.');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [addLog, showFloatingNumbers, setDefeatedPlayer, setVictorPlayer, setConfettiTrigger, battleLog, player1Name, player2Name]);

  // Battle actions hook
  const battleActions = useBattleActions({
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
  });
  const { performAttack, useAbility } = battleActions;

  // Refs for character cards and battle elements
  const player1CardRef = useRef<HTMLDivElement | null>(null);
  const player2CardRef = useRef<HTMLDivElement | null>(null);
  const battleCardsRef = useRef<HTMLDivElement | null>(null);
  const battleLogRef = useRef<HTMLDivElement | null>(null);

  // Function to trigger drop animation manually (for testing)
  const triggerDropAnimation = useCallback(() => {
    const triggerAnimation = () => {
      if (battleCardsRef.current && battleLogRef.current) {
        battleCardsRef.current.classList.remove('battle-drop');
        battleLogRef.current.classList.remove('battle-log-drop');
        
        void battleCardsRef.current.offsetWidth;
        void battleLogRef.current.offsetWidth;
        
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
        requestAnimationFrame(triggerAnimation);
      }
    };
    
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

  // Wrapper function to generate name when player selects their class
  // Also auto-selects a random opponent based on opponentType
  const handlePlayer1Select = useCallback((dndClass: DnDClass & { monsterId?: string; imageUrl?: string }) => {
    setPlayerClassWithMonsterEnhanced('player1', dndClass);
    
    // Auto-select a random opponent based on opponentType
    if (opponentType === 'monster') {
      const availableOpponents = availableMonsters;
      if (availableOpponents.length > 0) {
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        setPlayerClassWithMonsterEnhanced('player2', randomOpponent, randomOpponent.name);
      }
    } else {
      const availableOpponents = availableClasses.filter(cls => cls.name !== dndClass.name);
      if (availableOpponents.length > 0) {
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        setPlayerClassWithMonsterEnhanced('player2', randomOpponent);
      } else {
        const fallbackOpponent = availableClasses[0];
        if (fallbackOpponent) {
          setPlayerClassWithMonsterEnhanced('player2', fallbackOpponent);
        }
      }
    }
  }, [availableClasses, availableMonsters, opponentType, setPlayerClassWithMonsterEnhanced]);

  const startBattle = async () => {
    if (!player1Class || !player2Class) {
      addLog('system', 'Please select your character!');
      return;
    }

    if (isLoadingClassDetails || isBattleActive) {
      return;
    }

    setIsLoadingClassDetails(true);

    try {
      const p1IsMonster = isMonster(player1Class.name);
      const p2IsMonster = isMonster(player2Class.name);
      const p1AvailableAbilities = player1Class.abilities || (p1IsMonster ? FALLBACK_MONSTER_ABILITIES[player1Class.name] : FALLBACK_ABILITIES[player1Class.name]) || [];
      const p2AvailableAbilities = player2Class.abilities || (p2IsMonster ? FALLBACK_MONSTER_ABILITIES[player2Class.name] : FALLBACK_ABILITIES[player2Class.name]) || [];
      
      const p1Abilities = selectRandomAbilities(p1AvailableAbilities);
      const p2Abilities = selectRandomAbilities(p2AvailableAbilities);
      
      setClassDetails({
        [player1Class.name]: '',
        [player2Class.name]: '',
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
      
      setPlayer1Class(p1);
      setPlayerClassWithMonsterEnhanced('player2', p2);
      
      if (!player1Name) {
        const isP1Monster = isMonster(p1.name);
        setPlayer1Name(isP1Monster ? p1.name : generateCharacterName(p1.name));
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
      
      previousTurnRef.current = null;
      clearNarrativeQueue();
      
      // No opening narrative - battle log will show dice rolls and actions
      addLog('system', `⚔️ The battle begins between ${finalP1Name} (${p1.name}) and ${finalP2Name} (${p2.name})!`);
    } finally {
      setIsLoadingClassDetails(false);
    }
  };

  const resetBattle = () => {
    resetBattleBase();
    resetEffects();
    resetNarrative();
    clearProjectileTracking();
    aiOpponentCleanup.cleanup();
    setBattleSummary('');
    setIsSummaryVisible(false);
    setIsGeneratingSummary(false);
  };

  // Start a new random battle with the same hero (stays on battle screen)
  const startNewBattle = useCallback(async () => {
    if (!player1Class) {
      return;
    }

    // Close the overlay first
    setIsSummaryVisible(false);
    
    // Reset battle state but keep player1 and stay on battle screen
    resetEffects();
    resetNarrative();
    clearProjectileTracking();
    aiOpponentCleanup.cleanup();
    setBattleSummary('');
    setIsGeneratingSummary(false);
    setDefeatedPlayer(null);
    setVictorPlayer(null);
    setBattleLog([]);
    setCurrentTurn('player1');
    previousTurnRef.current = null;
    clearNarrativeQueue();
    // Reset player2 name so new opponent gets a fresh name
    setPlayer2Name('');
    setPlayer2MonsterId(null);

    // Select a different random opponent from BOTH monsters and classes
    // Exclude the current opponent to ensure it's different
    const currentOpponentName = player2Class?.name;
    let randomOpponent: DnDClass | null = null;
    
    // Combine all available opponents (monsters and classes)
    const allAvailableOpponents: DnDClass[] = [
      ...availableMonsters.filter(m => m.name !== currentOpponentName),
      ...availableClasses.filter(cls => cls.name !== player1Class.name && cls.name !== currentOpponentName)
    ];
    
    if (allAvailableOpponents.length > 0) {
      // Randomly select from combined pool
      randomOpponent = allAvailableOpponents[Math.floor(Math.random() * allAvailableOpponents.length)];
    } else {
      // Fallback: try including current opponent if no other options
      const fallbackOpponents: DnDClass[] = [
        ...availableMonsters,
        ...availableClasses.filter(cls => cls.name !== player1Class.name)
      ];
      if (fallbackOpponents.length > 0) {
        randomOpponent = fallbackOpponents[Math.floor(Math.random() * fallbackOpponents.length)];
      }
    }

    if (!randomOpponent) {
      addLog('system', 'No opponents available!');
      return;
    }

    // Store the selected opponent to use in setTimeout (avoid stale closure)
    const selectedOpponent = randomOpponent;

    // Set the opponent
    setPlayerClassWithMonsterEnhanced('player2', selectedOpponent);

    // Wait a moment for state to update, then start battle directly
    setTimeout(async () => {
      if (!player1Class || !selectedOpponent) {
        return;
      }

      setIsLoadingClassDetails(true);

      try {
        const p1IsMonster = isMonster(player1Class.name);
        const p2IsMonster = isMonster(selectedOpponent.name);
        const p1AvailableAbilities = player1Class.abilities || (p1IsMonster ? FALLBACK_MONSTER_ABILITIES[player1Class.name] : FALLBACK_ABILITIES[player1Class.name]) || [];
        const p2AvailableAbilities = selectedOpponent.abilities || (p2IsMonster ? FALLBACK_MONSTER_ABILITIES[selectedOpponent.name] : FALLBACK_ABILITIES[selectedOpponent.name]) || [];
        
        const p1Abilities = selectRandomAbilities(p1AvailableAbilities);
        const p2Abilities = selectRandomAbilities(p2AvailableAbilities);
        
        setClassDetails({
          [player1Class.name]: '',
          [selectedOpponent.name]: '',
        });

        const p1 = { 
          ...player1Class, 
          hitPoints: player1Class.maxHitPoints,
          abilities: p1Abilities,
        };
        const p2 = { 
          ...selectedOpponent, 
          hitPoints: selectedOpponent.maxHitPoints,
          abilities: p2Abilities,
        };
        
        setPlayer1Class(p1);
        setPlayerClassWithMonsterEnhanced('player2', p2);
        
        const isP1Monster = isMonster(p1.name);
        const isP2Monster = isMonster(p2.name);
        const finalP1Name = player1Name || (isP1Monster ? p1.name : generateCharacterName(p1.name));
        const finalP2Name = player2Name || (isP2Monster ? p2.name : generateCharacterName(p2.name));
        
        // Keep battle active - ensure it stays on battle screen
        setIsBattleActive(true);
        setBattleLog([]);
        setCurrentTurn('player1');
        
        previousTurnRef.current = null;
        clearNarrativeQueue();
        
        // No opening narrative - battle log will show dice rolls and actions
        addLog('system', `⚔️ The battle begins between ${finalP1Name} (${p1.name}) and ${finalP2Name} (${p2.name})!`);
      } finally {
        setIsLoadingClassDetails(false);
      }
    }, 100);
  }, [player1Class, player1Name, player2Class, opponentType, availableClasses, availableMonsters, setPlayerClassWithMonsterEnhanced, resetEffects, resetNarrative, clearProjectileTracking, aiOpponentCleanup, setBattleSummary, setIsSummaryVisible, setIsGeneratingSummary, setDefeatedPlayer, setVictorPlayer, setIsBattleActive, setBattleLog, setCurrentTurn, clearNarrativeQueue, addLog, setIsLoadingClassDetails, setClassDetails, setPlayer1Class, findAssociatedMonster]);

  const handleClearOpponentSelection = useCallback(() => {
    setPlayer2Class(null);
    setPlayer2Name('');
    setPlayer2MonsterId(null);
  }, [setPlayer2Class, setPlayer2Name, setPlayer2MonsterId]);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-4 pb-0">
        <div className="space-y-3 md:space-y-4 overflow-visible">
          {/* Character Selection */}
          {!isBattleActive && (
            <div className="space-y-4 md:space-y-5">
              {/* Main Title */}
              <div className="text-center">
                <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold mb-1 md:mb-2" style={{ 
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
                  <div className="space-y-4 md:space-y-5">
                    <ClassSelection
                      title=""
                      availableClasses={availableClasses}
                      selectedClass={player1Class}
                      onSelect={handlePlayer1Select}
                      createdMonsters={createdMonsters}
                      selectionSyncTrigger={selectionSyncTrigger}
                    />
                    <OpponentSelector
                      opponentType={opponentType}
                      onOpponentTypeChange={setOpponentType}
                      player2Class={player2Class}
                      player2Name={player2Name}
                      availableClasses={availableClasses}
                      availableMonsters={availableMonsters}
                      createdMonsters={createdMonsters}
                      monstersLoaded={monstersLoaded}
                      findAssociatedMonster={findAssociatedMonster}
                      onSelectClass={(cls) => setPlayerClassWithMonsterEnhanced('player2', cls)}
                      onClearSelection={handleClearOpponentSelection}
                      selectionSyncTrigger={selectionSyncTrigger}
                    />
                  </div>

                  {/* Begin Battle and Reset Buttons */}
                  <div className="mt-4 md:mt-5 flex gap-4">
                    <button
                      onClick={startBattle}
                      disabled={!player1Class || !player2Class || isLoadingClassDetails || isBattleActive}
                      className="flex-1 py-3 md:py-4 px-6 bg-red-900 hover:bg-red-800 text-white font-bold text-lg md:text-xl rounded-lg border-4 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl"
                      style={{ fontFamily: 'serif' }}
                    >
                      {isLoadingClassDetails ? 'Starting Battle...' : 'Begin Battle! ⚔️'}
                    </button>
                    <button
                      onClick={resetBattle}
                      className="flex items-center gap-2 px-6 py-3 md:py-4 text-gray-700 hover:text-gray-900 transition-colors font-semibold text-base md:text-lg border-2 border-gray-400 rounded-lg"
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

          {/* Battle Arena */}
          {isBattleActive && player1Class && player2Class && (
            <BattleArena
              player1Class={player1Class}
              player2Class={player2Class}
              player1Name={player1Name || 'Loading...'}
              player2Name={player2Name || 'Loading...'}
              player1MonsterId={player1MonsterId}
              player2MonsterId={player2MonsterId}
              findAssociatedMonster={findAssociatedMonster}
              onAttack={performAttack}
              onUseAbility={useAbility}
              shakingPlayer={shakingPlayer}
              sparklingPlayer={sparklingPlayer}
              missingPlayer={missingPlayer}
              hittingPlayer={hittingPlayer}
              castingPlayer={castingPlayer}
              flashingPlayer={flashingPlayer}
              castTrigger={castTrigger}
              flashTrigger={flashTrigger}
              flashProjectileType={flashProjectileType}
              castProjectileType={castProjectileType}
              shakeTrigger={shakeTrigger}
              sparkleTrigger={sparkleTrigger}
              missTrigger={missTrigger}
              hitTrigger={hitTrigger}
              shakeIntensity={shakeIntensity}
              sparkleIntensity={sparkleIntensity}
              isMoveInProgress={isMoveInProgress}
              currentTurn={currentTurn}
              defeatedPlayer={defeatedPlayer}
              victorPlayer={victorPlayer}
              confettiTrigger={confettiTrigger}
              onShakeComplete={handleShakeComplete}
              onSparkleComplete={handleSparkleComplete}
              onMissComplete={handleMissComplete}
              onHitComplete={handleHitComplete}
              onCastComplete={handleCastComplete}
              onFlashComplete={handleFlashComplete}
              player1CardRef={player1CardRef}
              player2CardRef={player2CardRef}
              battleCardsRef={battleCardsRef}
              triggerDropAnimation={triggerDropAnimation}
            />
          )}

          {/* Battle Log */}
          {isBattleActive && (
            <BattleLog
              battleLog={battleLog}
              isWaitingForAgent={isWaitingForAgent || isGeneratingSummary}
              isLoadingClassDetails={isLoadingClassDetails}
              onResetBattle={resetBattle}
              onTriggerDropAnimation={triggerDropAnimation}
              battleLogRef={battleLogRef}
              onOpenSummary={() => setIsSummaryVisible(true)}
              hasSummary={!!battleSummary && !!defeatedPlayer}
            />
          )}

        </div>
      </div>

      {/* Battle Summary Overlay - Show immediately when battle ends, can be reopened */}
      {defeatedPlayer && player1Class && player2Class && (isSummaryVisible || isGeneratingSummary) && (
        <BattleSummaryOverlay
          summary={battleSummary}
          isVisible={isSummaryVisible || isGeneratingSummary}
          onClose={() => setIsSummaryVisible(false)}
          onNewBattle={startNewBattle}
          onReset={resetBattle}
          victorName={
            defeatedPlayer === 'player1'
              ? (player2Name || player2Class.name)
              : (player1Name || player1Class.name)
          }
          defeatedName={
            defeatedPlayer === 'player1'
              ? (player1Name || player1Class.name)
              : (player2Name || player2Class.name)
          }
          isLoading={isGeneratingSummary}
        />
      )}
    </div>
  );
}
