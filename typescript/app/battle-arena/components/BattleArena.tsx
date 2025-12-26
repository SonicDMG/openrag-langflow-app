'use client';

import { useRef, useEffect } from 'react';
import { Character } from '../types';
import { ProjectileType } from '../utils/battle';
import {
  BattleCharacterCard,
  SupportHeroesContainer,
  PlayerId,
  PlayerEffects,
  EffectCallbacks,
  SupportHero,
  FindAssociatedMonster,
  extractPlayerEffects,
  getTurnLabel,
} from './shared';

type BattleArenaProps = {
  player1Class: Character;
  player2Class: Character;
  player1Name: string;
  player2Name: string;
  player1MonsterId: string | null;
  player2MonsterId: string | null;
  supportHeroes?: Array<{ class: Character; name: string; monsterId: string | null }>;
  findAssociatedMonster: (className: string) => (Character & { monsterId: string; imageUrl: string; imagePosition?: { offsetX: number; offsetY: number } }) | null;
  onAttack: (player: 'player1' | 'player2' | 'support1' | 'support2') => void;
  onUseAbility: (player: 'player1' | 'player2' | 'support1' | 'support2', abilityIndex: number) => void;
  // Visual effects
  shakingPlayer: 'player1' | 'player2' | 'support1' | 'support2' | null;
  sparklingPlayer: 'player1' | 'player2' | 'support1' | 'support2' | null;
  missingPlayer: 'player1' | 'player2' | 'support1' | 'support2' | null;
  hittingPlayer: 'player1' | 'player2' | 'support1' | 'support2' | null;
  castingPlayer: 'player1' | 'player2' | 'support1' | 'support2' | null;
  flashingPlayer: 'player1' | 'player2' | 'support1' | 'support2' | null;
  castTrigger: { player1: number; player2: number; support1: number; support2: number };
  flashTrigger: { player1: number; player2: number; support1: number; support2: number };
  flashProjectileType: { player1: ProjectileType | null; player2: ProjectileType | null; support1: ProjectileType | null; support2: ProjectileType | null };
  castProjectileType: { player1: ProjectileType | null; player2: ProjectileType | null; support1: ProjectileType | null; support2: ProjectileType | null };
  shakeTrigger: { player1: number; player2: number; support1: number; support2: number };
  sparkleTrigger: { player1: number; player2: number; support1: number; support2: number };
  missTrigger: { player1: number; player2: number; support1: number; support2: number };
  hitTrigger: { player1: number; player2: number; support1: number; support2: number };
  shakeIntensity: { player1: number; player2: number; support1: number; support2: number };
  sparkleIntensity: { player1: number; player2: number; support1: number; support2: number };
  isMoveInProgress: boolean;
  currentTurn: 'player1' | 'player2' | 'support1' | 'support2';
  defeatedPlayer: 'player1' | 'player2' | null;
  victorPlayer: 'player1' | 'player2' | null;
  confettiTrigger: number;
  onShakeComplete: () => void;
  onSparkleComplete: () => void;
  onMissComplete: () => void;
  onHitComplete: () => void;
  onCastComplete: () => void;
  onFlashComplete: () => void;
  // Refs
  player1CardRef: React.RefObject<HTMLDivElement | null>;
  player2CardRef: React.RefObject<HTMLDivElement | null>;
  battleCardsRef: React.RefObject<HTMLDivElement | null>;
  triggerDropAnimation: () => void;
  // Callback to set support hero refs
  onSupportHeroRefsReady?: (refs: { support1: React.RefObject<HTMLDivElement | null>; support2: React.RefObject<HTMLDivElement | null> }) => void;
};

export function BattleArena({
  player1Class,
  player2Class,
  player1Name,
  player2Name,
  player1MonsterId,
  player2MonsterId,
  supportHeroes = [],
  findAssociatedMonster,
  onAttack,
  onUseAbility,
  shakingPlayer,
  sparklingPlayer,
  missingPlayer,
  hittingPlayer,
  castingPlayer,
  flashingPlayer,
  castTrigger,
  flashTrigger,
  flashProjectileType,
  castProjectileType,
  shakeTrigger,
  sparkleTrigger,
  missTrigger,
  hitTrigger,
  shakeIntensity,
  sparkleIntensity,
  isMoveInProgress,
  currentTurn,
  defeatedPlayer,
  victorPlayer,
  confettiTrigger,
  onShakeComplete,
  onSparkleComplete,
  onMissComplete,
  onHitComplete,
  onCastComplete,
  onFlashComplete,
  player1CardRef,
  player2CardRef,
  battleCardsRef,
  triggerDropAnimation,
  onSupportHeroRefsReady,
}: BattleArenaProps) {
  // Trigger drop animation when component mounts (battle starts)
  useEffect(() => {
    triggerDropAnimation();
  }, [triggerDropAnimation]);

  // Group effect callbacks for cleaner prop passing
  const effectCallbacks: EffectCallbacks = {
    onShakeComplete,
    onSparkleComplete,
    onMissComplete,
    onHitComplete,
    onCastComplete,
    onFlashComplete,
  };

  // Helper function to extract player-specific effects
  const getPlayerEffects = (playerId: PlayerId): PlayerEffects => {
    return extractPlayerEffects(
      playerId,
      shakingPlayer,
      sparklingPlayer,
      missingPlayer,
      hittingPlayer,
      castingPlayer,
      flashingPlayer,
      shakeTrigger,
      sparkleTrigger,
      missTrigger,
      hitTrigger,
      castTrigger,
      flashTrigger,
      shakeIntensity,
      sparkleIntensity,
      flashProjectileType,
      castProjectileType
    );
  };

  // Get effects for each player
  const player1Effects = getPlayerEffects('player1');
  const player2Effects = getPlayerEffects('player2');

  return (
    <div ref={battleCardsRef} className="relative flex items-center justify-center gap-4 md:gap-8 py-12 -mx-4 sm:-mx-6 overflow-visible">
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
      
      {/* Support Heroes - Small cards to the left of player1 */}
      <SupportHeroesContainer
        supportHeroes={supportHeroes}
        currentTurn={currentTurn}
        isMoveInProgress={isMoveInProgress}
        confettiTrigger={confettiTrigger}
        findAssociatedMonster={findAssociatedMonster}
        onAttack={onAttack}
        onUseAbility={onUseAbility}
        effectCallbacks={effectCallbacks}
        getPlayerEffects={getPlayerEffects}
        onRefsReady={onSupportHeroRefsReady}
      />
      
      {/* Left Card - Player 1 */}
      <div className="relative z-10">
        <BattleCharacterCard
          playerId="player1"
          playerClass={player1Class}
          characterName={player1Name || 'Loading...'}
          monsterId={player1MonsterId}
          effects={player1Effects}
          isActive={currentTurn === 'player1'}
          isDefeated={defeatedPlayer === 'player1' || (player1Class?.hitPoints ?? 0) <= 0}
          isVictor={victorPlayer === 'player1'}
          isOpponent={false}
          rotation={-5}
          turnLabel="YOUR TURN"
          showTurnIndicator={defeatedPlayer !== 'player1'}
          findAssociatedMonster={findAssociatedMonster}
          onAttack={() => onAttack('player1')}
          onUseAbility={(idx: number) => onUseAbility('player1', idx)}
          effectCallbacks={effectCallbacks}
          isMoveInProgress={isMoveInProgress}
          confettiTrigger={confettiTrigger}
          cardRef={player1CardRef}
        />
      </div>
      {/* VS Graphic */}
      <div className="relative z-10 flex-shrink-0">
        <span className="text-5xl md:text-6xl font-bold" style={{ color: '#E0D9C9', fontFamily: 'serif' }}>
          VS
        </span>
      </div>
      
      {/* Right Card - Player 2 (Opponent) */}
      <div className="relative z-10">
        <BattleCharacterCard
          playerId="player2"
          playerClass={player2Class}
          characterName={player2Name || 'Loading...'}
          monsterId={player2MonsterId}
          effects={player2Effects}
          isActive={currentTurn === 'player2'}
          isDefeated={defeatedPlayer === 'player2' || (player2Class?.hitPoints ?? 0) <= 0}
          isVictor={victorPlayer === 'player2'}
          isOpponent={true}
          rotation={5}
          turnLabel="ENEMY TURN"
          showTurnIndicator={defeatedPlayer !== 'player2'}
          findAssociatedMonster={findAssociatedMonster}
          onAttack={() => onAttack('player2')}
          onUseAbility={(idx: number) => onUseAbility('player2', idx)}
          effectCallbacks={effectCallbacks}
          isMoveInProgress={isMoveInProgress}
          confettiTrigger={confettiTrigger}
          cardRef={player2CardRef}
        />
      </div>
    </div>
  );
}

