'use client';

import { useEffect, useState } from 'react';

export type FloatingNumberType = 'damage' | 'healing' | 'miss' | 'attack-roll';

interface FloatingNumberProps {
  value: number | string;
  type: FloatingNumberType;
  targetCardRef: React.RefObject<HTMLDivElement | null>;
  onComplete?: () => void;
}

export function FloatingNumber({ value, type, targetCardRef, onComplete }: FloatingNumberProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      if (!targetCardRef.current) {
        return;
      }

      const rect = targetCardRef.current.getBoundingClientRect();
      // Position at center of card, slightly above center
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2 - 20,
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
  }, [targetCardRef]);

  useEffect(() => {
    if (isVisible) {
      // Animation duration matches CSS animation (2s)
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!position || !isVisible) return null;

  // Determine color and styling based on type
  const getStyle = () => {
    switch (type) {
      case 'damage':
        return {
          color: '#DC2626', // red-600
          fontSize: '2.5rem',
          fontWeight: 900,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(220, 38, 38, 0.5)',
        };
      case 'healing':
        return {
          color: '#16A34A', // green-600
          fontSize: '2.5rem',
          fontWeight: 900,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(22, 163, 74, 0.5)',
        };
      case 'miss':
        return {
          color: '#9CA3AF', // gray-400
          fontSize: '1.75rem',
          fontWeight: 700,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        };
      case 'attack-roll':
        return {
          color: '#F59E0B', // amber-500
          fontSize: '1.5rem',
          fontWeight: 700,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        };
      default:
        return {
          color: '#FFFFFF',
          fontSize: '2rem',
          fontWeight: 700,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        };
    }
  };

  const style = getStyle();

  // Format the display value
  const displayValue = type === 'miss' 
    ? 'MISS' 
    : type === 'attack-roll' 
    ? String(value) 
    : type === 'healing'
    ? `+${value}`
    : `-${value}`;

  return (
    <div
      className="floating-number"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 2000,
        userSelect: 'none',
        ...style,
      }}
    >
      {displayValue}
    </div>
  );
}

