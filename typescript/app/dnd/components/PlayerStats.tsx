'use client';

import { useRef, useEffect, memo } from 'react';
import { DnDClass, CharacterEmotion } from '../types';
import { PixelCharacter } from './PixelCharacter';
import { Sparkles } from './Sparkles';
import { Confetti } from './Confetti';
import { EmotionTestControls } from './EmotionTestControls';
import { applyAnimationClass } from '../utils/animations';

// PlayerStats component to eliminate duplicate rendering code
interface PlayerStatsProps {
  playerClass: DnDClass;
  playerId: 'player1' | 'player2';
  currentTurn: 'player1' | 'player2';
  characterName: string;
  onAttack?: () => void; // Optional - if not provided, Attack button won't be shown
  onUseAbility: (index: number) => void;
  shouldShake: boolean;
  shouldSparkle: boolean;
  shouldMiss: boolean;
  shouldHit: boolean;
  shouldSurprise: boolean;
  shakeTrigger: number;
  sparkleTrigger: number;
  missTrigger: number;
  hitTrigger: number;
  surpriseTrigger: number;
  shakeIntensity?: number; // Damage amount for scaling shake animation
  sparkleIntensity?: number; // Healing amount for scaling sparkle count
  isMoveInProgress: boolean;
  isDefeated: boolean;
  isVictor: boolean;
  confettiTrigger: number;
  emotion?: CharacterEmotion; // Optional manual emotion override
  onShakeComplete: () => void;
  onSparkleComplete: () => void;
  onMissComplete: () => void;
  onHitComplete: () => void;
  onSurpriseComplete: () => void;
  // Optional emotion test controls (for test page)
  showEmotionControls?: boolean;
  onEmotionChange?: (emotion: CharacterEmotion | null) => void;
  // Optional additional test buttons (for test page)
  testButtons?: Array<{ label: string; onClick: () => void; className?: string }>;
  // If true, this is an opponent (AI-controlled) and buttons should be hidden
  isOpponent?: boolean;
  // If true, buttons are enabled regardless of turn (for test mode when AI is off)
  allowAllTurns?: boolean;
}

function PlayerStatsComponent({ 
  playerClass, 
  playerId, 
  currentTurn, 
  characterName,
  onAttack, 
  onUseAbility,
  shouldShake,
  shouldSparkle,
  shouldMiss,
  shouldHit,
  shouldSurprise,
  shakeTrigger,
  sparkleTrigger,
  missTrigger,
  hitTrigger,
  surpriseTrigger,
  shakeIntensity = 0,
  sparkleIntensity = 0,
  isMoveInProgress,
  isDefeated,
  isVictor,
  confettiTrigger,
  emotion,
  onShakeComplete,
  onSparkleComplete,
  onMissComplete,
  onHitComplete,
  onSurpriseComplete,
  showEmotionControls = false,
  onEmotionChange,
  testButtons = [],
  isOpponent = false,
  allowAllTurns = false // When true, buttons are enabled regardless of turn (for test mode)
}: PlayerStatsProps) {
  const isActive = currentTurn === playerId && !isDefeated;
  // If allowAllTurns is true, treat as always active (unless defeated or move in progress)
  const effectiveIsActive = allowAllTurns ? !isDefeated : isActive;
  const isDisabled = (effectiveIsActive && isMoveInProgress) || isDefeated;
  const animationRef = useRef<HTMLDivElement>(null);


  // Apply shake animation
  // NOTE: Shake animation should still play even when surprise is active (for visual feedback)
  // The emotion logic will handle showing surprised instead of hurt
  useEffect(() => {
    if (animationRef.current && shouldShake) {
      // Always set the intensity - use provided intensity or default to 1 for minimum shake
      const intensity = shakeIntensity > 0 ? shakeIntensity : 1;
      // Calculate intensity scale using non-linear scaling for better visual differentiation
      // Low damage (1) = subtle shake (whimper) ~0.2-0.3
      // High damage = strong shake (current good shake) ~1.0-2.0
      // Uses square root curve: scale = 0.15 + (intensityPercent^0.5) * 1.85
      const maxHP = playerClass.maxHitPoints;
      const intensityPercent = Math.min(intensity / maxHP, 1.0); // Cap at 100%
      // Square root curve: makes low damage much smaller, high damage stays strong
      const scale = 0.15 + (Math.sqrt(intensityPercent) * 1.85); // Range: ~0.15 to 2.0
      animationRef.current.style.setProperty('--shake-intensity', scale.toString());
    }
    
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldShake, // Always apply shake animation when taking damage
      shakeTrigger,
      'shake',
      400,
      onShakeComplete
    );
    return cleanup;
  }, [shouldShake, shakeTrigger, shakeIntensity, playerClass.maxHitPoints, onShakeComplete]);

  // Apply sparkle animation (timeout-based)
  // Keep the sparkle effect active for longer to ensure the happy emotion persists
  useEffect(() => {
    if (shouldSparkle && sparkleTrigger > 0) {
      const timer = setTimeout(() => {
        onSparkleComplete();
      }, 1500); // Extended from 800ms to 1500ms to match sparkle animation + emotion display
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
      onMissComplete
    );
    return cleanup;
  }, [shouldMiss, missTrigger, onMissComplete]);

  // Apply hit animation (timeout-based - show triumphant expression)
  useEffect(() => {
    if (shouldHit && hitTrigger > 0) {
      const timer = setTimeout(() => {
        onHitComplete();
      }, 1000); // Show triumphant expression for 1 second
      return () => clearTimeout(timer);
    }
  }, [shouldHit, hitTrigger, onHitComplete]);

  // Apply surprise animation (timeout-based - show surprised expression)
  useEffect(() => {
    if (shouldSurprise && surpriseTrigger > 0) {
      const timer = setTimeout(() => {
        onSurpriseComplete();
      }, 1200); // Show surprised expression for 1.2 seconds
      return () => clearTimeout(timer);
    }
  }, [shouldSurprise, surpriseTrigger, onSurpriseComplete]);

  return (
    <div 
      ref={animationRef}
      className={`bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl sparkle-container relative ${isActive ? 'ring-4 ring-amber-400' : ''} ${isDefeated ? 'opacity-60' : ''}`}
    >
      {isDefeated && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-8xl text-red-900 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.8))' }}>
            ☠️
          </div>
        </div>
      )}
      {isVictor && <Confetti key={confettiTrigger} trigger={confettiTrigger} />}
      {shouldSparkle && (
        <Sparkles 
          key={sparkleTrigger} 
          trigger={sparkleTrigger} 
          count={sparkleIntensity > 0 ? Math.max(1, Math.ceil(sparkleIntensity * 0.6)) : 12}
        />
      )}
      
      {/* Pixel Art Character */}
      <div className="mb-4 flex justify-center">
        <PixelCharacter 
          playerClass={playerClass} 
          size={128}
          isActive={isActive}
          isDefeated={isDefeated}
          isVictor={isVictor}
          shouldShake={shouldShake}
          shouldSparkle={shouldSparkle}
          shouldMiss={shouldMiss}
          shouldHit={shouldHit}
          emotion={emotion}
        />
      </div>
      
      <div className="text-center mb-2">
        <h3 className="text-2xl font-bold mb-1 text-amber-100" style={{ fontFamily: 'serif' }}>
          {characterName}
        </h3>
        <p className="text-sm text-amber-300 italic">
          {playerClass.name}
          {isActive && ' ⚡'}
          {isDefeated && ' 💀'}
          {isVictor && ' 🏆'}
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-amber-300">Hit Points:</span>
          <span className="font-bold text-amber-100">
            {isDefeated ? 0 : playerClass.hitPoints} / {playerClass.maxHitPoints}
          </span>
        </div>
        <div className="w-full bg-amber-950 rounded-full h-4 border-2 border-amber-800">
          <div
            className="bg-red-600 h-full rounded-full transition-all"
            style={{ width: `${isDefeated ? 0 : (playerClass.hitPoints / playerClass.maxHitPoints) * 100}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-amber-300">Armor Class:</span>
          <span className="font-bold text-amber-100">{playerClass.armorClass}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-300">Attack Bonus:</span>
          <span className="font-bold text-amber-100">+{playerClass.attackBonus}</span>
        </div>
        <div className="mt-4">
          <div className="text-amber-300 mb-2">
            Abilities: {playerClass.abilities.length > 0 ? `(${playerClass.abilities.length})` : '(none)'}
            {isOpponent && <span className="text-amber-400 text-xs ml-2">(AI-controlled)</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {playerClass.abilities.length > 0 ? (
              <>
                {playerClass.abilities.map((ability, idx) => {
                  // Find Test Miss button if it exists
                  const testMissButton = testButtons.find(btn => btn.label.includes('Test Miss'));
                  const isTestHeal = ability.name === 'Test Heal';
                  
                  if (isOpponent) {
                    // For opponents, show abilities as read-only badges
                    return (
                      <div key={idx} className="contents">
                        <div
                          className="px-3 py-1 bg-amber-800/50 text-amber-200 text-xs rounded border border-amber-700/50 cursor-default"
                          title={ability.description || undefined}
                        >
                          {ability.name}
                        </div>
                        {/* Insert Test Miss button right after Test Heal */}
                        {isTestHeal && testMissButton && (
                          <button
                            key="test-miss-after-heal"
                            onClick={testMissButton.onClick}
                            className={testMissButton.className || "px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"}
                          >
                            {testMissButton.label}
                          </button>
                        )}
                      </div>
                    );
                  }
                  
                  // For player, show interactive buttons
                  return (
                    <div key={idx} className="contents">
                      <button
                        onClick={() => onUseAbility(idx)}
                        disabled={!effectiveIsActive || isDisabled}
                        className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title={ability.description || undefined}
                      >
                        {ability.name}
                      </button>
                      {/* Insert Test Miss button right after Test Heal */}
                      {isTestHeal && testMissButton && (
                        <button
                          key="test-miss-after-heal"
                          onClick={testMissButton.onClick}
                          className={testMissButton.className || "px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"}
                        >
                          {testMissButton.label}
                        </button>
                      )}
                    </div>
                  );
                })}
                {/* Render remaining test buttons (excluding Test Miss since it's already rendered) */}
                {!isOpponent && testButtons.filter(btn => !btn.label.includes('Test Miss')).map((testButton, idx) => (
                  <button
                    key={`test-${idx}`}
                    onClick={testButton.onClick}
                    className={testButton.className || "px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"}
                  >
                    {testButton.label}
                  </button>
                ))}
              </>
            ) : (
              <span className="text-amber-400 text-xs italic">No abilities loaded</span>
            )}
          </div>
        </div>
        {!isOpponent && effectiveIsActive && onAttack && (
          <button
            onClick={onAttack}
            disabled={isDisabled}
            className="mt-4 w-full py-2 px-4 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Attack! ⚔️
          </button>
        )}
        {isOpponent && (
          <div className="mt-2 text-center">
            <div className="text-amber-300 text-sm italic">🤖 Auto-playing opponent</div>
          </div>
        )}
        
        {/* Emotion Test Controls (only shown when enabled) */}
        {showEmotionControls && onEmotionChange && (
          <div className="mt-4 pt-4 border-t border-amber-800">
            <EmotionTestControls
              characterName={characterName}
              currentEmotion={emotion || null}
              onEmotionChange={onEmotionChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize PlayerStats to prevent unnecessary re-renders when props haven't changed
export const PlayerStats = memo(PlayerStatsComponent);

