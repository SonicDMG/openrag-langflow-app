import { useState, useCallback, useRef } from 'react';
import { Character, BattleLog } from '../../types';
import { getBattleNarrative } from '../../services/apiService';

export type QueuedNarrativeEvent = {
  eventDescription: string;
  attackerClass: Character;
  defenderClass: Character;
  attackerDetails: string;
  defenderDetails: string;
};

export function useBattleNarrative(addLog: (type: BattleLog['type'], message: string) => void) {
  const [battleResponseId, setBattleResponseId] = useState<string | null>(null);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const narrativeQueueRef = useRef<QueuedNarrativeEvent[]>([]);

  // Helper function to generate narrative and update response ID
  const generateAndLogNarrative = useCallback(async (
    eventDescription: string,
    attackerClass: Character,
    defenderClass: Character,
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
    currentPlayer1Class: Character | null,
    currentPlayer2Class: Character | null
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

  const queueNarrativeEvent = useCallback((event: QueuedNarrativeEvent) => {
    narrativeQueueRef.current.push(event);
  }, []);

  const clearNarrativeQueue = useCallback(() => {
    narrativeQueueRef.current = [];
  }, []);

  const resetNarrative = useCallback(() => {
    setBattleResponseId(null);
    clearNarrativeQueue();
  }, [clearNarrativeQueue]);

  return {
    battleResponseId,
    setBattleResponseId,
    isWaitingForAgent,
    setIsWaitingForAgent,
    generateAndLogNarrative,
    processNarrativeQueue,
    queueNarrativeEvent,
    clearNarrativeQueue,
    resetNarrative,
  };
}

