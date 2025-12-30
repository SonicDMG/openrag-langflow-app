/**
 * BattleCharacterCard - Shared wrapper component for character cards in battle
 * 
 * This component wraps the base CharacterCard with battle-specific logic including:
 * - Image position resolution
 * - Turn indicator rendering
 * - Effect state management
 * - Rotation and scaling
 * 
 * Used by both the main battle page and test page for consistency.
 */

'use client';

import { CharacterCard } from '../CharacterCard';
import { BattleCharacterCardProps } from '../../../../lib/types';
import { resolveImagePosition } from '../../../../utils/imagePosition';
import { getCharacterImageUrls } from '../../../utils/imageUtils';

/**
 * Wrapper component that adds battle-specific functionality to CharacterCard
 */
export function BattleCharacterCard({
  playerId,
  playerClass,
  characterName,
  monsterId,
  effects,
  isActive,
  isDefeated,
  isVictor,
  isOpponent = false,
  allowAllTurns = false,
  rotation,
  scale = 1,
  turnLabel,
  showTurnIndicator = true,
  findAssociatedMonster,
  onAttack,
  onUseAbility,
  effectCallbacks,
  isMoveInProgress,
  confettiTrigger,
  cardRef,
}: BattleCharacterCardProps) {
  // Get Everart URL from character data
  const characterEverartUrl = (playerClass as any).imageUrl;
  
  // Get both primary (local CDN) and fallback (Everart) URLs
  const { primaryUrl, fallbackUrl } = getCharacterImageUrls(monsterId, characterEverartUrl);
  
  // Resolve image position using shared utility
  // Priority: character's own imagePosition > name-based lookup
  const characterImagePosition = (playerClass as any).imagePosition;
  const imagePosition = resolveImagePosition(
    characterName,
    playerClass.name,
    findAssociatedMonster,
    characterImagePosition
  );

  return (
    <div
      ref={cardRef}
      className="relative"
      style={{
        transform: `rotate(${rotation}deg) scale(${scale})`,
        opacity: isDefeated ? 0.5 : 1,
      }}
    >
      {/* Turn indicator */}
      {showTurnIndicator && isActive && !isDefeated && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-400 text-black px-3 py-1 rounded-md text-sm font-bold shadow-lg animate-pulse">
          {turnLabel || 'YOUR TURN'}
        </div>
      )}
      
      {/* Card with active state styling */}
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
          playerClass={playerClass}
          characterName={characterName}
          monsterImageUrl={primaryUrl}
          everartFallbackUrl={fallbackUrl}
          imagePosition={imagePosition}
          onAttack={onAttack}
          onUseAbility={onUseAbility}
          shouldShake={effects.shouldShake}
          shouldSparkle={effects.shouldSparkle}
          shouldMiss={effects.shouldMiss}
          shouldHit={effects.shouldHit}
          shouldCast={effects.shouldCast}
          shouldFlash={effects.shouldFlash}
          castTrigger={effects.castTrigger}
          flashTrigger={effects.flashTrigger}
          flashProjectileType={effects.flashProjectileType}
          castProjectileType={effects.castProjectileType}
          shakeTrigger={effects.shakeTrigger}
          sparkleTrigger={effects.sparkleTrigger}
          missTrigger={effects.missTrigger}
          hitTrigger={effects.hitTrigger}
          shakeIntensity={effects.shakeIntensity}
          sparkleIntensity={effects.sparkleIntensity}
          isMoveInProgress={isMoveInProgress}
          isActive={isActive}
          isDefeated={isDefeated}
          isVictor={isVictor}
          confettiTrigger={confettiTrigger}
          onShakeComplete={effectCallbacks.onShakeComplete}
          onSparkleComplete={effectCallbacks.onSparkleComplete}
          onMissComplete={effectCallbacks.onMissComplete}
          onHitComplete={effectCallbacks.onHitComplete}
          onCastComplete={effectCallbacks.onCastComplete}
          onFlashComplete={effectCallbacks.onFlashComplete}
          isOpponent={isOpponent}
          allowAllTurns={allowAllTurns}
        />
      </div>
    </div>
  );
}

// Made with Bob
