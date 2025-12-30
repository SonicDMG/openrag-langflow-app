/**
 * SupportHeroesContainer - Renders support hero cards in battle
 * 
 * This component handles the rendering of support hero cards with proper
 * positioning, rotation, and turn indicators. Used by both main battle
 * and test pages.
 */

'use client';

import { useRef, useEffect } from 'react';
import { BattleCharacterCard } from './BattleCharacterCard';
import { SupportHero, PlayerId, PlayerEffects, EffectCallbacks, FindAssociatedMonster } from '../../lib/types';

export type SupportHeroesContainerProps = {
  supportHeroes: SupportHero[];
  currentTurn: PlayerId;
  isMoveInProgress: boolean;
  confettiTrigger: number;
  findAssociatedMonster: FindAssociatedMonster;
  onAttack: (player: PlayerId) => void;
  onUseAbility: (player: PlayerId, abilityIndex: number) => void;
  effectCallbacks: EffectCallbacks;
  getPlayerEffects: (playerId: PlayerId) => PlayerEffects;
  onRefsReady?: (refs: {
    support1: React.RefObject<HTMLDivElement | null>;
    support2: React.RefObject<HTMLDivElement | null>;
  }) => void;
};

/**
 * Container component for rendering support hero cards
 */
export function SupportHeroesContainer({
  supportHeroes,
  currentTurn,
  isMoveInProgress,
  confettiTrigger,
  findAssociatedMonster,
  onAttack,
  onUseAbility,
  effectCallbacks,
  getPlayerEffects,
  onRefsReady,
}: SupportHeroesContainerProps) {
  // Create refs for support hero cards
  const support1CardRef = useRef<HTMLDivElement | null>(null);
  const support2CardRef = useRef<HTMLDivElement | null>(null);

  // Notify parent when refs are ready
  useEffect(() => {
    if (onRefsReady && supportHeroes.length > 0) {
      onRefsReady({ support1: support1CardRef, support2: support2CardRef });
    }
  }, [onRefsReady, supportHeroes.length]);

  // Don't render if no support heroes
  if (!supportHeroes || supportHeroes.length === 0) {
    return null;
  }

  return (
    <div className="relative z-20 flex flex-col gap-3 mr-4" style={{ minWidth: '120px' }}>
      {supportHeroes.map((supportHero, index) => {
        const supportPlayer = (index === 0 ? 'support1' : 'support2') as PlayerId;
        const isActive = currentTurn === supportPlayer;
        const isDefeated = supportHero.class.hitPoints <= 0;
        const effects = getPlayerEffects(supportPlayer);

        return (
          <BattleCharacterCard
            key={`support-${index}-${supportHero.name}`}
            playerId={supportPlayer}
            playerClass={supportHero.class}
            characterName={supportHero.name}
            monsterId={supportHero.monsterId}
            effects={effects}
            isActive={isActive}
            isDefeated={isDefeated}
            isVictor={false}
            isOpponent={false}
            allowAllTurns={false}
            rotation={-5 + index * 2}
            scale={0.65}
            turnLabel="YOUR TURN"
            showTurnIndicator={true}
            findAssociatedMonster={findAssociatedMonster}
            onAttack={() => onAttack(supportPlayer)}
            onUseAbility={(idx) => onUseAbility(supportPlayer, idx)}
            effectCallbacks={effectCallbacks}
            isMoveInProgress={isMoveInProgress}
            confettiTrigger={confettiTrigger}
            cardRef={index === 0 ? support1CardRef : support2CardRef}
          />
        );
      })}
    </div>
  );
}

// Made with Bob
