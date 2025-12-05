'use client';

import { useRef, useEffect, memo, useState } from 'react';
import { DnDClass, Ability, AttackAbility, HealingAbility } from '../types';
import { Sparkles } from './Sparkles';
import { Confetti } from './Confetti';
import { applyAnimationClass } from '../utils/animations';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, isMonster } from '../constants';

/**
 * Builds a tooltip string for a basic attack that includes dice information
 */
function buildAttackTooltip(damageDie: string, attackType?: 'melee' | 'ranged'): string {
  const parts: string[] = [];
  
  // Add description based on attack type
  if (attackType === 'melee') {
    parts.push('Basic melee weapon attack');
  } else if (attackType === 'ranged') {
    parts.push('Basic ranged weapon attack');
  } else {
    parts.push('Basic melee or ranged attack');
  }
  
  // Add dice information with labels
  const diceInfo: string[] = [];
  diceInfo.push('d20 (attack roll)'); // Attack roll is always d20
  if (damageDie) {
    // Ensure damageDie has the "1" prefix if it's just "dX"
    const formattedDie = damageDie.startsWith('d') ? `1${damageDie}` : damageDie;
    diceInfo.push(`${formattedDie} (damage)`);
  }
  
  if (diceInfo.length > 0) {
    parts.push(`Dice: ${diceInfo.join(', ')}`);
  }
  
  return parts.join('\n');
}

/**
 * Builds a tooltip string for an ability that includes dice information
 */
function buildAbilityTooltip(ability: Ability): string {
  const parts: string[] = [];
  
  // Add description
  if (ability.description) {
    parts.push(ability.description);
  }
  
  // Add dice information based on ability type
  if (ability.type === 'attack') {
    const attackAbility = ability as AttackAbility;
    const diceInfo: string[] = [];
    
    // Attack roll (d20) if required
    if (attackAbility.attackRoll) {
      diceInfo.push('d20');
    }
    
    // Damage dice
    if (attackAbility.damageDice) {
      diceInfo.push(attackAbility.damageDice);
    }
    
    // Bonus damage dice
    if (attackAbility.bonusDamageDice) {
      diceInfo.push(`+${attackAbility.bonusDamageDice}`);
    }
    
    // Number of attacks if > 1
    const numAttacks = attackAbility.attacks || 1;
    if (numAttacks > 1) {
      diceInfo.push(`(${numAttacks} attacks)`);
    }
    
    if (diceInfo.length > 0) {
      parts.push(`Dice: ${diceInfo.join(' ')}`);
    }
  } else if (ability.type === 'healing') {
    const healingAbility = ability as HealingAbility;
    
    // Healing dice
    if (healingAbility.healingDice) {
      parts.push(`Dice: ${healingAbility.healingDice}`);
    }
  }
  
  return parts.join('\n');
}

// CharacterCard component - Unified card design for all pages
interface CharacterCardProps {
  playerClass: DnDClass;
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
  // Cut-out monster image URL (optional - for animated layered display)
  monsterCutOutImageUrl?: string;
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
  monsterCutOutImageUrl,
  size = 'normal',
  cardIndex,
  totalCards,
  isSelected = false,
  selectionSyncTrigger = 0,
  imageMarginBottom,
  onZoom,
  showZoomButton = false,
}: CharacterCardProps) {
  const animationRef = useRef<HTMLDivElement>(null);
  const characterImageRef = useRef<HTMLDivElement>(null);
  const cutOutCharacterRef = useRef<HTMLImageElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const effectiveIsActive = allowAllTurns ? !isDefeated : isActive;
  const isDisabled = (effectiveIsActive && isMoveInProgress) || isDefeated;
  // Only disable opponent abilities if allowAllTurns is false (i.e., it's actually auto-playing)
  const shouldDisableOpponent = isOpponent && !allowAllTurns;
  const [imageError, setImageError] = useState(false);
  const [cutOutImageError, setCutOutImageError] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  
  // Placeholder image URL for cards without associated monsters
  const placeholderImageUrl = '/cdn/placeholder.png';

  // Apply shake animation
  // If there's an animated character (cut-out image), shake only the cut-out character, not the background
  useEffect(() => {
    const hasAnimatedCharacter = monsterCutOutImageUrl && !cutOutImageError;
    const targetRef = hasAnimatedCharacter ? cutOutCharacterRef : animationRef;
    
    if (targetRef.current && shouldShake) {
      const intensity = shakeIntensity > 0 ? shakeIntensity : 1;
      const maxHP = playerClass.maxHitPoints;
      const intensityPercent = Math.min(intensity / maxHP, 1.0);
      const scale = 0.15 + (Math.sqrt(intensityPercent) * 1.85);
      targetRef.current.style.setProperty('--shake-intensity', scale.toString());
    }
    
    const cleanup = applyAnimationClass(
      targetRef.current,
      shouldShake,
      shakeTrigger,
      'shake',
      400,
      onShakeComplete || (() => {})
    );
    return cleanup;
  }, [shouldShake, shakeTrigger, shakeIntensity, playerClass.maxHitPoints, onShakeComplete, monsterCutOutImageUrl, cutOutImageError]);

  // Apply sparkle animation
  useEffect(() => {
    if (shouldSparkle && sparkleTrigger > 0) {
      const timer = setTimeout(() => {
        onSparkleComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldSparkle, sparkleTrigger, onSparkleComplete]);

  // Apply miss animation
  useEffect(() => {
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldMiss,
      missTrigger,
      'miss',
      600,
      onMissComplete || (() => {})
    );
    return cleanup;
  }, [shouldMiss, missTrigger, onMissComplete]);

  // Apply hit animation
  useEffect(() => {
    if (shouldHit && hitTrigger > 0) {
      const timer = setTimeout(() => {
        onHitComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldHit, hitTrigger, onHitComplete]);

  // Apply cast animation
  useEffect(() => {
    if (shouldCast && castTrigger > 0) {
      const timer = setTimeout(() => {
        onCastComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldCast, castTrigger, onCastComplete]);

  // Apply flash animation
  useEffect(() => {
    if (shouldFlash && flashTrigger > 0) {
      const timer = setTimeout(() => {
        onFlashComplete?.();
      }, 500); // Match flash animation duration
      return () => clearTimeout(timer);
    }
  }, [shouldFlash, flashTrigger, onFlashComplete]);

  // Apply pulse animation for selected cards - restart animation to sync with other selected cards
  useEffect(() => {
    if (!animationRef.current) return;
    
    if (isSelected) {
      // Remove and re-add the animation class to restart it, ensuring sync with other cards
      const element = animationRef.current;
      element.classList.remove('card-pulse');
      
      // Use requestAnimationFrame to ensure all cards restart at the same frame
      // The selectionSyncTrigger ensures all cards restart together even if selected at different times
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (element && isSelected) {
            element.classList.add('card-pulse');
          }
        });
      });
    } else {
      // Remove animation when not selected
      animationRef.current.classList.remove('card-pulse');
    }
  }, [isSelected, selectionSyncTrigger]);

  // Ensure breathing animation is applied to cutout image when it loads
  useEffect(() => {
    if (cutOutCharacterRef.current && monsterCutOutImageUrl && mainImageLoaded && !cutOutImageError) {
      const element = cutOutCharacterRef.current;
      // Ensure the character-cutout class is applied
      if (!element.classList.contains('character-cutout')) {
        element.classList.add('character-cutout');
      }
      // Force the animation to start by removing and re-adding the class
      element.classList.remove('character-cutout');
      requestAnimationFrame(() => {
        if (element && !cutOutImageError) {
          element.classList.add('character-cutout');
        }
      });
    }
  }, [monsterCutOutImageUrl, mainImageLoaded, cutOutImageError]);

  // Reset image error and loaded state when monsterImageUrl changes
  useEffect(() => {
    if (monsterImageUrl) {
      setImageError(false);
      setMainImageLoaded(false);
    }
  }, [monsterImageUrl]);

  // Reset cut-out image error when monsterCutOutImageUrl changes
  useEffect(() => {
    if (monsterCutOutImageUrl) {
      setCutOutImageError(false);
    }
  }, [monsterCutOutImageUrl]);

  // Adjust font size for long names to prevent wrapping
  useEffect(() => {
    const adjustFontSize = () => {
      if (!nameRef.current) return;
      
      const element = nameRef.current;
      const parent = element.parentElement;
      if (!parent) return;
      
      const isCompact = size === 'compact';
      
      // Get available width (parent width minus padding and icon space)
      const parentWidth = parent.offsetWidth;
      const paddingRight = isCompact ? 24 : 48; // 1.5rem = 24px, 3rem = 48px
      const availableWidth = parentWidth - paddingRight;
      
      // Reset to default size first to measure accurately
      element.style.fontSize = '';
      element.style.whiteSpace = 'nowrap';
      
      // Measure text width
      const textWidth = element.scrollWidth;
      
      // If text is too wide, calculate and apply smaller font size
      if (textWidth > availableWidth) {
        const baseFontSize = isCompact ? 16 : 20; // text-base = 16px, text-xl = 20px
        const scaleFactor = availableWidth / textWidth;
        const newFontSize = Math.max(baseFontSize * scaleFactor * 0.95, baseFontSize * 0.6); // Scale down, but not below 60% of base
        element.style.fontSize = `${newFontSize}px`;
      } else {
        // Reset to default if it fits
        element.style.fontSize = '';
      }
    };
    
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(adjustFontSize);
    });
    
    // Also handle window resize
    window.addEventListener('resize', adjustFontSize);
    
    return () => {
      window.removeEventListener('resize', adjustFontSize);
    };
  }, [characterName, size]);

  // Size scaling - compact is 60% of normal
  const isCompact = size === 'compact';
  const maxWidth = isCompact ? '192px' : '320px'; // 320 * 0.6 = 192
  const padding = isCompact ? '0.75rem' : '1rem'; // p-3 vs p-4
  // For compact cards, make image larger since abilities section is hidden
  const imageWidth = isCompact ? '180px' : '280px'; // Larger for compact since no abilities shown
  const imageHeight = isCompact ? '130px' : '200px'; // Larger for compact since no abilities shown
  const borderWidth = isCompact ? '2px' : '3px';
  const borderRadius = isCompact ? '8px' : '12px';
  const iconSize = isCompact ? 'w-6 h-6' : 'w-10 h-10';
  const titleSize = isCompact ? 'text-base' : 'text-xl';
  const typeSize = isCompact ? 'text-[10px]' : 'text-xs';
  const abilityHeadingSize = isCompact ? 'text-[9px]' : 'text-xs';
  const abilityTextSize = isCompact ? 'text-[8px]' : 'text-[10px]';
  const abilityButtonPadding = isCompact ? '1px 4px' : '2px 6px';
  const statsTextSize = isCompact ? 'text-[10px]' : 'text-sm';
  const abilityGap = isCompact ? 'gap-0' : 'gap-1';
  const abilityLineHeight = isCompact ? 'leading-tight' : 'leading-normal';
  const hpBarMaxWidth = isCompact ? '84px' : '140px'; // 140 * 0.6 = 84
  const diamondSize = isCompact ? '6px' : '8px';
  const framePadding = isCompact ? '6px' : '10px'; // Padding for the dark frame
  const innerBorderRadius = isCompact ? '8px' : '12px'; // Rounded corners for inner card

  // Check if we're in battle mode (has onAttack callback)
  const isInBattle = !!onAttack;
  
  return (
    <div 
      ref={animationRef}
      className={`relative flex flex-col ${isDefeated ? 'card-damaged card-slam-down' : isInBattle ? 'card-elevated' : ''}`}
      style={{ 
        backgroundColor: '#1a1a1a', // Dark black frame background
        borderRadius: borderRadius,
        width: '100%',
        maxWidth: maxWidth, // Constrain width to maintain portrait aspect
        aspectRatio: '3/4', // Portrait orientation: 3 wide by 4 tall
        padding: framePadding, // Dark frame padding
        boxShadow: isSelected
          ? '0 0 12px rgba(127, 29, 29, 0.6), 0 0 6px rgba(185, 28, 28, 0.4), 0 8px 20px rgba(0, 0, 0, 0.3), 0 4px 10px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : isActive 
          ? '0 0 20px rgba(251, 191, 36, 0.5), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        // Paper texture effect for outer frame
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 4px 4px, 4px 4px',
        position: 'relative',
        overflow: 'visible' // Allow cast effect to extend outside card
      }}
    >
      {/* Default Hero Badge - top left corner */}
      {playerClass.isDefault && (
        <div
          className="absolute top-2 left-2 z-30 bg-amber-600/90 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg border border-amber-400/50"
          title="Default Hero - loaded from game defaults"
        >
          DEFAULT
        </div>
      )}

      {/* Zoom button - printed text on card */}
      {showZoomButton && onZoom && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onZoom();
          }}
          className="absolute top-2 right-2 z-30 transition-all cursor-pointer"
          style={{
            backgroundColor: 'transparent',
            color: '#5C4033',
            fontFamily: 'serif',
            fontWeight: 'bold',
            border: 'none',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          title="View details"
          aria-label="View character details"
        >
          <svg className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
      )}
      
      {/* Dust particles effect when card slams down */}
      {isDefeated && isInBattle && (() => {
        // Generate random particle counts per side (more realistic dust distribution)
        // Each side gets a random number between min and max particles
        const getRandomCount = (min: number, max: number) => 
          Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Generate random counts for each side (ensuring bottom has good coverage)
        const bottomCount = getRandomCount(8, 15); // Bottom: 8-15 particles
        const topCount = getRandomCount(6, 12);   // Top: 6-12 particles
        const leftCount = getRandomCount(6, 12);  // Left: 6-12 particles
        const rightCount = getRandomCount(6, 12); // Right: 6-12 particles
        
        const totalParticles = bottomCount + topCount + leftCount + rightCount;
        const particles: Array<{ 
          side: 'bottom' | 'top' | 'left' | 'right'; 
          position: number; // 0-100 for position along the edge
          delay: number; // Animation delay in seconds
          duration: number; // Animation duration in seconds
          horizontalOffset: number; // Random horizontal offset for bottom/top
          verticalOffset: number; // Random vertical offset for left/right
        }> = [];
        
        // Helper to generate random position along edge
        const getRandomPosition = () => Math.random() * 100;
        const getRandomDelay = () => Math.random() * 0.05; // 0-0.05s delay (almost immediate)
        const getRandomDuration = () => 0.3 + Math.random() * 0.2; // 0.3-0.5s duration (quick burst)
        const getRandomOffset = () => (Math.random() - 0.5) * 30; // -15px to +15px
        
        // Create bottom particles
        for (let i = 0; i < bottomCount; i++) {
          particles.push({ 
            side: 'bottom', 
            position: getRandomPosition(),
            delay: getRandomDelay(),
            duration: getRandomDuration(),
            horizontalOffset: getRandomOffset(),
            verticalOffset: 0
          });
        }
        
        // Create top particles
        for (let i = 0; i < topCount; i++) {
          particles.push({ 
            side: 'top', 
            position: getRandomPosition(),
            delay: getRandomDelay(),
            duration: getRandomDuration(),
            horizontalOffset: getRandomOffset(),
            verticalOffset: 0
          });
        }
        
        // Create left particles
        for (let i = 0; i < leftCount; i++) {
          particles.push({ 
            side: 'left', 
            position: getRandomPosition(),
            delay: getRandomDelay(),
            duration: getRandomDuration(),
            horizontalOffset: 0,
            verticalOffset: getRandomOffset()
          });
        }
        
        // Create right particles
        for (let i = 0; i < rightCount; i++) {
          particles.push({ 
            side: 'right', 
            position: getRandomPosition(),
            delay: getRandomDelay(),
            duration: getRandomDuration(),
            horizontalOffset: 0,
            verticalOffset: getRandomOffset()
          });
        }
        
        return (
          <div className="card-dust-container">
            {particles.map((particle, i) => {
              // Set initial position based on side
              const initialStyle: React.CSSProperties & { [key: `--${string}`]: string } = {
                '--dust-delay': `${particle.delay}s`,
                '--dust-duration': `${particle.duration}s`,
                '--dust-horizontal-offset': `${particle.horizontalOffset}px`,
                '--dust-vertical-offset': `${particle.verticalOffset}px`,
              };
              
              if (particle.side === 'bottom' || particle.side === 'top') {
                initialStyle.left = `${particle.position}%`;
                initialStyle.top = particle.side === 'bottom' ? '100%' : '0%';
              } else {
                initialStyle.left = particle.side === 'left' ? '0%' : '100%';
                initialStyle.top = `${particle.position}%`;
              }
              
              return (
                <div 
                  key={i} 
                  className={`card-dust-particle card-dust-${particle.side}`}
                  style={initialStyle}
                />
              );
            })}
          </div>
        );
      })()}
      {/* Texture overlay for outer frame */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: borderRadius,
          background: `
            repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.03) 0px,
              transparent 1px,
              transparent 2px,
              rgba(0, 0, 0, 0.03) 3px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.03) 0px,
              transparent 1px,
              transparent 2px,
              rgba(0, 0, 0, 0.03) 3px
            )
          `,
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
          backgroundColor: '#F2ECDE', // Light beige background
          borderRadius: innerBorderRadius,
          flex: 1,
          minHeight: 0, // Allow flex to shrink
          // Paper texture effect for inner card
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.02) 0%, transparent 50%),
            repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 0, 0, 0.03) 1px, rgba(0, 0, 0, 0.03) 2px),
            repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0, 0, 0, 0.03) 1px, rgba(0, 0, 0, 0.03) 2px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 3px 3px, 3px 3px',
          // Subtle embossed effect
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.5),
            inset 0 -1px 2px rgba(0, 0, 0, 0.1),
            0 2px 4px rgba(0, 0, 0, 0.15)
          `
        }}
      >
        {/* Paper grain texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: innerBorderRadius,
            background: `
              repeating-linear-gradient(
                0deg,
                rgba(139, 111, 71, 0.02) 0px,
                transparent 0.5px,
                transparent 1px,
                rgba(139, 111, 71, 0.02) 1.5px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(139, 111, 71, 0.02) 0px,
                transparent 0.5px,
                transparent 1px,
                rgba(139, 111, 71, 0.02) 1.5px
              )
            `,
            opacity: 0.8,
            mixBlendMode: 'multiply'
          }}
        />
        {/* Defeated overlay - removed skull icon, damage effect applied via CSS class */}

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

        {/* Flash/glow effect for attack initiation - appears on side facing opponent */}
        {shouldFlash && flashTrigger > 0 && (
          <div 
            className={`${isOpponent ? 'card-flash-left' : 'card-flash-right'} ${flashProjectileType ? `card-flash-${flashProjectileType}` : ''}`}
            key={`flash-${flashTrigger}`}
            style={{ position: 'absolute' }}
          />
        )}

        {/* Card Content */}
        <div className={`h-full flex flex-col relative z-10 ${isDefeated ? 'card-content-damaged' : ''}`} style={{ padding: padding }}>
        {/* Header with name, type, and symbol */}
        <div className="relative" style={{ marginBottom: isCompact ? '0.5rem' : '0.75rem' }}>
          {/* Character name - bold, dark brown */}
          <h3 
            ref={nameRef}
            className={`${titleSize} font-bold mb-1`}
            style={{ 
              fontFamily: 'serif',
              color: '#5C4033', // Dark brown
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {characterName}
          </h3>

          {/* Character type - smaller, lighter brown */}
          <p 
            className={typeSize}
            style={{ 
              color: '#8B6F47', // Lighter brown
              fontStyle: 'italic'
            }}
          >
            {/* For created monsters, use klass field if available */}
            {/* For custom heroes (not in FALLBACK_CLASSES and not created monsters), we don't have a class type, so show "Hero" */}
            {/* For regular classes/monsters, use name as class type */}
            {(() => {
              // If it's a created monster, use klass
              if ((playerClass as any).klass) {
                return (playerClass as any).klass;
              }
              // Check if it's a default monster or hero
              const isDefaultMonster = FALLBACK_MONSTERS.some(fm => fm.name === playerClass.name);
              const isDefaultHero = FALLBACK_CLASSES.some(fc => fc.name === playerClass.name);
              
              // If it has a monsterId, it's a created monster
              if ((playerClass as any).monsterId) {
                return 'Monster';
              }
              // If it's a default monster, use its name as the class
              if (isDefaultMonster) {
                return playerClass.name;
              }
              // If it's a custom hero (not in defaults and not a monster)
              if (!isDefaultHero && !isDefaultMonster) {
                return 'Hero';
              }
              // Otherwise, use name as class type (for default heroes)
              return playerClass.name;
            })()}
          </p>
        </div>

        {/* Central pixel art image in frame - slightly darker beige */}
        <div 
          ref={characterImageRef}
          className="rounded-lg flex justify-center items-center overflow-hidden relative"
          style={{ 
            backgroundColor: '#E8E0D6', // Slightly darker beige frame
            border: isCompact ? '1.5px solid #D4C4B0' : '2px solid #D4C4B0',
            borderRadius: isCompact ? '6px' : '8px',
            padding: '0', // Remove padding so image fills the container
            width: `calc(100% + ${padding} + ${padding})`, // Extend beyond padding on both sides to reach full card width
            height: imageHeight, // Scaled height
            aspectRatio: '280/200', // Match the actual image aspect ratio (1.4:1)
            marginBottom: imageMarginBottom || (isCompact ? '1.5rem' : '0.75rem'),
            marginLeft: `-${padding}`, // Negative margin to counteract parent padding
            marginRight: `-${padding}`, // Negative margin to counteract parent padding
          }}
        >
          {monsterImageUrl && !imageError ? (
            <>
              {/* Background image layer */}
              <img
                src={monsterImageUrl}
                alt={characterName}
                style={{
                  imageRendering: 'pixelated' as const,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                onLoad={() => setMainImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {/* Cut-out character layer with animation (only load after main image loads to avoid initial 404s) */}
              {monsterCutOutImageUrl && mainImageLoaded && !cutOutImageError && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0, // Align bottom of cutout with bottom of background
                    left: '50%',
                    transform: 'translateX(-50%) scale(0.8)', // Scale container to 80%
                    transformOrigin: 'center bottom', // Scale from bottom center so bottom stays aligned
                    width: '100%',
                    height: '100%',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'flex-end', // Align image to bottom of container
                    justifyContent: 'center',
                  }}
                >
                  <img
                    ref={cutOutCharacterRef}
                    src={monsterCutOutImageUrl}
                    alt={`${characterName} (cut-out)`}
                    className="character-cutout"
                    style={{
                      imageRendering: 'pixelated' as const,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain', // Preserve aspect ratio and fit within container
                      objectPosition: 'center bottom', // Align character to bottom
                      display: 'block',
                    }}
                    onLoad={() => {
                      // Ensure animation starts when image loads
                      if (cutOutCharacterRef.current) {
                        const element = cutOutCharacterRef.current;
                        element.classList.remove('character-cutout');
                        requestAnimationFrame(() => {
                          if (element) {
                            element.classList.add('character-cutout');
                          }
                        });
                      }
                    }}
                    onError={() => {
                      // Silently handle missing cutout images - they're optional
                      setCutOutImageError(true);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            // If no monsterImageUrl or image error, show placeholder image
            <img
              src={placeholderImageUrl}
              alt="Placeholder"
              style={{
                imageRendering: 'pixelated' as const,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          )}
        </div>

        {/* Abilities section - hidden for compact cards since abilities are randomly generated on battle start */}
        {!isCompact && (
        <div style={{ marginBottom: isCompact ? '0.375rem' : '0.75rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: isCompact ? '0.125rem' : '0.375rem' }}>
            <h4 
              className={`${abilityHeadingSize} font-semibold`}
              style={{ color: '#8B6F47' }} // Lighter brown for heading
            >
              Abilities
            </h4>
            {isOpponent && (
              <div className={`${abilityTextSize} italic font-semibold`} style={{ color: '#8B6F47' }}>
                Auto-playing opponent
              </div>
            )}
          </div>
          <div className="flex flex-wrap" style={{ gap: isCompact ? '2px' : '2px', alignItems: 'flex-start' }}>
            {/* Basic Attack button(s) - show separate Melee/Ranged if both are available */}
            {onAttack && (() => {
              const hasMelee = !!playerClass.meleeDamageDie;
              const hasRanged = !!playerClass.rangedDamageDie;
              const showSeparate = hasMelee && hasRanged;
              const attackIcon = '⚔️';
              const iconSize = isCompact ? '0.65em' : '0.75em';
              
              if (showSeparate) {
                // Show separate Melee and Ranged buttons
                return (
                  <>
                    <button
                      onClick={() => onAttack('melee')}
                      disabled={shouldDisableOpponent || isDisabled}
                      className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80"
                      style={{ 
                        color: '#000000',
                        backgroundColor: '#D1C9BA',
                        border: '1px solid #D4C4B0',
                        borderRadius: '6px',
                        padding: abilityButtonPadding,
                        cursor: (shouldDisableOpponent || isDisabled) ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        fontFamily: 'serif',
                        fontWeight: 'bold',
                        fontSize: isCompact ? '8px' : '10px',
                        lineHeight: '1.2',
                        minHeight: 'auto',
                        boxSizing: 'border-box',
                        margin: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        verticalAlign: 'top'
                      }}
                      title={buildAttackTooltip(playerClass.meleeDamageDie!, 'melee')}
                    >
                      <span style={{ fontSize: iconSize, lineHeight: '1' }}>{attackIcon}</span>
                      Melee
                    </button>
                    <button
                      onClick={() => onAttack('ranged')}
                      disabled={shouldDisableOpponent || isDisabled}
                      className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80"
                      style={{ 
                        color: '#000000',
                        backgroundColor: '#D1C9BA',
                        border: '1px solid #D4C4B0',
                        borderRadius: '6px',
                        padding: abilityButtonPadding,
                        cursor: (shouldDisableOpponent || isDisabled) ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        fontFamily: 'serif',
                        fontWeight: 'bold',
                        fontSize: isCompact ? '8px' : '10px',
                        lineHeight: '1.2',
                        minHeight: 'auto',
                        boxSizing: 'border-box',
                        margin: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        verticalAlign: 'top'
                      }}
                      title={buildAttackTooltip(playerClass.rangedDamageDie!, 'ranged')}
                    >
                      <span style={{ fontSize: iconSize, lineHeight: '1' }}>{attackIcon}</span>
                      Ranged
                    </button>
                  </>
                );
              } else {
                // Show single Attack button (fallback to damageDie)
                // Determine attack type and damage die
                let damageDie: string;
                let attackType: 'melee' | 'ranged' | undefined;
                
                if (hasMelee) {
                  damageDie = playerClass.meleeDamageDie!;
                  attackType = 'melee';
                } else if (hasRanged) {
                  damageDie = playerClass.rangedDamageDie!;
                  attackType = 'ranged';
                } else {
                  damageDie = playerClass.damageDie;
                  attackType = undefined; // Generic attack
                }
                
                return (
                  <button
                    onClick={() => onAttack()}
                    disabled={shouldDisableOpponent || isDisabled}
                    className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80"
                    style={{ 
                      color: '#000000',
                      backgroundColor: '#D1C9BA',
                      border: '1px solid #D4C4B0',
                      borderRadius: '6px',
                      padding: abilityButtonPadding,
                      cursor: (shouldDisableOpponent || isDisabled) ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      fontFamily: 'serif',
                      fontWeight: 'bold',
                      fontSize: isCompact ? '8px' : '10px',
                      lineHeight: '1.2',
                      minHeight: 'auto',
                      boxSizing: 'border-box',
                      margin: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      verticalAlign: 'top'
                    }}
                    title={buildAttackTooltip(damageDie, attackType)}
                  >
                    <span style={{ fontSize: iconSize, lineHeight: '1' }}>{attackIcon}</span>
                    Attack
                  </button>
                );
              }
            })()}
            {/* Ability buttons */}
            {playerClass.abilities.length > 0 && playerClass.abilities.map((ability, idx) => {
              const isTestHeal = ability.name === 'Test Heal';
              const testMissButton = testButtons.find(btn => btn.label.includes('Test Miss'));
              const isAttack = ability.type === 'attack';
              const abilityIcon = isAttack ? '⚔️' : '💚';
              const iconSize = isCompact ? '0.65em' : '0.75em';
              
              // For non-interactive mode (auto-playing opponents or preview), show as disabled buttons
              if (shouldDisableOpponent || !onUseAbility) {
                return (
                  <button
                    key={idx}
                    disabled
                    className="opacity-75 cursor-default"
                    style={{ 
                      color: '#000000',
                      backgroundColor: '#D1C9BA',
                      border: '1px solid #D4C4B0',
                      borderRadius: '6px',
                      padding: abilityButtonPadding,
                      whiteSpace: 'nowrap',
                      fontFamily: 'serif',
                      fontWeight: 'bold',
                      fontSize: isCompact ? '8px' : '10px',
                      lineHeight: '1.2',
                      minHeight: 'auto',
                      boxSizing: 'border-box',
                      margin: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      verticalAlign: 'middle'
                    }}
                    title={buildAbilityTooltip(ability) || undefined}
                  >
                    <span style={{ fontSize: iconSize, lineHeight: '1' }}>{abilityIcon}</span>
                    {ability.name}
                  </button>
                );
              }
              
              // For interactive mode, show as clickable buttons
              return (
                <button
                  key={idx}
                  onClick={() => onUseAbility(idx)}
                  disabled={!effectiveIsActive || isDisabled}
                  className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80"
                  style={{ 
                    color: '#000000',
                    backgroundColor: '#D1C9BA',
                    border: '1px solid #D4C4B0',
                    borderRadius: '6px',
                    padding: abilityButtonPadding,
                    cursor: (!effectiveIsActive || isDisabled) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'serif',
                    fontWeight: 'bold',
                    fontSize: isCompact ? '8px' : '10px',
                    lineHeight: '1.2',
                    minHeight: 'auto',
                    boxSizing: 'border-box',
                    margin: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    verticalAlign: 'top'
                  }}
                  title={buildAbilityTooltip(ability) || undefined}
                  >
                    <span style={{ fontSize: iconSize, lineHeight: '1' }}>{abilityIcon}</span>
                    {ability.name}
                  </button>
              );
            })}
            {/* Render remaining test buttons (excluding Test Miss since it's already rendered) */}
            {!isOpponent && testButtons.filter(btn => !btn.label.includes('Test Miss')).map((testButton, idx) => (
              <button
                key={`test-${idx}`}
                onClick={testButton.onClick}
                className={testButton.className || "ml-2 px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"}
              >
                {testButton.label}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Divider with diamond icon */}
        <div className="flex items-center justify-center" style={{ marginBottom: isCompact ? '0.5rem' : '0.75rem' }}>
          <div className="flex-1 border-t" style={{ borderColor: '#5C4033' }}></div>
          <div 
            className="mx-2"
            style={{
              width: diamondSize,
              height: diamondSize,
              backgroundColor: '#5C4033',
              transform: 'rotate(45deg)'
            }}
          ></div>
          <div className="flex-1 border-t" style={{ borderColor: '#5C4033' }}></div>
        </div>

        {/* Stats section */}
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            {/* AC (Armor Class) - left side */}
            <div className="flex items-center" style={{ gap: '0' }}>
              {/* Green shield icon */}
              <div className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path
                    fill="#22c55e"
                    d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"
                  />
                  <path
                    fill="#16a34a"
                    d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"
                    opacity="0.8"
                  />
                </svg>
              </div>
              <span className={`font-bold ${statsTextSize}`} style={{ color: '#5C4033' }}>
                {playerClass.armorClass}
              </span>
            </div>

            {/* HP with bar - right side */}
            <div className="flex items-center flex-1 justify-end" style={{ gap: '0' }}>
              {/* Heart icon */}
              <div className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path
                    fill="#dc2626"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
              </div>
              <div 
                className="flex-1 rounded-sm overflow-hidden"
                style={{ 
                  backgroundColor: '#E8E0D6',
                  height: isCompact ? '8px' : '12px',
                  border: isCompact ? '0.5px solid #D4C4B0' : '1px solid #D4C4B0',
                  maxWidth: hpBarMaxWidth
                }}
              >
                <div
                  className="h-full transition-all"
                  style={{ 
                    backgroundColor: '#A66D28', // Brown
                    width: `${isDefeated ? 0 : (playerClass.hitPoints / playerClass.maxHitPoints) * 100}%` 
                  }}
                />
              </div>
              <span className={`font-bold ${statsTextSize}`} style={{ color: '#5C4033', marginLeft: isCompact ? '0.125rem' : '0.25rem' }}>
                {isDefeated ? 0 : playerClass.hitPoints} / {playerClass.maxHitPoints}
              </span>
            </div>
          </div>
        </div>

        </div>
      </div>

      {/* Footer text in dark frame area */}
      <div 
        className="relative flex items-center justify-between"
        style={{ 
          marginTop: isCompact ? '4px' : '6px',
          paddingTop: '0',
          paddingBottom: '0',
          height: isCompact ? '16px' : '20px'
        }}
      >
        {/* Card number in bottom left */}
        {cardIndex !== undefined && totalCards !== undefined ? (
          <span 
            className={isCompact ? 'text-[8px]' : 'text-[10px]'}
            style={{ 
              color: '#F2ECDE', // Light beige text on dark frame
              fontFamily: 'serif',
              fontWeight: 'bold'
            }}
          >
            {cardIndex + 1}/{totalCards}
          </span>
        ) : (
          <span 
            className={isCompact ? 'text-[8px]' : 'text-[10px]'}
            style={{ 
              color: '#F2ECDE', // Light beige text on dark frame
              fontFamily: 'serif',
              fontWeight: 'bold'
            }}
          >
            1/12
          </span>
        )}

        {/* Small symbol in center bottom - absolutely centered */}
        <div 
          className="absolute"
          style={{
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: isCompact ? '8px' : '10px',
            height: isCompact ? '8px' : '10px',
            backgroundColor: '#F2ECDE',
            opacity: 0.6
          }}
        ></div>

        {/* "2025 OpenRAG" in bottom right */}
        <span 
          className={isCompact ? 'text-[8px]' : 'text-[10px]'}
          style={{ 
            color: '#F2ECDE', // Light beige text on dark frame
            fontFamily: 'serif',
            fontWeight: 'bold'
          }}
        >
          2025 OpenRAG
        </span>
      </div>
    </div>
  );
}

// Memoize CharacterCard to prevent unnecessary re-renders
export const CharacterCard = memo(CharacterCardComponent);

