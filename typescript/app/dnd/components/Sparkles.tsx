'use client';

import { useState, useEffect } from 'react';

// Sparkle component for healing effects
export function Sparkles({ trigger }: { trigger: number }) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Generate random sparkle positions
    const newSparkles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setSparkles(newSparkles);

    // Clean up sparkles after animation
    const timer = setTimeout(() => setSparkles([]), 800);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="sparkle"
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

