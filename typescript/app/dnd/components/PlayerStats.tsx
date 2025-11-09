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
  testButtons = []
}: PlayerStatsProps) {
  const isActive = currentTurn === playerId && !isDefeated;
  const isDisabled = (isActive && isMoveInProgress) || isDefeated;
  const animationRef = useRef<HTMLDivElement>(null);


  // Apply shake animation
  // NOTE: Shake animation should still play even when surprise is active (for visual feedback)
  // The emotion logic will handle showing surprised instead of hurt
  useEffect(() => {
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldShake, // Always apply shake animation when taking damage
      shakeTrigger,
      'shake',
      400,
      onShakeComplete
    );
    return cleanup;
  }, [shouldShake, shakeTrigger, onShakeComplete]);

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
      {shouldSparkle && <Sparkles key={sparkleTrigger} trigger={sparkleTrigger} />}
      
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
          <div className="text-amber-300 mb-2">Abilities: {playerClass.abilities.length > 0 ? `(${playerClass.abilities.length})` : '(none)'}</div>
          <div className="flex flex-wrap gap-2">
            {playerClass.abilities.length > 0 ? (
              playerClass.abilities.map((ability, idx) => (
                <button
                  key={idx}
                  onClick={() => onUseAbility(idx)}
                  disabled={!isActive || isDisabled}
                  className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={ability.description || undefined}
                >
                  {ability.name}
                </button>
              ))
            ) : (
              <span className="text-amber-400 text-xs italic">No abilities loaded</span>
            )}
            {testButtons.map((testButton, idx) => (
              <button
                key={`test-${idx}`}
                onClick={testButton.onClick}
                className={testButton.className || "px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"}
              >
                {testButton.label}
              </button>
            ))}
          </div>
        </div>
        {isActive && onAttack && (
          <button
            onClick={onAttack}
            disabled={isDisabled}
            className="mt-4 w-full py-2 px-4 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Attack! ⚔️
          </button>
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

