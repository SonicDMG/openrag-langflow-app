import { useState, useCallback, useRef, useEffect } from 'react';
import { DnDClass, BattleLog } from '../types';
import { generateCharacterName } from '../utils/names';
import { isMonster } from '../constants';

export function useBattleState() {
  // Player states
  const [player1Class, setPlayer1Class] = useState<DnDClass | null>(null);
  const [player2Class, setPlayer2Class] = useState<DnDClass | null>(null);
  const [player1Name, setPlayer1Name] = useState<string>('');
  const [player2Name, setPlayer2Name] = useState<string>('');
  const [player1MonsterId, setPlayer1MonsterId] = useState<string | null>(null);
  const [player2MonsterId, setPlayer2MonsterId] = useState<string | null>(null);

  // Battle state
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [isMoveInProgress, setIsMoveInProgress] = useState(false);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [isOpponentAutoPlaying, setIsOpponentAutoPlaying] = useState(false);

  // Class details and loading
  const [classDetails, setClassDetails] = useState<Record<string, string>>({});
  const [isLoadingClassDetails, setIsLoadingClassDetails] = useState(false);

  // Opponent selection
  const [opponentType, setOpponentType] = useState<'class' | 'monster'>('class');

  // Refs for tracking
  const previousTurnRef = useRef<'player1' | 'player2' | null>(null);
  const currentPlayer1ClassRef = useRef<DnDClass | null>(null);
  const currentPlayer2ClassRef = useRef<DnDClass | null>(null);

  // Keep refs in sync with current player classes
  useEffect(() => {
    currentPlayer1ClassRef.current = player1Class;
    currentPlayer2ClassRef.current = player2Class;
  }, [player1Class, player2Class]);

  // Helper to add log entries
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

  // Helper to set a player's class and automatically find associated monster
  const setPlayerClassWithMonster = useCallback((
    player: 'player1' | 'player2',
    dndClass: DnDClass & { monsterId?: string; imageUrl?: string },
    name?: string,
    findAssociatedMonster?: (className: string) => (DnDClass & { monsterId: string; imageUrl: string }) | null
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
    } else if (findAssociatedMonster) {
      // Otherwise, check if there's an associated monster for this class/monster type
      const associatedMonster = findAssociatedMonster(dndClass.name);
      if (associatedMonster) {
        setMonsterId(associatedMonster.monsterId);
      } else {
        setMonsterId(null);
      }
    }
  }, []);

  // Helper function to switch turns
  const switchTurn = useCallback(async (
    currentAttacker: 'player1' | 'player2',
    defeatedPlayer: 'player1' | 'player2' | null,
    processNarrativeQueue?: () => Promise<void>
  ) => {
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
    if (isFullRoundComplete && processNarrativeQueue) {
      await processNarrativeQueue();
    }
    
    setCurrentTurn(nextPlayer);
  }, []);

  // Reset battle state
  const resetBattle = useCallback(() => {
    setIsBattleActive(false);
    setBattleLog([]);
    setPlayer1Class(null);
    setPlayer2Class(null);
    setPlayer1Name('');
    setPlayer2Name('');
    setPlayer1MonsterId(null);
    setPlayer2MonsterId(null);
    setClassDetails({});
    setIsMoveInProgress(false);
    setIsOpponentAutoPlaying(false);
    previousTurnRef.current = null;
  }, []);

  return {
    // Player states
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
    
    // Battle state
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
    
    // Class details
    classDetails,
    setClassDetails,
    isLoadingClassDetails,
    setIsLoadingClassDetails,
    
    // Opponent selection
    opponentType,
    setOpponentType,
    
    // Refs
    previousTurnRef,
    currentPlayer1ClassRef,
    currentPlayer2ClassRef,
    
    // Functions
    addLog,
    updatePlayerHP,
    switchTurn,
    resetBattle,
  };
}

