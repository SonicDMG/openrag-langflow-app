'use client';

import { useEffect, useState } from 'react';

export interface DiceRollData {
  diceType: string;
  result: number;
}

interface CardDiceDisplayProps {
  diceRolls: DiceRollData[];
  targetCardRef: React.RefObject<HTMLDivElement | null>;
  side?: 'left' | 'right'; // Which side of the card to show dice on
  onComplete?: () => void;
}

export function CardDiceDisplay({ diceRolls, targetCardRef, side = 'right', onComplete }: CardDiceDisplayProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      if (!targetCardRef.current) {
        return;
      }

      const rect = targetCardRef.current.getBoundingClientRect();
      // Position on the left or right side of the card, vertically centered
      // getBoundingClientRect accounts for rotation, so we can use it directly
      const cardCenterY = rect.top + rect.height / 2;
      const diceHeight = 50; // Height of each dice
      const gap = 8; // Gap between dice
      const totalDiceHeight = diceRolls.length * diceHeight + (diceRolls.length - 1) * gap;
      const startY = cardCenterY - totalDiceHeight / 2;
      
      setPosition({
        x: side === 'left' ? rect.left - 15 : rect.right + 15, // 15px outside the card edge
        y: startY, // Vertically centered
      });
      setIsVisible(true);
    };

    // Try immediately
    updatePosition();

    // If not ready, try again shortly
    if (!targetCardRef.current) {
      const timer = setTimeout(updatePosition, 50);
      return () => clearTimeout(timer);
    }
  }, [targetCardRef, side, diceRolls.length]);

  useEffect(() => {
    if (isVisible && diceRolls.length > 0) {
      // Start fade out after 2.5 seconds
      const fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2500);
      
      // Complete after fade out animation (0.3s)
      const completeTimer = setTimeout(() => {
        setIsVisible(false);
        setIsFadingOut(false);
        onComplete?.();
      }, 3000);
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, diceRolls.length, onComplete]);

  if (!position || !isVisible || diceRolls.length === 0) return null;

  // Determine dice class based on type
  const getDiceClass = (diceType: string) => {
    const sides = parseInt(diceType.replace(/[^\d]/g, '')) || 6;
    if (sides === 20) return 'dice-d20';
    if (sides === 12) return 'dice-d12';
    if (sides === 10) return 'dice-d10';
    if (sides === 8) return 'dice-d8';
    if (sides === 6) return 'dice-d6';
    if (sides === 4) return 'dice-d4';
    return 'dice-d6';
  };

  // Combine positioning transform with animation scale
  const baseTransform = side === 'left' ? 'translateX(-100%)' : 'none';
  
  return (
    <div
      className={`card-dice-display ${isFadingOut ? 'card-dice-fade-out' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        '--base-transform': baseTransform, // Store base transform in CSS variable
        pointerEvents: 'none',
        zIndex: 1500,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: side === 'left' ? 'flex-end' : 'flex-start',
      } as React.CSSProperties & { '--base-transform': string }}
    >
      {diceRolls.map((dice, index) => {
        const sides = parseInt(dice.diceType.replace(/[^\d]/g, '')) || 6;
        return (
          <div
            key={`${dice.diceType}-${index}`}
            className={`card-dice ${getDiceClass(dice.diceType)}`}
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="dice-face">
              <span className="dice-result">{dice.result}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

