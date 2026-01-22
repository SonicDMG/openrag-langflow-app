'use client';

import { useRef, memo } from 'react';
import { Character } from '../../../lib/types';
import { Sparkles } from '../../effects/Sparkles';
import { Confetti } from '../../effects/Confetti';
import { useCardAnimations } from '../../../hooks/ui/useCardAnimations';
import { useCardSizing, getCardSizeClasses } from '../../../hooks/ui/useCardSizing';
import { useImageState } from '../../../hooks/ui/useImageState';
import { getCharacterSource } from '../../../utils/character/characterSource';
import { getCardBoxShadowClass } from '../../cardTheme';
import { CardHeader } from './card-parts/CardHeader';
import { CardFooter } from './card-parts/CardFooter';
import { CardImage } from './card-parts/CardImage';
import { AbilitiesSection } from './card-parts/AbilitiesSection';
import { StatsSection } from './card-parts/StatsSection';
import { Divider } from './card-parts/Divider';
import { DustParticleEffect } from './card-parts/DustParticleEffect';

// ============================================================================
// Type Definitions
// ============================================================================

interface AnimationProps {
  shouldShake?: boolean;
  shouldSparkle?: boolean;
  shouldMiss?: boolean;
  shouldHit?: boolean;
  shouldCast?: boolean;
  shouldFlash?: boolean;
  castTrigger?: number;
  shakeTrigger?: number;
  sparkleTrigger?: number;
  missTrigger?: number;
  hitTrigger?: number;
  flashTrigger?: number;
  flashProjectileType?: string | null;
  castProjectileType?: string | null;
  shakeIntensity?: number;
  sparkleIntensity?: number;
}

interface StatusProps {
  isActive?: boolean;
  isDefeated?: boolean;
  isVictor?: boolean;
  confettiTrigger?: number;
}

interface AnimationCallbacks {
  onShakeComplete?: () => void;
  onSparkleComplete?: () => void;
  onMissComplete?: () => void;
  onHitComplete?: () => void;
  onCastComplete?: () => void;
  onFlashComplete?: () => void;
}

interface ActionProps {
  onAttack?: (attackType?: 'melee' | 'ranged') => void;
  onUseAbility?: (index: number) => void;
  isMoveInProgress?: boolean;
  isOpponent?: boolean;
  allowAllTurns?: boolean;
  testButtons?: Array<{ label: string; onClick: () => void; className?: string }>;
}

interface ImageProps {
  monsterImageUrl?: string;
  everartFallbackUrl?: string;
  imagePosition?: { offsetX: number; offsetY: number };
  imageMarginBottom?: string;
}

interface DisplayProps {
  size?: 'normal' | 'compact';
  cardIndex?: number;
  totalCards?: number;
  isSelected?: boolean;
  selectionSyncTrigger?: number;
}

interface ZoomProps {
  onZoom?: () => void;
  showZoomButton?: boolean;
}

interface CharacterCardProps extends AnimationProps, StatusProps, AnimationCallbacks, ActionProps, ImageProps, DisplayProps, ZoomProps {
  playerClass: Character;
  characterName: string;
}


// ============================================================================
// Component
// ============================================================================

function CharacterCardComponent({
  playerClass,
  characterName,
  // Animation props
  shouldShake = false,
  shouldSparkle = false,
  shouldMiss = false,
  shouldHit = false,
  shouldCast = false,
  shouldFlash = false,
  castTrigger = 0,
  shakeTrigger = 0,
  sparkleTrigger = 0,
  missTrigger = 0,
  hitTrigger = 0,
  flashTrigger = 0,
  flashProjectileType = null,
  castProjectileType = null,
  shakeIntensity = 0,
  sparkleIntensity = 0,
  // Status props
  isActive = false,
  isDefeated = false,
  isVictor = false,
  confettiTrigger = 0,
  // Callbacks
  onShakeComplete,
  onSparkleComplete,
  onMissComplete,
  onHitComplete,
  onCastComplete,
  onFlashComplete,
  // Action props
  onAttack,
  onUseAbility,
  isMoveInProgress = false,
  isOpponent = false,
  allowAllTurns = false,
  testButtons = [],
  // Image props
  monsterImageUrl,
  everartFallbackUrl,
  imagePosition,
  imageMarginBottom,
  // Display props
  size = 'normal',
  cardIndex,
  totalCards,
  isSelected = false,
  selectionSyncTrigger = 0,
  // Zoom props
  onZoom,
  showZoomButton = false,
}: CharacterCardProps) {
  // ===== REFS =====
  const animationRef = useRef<HTMLDivElement>(null);
  const characterImageRef = useRef<HTMLDivElement>(null);
  
  // ===== HOOKS =====
  const sizing = useCardSizing(size);
  const sizeClasses = getCardSizeClasses(sizing.isCompact);
  const imageState = useImageState({ monsterImageUrl, characterName, sizing });
  
  useCardAnimations(
    {
      shouldShake,
      shouldSparkle,
      shouldMiss,
      shouldHit,
      shouldCast,
      shouldFlash,
      shakeTrigger,
      sparkleTrigger,
      missTrigger,
      hitTrigger,
      castTrigger,
      flashTrigger,
      shakeIntensity,
      isSelected,
      selectionSyncTrigger,
    },
    {
      onShakeComplete,
      onSparkleComplete,
      onMissComplete,
      onHitComplete,
      onCastComplete,
      onFlashComplete,
    },
    { animationRef },
    playerClass.maxHitPoints
  );
  
  // ===== DERIVED STATE =====
  const effectiveIsActive = allowAllTurns ? !isDefeated : isActive;
  const isDisabled = (effectiveIsActive && isMoveInProgress) || isDefeated;
  const shouldDisableOpponent = isOpponent && !allowAllTurns;
  const isInBattle = !!onAttack;
  
  // ===== STYLE CALCULATIONS =====
  // Only dynamic styles from sizing hook - static styles moved to className
  const outerFrameStyle = {
    width: sizing.maxWidth,
    minWidth: sizing.maxWidth,
    maxWidth: sizing.maxWidth,
    padding: sizing.framePadding,
  };

  const innerCardStyle = {
    // No inline styles needed - using Tailwind classes
  };

  // ===== RENDER =====
  // Build className strings for better readability
  const outerFrameClassName = [
    'relative',
    'flex',
    'flex-col',
    'aspect-[3/4]',
    'overflow-visible',
    'transition-transform',
    'duration-200',
    'hover:scale-[1.02]',
    'rounded-xl', // Main card border radius
    'bg-stone-800',
    getCardBoxShadowClass(isSelected, isActive),
    isDefeated ? 'card-damaged card-slam-down' : isInBattle ? 'card-elevated' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={animationRef}
      className={outerFrameClassName}
      style={outerFrameStyle}
    >
      {/* Dust particles effect when card slams down */}
      {isDefeated && isInBattle && <DustParticleEffect />}
      
      {/* Cast effect - must be outside inner card to avoid overflow clipping */}
      {shouldCast && castTrigger > 0 && (
        <div 
          className={`${isOpponent ? 'card-cast-left' : 'card-cast-right'} ${
            castProjectileType ? `card-cast-${castProjectileType}` : ''
          }`}
          key={`cast-${castTrigger}`}
        />
      )}

      {/* Inner card with rounded corners - larger radius at bottom */}
      <div 
        className={[
          'relative',
          'overflow-hidden',
          'shadow-inner',
          'flex-1',
          'min-h-0',
          'rounded-t-lg', // Top corners use medium radius
          'rounded-b-[1.5vw]', // Bottom corners use larger radius
          'bg-amber-50',
          isDefeated ? 'card-inner-damaged' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Confetti for victor */}
        {isVictor && (
          <Confetti 
            key={`confetti-${characterName}-${confettiTrigger}`} 
            trigger={confettiTrigger} 
          />
        )}

        {/* Sparkles effect */}
        {shouldSparkle && (
          <Sparkles 
            key={`sparkle-${characterName}-${sparkleTrigger}`} 
            trigger={sparkleTrigger} 
            count={sparkleIntensity > 0 ? Math.max(1, Math.ceil(sparkleIntensity * 0.6)) : 12}
          />
        )}

        {/* Flash/glow effect for attack initiation */}
        {shouldFlash && flashTrigger > 0 && (
          <div 
            className={`${isOpponent ? 'card-flash-left' : 'card-flash-right'} ${
              flashProjectileType ? `card-flash-${flashProjectileType}` : ''
            }`}
            key={`flash-${flashTrigger}`}
            style={{ position: 'absolute' }}
          />
        )}

        {/* Card Content */}
        <div 
          className={[
            'h-full',
            'flex',
            'flex-col',
            'relative',
            'z-10',
            isDefeated ? 'card-content-damaged' : '',
          ].filter(Boolean).join(' ')}
          style={{ padding: '0' }}
        >
          {/* Header: Character source badge and zoom button - above image */}
          <CardHeader
            source={getCharacterSource(playerClass)}
            showZoomButton={showZoomButton}
            onZoom={onZoom}
            isCompact={sizing.isCompact}
          />

          {/* Character Image */}
          <CardImage
            playerClass={playerClass}
            characterName={characterName}
            monsterImageUrl={monsterImageUrl}
            everartFallbackUrl={everartFallbackUrl}
            monsterId={(playerClass as any).monsterId}
            imagePosition={imagePosition}
            imageError={imageState.imageError}
            setImageError={imageState.setImageError}
            setMainImageLoaded={imageState.setMainImageLoaded}
            nameRef={imageState.nameRef}
            characterImageRef={characterImageRef}
            sizing={sizing}
            imageMarginBottom={imageMarginBottom}
          />

          {/* Abilities section - hidden for compact cards */}
          {!sizing.isCompact && (
            <AbilitiesSection
              playerClass={playerClass}
              onAttack={onAttack}
              onUseAbility={onUseAbility}
              shouldDisableOpponent={shouldDisableOpponent}
              isDisabled={isDisabled}
              effectiveIsActive={effectiveIsActive}
              isOpponent={isOpponent}
              testButtons={testButtons}
              sizing={sizing}
            />
          )}

          {/* Divider with diamond icon */}
          <Divider isCompact={sizing.isCompact} />

          {/* Stats section */}
          <StatsSection
            playerClass={playerClass}
            isDefeated={isDefeated}
            sizing={sizing}
          />
        </div>
      </div>

      {/* Footer text in dark frame area */}
      <CardFooter
        cardIndex={cardIndex}
        totalCards={totalCards}
        isCompact={sizing.isCompact}
      />
    </div>
  );
}

export const CharacterCard = memo(CharacterCardComponent);

// Made with Bob
