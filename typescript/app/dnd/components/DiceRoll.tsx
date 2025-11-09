'use client';

import { useState, useEffect, useMemo } from 'react';
import { SingleDice } from './SingleDice';

// Dice Roll Animation Component - Now supports multiple dice
interface DiceRollProps {
  trigger: number;
  diceRolls: Array<{ diceType: string; result: number }>; // Array of dice to show
  onComplete?: () => void;
}

export function DiceRoll({ trigger, diceRolls, onComplete }: DiceRollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // Use useMemo to fix positions so they don't change on re-renders
  const positions = useMemo(() => {
    if (trigger === 0 || diceRolls.length === 0) return null;
    
    // Generate positions for multiple dice, spread them out but keep them on screen
    const baseY = 35 + Math.random() * 15; // 35-50% from top (more centered)
    const maxDice = diceRolls.length;
    const totalWidth = Math.min(maxDice * 12, 60); // Limit total width to 60%
    const startXBase = (100 - totalWidth) / 2; // Center the dice group
    
    return diceRolls.map((_, index) => {
      const spacing = totalWidth / maxDice; // Even spacing
      const startX = startXBase + (index * spacing) + Math.random() * 3; // Small random offset
      return {
        startX: Math.max(5, Math.min(85, startX)), // Clamp between 5% and 85%
        startY: Math.max(25, Math.min(65, baseY + (index % 2 === 0 ? 0 : 3))), // Clamp Y position
        delay: index * 0.08, // Stagger animations slightly
      };
    });
  }, [trigger, diceRolls]);

  useEffect(() => {
    if (trigger > 0 && positions) {
      setIsVisible(true);
      setShowResult(false);
      
      // Show result after rolling animation completes (0.8s - faster!)
      const resultTimer = setTimeout(() => {
        setShowResult(true);
      }, 800);
      
      // Hide after result has been displayed (2s pause - faster but still readable)
      // Total: 0.8s roll + 0.3s bounce + 2s display = 3.1s
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setShowResult(false);
        onComplete?.();
      }, 3100);
      
      return () => {
        clearTimeout(resultTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [trigger, positions, onComplete]);

  if (!isVisible || !positions) return null;

  return (
    <div 
      className="dice-roll-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {diceRolls.map((dice, index) => (
        <SingleDice
          key={`${dice.diceType}-${index}`}
          diceType={dice.diceType}
          result={dice.result}
          startX={positions[index].startX}
          startY={positions[index].startY}
          delay={positions[index].delay}
          showResult={showResult}
        />
      ))}
    </div>
  );
}

