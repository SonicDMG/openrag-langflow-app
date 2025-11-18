'use client';

import { useEffect, useState } from 'react';

export type FloatingNumberType = 'damage' | 'healing' | 'miss' | 'attack-roll' | 'defeated' | 'knocked-out';

interface FloatingNumberProps {
  value: number | string;
  type: FloatingNumberType;
  targetCardRef: React.RefObject<HTMLDivElement | null>;
  onComplete?: () => void;
  persistent?: boolean; // If true, text stays visible and doesn't auto-remove
}

export function FloatingNumber({ value, type, targetCardRef, onComplete, persistent = false }: FloatingNumberProps) {
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

    // For persistent defeated/knocked-out text, update position continuously
    if (persistent && (type === 'defeated' || type === 'knocked-out')) {
      const handleUpdate = () => updatePosition();
      const interval = setInterval(handleUpdate, 100); // Update every 100ms
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        clearInterval(interval);
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [targetCardRef, persistent, type]);

  useEffect(() => {
    if (isVisible && !persistent) {
      // Animation duration matches CSS animation (2s for normal, 3s for defeated/knocked-out)
      const duration = (type === 'defeated' || type === 'knocked-out') ? 3000 : 2000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete, type, persistent]);

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
      case 'defeated':
        return {
          color: '#DC2626', // red-600
          fontSize: '3rem',
          fontWeight: 900,
          textShadow: 
            '3px 3px 6px rgba(0, 0, 0, 0.8), ' +
            '0 0 20px rgba(220, 38, 38, 0.8), ' +
            '0 0 40px rgba(220, 38, 38, 0.6), ' +
            '0 0 60px rgba(220, 38, 38, 0.4)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        };
      case 'knocked-out':
        return {
          color: '#DC2626', // red-600
          fontSize: '2.5rem',
          fontWeight: 900,
          textShadow: 
            '2px 2px 4px rgba(0, 0, 0, 0.8), ' +
            '0 0 15px rgba(220, 38, 38, 0.7), ' +
            '0 0 30px rgba(220, 38, 38, 0.5)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
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
    : type === 'defeated'
    ? 'DEFEATED!'
    : type === 'knocked-out'
    ? 'KNOCKED OUT!'
    : type === 'attack-roll' 
    ? String(value) 
    : type === 'healing'
    ? `+${value}`
    : `-${value}`;

  return (
    <div
      className={(type === 'defeated' || type === 'knocked-out') ? (persistent ? 'floating-number-defeated-persistent' : 'floating-number-defeated') : 'floating-number'}
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

