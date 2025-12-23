'use client';

import { useRef, useEffect } from 'react';
import { DnDClass } from '../types';
import { CharacterCard } from './CharacterCard';
import { ProjectileType } from '../utils/battle';

type BattleArenaProps = {
  player1Class: DnDClass;
  player2Class: DnDClass;
  player1Name: string;
  player2Name: string;
  player1MonsterId: string | null;
  player2MonsterId: string | null;
  supportHeroes?: Array<{ class: DnDClass; name: string; monsterId: string | null }>;
  findAssociatedMonster: (className: string) => (DnDClass & { monsterId: string; imageUrl: string }) | null;
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
  // Create refs for support hero cards
  const support1CardRef = useRef<HTMLDivElement | null>(null);
  const support2CardRef = useRef<HTMLDivElement | null>(null);
  
  // Debug: Log support heroes
  useEffect(() => {
    console.log('[BattleArena] Support heroes updated:', { supportHeroes, length: supportHeroes?.length, hasSupportHeroes: supportHeroes && supportHeroes.length > 0 });
  }, [supportHeroes]);
  
  // Notify parent when refs are ready
  useEffect(() => {
    if (onSupportHeroRefsReady && supportHeroes.length > 0) {
      onSupportHeroRefsReady({ support1: support1CardRef, support2: support2CardRef });
    }
  }, [onSupportHeroRefsReady, supportHeroes.length]);
  
  // Trigger drop animation when component mounts (battle starts)
  useEffect(() => {
    triggerDropAnimation();
  }, [triggerDropAnimation]);

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
      {supportHeroes && supportHeroes.length > 0 && (
        <div className="relative z-20 flex flex-col gap-3 mr-4" style={{ minWidth: '120px' }}>
          {/* Debug: Support heroes count: {supportHeroes.length} */}
          {supportHeroes.map((supportHero, index) => {
            const supportPlayer = index === 0 ? 'support1' : 'support2';
            const isActive = currentTurn === supportPlayer;
            const isDefeated = supportHero.class.hitPoints <= 0;
            
            return (
              <div
                key={`support-${index}-${supportHero.name}`}
                ref={index === 0 ? support1CardRef : support2CardRef}
                className="relative"
                style={{
                  transform: `rotate(${-5 + index * 2}deg) scale(0.65)`,
                  opacity: isDefeated ? 0.5 : 1,
                }}
              >
                {/* Turn indicator for support heroes */}
                {isActive && !isDefeated && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-400 text-black px-2 py-1 rounded-md text-xs font-bold shadow-lg animate-pulse">
                    YOUR TURN
                  </div>
                )}
                <div
                  className={`transition-all duration-300 ${
                    isActive && !isDefeated
                      ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-2xl shadow-yellow-400/50'
                      : ''
                  }`}
                  style={{
                    borderRadius: '8px',
                  }}
                >
                  <CharacterCard
                  playerClass={supportHero.class}
                  characterName={supportHero.name}
                  monsterImageUrl={supportHero.monsterId ? `/cdn/monsters/${supportHero.monsterId}/280x200.png` : undefined}
                  onAttack={() => onAttack(supportPlayer)}
                  onUseAbility={(idx) => onUseAbility(supportPlayer, idx)}
                  shouldShake={shakingPlayer === supportPlayer}
                  shouldSparkle={sparklingPlayer === supportPlayer}
                  shouldMiss={missingPlayer === supportPlayer}
                  shouldHit={hittingPlayer === supportPlayer}
                  shouldCast={castingPlayer === supportPlayer}
                  shouldFlash={flashingPlayer === supportPlayer}
                  castTrigger={castTrigger[supportPlayer]}
                  flashTrigger={flashTrigger[supportPlayer]}
                  flashProjectileType={flashProjectileType[supportPlayer]}
                  castProjectileType={castProjectileType[supportPlayer]}
                  shakeTrigger={shakeTrigger[supportPlayer]}
                  sparkleTrigger={sparkleTrigger[supportPlayer]}
                  missTrigger={missTrigger[supportPlayer]}
                  hitTrigger={hitTrigger[supportPlayer]}
                  shakeIntensity={shakeIntensity[supportPlayer]}
                  sparkleIntensity={sparkleIntensity[supportPlayer]}
                  isMoveInProgress={isMoveInProgress}
                  isActive={isActive}
                  isDefeated={isDefeated}
                  isVictor={false}
                  confettiTrigger={confettiTrigger}
                  onShakeComplete={onShakeComplete}
                  onSparkleComplete={onSparkleComplete}
                  onMissComplete={onMissComplete}
                  onHitComplete={onHitComplete}
                  onCastComplete={onCastComplete}
                  onFlashComplete={onFlashComplete}
                  isOpponent={false}
                  allowAllTurns={false}
                />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Left Card - Rotated counter-clockwise (outward) */}
      <div 
        ref={player1CardRef} 
        className={`relative z-10 transition-all duration-300 ${
          currentTurn === 'player1' && defeatedPlayer !== 'player1'
            ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-2xl shadow-yellow-400/50'
            : ''
        }`}
        style={{ transform: 'rotate(-5deg)', borderRadius: '8px' }}
      >
        {/* Turn indicator for player1 */}
        {currentTurn === 'player1' && defeatedPlayer !== 'player1' && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-400 text-black px-3 py-1 rounded-md text-sm font-bold shadow-lg animate-pulse">
            YOUR TURN
          </div>
        )}
        <CharacterCard
          playerClass={player1Class}
          characterName={player1Name || 'Loading...'}
          monsterImageUrl={player1MonsterId ? `/cdn/monsters/${player1MonsterId}/280x200.png` : undefined}
          onAttack={() => onAttack('player1')}
          onUseAbility={(idx) => onUseAbility('player1', idx)}
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
          isMoveInProgress={isMoveInProgress}
          isActive={currentTurn === 'player1'}
          isDefeated={defeatedPlayer === 'player1' || (player1Class?.hitPoints ?? 0) <= 0}
          isVictor={victorPlayer === 'player1'}
          confettiTrigger={confettiTrigger}
          onShakeComplete={onShakeComplete}
          onSparkleComplete={onSparkleComplete}
          onMissComplete={onMissComplete}
          onHitComplete={onHitComplete}
          onCastComplete={onCastComplete}
          onFlashComplete={onFlashComplete}
        />
      </div>
      {/* VS Graphic */}
      <div className="relative z-10 flex-shrink-0">
        <span className="text-5xl md:text-6xl font-bold" style={{ color: '#E0D9C9', fontFamily: 'serif' }}>
          VS
        </span>
      </div>
      {/* Right Card - Rotated clockwise (outward) */}
      <div 
        ref={player2CardRef} 
        className={`relative z-10 transition-all duration-300 ${
          currentTurn === 'player2' && defeatedPlayer !== 'player2'
            ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-2xl shadow-yellow-400/50'
            : ''
        }`}
        style={{ transform: 'rotate(5deg)', borderRadius: '8px' }}
      >
        {/* Turn indicator for player2 (monster) */}
        {currentTurn === 'player2' && defeatedPlayer !== 'player2' && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-400 text-black px-3 py-1 rounded-md text-sm font-bold shadow-lg animate-pulse">
            ENEMY TURN
          </div>
        )}
        <CharacterCard
          playerClass={player2Class}
          characterName={player2Name || 'Loading...'}
          monsterImageUrl={player2MonsterId ? `/cdn/monsters/${player2MonsterId}/280x200.png` : undefined}
          onAttack={() => onAttack('player2')}
          onUseAbility={(idx) => onUseAbility('player2', idx)}
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
          isMoveInProgress={isMoveInProgress}
          isActive={currentTurn === 'player2'}
          isDefeated={defeatedPlayer === 'player2' || (player2Class?.hitPoints ?? 0) <= 0}
          isVictor={victorPlayer === 'player2'}
          confettiTrigger={confettiTrigger}
          onShakeComplete={onShakeComplete}
          onSparkleComplete={onSparkleComplete}
          onMissComplete={onMissComplete}
          onHitComplete={onHitComplete}
          onCastComplete={onCastComplete}
          onFlashComplete={onFlashComplete}
          isOpponent={true}
        />
      </div>
    </div>
  );
}

