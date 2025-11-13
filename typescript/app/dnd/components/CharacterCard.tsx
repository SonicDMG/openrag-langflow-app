'use client';

import { useRef, useEffect, memo, useState } from 'react';
import { DnDClass } from '../types';
import { Sparkles } from './Sparkles';
import { Confetti } from './Confetti';
import { applyAnimationClass } from '../utils/animations';
import { MONSTER_ICONS, CLASS_ICONS } from '../constants';

// CharacterCard component - Unified card design for all pages
interface CharacterCardProps {
  playerClass: DnDClass;
  characterName: string;
  // Animation props
  shouldShake?: boolean;
  shouldSparkle?: boolean;
  shouldMiss?: boolean;
  shouldHit?: boolean;
  shouldSurprise?: boolean;
  shouldCast?: boolean;
  castTrigger?: number;
  shakeTrigger?: number;
  sparkleTrigger?: number;
  missTrigger?: number;
  hitTrigger?: number;
  surpriseTrigger?: number;
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
  onSurpriseComplete?: () => void;
  onCastComplete?: () => void;
  // Action buttons (optional - for battle/test pages)
  onAttack?: () => void;
  onUseAbility?: (index: number) => void;
  isMoveInProgress?: boolean;
  isOpponent?: boolean;
  allowAllTurns?: boolean;
  // Test buttons (optional - for test page)
  testButtons?: Array<{ label: string; onClick: () => void; className?: string }>;
  // Monster image URL (optional - for monster creator preview)
  monsterImageUrl?: string;
}

function CharacterCardComponent({
  playerClass,
  characterName,
  shouldShake = false,
  shouldSparkle = false,
  shouldMiss = false,
  shouldHit = false,
  shouldSurprise = false,
  shouldCast = false,
  castTrigger = 0,
  shakeTrigger = 0,
  sparkleTrigger = 0,
  missTrigger = 0,
  hitTrigger = 0,
  surpriseTrigger = 0,
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
  onSurpriseComplete,
  onCastComplete,
  onAttack,
  onUseAbility,
  isMoveInProgress = false,
  isOpponent = false,
  allowAllTurns = false,
  testButtons = [],
  monsterImageUrl,
}: CharacterCardProps) {
  const animationRef = useRef<HTMLDivElement>(null);
  const effectiveIsActive = allowAllTurns ? !isDefeated : isActive;
  const isDisabled = (effectiveIsActive && isMoveInProgress) || isDefeated;
  const [imageError, setImageError] = useState(false);
  
  // Check if this is a monster or class
  const isMonster = MONSTER_ICONS[playerClass.name] !== undefined;
  const icon = isMonster 
    ? (MONSTER_ICONS[playerClass.name] || '👹')
    : (CLASS_ICONS[playerClass.name] || '⚔️');

  // Apply shake animation
  useEffect(() => {
    if (animationRef.current && shouldShake) {
      const intensity = shakeIntensity > 0 ? shakeIntensity : 1;
      const maxHP = playerClass.maxHitPoints;
      const intensityPercent = Math.min(intensity / maxHP, 1.0);
      const scale = 0.15 + (Math.sqrt(intensityPercent) * 1.85);
      animationRef.current.style.setProperty('--shake-intensity', scale.toString());
    }
    
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldShake,
      shakeTrigger,
      'shake',
      400,
      onShakeComplete || (() => {})
    );
    return cleanup;
  }, [shouldShake, shakeTrigger, shakeIntensity, playerClass.maxHitPoints, onShakeComplete]);

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

  // Apply surprise animation
  useEffect(() => {
    if (shouldSurprise && surpriseTrigger > 0) {
      const timer = setTimeout(() => {
        onSurpriseComplete?.();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [shouldSurprise, surpriseTrigger, onSurpriseComplete]);

  // Apply cast animation
  useEffect(() => {
    if (shouldCast && castTrigger > 0) {
      const timer = setTimeout(() => {
        onCastComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldCast, castTrigger, onCastComplete]);

  // Reset image error when monsterImageUrl changes
  useEffect(() => {
    if (monsterImageUrl) {
      setImageError(false);
    }
  }, [monsterImageUrl]);

  return (
    <div 
      ref={animationRef}
      className="relative overflow-hidden"
      style={{ 
        backgroundColor: '#F5F1E8', // Light beige background
        border: '3px solid #5C4033', // Dark brown border
        borderRadius: '12px',
        width: '100%',
        maxWidth: '320px', // Constrain width to maintain portrait aspect
        aspectRatio: '3/4', // Portrait orientation: 3 wide by 4 tall
        ...(isActive ? { boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)' } : {})
      }}
    >
      {/* Defeated overlay */}
      {isDefeated && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none bg-black/30">
          <div className="text-8xl text-red-900 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.8))' }}>
            ☠️
          </div>
        </div>
      )}

      {/* Confetti for victor */}
      {isVictor && <Confetti key={confettiTrigger} trigger={confettiTrigger} />}

      {/* Sparkles effect */}
      {shouldSparkle && (
        <Sparkles 
          key={sparkleTrigger} 
          trigger={sparkleTrigger} 
          count={sparkleIntensity > 0 ? Math.max(1, Math.ceil(sparkleIntensity * 0.6)) : 12}
        />
      )}

      {/* Card Content */}
      <div className="p-4 h-full flex flex-col">
        {/* Header with name, type, and symbol */}
        <div className="relative mb-3">
          {/* Purple abstract symbol in top right - flame/swirling design */}
          <div className="absolute top-0 right-0 w-10 h-10">
            <svg viewBox="0 0 24 24" className="w-full h-full" style={{ color: '#9333EA' }}>
              {/* Flame/swirling abstract design */}
              <path
                fill="currentColor"
                d="M12 2c-2.5 0-4.5 1-6 2.5C4.5 6 4 8 4 10c0 2 1 4 2.5 5.5C8 17 10 18 12 18c2 0 4-1 5.5-2.5C19 14 20 12 20 10c0-2-.5-4-2-5.5C16.5 3 14.5 2 12 2z"
                opacity="0.4"
              />
              <path
                fill="currentColor"
                d="M12 4c-1.5 0-3 .5-4 1.5C7 6.5 6.5 8 6.5 9.5c0 1.5.5 3 1.5 4C9 15 10.5 15.5 12 15.5c1.5 0 3-.5 4-1.5 1-1 1.5-2.5 1.5-4 0-1.5-.5-3-1.5-4.5C15 4.5 13.5 4 12 4z"
                opacity="0.6"
              />
              <path
                fill="currentColor"
                d="M12 6c-1 0-2 .3-2.5 1C9 7.7 8.5 8.5 8.5 9.5c0 1 .3 2 1 2.5.7.5 1.5.5 2.5.5s2 0 2.5-.5c.7-.5 1-1.5 1-2.5 0-1-.5-1.8-1-2.5C14 6.3 13 6 12 6z"
              />
            </svg>
          </div>

          {/* Character name - bold, dark brown */}
          <h3 
            className="text-xl font-bold mb-1 pr-12" 
            style={{ 
              fontFamily: 'serif',
              color: '#5C4033', // Dark brown
              fontWeight: 'bold'
            }}
          >
            {characterName}
            {isActive && ' ⚡'}
            {isDefeated && ' 💀'}
            {isVictor && ' 🏆'}
          </h3>

          {/* Character type - smaller, lighter brown */}
          <p 
            className="text-xs" 
            style={{ 
              color: '#8B6F47', // Lighter brown
              fontStyle: 'italic'
            }}
          >
            {playerClass.name}
          </p>
        </div>

        {/* Central pixel art image in frame - slightly darker beige */}
        <div 
          className="rounded-lg mb-3 flex justify-center items-center overflow-hidden"
          style={{ 
            backgroundColor: '#E8E0D6', // Slightly darker beige frame
            border: '2px solid #D4C4B0',
            borderRadius: '8px',
            padding: '0', // Remove padding so image fills the container
            width: '280px', // Fixed width to match image
            height: '200px', // Fixed height to match image
            aspectRatio: '280/200' // Match the actual image aspect ratio (1.4:1)
          }}
        >
          {monsterImageUrl ? (
            // If monsterImageUrl is provided, try to show it with fallback to placeholder
            imageError ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div 
                  className="text-8xl mb-2"
                  style={{ 
                    imageRendering: 'pixelated' as const,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                >
                  {icon}
                </div>
                <div className="text-xs text-center px-2" style={{ color: '#8B6F47' }}>
                  {playerClass.name}
                </div>
              </div>
            ) : (
              <img
                src={monsterImageUrl}
                alt={characterName}
                style={{
                  imageRendering: 'pixelated' as const,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // Cover the container, may crop edges
                  display: 'block'
                }}
                onError={() => setImageError(true)}
              />
            )
          ) : (
            // If no monsterImageUrl, show placeholder with icon
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div 
                className="text-8xl mb-2"
                style={{ 
                  imageRendering: 'pixelated' as const,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                {icon}
              </div>
              <div className="text-xs text-center px-2" style={{ color: '#8B6F47' }}>
                {playerClass.name}
              </div>
            </div>
          )}
        </div>

        {/* Abilities section */}
        <div className="mb-3">
          <h4 
            className="text-xs font-semibold mb-1.5" 
            style={{ color: '#8B6F47' }} // Lighter brown for heading
          >
            Abilities
          </h4>
          <div>
            {playerClass.abilities.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {playerClass.abilities.map((ability, idx) => {
                  const isTestHeal = ability.name === 'Test Heal';
                  const testMissButton = testButtons.find(btn => btn.label.includes('Test Miss'));
                  
                  // Show abilities as comma-separated list (matching image design)
                  // But keep interactive functionality for battle/test pages
                  if (isOpponent || !onUseAbility) {
                    return (
                      <span key={idx}>
                        <span 
                          className="text-xs"
                          style={{ color: '#5C4033' }} // Dark brown for ability names
                        >
                          {ability.name}
                        </span>
                        {idx < playerClass.abilities.length - 1 && <span style={{ color: '#5C4033' }}>, </span>}
                      </span>
                    );
                  }
                  
                  // For interactive mode, show as clickable but styled like text
                  return (
                    <span key={idx}>
                      <button
                        onClick={() => onUseAbility(idx)}
                        disabled={!effectiveIsActive || isDisabled}
                        className="text-xs hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ 
                          color: '#5C4033',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: (!effectiveIsActive || isDisabled) ? 'not-allowed' : 'pointer'
                        }}
                        title={ability.description || undefined}
                      >
                        {ability.name}
                      </button>
                      {idx < playerClass.abilities.length - 1 && <span style={{ color: '#5C4033' }}>, </span>}
                      {isTestHeal && testMissButton && (
                        <button
                          key="test-miss-after-heal"
                          onClick={testMissButton.onClick}
                          className={testMissButton.className || "ml-2 px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"}
                        >
                          {testMissButton.label}
                        </button>
                      )}
                    </span>
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
            ) : (
              <span className="text-xs italic" style={{ color: '#8B6F47' }}>No abilities</span>
            )}
          </div>
        </div>

        {/* Divider with diamond icon */}
        <div className="flex items-center justify-center mb-3">
          <div className="flex-1 border-t" style={{ borderColor: '#5C4033' }}></div>
          <div 
            className="mx-2"
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#5C4033',
              transform: 'rotate(45deg)'
            }}
          ></div>
          <div className="flex-1 border-t" style={{ borderColor: '#5C4033' }}></div>
        </div>

        {/* Stats section */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            {/* AC (Armor Class) with shield icon - left side */}
            <div className="flex items-center gap-1.5">
              <span className="text-base" style={{ color: '#16A34A' }}>🛡️</span>
              <span className="font-bold text-sm" style={{ color: '#5C4033' }}>
                {playerClass.armorClass}
              </span>
            </div>

            {/* HP with heart icon and bar - right side */}
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <span className="text-base" style={{ color: '#DC2626' }}>❤️</span>
              <div 
                className="flex-1 max-w-[140px] rounded-sm overflow-hidden"
                style={{ 
                  backgroundColor: '#E8E0D6',
                  height: '12px',
                  border: '1px solid #D4C4B0'
                }}
              >
                <div
                  className="h-full transition-all"
                  style={{ 
                    backgroundColor: '#DC2626', // Red
                    width: `${isDefeated ? 0 : (playerClass.hitPoints / playerClass.maxHitPoints) * 100}%` 
                  }}
                />
              </div>
              <span className="font-bold text-xs ml-1" style={{ color: '#5C4033' }}>
                {isDefeated ? 0 : playerClass.hitPoints}
              </span>
            </div>
          </div>

          {/* Attack button (if provided and not opponent) */}
          {!isOpponent && effectiveIsActive && onAttack && (
            <button
              onClick={onAttack}
              disabled={isDisabled}
              className="w-full mt-3 py-2 px-4 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Attack! ⚔️
            </button>
          )}

          {/* Opponent indicator */}
          {isOpponent && (
            <div className="mt-2 text-center">
              <div className="text-xs italic" style={{ color: '#8B6F47' }}>🤖 Auto-playing opponent</div>
            </div>
          )}
        </div>

        {/* Bottom icon (bat/winged creature) - dark brown, partially overlapping bottom border */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ 
            bottom: '-10px', // Partially overlapping bottom border
            zIndex: 10
          }}
        >
          <svg viewBox="0 0 24 24" className="w-10 h-10" style={{ color: '#5C4033' }}>
            {/* Bat/winged creature - stylized design */}
            <path
              fill="currentColor"
              d="M12 2c-1.5 0-3 .5-4 1.5C6.5 4.5 5.5 6 5.5 8c0 2 1 3.5 2.5 4.5C9 13.5 10.5 14 12 14c1.5 0 3-.5 4-1.5 1.5-1 2.5-2.5 2.5-4.5 0-2-1-3.5-2.5-4.5C15 2.5 13.5 2 12 2z"
            />
            {/* Left wing */}
            <path
              fill="currentColor"
              d="M6 10c0-1 .5-2 1.5-2.5C8.5 7 9.5 7.5 10 8.5c.5 1 .5 2 0 3-.5 1-1.5 1.5-2.5 1.5-1 0-2-.5-2.5-1.5C4.5 11 4.5 10 6 10z"
              opacity="0.8"
            />
            {/* Right wing */}
            <path
              fill="currentColor"
              d="M18 10c0-1-.5-2-1.5-2.5C15.5 7 14.5 7.5 14 8.5c-.5 1-.5 2 0 3 .5 1 1.5 1.5 2.5 1.5 1 0 2-.5 2.5-1.5C19.5 11 19.5 10 18 10z"
              opacity="0.8"
            />
            {/* Body/head */}
            <ellipse
              cx="12"
              cy="10"
              rx="2"
              ry="3"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Memoize CharacterCard to prevent unnecessary re-renders
export const CharacterCard = memo(CharacterCardComponent);

