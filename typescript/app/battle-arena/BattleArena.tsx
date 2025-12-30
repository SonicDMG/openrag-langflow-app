'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

// Types
import { Character } from './lib/types';

// Constants
import { FALLBACK_ABILITIES, FALLBACK_MONSTER_ABILITIES, FALLBACK_CLASSES, selectRandomAbilities, isMonster } from './lib/constants';

// Utilities
import { generateCharacterName, generateDeterministicCharacterName, getCharacterName } from './utils/character/names';
import { getOpponent } from './utils/battle/battle';

// Hooks
import { useAIOpponent } from '../battle-arena/hooks/battle/useAIOpponent';
import { useBattleData } from '../battle-arena/hooks/battle/useBattleData';
import { useBattleState } from '../battle-arena/hooks/battle/useBattleState';
import { useBattleEffects } from '../battle-arena/hooks/battle/useBattleEffects';
import { useProjectileEffects } from '../battle-arena/hooks/battle/useProjectileEffects';
import { useBattleNarrative } from '../battle-arena/hooks/battle/useBattleNarrative';
import { useBattleActions } from '../battle-arena/hooks/battle/useBattleActions';

// Services
import { getBattleSummary, generateBattleEndingImage } from '../battle-arena/services/client/apiService';

// Components
import { ClassSelection } from '../battle-arena/components/battle/ClassSelection';
import { FloatingNumber } from '../battle-arena/components/effects/FloatingNumber';
import { PageHeader } from '../battle-arena/components/ui/PageHeader';
import { LandscapePrompt } from '../battle-arena/components/ui/LandscapePrompt';
import { ProjectileEffect } from '../battle-arena/components/effects/ProjectileEffect';
import { BattleArenaLayout } from '../battle-arena/components/BattleArenaLayout';
import { BattleLog } from '../battle-arena/components/battle/BattleLog';
import { OpponentSelector } from '../battle-arena/components/battle/OpponentSelector';
import { BattleSummaryOverlay } from '../battle-arena/components/battle/BattleSummaryOverlay';

export default function BattleArena() {
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
    isRefreshingFromDatabase,
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
    supportHeroes,
    setSupportHeroes,
    supportHeroNames,
    setSupportHeroNames,
    supportHeroMonsterIds,
    setSupportHeroMonsterIds,
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
  const [battleEndingImageUrl, setBattleEndingImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Helper to find associated image for a character
  // Simplified: now only one image per character (auto-cleanup on creation)
  const findAssociatedMonster = useCallback((className: string): (Character & { monsterId: string; imageUrl: string }) | null => {
    console.log('[findAssociatedMonster] Searching for:', className, 'in', createdMonsters.length, 'images');
    
    // Find the single image associated with this character
    const associated = createdMonsters.find(m => {
      // For created monsters, match by klass field; for regular monsters, match by name
      const monsterKlass = (m as any).klass;
      const matches = monsterKlass ? monsterKlass === className : m.name === className;
      if (matches) {
        console.log('[findAssociatedMonster] Found image:', { name: m.name, klass: monsterKlass, monsterId: m.monsterId, imagePosition: (m as any).imagePosition });
      }
      return matches;
    });
    
    return associated || null;
  }, [createdMonsters]);

  // Update monster IDs when createdMonsters loads or changes
  useEffect(() => {
    if (player1Class && !player1MonsterId && player1Name) {
      // Priority order for getting monsterId:
      // 1. Check if the character itself has a monsterId (for database-saved characters with images)
      // 2. Find associated monster by name lookup (for created monsters)
      const characterMonsterId = (player1Class as any).monsterId;
      
      if (characterMonsterId) {
        console.log('[BattleArena] Using monsterId from player1Class:', characterMonsterId);
        setPlayer1MonsterId(characterMonsterId);
      } else {
        // Fall back to name-based lookup
        const associatedMonster = findAssociatedMonster(player1Name);
        console.log('[BattleArena] Auto-association for player1:', {
          characterName: player1Name,
          className: player1Class.name,
          found: !!associatedMonster,
          monsterId: associatedMonster?.monsterId,
          currentPlayer1MonsterId: player1MonsterId
        });
        if (associatedMonster) {
          console.log('[BattleArena] Setting player1MonsterId to:', associatedMonster.monsterId);
          setPlayer1MonsterId(associatedMonster.monsterId);
        }
      }
    }
    if (player2Class && !player2MonsterId && player2Name) {
      // Priority order for getting monsterId:
      // 1. Check if the character itself has a monsterId (for database-saved characters with images)
      // 2. Find associated monster by name lookup (for created monsters)
      const characterMonsterId = (player2Class as any).monsterId;
      
      if (characterMonsterId) {
        console.log('[BattleArena] Using monsterId from player2Class:', characterMonsterId);
        setPlayer2MonsterId(characterMonsterId);
      } else {
        // Fall back to name-based lookup
        const associatedMonster = findAssociatedMonster(player2Name);
        if (associatedMonster) {
          setPlayer2MonsterId(associatedMonster.monsterId);
        }
      }
    }
  }, [createdMonsters, player1Class, player2Class, player1Name, player2Name, player1MonsterId, player2MonsterId, findAssociatedMonster, setPlayer1MonsterId, setPlayer2MonsterId]);

  // Enhanced setPlayerClassWithMonster that includes findAssociatedMonster
  const setPlayerClassWithMonsterEnhanced = useCallback((
    player: 'player1' | 'player2',
    character: Character & { monsterId?: string; imageUrl?: string },
    name?: string
  ) => {
    setPlayerClassWithMonster(player, character, name, findAssociatedMonster);
  }, [setPlayerClassWithMonster, findAssociatedMonster]);

  // Enhanced switchTurn - no narrative processing during battle
  const switchTurn = useCallback(async (attacker: 'player1' | 'player2' | 'support1' | 'support2') => {
    await switchTurnBase(attacker, defeatedPlayer, async () => {});
  }, [switchTurnBase, defeatedPlayer]);

  // Use the centralized getCharacterName utility function

  // Helper function to handle victory condition
  const handleVictory = useCallback(async (
    attackerClass: Character,
    defenderClass: Character,
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
    
    // Note: Floating number is already shown in createPostDamageCallback, so we don't need to show it again here
    // This prevents duplicate floating numbers and ensures it appears before the overlay
    
    addLog('system', `🏆 ${attackerClass.name} wins! ${defenderClass.name} has been defeated!`);
    
    // Delay showing overlay slightly to ensure floating number appears first
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Show overlay
    setIsSummaryVisible(true);
    setBattleSummary(''); // Start with empty summary
    
    // Generate battle summary with streaming
    setIsGeneratingSummary(true);
    let finalSummary = '';
    try {
      // Get the correct victor and defeated classes and names from state
      const victorClass = victor === 'player1' ? player1Class : player2Class;
      const defeatedClass = defender === 'player1' ? player1Class : player2Class;
      
      // Debug: Log all the values we're working with
      console.log('=== VICTORY HANDLER DEBUG ===');
      console.log('Victor player:', victor);
      console.log('Defender player:', defender);
      console.log('player1Name:', player1Name);
      console.log('player2Name:', player2Name);
      console.log('player1Class?.name:', player1Class?.name);
      console.log('player2Class?.name:', player2Class?.name);
      console.log('attackerClass.name:', attackerClass.name);
      console.log('defenderClass.name:', defenderClass.name);
      console.log('=== END VICTORY HANDLER DEBUG ===');
      
      const victorName = victor === 'player1'
        ? getCharacterName(player1Name || '', victorClass)
        : getCharacterName(player2Name || '', victorClass);
      
      const defeatedName = defender === 'player1'
        ? getCharacterName(player1Name || '', defeatedClass)
        : getCharacterName(player2Name || '', defeatedClass);
      
      if (!victorClass || !defeatedClass) {
        throw new Error('Missing class information for battle summary');
      }
      
      // Use imagePrompt for visual descriptions if available, otherwise fall back to passed-in details
      const victorVisualDetails = victorClass.imagePrompt || attackerDetails || '';
      const defeatedVisualDetails = defeatedClass.imagePrompt || defenderDetails || '';
      
      // Only include support heroes if they're on the victor's side (support heroes always join player1)
      const supportHeroesForChronicle = victor === 'player1' ? supportHeroes : undefined;
      
      // Get support hero details - use imagePrompt if available, otherwise classDetails
      const supportHeroDetails: Record<string, string> = {};
      if (supportHeroesForChronicle) {
        supportHeroesForChronicle.forEach(sh => {
          // Prefer imagePrompt for visual description, fall back to classDetails
          const visualDetails = sh.class.imagePrompt || classDetails[sh.class.name] || '';
          if (visualDetails) {
            supportHeroDetails[sh.class.name] = visualDetails;
          }
        });
      }
      
      finalSummary = await getBattleSummary(
        battleLog,
        victorClass,
        { ...defeatedClass, hitPoints: 0 },
        victorVisualDetails,
        defeatedVisualDetails,
        victorName,
        defeatedName,
        (chunk: string) => {
          // Stream the summary as it arrives
          setBattleSummary(chunk);
        },
        supportHeroesForChronicle,
        supportHeroDetails
      );
      
      // Generate battle ending image after summary is complete
      if (finalSummary) {
        setIsGeneratingImage(true);
        try {
          const imageUrl = await generateBattleEndingImage(
            victorClass,
            { ...defeatedClass, hitPoints: 0 },
            victorName,
            defeatedName,
            finalSummary,
            victorVisualDetails,
            defeatedVisualDetails,
            supportHeroesForChronicle,
            supportHeroDetails
          );
          setBattleEndingImageUrl(imageUrl);
        } catch (imageError) {
          console.error('Error generating battle ending image:', imageError);
          // Don't fail the whole flow if image generation fails
        } finally {
          setIsGeneratingImage(false);
        }
      }
    } catch (error) {
      console.error('Error generating battle summary:', error);
      addLog('system', 'Failed to generate battle summary.');
      const fallbackSummary = 'The battle concluded with a decisive victory.';
      setBattleSummary(fallbackSummary);
      // Don't generate image if summary generation failed
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [addLog, showFloatingNumbers, setDefeatedPlayer, setVictorPlayer, setConfettiTrigger, battleLog, player1Name, player2Name, player1Class, player2Class, supportHeroes, getCharacterName, classDetails]);

  // Battle actions hook
  const battleActions = useBattleActions({
    player1Class,
    player2Class,
    supportHeroes,
    isBattleActive,
    isMoveInProgress,
    classDetails,
    defeatedPlayer,
    currentTurn,
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
    setDefeatedPlayer,
  });
  const { performAttack, useAbility } = battleActions;

  // Refs for character cards and battle elements
  const player1CardRef = useRef<HTMLDivElement | null>(null);
  const player2CardRef = useRef<HTMLDivElement | null>(null);
  const support1CardRef = useRef<HTMLDivElement | null>(null);
  const support2CardRef = useRef<HTMLDivElement | null>(null);
  const battleCardsRef = useRef<HTMLDivElement | null>(null);
  const battleLogRef = useRef<HTMLDivElement | null>(null);
  
  // Callback to receive support hero refs from BattleArena
  const handleSupportHeroRefsReady = useCallback((refs: { support1: React.RefObject<HTMLDivElement | null>; support2: React.RefObject<HTMLDivElement | null> }) => {
    support1CardRef.current = refs.support1.current;
    support2CardRef.current = refs.support2.current;
  }, []);

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

  // Auto-switch turn if current player is knocked out and can't act
  useEffect(() => {
    if (!isBattleActive || isMoveInProgress || defeatedPlayer) return;
    
    // Check if current turn player is knocked out
    const isCurrentPlayerKnockedOut = 
      (currentTurn === 'player1' && player1Class && player1Class.hitPoints <= 0) ||
      (currentTurn === 'player2' && player2Class && player2Class.hitPoints <= 0) ||
      (currentTurn === 'support1' && supportHeroes.length > 0 && supportHeroes[0].class.hitPoints <= 0) ||
      (currentTurn === 'support2' && supportHeroes.length > 1 && supportHeroes[1].class.hitPoints <= 0);
    
    if (isCurrentPlayerKnockedOut) {
      // Check if this is a team battle and player1 is knocked out
      const isTeamBattle = supportHeroes.length > 0;
      if (currentTurn === 'player1' && isTeamBattle) {
        // Check if all heroes are defeated
        const allHeroesDefeated = 
          (player1Class?.hitPoints ?? 0) <= 0 &&
          (supportHeroes.length === 0 || supportHeroes[0].class.hitPoints <= 0) &&
          (supportHeroes.length <= 1 || supportHeroes[1].class.hitPoints <= 0);
        
        if (allHeroesDefeated) {
          // All heroes defeated, battle should end
          setDefeatedPlayer('player1');
          return;
        }
        // Player1 knocked out but support heroes alive - switch turn to support hero
        addLog('system', `💀 ${player1Class?.name || 'Hero'} is knocked out and cannot act. Turn passes to support heroes.`);
        switchTurn('player1');
      } else {
        // For other cases (support hero knocked out, or non-team battle), just switch turn
        switchTurn(currentTurn);
      }
    }
  }, [isBattleActive, isMoveInProgress, defeatedPlayer, currentTurn, player1Class, player2Class, supportHeroes, switchTurn, addLog, setDefeatedPlayer]);

  // Use AI opponent hook for player2 (monster)
  // Reduced delay to 500ms to make monsters hit faster
  const aiOpponentCleanup = useAIOpponent({
    isActive: isBattleActive,
    currentTurn,
    isMoveInProgress,
    defeatedPlayer,
    opponentClass: player2Class,
    playerId: 'player2',
    callbacks: {
      onAttack: () => performAttack('player2'),
      onUseAbility: (abilityIndex: number) => useAbility('player2', abilityIndex),
    },
    delay: 500, // 500ms delay to make monsters hit faster
    onStateChange: setIsOpponentAutoPlaying,
    onMoveInProgressChange: setIsMoveInProgress,
  });
  
  // Use AI opponent hooks for support heroes (they auto-play after a delay to allow manual control)
  // Reduced delay to 500ms to make support heroes hit faster
  const supportHero1Cleanup = useAIOpponent({
    isActive: isBattleActive && supportHeroes.length > 0,
    currentTurn,
    isMoveInProgress,
    defeatedPlayer,
    opponentClass: supportHeroes.length > 0 ? supportHeroes[0].class : null,
    playerId: 'support1',
    callbacks: {
      onAttack: () => performAttack('support1'),
      onUseAbility: (abilityIndex: number) => useAbility('support1', abilityIndex),
    },
    delay: 500, // 500ms delay to allow manual control while making them hit faster
    onStateChange: () => {},
    onMoveInProgressChange: setIsMoveInProgress,
  });
  
  const supportHero2Cleanup = useAIOpponent({
    isActive: isBattleActive && supportHeroes.length > 1,
    currentTurn,
    isMoveInProgress,
    defeatedPlayer,
    opponentClass: supportHeroes.length > 1 ? supportHeroes[1].class : null,
    playerId: 'support2',
    callbacks: {
      onAttack: () => performAttack('support2'),
      onUseAbility: (abilityIndex: number) => useAbility('support2', abilityIndex),
    },
    delay: 500, // 500ms delay to allow manual control while making them hit faster
    onStateChange: () => {},
    onMoveInProgressChange: setIsMoveInProgress,
  });

  // Wrapper function to generate name when player selects their class
  // Also auto-selects a random opponent based on opponentType
  const handlePlayer1Select = useCallback((character: Character & { monsterId?: string; imageUrl?: string }) => {
    setPlayerClassWithMonsterEnhanced('player1', character);
    
    // Auto-select a random opponent based on opponentType
    if (opponentType === 'monster') {
      const availableOpponents = availableMonsters;
      if (availableOpponents.length > 0) {
        const randomOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        setPlayerClassWithMonsterEnhanced('player2', randomOpponent, randomOpponent.name);
      }
    } else {
      const availableOpponents = availableClasses.filter(cls => cls.name !== character.name);
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
      const p1IsMonster = isMonster(player1Class.name, availableMonsters);
      const p2IsMonster = isMonster(player2Class.name, availableMonsters);
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
        setPlayer1Name(getCharacterName('', p1));
        const associatedMonster = findAssociatedMonster(p1.name);
        if (associatedMonster) {
          setPlayer1MonsterId(associatedMonster.monsterId);
        }
      }
      
      const finalP1Name = getCharacterName(player1Name || '', p1);
      const finalP2Name = getCharacterName(player2Name || '', p2);
      
      // Check if we need support heroes (monster with HP > 50)
      const isP2Monster = isMonster(p2.name, availableMonsters);
      const needsSupportHeroes = isP2Monster && p2.maxHitPoints > 50;
      console.log('[BattleArena] Support heroes check:', { isP2Monster, maxHitPoints: p2.maxHitPoints, needsSupportHeroes });
      let newSupportHeroes: Array<{ class: Character; name: string; monsterId: string | null }> = [];
      
      if (needsSupportHeroes) {
        // Select 2 random support heroes from available classes (excluding player1's class)
        const availableSupportClasses = availableClasses.filter(
          cls => cls.name !== p1.name && !isMonster(cls.name, availableMonsters)
        );
        
        if (availableSupportClasses.length >= 2) {
          // Shuffle and pick 2
          const shuffled = [...availableSupportClasses].sort(() => Math.random() - 0.5);
          const selectedSupportClasses = shuffled.slice(0, 2);
          
          newSupportHeroes = selectedSupportClasses.map((supportClass) => {
            const supportIsMonster = isMonster(supportClass.name, availableMonsters);
            const supportAvailableAbilities = supportClass.abilities || (supportIsMonster ? FALLBACK_MONSTER_ABILITIES[supportClass.name] : FALLBACK_ABILITIES[supportClass.name]) || [];
            const supportAbilities = selectRandomAbilities(supportAvailableAbilities);
            
            const supportHero = {
              ...supportClass,
              hitPoints: supportClass.maxHitPoints,
              abilities: supportAbilities,
            };
            
            // Use the centralized getCharacterName utility for consistent name handling
            const supportName = getCharacterName('', supportClass);
            
            const associatedMonster = findAssociatedMonster(supportClass.name);
            const supportMonsterId = associatedMonster ? associatedMonster.monsterId : null;
            
            // Add to class details
            setClassDetails(prev => ({
              ...prev,
              [supportClass.name]: '',
            }));
            
            return {
              class: supportHero,
              name: supportName,
              monsterId: supportMonsterId,
            };
          });
          
          setSupportHeroes(newSupportHeroes);
          console.log('[BattleArena] Setting support heroes:', newSupportHeroes.length, newSupportHeroes);
          addLog('system', `🛡️ ${newSupportHeroes[0].name} (${newSupportHeroes[0].class.name}) and ${newSupportHeroes[1].name} (${newSupportHeroes[1].class.name}) join the battle to support ${finalP1Name}!`);
        } else if (availableSupportClasses.length === 1) {
          // Only one support hero available
          const supportClass = availableSupportClasses[0];
          const supportIsMonster = isMonster(supportClass.name);
          const supportAvailableAbilities = supportClass.abilities || (supportIsMonster ? FALLBACK_MONSTER_ABILITIES[supportClass.name] : FALLBACK_ABILITIES[supportClass.name]) || [];
          const supportAbilities = selectRandomAbilities(supportAvailableAbilities);
          
          const supportHero = {
            ...supportClass,
            hitPoints: supportClass.maxHitPoints,
            abilities: supportAbilities,
          };
          
          // Use the centralized getCharacterName utility for consistent name handling
          const supportName = getCharacterName('', supportClass);
          
          const associatedMonster = findAssociatedMonster(supportClass.name);
          const supportMonsterId = associatedMonster ? associatedMonster.monsterId : null;
          
          setClassDetails(prev => ({
            ...prev,
            [supportClass.name]: '',
          }));
          
          newSupportHeroes = [{
            class: supportHero,
            name: supportName,
            monsterId: supportMonsterId,
          }];
          
          setSupportHeroes(newSupportHeroes);
          addLog('system', `🛡️ ${supportName} (${supportClass.name}) joins the battle to support ${finalP1Name}!`);
        }
      } else {
        // Clear support heroes if not needed
        setSupportHeroes([]);
      }
      
      setIsBattleActive(true);
      setBattleLog([]);
      setCurrentTurn('player1');
      
      previousTurnRef.current = null;
      clearNarrativeQueue();
      
      // No opening narrative - battle log will show dice rolls and actions
      const supportText = newSupportHeroes.length > 0 
        ? ` along with ${newSupportHeroes.map(sh => sh.name).join(' and ')}`
        : '';
      addLog('system', `⚔️ The battle begins between ${finalP1Name} (${p1.name})${supportText} and ${finalP2Name} (${p2.name})!`);
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
    supportHero1Cleanup.cleanup();
    supportHero2Cleanup.cleanup();
    setBattleSummary('');
    setIsSummaryVisible(false);
    setIsGeneratingSummary(false);
    setBattleEndingImageUrl(null);
    setIsGeneratingImage(false);
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
    supportHero1Cleanup.cleanup();
    supportHero2Cleanup.cleanup();
    setBattleSummary('');
    setIsGeneratingSummary(false);
    setBattleEndingImageUrl(null);
    setIsGeneratingImage(false);
    setDefeatedPlayer(null);
    setVictorPlayer(null);
    setBattleLog([]);
    setCurrentTurn('player1');
    setIsMoveInProgress(false); // Reset move in progress to unlock buttons
    previousTurnRef.current = null;
    clearNarrativeQueue();
    // Reset player2 name so new opponent gets a fresh name
    setPlayer2Name('');
    setPlayer2MonsterId(null);
    // Clear support heroes - they'll be re-added if needed
    setSupportHeroes([]);

    // Select a different random opponent from BOTH monsters and classes
    // Exclude the current opponent to ensure it's different
    const currentOpponentName = player2Class?.name;
    let randomOpponent: Character | null = null;
    
    // Combine all available opponents (monsters and classes)
    const allAvailableOpponents: Character[] = [
      ...availableMonsters.filter(m => m.name !== currentOpponentName),
      ...availableClasses.filter(cls => cls.name !== player1Class.name && cls.name !== currentOpponentName)
    ];
    
    if (allAvailableOpponents.length > 0) {
      // Randomly select from combined pool
      randomOpponent = allAvailableOpponents[Math.floor(Math.random() * allAvailableOpponents.length)];
    } else {
      // Fallback: try including current opponent if no other options
      const fallbackOpponents: Character[] = [
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
        const p1IsMonster = isMonster(player1Class.name, availableMonsters);
        const p2IsMonster = isMonster(selectedOpponent.name, availableMonsters);
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
        
        const finalP1Name = getCharacterName(player1Name || '', p1);
        const finalP2Name = getCharacterName(player2Name || '', p2);
        
        // Check if we need support heroes (monster with HP > 50)
        const isP2Monster = isMonster(p2.name, availableMonsters);
        const needsSupportHeroes = isP2Monster && p2.maxHitPoints > 50;
        let newSupportHeroes: Array<{ class: Character; name: string; monsterId: string | null }> = [];
        
        if (needsSupportHeroes) {
          // Select 2 random support heroes from available classes (excluding player1's class)
          const availableSupportClasses = availableClasses.filter(
            cls => cls.name !== p1.name && !isMonster(cls.name)
          );
          
          if (availableSupportClasses.length >= 2) {
            // Shuffle and pick 2
            const shuffled = [...availableSupportClasses].sort(() => Math.random() - 0.5);
            const selectedSupportClasses = shuffled.slice(0, 2);
            
            newSupportHeroes = selectedSupportClasses.map((supportClass) => {
              const supportIsMonster = isMonster(supportClass.name, availableMonsters);
              const supportAvailableAbilities = supportClass.abilities || (supportIsMonster ? FALLBACK_MONSTER_ABILITIES[supportClass.name] : FALLBACK_ABILITIES[supportClass.name]) || [];
              const supportAbilities = selectRandomAbilities(supportAvailableAbilities);
              
              const supportHero = {
                ...supportClass,
                hitPoints: supportClass.maxHitPoints,
                abilities: supportAbilities,
              };
              
              // Use the centralized getCharacterName utility for consistent name handling
              const supportName = getCharacterName('', supportClass);
              
              const associatedMonster = findAssociatedMonster(supportClass.name);
              const supportMonsterId = associatedMonster ? associatedMonster.monsterId : null;
              
              // Add to class details
              setClassDetails(prev => ({
                ...prev,
                [supportClass.name]: '',
              }));
              
              return {
                class: supportHero,
                name: supportName,
                monsterId: supportMonsterId,
              };
            });
            
            setSupportHeroes(newSupportHeroes);
            addLog('system', `🛡️ ${newSupportHeroes[0].name} (${newSupportHeroes[0].class.name}) and ${newSupportHeroes[1].name} (${newSupportHeroes[1].class.name}) join the battle to support ${finalP1Name}!`);
          } else if (availableSupportClasses.length === 1) {
            // Only one support hero available
            const supportClass = availableSupportClasses[0];
            const supportIsMonster = isMonster(supportClass.name, availableMonsters);
            const supportAvailableAbilities = supportClass.abilities || (supportIsMonster ? FALLBACK_MONSTER_ABILITIES[supportClass.name] : FALLBACK_ABILITIES[supportClass.name]) || [];
            const supportAbilities = selectRandomAbilities(supportAvailableAbilities);
            
            const supportHero = {
              ...supportClass,
              hitPoints: supportClass.maxHitPoints,
              abilities: supportAbilities,
            };
            
            // Use the centralized getCharacterName utility for consistent name handling
            const supportName = getCharacterName('', supportClass);
            
            const associatedMonster = findAssociatedMonster(supportClass.name);
            const supportMonsterId = associatedMonster ? associatedMonster.monsterId : null;
            
            setClassDetails(prev => ({
              ...prev,
              [supportClass.name]: '',
            }));
            
            newSupportHeroes = [{
              class: supportHero,
              name: supportName,
              monsterId: supportMonsterId,
            }];
            
            setSupportHeroes(newSupportHeroes);
            addLog('system', `🛡️ ${supportName} (${supportClass.name}) joins the battle to support ${finalP1Name}!`);
          }
        } else {
          // Clear support heroes if not needed
          setSupportHeroes([]);
        }
        
        // Keep battle active - ensure it stays on battle screen
        setIsBattleActive(true);
        setBattleLog([]);
        setCurrentTurn('player1');
        
        previousTurnRef.current = null;
        clearNarrativeQueue();
        
        // No opening narrative - battle log will show dice rolls and actions
        const supportText = newSupportHeroes.length > 0 
          ? ` along with ${newSupportHeroes.map(sh => sh.name).join(' and ')}`
          : '';
        addLog('system', `⚔️ The battle begins between ${finalP1Name} (${p1.name})${supportText} and ${finalP2Name} (${p2.name})!`);
      } finally {
        setIsLoadingClassDetails(false);
      }
    }, 100);
  }, [player1Class, player1Name, player2Class, opponentType, availableClasses, availableMonsters, setPlayerClassWithMonsterEnhanced, resetEffects, resetNarrative, clearProjectileTracking, aiOpponentCleanup, supportHero1Cleanup, supportHero2Cleanup, setBattleSummary, setIsSummaryVisible, setIsGeneratingSummary, setDefeatedPlayer, setVictorPlayer, setIsBattleActive, setBattleLog, setCurrentTurn, clearNarrativeQueue, addLog, setIsLoadingClassDetails, setClassDetails, setPlayer1Class, findAssociatedMonster, setSupportHeroes]);

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
      {floatingNumbers.map((number) => {
        // Determine which ref to use based on target player
        let targetRef: React.RefObject<HTMLDivElement | null> = player1CardRef;
        if (number.targetPlayer === 'player2') {
          targetRef = player2CardRef;
        } else if (number.targetPlayer === 'support1') {
          // Always try to use support1 ref, even if not available yet (will retry)
          targetRef = support1CardRef.current 
            ? { current: support1CardRef.current } as React.RefObject<HTMLDivElement | null>
            : player1CardRef; // Fallback to player1 if support ref not ready
        } else if (number.targetPlayer === 'support2') {
          // Always try to use support2 ref, even if not available yet (will retry)
          targetRef = support2CardRef.current 
            ? { current: support2CardRef.current } as React.RefObject<HTMLDivElement | null>
            : player1CardRef; // Fallback to player1 if support ref not ready
        }
        
        return (
          <FloatingNumber
            key={number.id}
            value={number.value}
            type={number.type}
            targetCardRef={targetRef}
            onComplete={() => handleFloatingNumberComplete(number.id)}
            persistent={number.persistent}
          />
        );
      })}
      
      {/* Projectile Effects */}
      {projectileEffects.map((projectile) => {
        // Determine which refs to use based on from/to players
        let fromRef = player1CardRef;
        if (projectile.fromPlayer === 'player2') {
          fromRef = player2CardRef;
        } else if (projectile.fromPlayer === 'support1' && support1CardRef.current) {
          fromRef = { current: support1CardRef.current } as React.RefObject<HTMLDivElement | null>;
        } else if (projectile.fromPlayer === 'support2' && support2CardRef.current) {
          fromRef = { current: support2CardRef.current } as React.RefObject<HTMLDivElement | null>;
        }
        
        let toRef = player1CardRef;
        if (projectile.toPlayer === 'player2') {
          toRef = player2CardRef;
        } else if (projectile.toPlayer === 'support1' && support1CardRef.current) {
          toRef = { current: support1CardRef.current } as React.RefObject<HTMLDivElement | null>;
        } else if (projectile.toPlayer === 'support2' && support2CardRef.current) {
          toRef = { current: support2CardRef.current } as React.RefObject<HTMLDivElement | null>;
        }
        
        return (
          <ProjectileEffect
            key={projectile.id}
            fromCardRef={fromRef}
            toCardRef={toRef}
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
        );
      })}
      
      {/* Header */}
      <PageHeader
        title="Battle"
        title2="Arena"
        decalImageUrl="/cdn/decals/battle-arena.png"
        isLoading={isRefreshingFromDatabase}
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
            <BattleArenaLayout
              player1Class={player1Class}
              player2Class={player2Class}
              player1Name={player1Name || 'Loading...'}
              player2Name={player2Name || 'Loading...'}
              player1MonsterId={player1MonsterId}
              player2MonsterId={player2MonsterId}
              supportHeroes={supportHeroes}
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
              onSupportHeroRefsReady={handleSupportHeroRefsReady}
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
              ? getCharacterName(player2Name || '', player2Class)
              : getCharacterName(player1Name || '', player1Class)
          }
          defeatedName={
            defeatedPlayer === 'player1'
              ? getCharacterName(player1Name || '', player1Class)
              : getCharacterName(player2Name || '', player2Class)
          }
          isLoading={isGeneratingSummary}
          battleEndingImageUrl={battleEndingImageUrl}
          isGeneratingImage={isGeneratingImage}
        />
      )}
    </div>
  );
}
