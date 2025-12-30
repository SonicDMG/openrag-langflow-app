'use client';

import { useRef, memo, useMemo } from 'react';
import { Character } from '../../../lib/types';
import { Sparkles } from '../../effects/Sparkles';
import { Confetti } from '../../effects/Confetti';
import { useCardAnimations } from '../../../hooks/ui/useCardAnimations';
import { useCardSizing } from '../../../hooks/ui/useCardSizing';
import { useImageState } from '../../../hooks/ui/useImageState';
import { getCharacterSource } from '../../../utils/character/characterSource';
import { CARD_THEME, getCardBoxShadow } from '../../cardTheme';
import { CardHeader } from './card-parts/CardHeader';
import { CardFooter } from './card-parts/CardFooter';
import { CardImage } from './card-parts/CardImage';
import { AbilitiesSection } from './card-parts/AbilitiesSection';
import { StatsSection } from './card-parts/StatsSection';
import { Divider } from './card-parts/Divider';

/**
 * Type definition for dust particle effect
 */
type DustParticle = {
  side: 'bottom' | 'top' | 'left' | 'right';
  position: number;
  delay: number;
  duration: number;
  horizontalOffset: number;
  verticalOffset: number;
};

/**
 * Configuration for dust particle generation
 */
const DUST_PARTICLE_CONFIG = {
  counts: {
    bottom: { min: 30, max: 45 },
    top: { min: 15, max: 25 },
    left: { min: 15, max: 25 },
    right: { min: 15, max: 25 },
  },
  animation: {
    maxDelay: 0.05,
    minDuration: 0.4,
    maxDuration: 0.7,
    offsetRange: 50,
  },
} as const;

/**
 * Generates random dust particles for all four sides of the card
 */
function generateDustParticles(): DustParticle[] {
  const getRandomCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  
  const getRandomPosition = () => Math.random() * 100;
  const getRandomDelay = () => Math.random() * DUST_PARTICLE_CONFIG.animation.maxDelay;
  const getRandomDuration = () =>
    DUST_PARTICLE_CONFIG.animation.minDuration +
    Math.random() * (DUST_PARTICLE_CONFIG.animation.maxDuration - DUST_PARTICLE_CONFIG.animation.minDuration);
  const getRandomOffset = () =>
    (Math.random() - 0.5) * DUST_PARTICLE_CONFIG.animation.offsetRange;

  const sides: Array<{ side: DustParticle['side']; isHorizontal: boolean }> = [
    { side: 'bottom', isHorizontal: true },
    { side: 'top', isHorizontal: true },
    { side: 'left', isHorizontal: false },
    { side: 'right', isHorizontal: false },
  ];

  return sides.flatMap(({ side, isHorizontal }) => {
    const config = DUST_PARTICLE_CONFIG.counts[side];
    const count = getRandomCount(config.min, config.max);
    
    return Array.from({ length: count }, () => ({
      side,
      position: getRandomPosition(),
      delay: getRandomDelay(),
      duration: getRandomDuration(),
      horizontalOffset: isHorizontal ? getRandomOffset() : 0,
      verticalOffset: isHorizontal ? 0 : getRandomOffset(),
    }));
  });
}

/**
 * Calculates the CSS style properties for a dust particle
 */
function getParticleStyle(particle: DustParticle): React.CSSProperties & { [key: `--${string}`]: string } {
  const isHorizontal = particle.side === 'bottom' || particle.side === 'top';
  
  return {
    '--dust-delay': `${particle.delay}s`,
    '--dust-duration': `${particle.duration}s`,
    '--dust-horizontal-offset': `${particle.horizontalOffset}px`,
    '--dust-vertical-offset': `${particle.verticalOffset}px`,
    left: isHorizontal ? `${particle.position}%` : (particle.side === 'left' ? '0%' : '100%'),
    top: isHorizontal ? (particle.side === 'bottom' ? '100%' : '0%') : `${particle.position}%`,
  };
}

/**
 * Dust particle effect component for defeated cards
 */
function DustParticleEffect() {
  const particles = useMemo(() => generateDustParticles(), []);
  
  return (
    <div className="card-dust-container">
      {particles.map((particle, i) => (
        <div
          key={i}
          className={`card-dust-particle card-dust-${particle.side}`}
          style={getParticleStyle(particle)}
        />
      ))}
    </div>
  );
}

// CharacterCard component - Unified card design for all pages
interface CharacterCardProps {
  playerClass: Character;
  characterName: string;
  // Animation props
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
  // Status props
  isActive?: boolean;
  isDefeated?: boolean;
  isVictor?: boolean;
  confettiTrigger?: number;
  // Callbacks
  onShakeComplete?: () => void;
  onSparkleComplete?: () => void;
  onMissComplete?: () => void;
  onHitComplete?: () => void;
  onCastComplete?: () => void;
  onFlashComplete?: () => void;
  // Action buttons (optional - for battle/test pages)
  onAttack?: (attackType?: 'melee' | 'ranged') => void;
  onUseAbility?: (index: number) => void;
  isMoveInProgress?: boolean;
  isOpponent?: boolean;
  allowAllTurns?: boolean;
  // Test buttons (optional - for test page)
  testButtons?: Array<{ label: string; onClick: () => void; className?: string }>;
  // Monster image URL (optional - for monster creator preview)
  monsterImageUrl?: string;
  // Everart fallback URL (optional - for fallback when local CDN fails)
  everartFallbackUrl?: string;
  // Image positioning (optional - for custom image positioning)
  imagePosition?: { offsetX: number; offsetY: number };
  // Size variant - 'normal' for battle cards, 'compact' for selection
  size?: 'normal' | 'compact';
  // Card position and total count (for card numbering)
  cardIndex?: number;
  totalCards?: number;
  // Whether this card is selected (for selection UI)
  isSelected?: boolean;
  // Selection sync trigger - when this changes, all selected cards restart their pulse animation
  selectionSyncTrigger?: number;
  // Custom image margin-bottom override
  imageMarginBottom?: string;
  // Zoom functionality
  onZoom?: () => void;
  showZoomButton?: boolean;
}

function CharacterCardComponent({
  playerClass,
  characterName,
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
  isActive = false,
  isDefeated = false,
  isVictor = false,
  confettiTrigger = 0,
  onShakeComplete,
  onSparkleComplete,
  onMissComplete,
  onHitComplete,
  onCastComplete,
  onFlashComplete,
  onAttack,
  onUseAbility,
  isMoveInProgress = false,
  isOpponent = false,
  allowAllTurns = false,
  testButtons = [],
  monsterImageUrl,
  everartFallbackUrl,
  imagePosition,
  size = 'normal',
  cardIndex,
  totalCards,
  isSelected = false,
  selectionSyncTrigger = 0,
  imageMarginBottom,
  onZoom,
  showZoomButton = false,
}: CharacterCardProps) {
  // Refs
  const animationRef = useRef<HTMLDivElement>(null);
  const characterImageRef = useRef<HTMLDivElement>(null);
  
  // Custom hooks
  const sizing = useCardSizing(size);
  const imageState = useImageState({ monsterImageUrl, characterName, sizing });
  
  // Use animations hook
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
  
  // Derived state
  const effectiveIsActive = allowAllTurns ? !isDefeated : isActive;
  const isDisabled = (effectiveIsActive && isMoveInProgress) || isDefeated;
  const shouldDisableOpponent = isOpponent && !allowAllTurns;
  const isInBattle = !!onAttack;
  
  return (
    <div
      ref={animationRef}
      className={`relative flex flex-col ${isDefeated ? 'card-damaged card-slam-down' : isInBattle ? 'card-elevated' : ''}`}
      style={{
        backgroundColor: CARD_THEME.colors.frame,
        borderRadius: sizing.borderRadius,
        width: sizing.maxWidth,
        minWidth: sizing.maxWidth,
        maxWidth: sizing.maxWidth,
        aspectRatio: '3/4',
        padding: sizing.framePadding,
        boxShadow: getCardBoxShadow(isSelected, isActive),
        backgroundImage: CARD_THEME.textures.outerFrame,
        backgroundSize: '100% 100%, 100% 100%, 4px 4px, 4px 4px',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Header: Character source badge and zoom button */}
      <CardHeader
        source={getCharacterSource(playerClass)}
        showZoomButton={showZoomButton}
        onZoom={onZoom}
        isCompact={sizing.isCompact}
      />

      {/* Dust particles effect when card slams down */}
      {isDefeated && isInBattle && <DustParticleEffect />}
      
      {/* Texture overlay for outer frame */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: sizing.borderRadius,
          background: CARD_THEME.textures.overlay,
          opacity: 0.6,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Cast effect - must be outside inner card to avoid overflow clipping */}
      {shouldCast && castTrigger > 0 && (
        <div 
          className={`${isOpponent ? 'card-cast-left' : 'card-cast-right'} ${castProjectileType ? `card-cast-${castProjectileType}` : ''}`}
          key={`cast-${castTrigger}`}
        />
      )}

      {/* Inner card with rounded corners */}
      <div 
        className={`relative overflow-hidden ${isDefeated ? 'card-inner-damaged' : ''}`}
        style={{ 
          backgroundColor: CARD_THEME.colors.innerCard,
          borderRadius: sizing.innerBorderRadius,
          flex: 1,
          minHeight: 0,
          backgroundImage: CARD_THEME.textures.innerCard,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 3px 3px, 3px 3px',
          boxShadow: CARD_THEME.shadows.innerCard,
        }}
      >
        {/* Paper grain texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: sizing.innerBorderRadius,
            background: CARD_THEME.textures.paperGrain,
            opacity: 0.8,
            mixBlendMode: 'multiply'
          }}
        />

        {/* Confetti for victor */}
        {isVictor && <Confetti key={`confetti-${characterName}-${confettiTrigger}`} trigger={confettiTrigger} />}

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
            className={`${isOpponent ? 'card-flash-left' : 'card-flash-right'} ${flashProjectileType ? `card-flash-${flashProjectileType}` : ''}`}
            key={`flash-${flashTrigger}`}
            style={{ position: 'absolute' }}
          />
        )}

        {/* Card Content */}
        <div className={`h-full flex flex-col relative z-10 ${isDefeated ? 'card-content-damaged' : ''}`} style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
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
          <Divider
            diamondSize={sizing.diamondSize}
            padding={sizing.padding}
            marginBottom={sizing.isCompact ? '0.5rem' : '0.75rem'}
          />

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
