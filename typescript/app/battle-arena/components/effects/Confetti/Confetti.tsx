'use client';

import { useState, useEffect } from 'react';
import styles from './Confetti.module.css';

interface ConfettiProps {
  trigger: number;
}

/**
 * Confetti component for victory effects
 * Generates animated confetti pieces that fall from the top of the screen
 */
export function Confetti({ trigger }: ConfettiProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Generate random confetti pieces
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1, // 2-3 seconds
    }));
    setConfetti(newConfetti);

    // Clean up confetti after animation
    const timer = setTimeout(() => setConfetti([]), 3000);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className={styles.confetti}>
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className={styles.confettiPiece}
          style={{
            left: `${piece.x}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Made with Bob
