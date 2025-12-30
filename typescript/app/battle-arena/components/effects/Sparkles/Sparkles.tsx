'use client';

import { useState, useEffect } from 'react';
import styles from './Sparkles.module.css';

interface SparklesProps {
  trigger: number;
  count?: number;
}

/**
 * Sparkle component for healing effects
 * Generates animated sparkles that rise and fade
 * Count scales with healing amount (1-30 sparkles)
 */
export function Sparkles({ trigger, count = 12 }: SparklesProps) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Generate random sparkle positions - count scales with healing amount
    // Allow as few as 1 sparkle for very low heals, up to 30 for massive heals
    const sparkleCount = Math.max(1, Math.min(count, 30)); // Min 1, max 30 sparkles
    const newSparkles = Array.from({ length: sparkleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setSparkles(newSparkles);

    // Clean up sparkles after animation
    const timer = setTimeout(() => setSparkles([]), 800);
    return () => clearTimeout(timer);
  }, [trigger, count]);

  return (
    <>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className={styles.sparkle}
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.id * 0.05}s`,
          }}
        />
      ))}
    </>
  );
}

// Made with Bob
