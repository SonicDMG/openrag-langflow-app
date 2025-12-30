import { useState, useCallback, useRef, useEffect } from 'react';
import { Character, BattleLog } from '../../lib/types';
import { generateCharacterName, generateDeterministicCharacterName, getCharacterName } from '../../utils/character/names';
import { isMonster, FALLBACK_CLASSES } from '../../lib/constants';

export function useBattleState() {
  // Player states
  const [player1Class, setPlayer1Class] = useState<Character | null>(null);
  const [player2Class, setPlayer2Class] = useState<Character | null>(null);
  const [player1Name, setPlayer1Name] = useState<string>('');
  const [player2Name, setPlayer2Name] = useState<string>('');
  const [player1MonsterId, setPlayer1MonsterId] = useState<string | null>(null);
  const [player2MonsterId, setPlayer2MonsterId] = useState<string | null>(null);
  
  // Support heroes (for when fighting high HP monsters)
  const [supportHeroes, setSupportHeroes] = useState<Array<{ class: Character; name: string; monsterId: string | null }>>([]);
  const [supportHeroNames, setSupportHeroNames] = useState<string[]>([]);
  const [supportHeroMonsterIds, setSupportHeroMonsterIds] = useState<(string | null)[]>([]);

  // Battle state
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2' | 'support1' | 'support2'>('player1');
  const [isMoveInProgress, setIsMoveInProgress] = useState(false);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [isOpponentAutoPlaying, setIsOpponentAutoPlaying] = useState(false);

  // Class details and loading
  const [classDetails, setClassDetails] = useState<Record<string, string>>({});
  const [isLoadingClassDetails, setIsLoadingClassDetails] = useState(false);

  // Opponent selection
  const [opponentType, setOpponentType] = useState<'class' | 'monster'>('monster');

  // Refs for tracking
  const previousTurnRef = useRef<'player1' | 'player2' | 'support1' | 'support2' | null>(null);
  const currentPlayer1ClassRef = useRef<Character | null>(null);
  const currentPlayer2ClassRef = useRef<Character | null>(null);

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
  // Can accept either a new HP value directly, or damage to subtract from current HP
  const updatePlayerHP = useCallback((player: 'player1' | 'player2' | 'support1' | 'support2', newHPOrDamage: number, isDamage: boolean = false) => {
    if (player === 'player1') {
      setPlayer1Class((current) => {
        if (!current) return current;
        // If isDamage is true, subtract from current HP; otherwise use the value directly
        const newHP = isDamage ? Math.max(0, current.hitPoints - newHPOrDamage) : newHPOrDamage;
        // Ensure HP never exceeds maxHitPoints
        const cappedHP = Math.min(newHP, current.maxHitPoints);
        return { ...current, hitPoints: cappedHP };
      });
    } else if (player === 'player2') {
      setPlayer2Class((current) => {
        if (!current) return current;
        // If isDamage is true, subtract from current HP; otherwise use the value directly
        const newHP = isDamage ? Math.max(0, current.hitPoints - newHPOrDamage) : newHPOrDamage;
        // Ensure HP never exceeds maxHitPoints
        const cappedHP = Math.min(newHP, current.maxHitPoints);
        return { ...current, hitPoints: cappedHP };
      });
    } else if (player === 'support1' || player === 'support2') {
      const index = player === 'support1' ? 0 : 1;
      setSupportHeroes((current) => {
        const updated = [...current];
        if (updated[index]) {
          // If isDamage is true, subtract from current HP; otherwise use the value directly
          const newHP = isDamage ? Math.max(0, updated[index].class.hitPoints - newHPOrDamage) : newHPOrDamage;
          // Ensure HP never exceeds maxHitPoints
          const cappedHP = Math.min(newHP, updated[index].class.maxHitPoints);
          updated[index] = {
            ...updated[index],
            class: { ...updated[index].class, hitPoints: cappedHP }
          };
        }
        return updated;
      });
    }
  }, []);

  // Helper to set a player's class and automatically find associated monster
  const setPlayerClassWithMonster = useCallback((
    player: 'player1' | 'player2',
    character: Character & { monsterId?: string; imageUrl?: string },
    name?: string,
    findAssociatedMonster?: (className: string) => (Character & { monsterId: string; imageUrl: string }) | null
  ) => {
    const setName = player === 'player1' ? setPlayer1Name : setPlayer2Name;
    const setClass = player === 'player1' ? setPlayer1Class : setPlayer2Class;
    const setMonsterId = player === 'player1' ? setPlayer1MonsterId : setPlayer2MonsterId;
    
    setClass(character);
    
    // Set name if provided, otherwise use the centralized getCharacterName utility
    if (name) {
      setName(name);
    } else {
      const nameToUse = getCharacterName('', character);
      setName(nameToUse);
    }
    
    // Check if this entity already has a monsterId (explicitly selected created monster)
    if (character.monsterId) {
      setMonsterId(character.monsterId);
    } else if (findAssociatedMonster) {
      // Otherwise, check if there's an associated monster for this class/monster type
      // For created monsters, use klass to find associated monster; for regular classes, use name
      const isCreatedMonster = !!(character as any).klass && !!(character as any).monsterId;
      const lookupName = isCreatedMonster ? (character as any).klass : character.name;
      const associatedMonster = findAssociatedMonster(lookupName);
      if (associatedMonster) {
        setMonsterId(associatedMonster.monsterId);
      } else {
        setMonsterId(null);
      }
    }
  }, []);

  // Helper function to switch turns
  const switchTurn = useCallback(async (
    currentAttacker: 'player1' | 'player2' | 'support1' | 'support2',
    defeatedPlayer: 'player1' | 'player2' | null,
    processNarrativeQueue?: () => Promise<void>
  ) => {
    // Determine next player in turn order: player1 -> support1 -> support2 -> player2 -> player1...
    const getNextPlayer = (current: 'player1' | 'player2' | 'support1' | 'support2'): 'player1' | 'player2' | 'support1' | 'support2' => {
      const hasSupportHeroes = supportHeroes.length > 0;
      
      if (!hasSupportHeroes) {
        // No support heroes, just alternate between player1 and player2
        return current === 'player1' ? 'player2' : 'player1';
      }
      
      // With support heroes: player1 -> support1 -> support2 -> player2 -> player1...
      if (current === 'player1') {
        return 'support1';
      } else if (current === 'support1') {
        return supportHeroes.length > 1 ? 'support2' : 'player2';
      } else if (current === 'support2') {
        return 'player2';
      } else {
        return 'player1';
      }
    };
    
    // Helper to check if a player is defeated
    const isPlayerDefeated = (player: 'player1' | 'player2' | 'support1' | 'support2'): boolean => {
      if (player === 'player1') {
        return player1Class ? player1Class.hitPoints <= 0 : false;
      } else if (player === 'player2') {
        return player2Class ? player2Class.hitPoints <= 0 : false;
      } else if (player === 'support1') {
        return supportHeroes.length > 0 ? supportHeroes[0].class.hitPoints <= 0 : true;
      } else if (player === 'support2') {
        return supportHeroes.length > 1 ? supportHeroes[1].class.hitPoints <= 0 : true;
      }
      return false;
    };
    
    // Find next non-defeated player
    let nextPlayer = getNextPlayer(currentAttacker);
    let attempts = 0;
    const maxAttempts = 10; // Safety limit
    
    // Skip defeated players (including player1 if knocked out but support heroes remain)
    while (isPlayerDefeated(nextPlayer) && attempts < maxAttempts) {
      // Skip defeated players - this handles player1 being knocked out while support heroes remain
      nextPlayer = getNextPlayer(nextPlayer);
      attempts++;
    }
    
    // Safety check: if we couldn't find a non-defeated player, battle might be over
    if (attempts >= maxAttempts || isPlayerDefeated(nextPlayer)) {
      // All players defeated or couldn't find next player - battle should end
      return;
    }
    
    // Don't switch to a defeated main player - skip to next
    if (defeatedPlayer === nextPlayer) {
      const nextNextPlayer = getNextPlayer(nextPlayer);
      if (defeatedPlayer === nextNextPlayer) {
        // Both next players defeated, battle is over
        return;
      }
      setCurrentTurn(nextNextPlayer);
      return;
    }
    
    // Check if we've completed a full round (player2 just moved → switching to player1)
    // This means all players have made their moves in this round
    const isFullRoundComplete = currentAttacker === 'player2';
    
    // Update the previous turn reference
    previousTurnRef.current = currentAttacker;
    
    // If a full round is complete and we have queued events, process them
    if (isFullRoundComplete && processNarrativeQueue) {
      await processNarrativeQueue();
    }
    
    setCurrentTurn(nextPlayer);
  }, [supportHeroes, player1Class, player2Class]);

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
    setSupportHeroes([]);
    setSupportHeroNames([]);
    setSupportHeroMonsterIds([]);
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
    
    // Support heroes
    supportHeroes,
    setSupportHeroes,
    supportHeroNames,
    setSupportHeroNames,
    supportHeroMonsterIds,
    setSupportHeroMonsterIds,
    
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

