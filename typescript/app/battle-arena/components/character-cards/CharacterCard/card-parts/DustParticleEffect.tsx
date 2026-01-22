import { useMemo } from 'react';

/**
 * Type definition for dust particle effect
 */
type DustParticle = {
  side: 'bottom' | 'top' | 'left' | 'right';
  position: number;
  delay: number;
  duration: number;
  horizontalOffset: number;
  verticalOffset: number;
};

/**
 * Configuration for dust particle generation
 */
const DUST_PARTICLE_CONFIG = {
  counts: {
    bottom: { min: 30, max: 45 },
    top: { min: 15, max: 25 },
    left: { min: 15, max: 25 },
    right: { min: 15, max: 25 },
  },
  animation: {
    maxDelay: 0.05,
    minDuration: 0.4,
    maxDuration: 0.7,
    offsetRange: 50,
  },
} as const;

/**
 * Generates random dust particles for all four sides of the card
 */
function generateDustParticles(): DustParticle[] {
  const getRandomCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  
  const getRandomPosition = () => Math.random() * 100;
  const getRandomDelay = () => Math.random() * DUST_PARTICLE_CONFIG.animation.maxDelay;
  const getRandomDuration = () =>
    DUST_PARTICLE_CONFIG.animation.minDuration +
    Math.random() * (DUST_PARTICLE_CONFIG.animation.maxDuration - DUST_PARTICLE_CONFIG.animation.minDuration);
  const getRandomOffset = () =>
    (Math.random() - 0.5) * DUST_PARTICLE_CONFIG.animation.offsetRange;

  const sides: Array<{ side: DustParticle['side']; isHorizontal: boolean }> = [
    { side: 'bottom', isHorizontal: true },
    { side: 'top', isHorizontal: true },
    { side: 'left', isHorizontal: false },
    { side: 'right', isHorizontal: false },
  ];

  return sides.flatMap(({ side, isHorizontal }) => {
    const config = DUST_PARTICLE_CONFIG.counts[side];
    const count = getRandomCount(config.min, config.max);
    
    return Array.from({ length: count }, () => ({
      side,
      position: getRandomPosition(),
      delay: getRandomDelay(),
      duration: getRandomDuration(),
      horizontalOffset: isHorizontal ? getRandomOffset() : 0,
      verticalOffset: isHorizontal ? 0 : getRandomOffset(),
    }));
  });
}

/**
 * Calculates the CSS style properties for a dust particle
 */
function getParticleStyle(particle: DustParticle): React.CSSProperties & { [key: `--${string}`]: string } {
  const isHorizontal = particle.side === 'bottom' || particle.side === 'top';
  
  return {
    '--dust-delay': `${particle.delay}s`,
    '--dust-duration': `${particle.duration}s`,
    '--dust-horizontal-offset': `${particle.horizontalOffset}px`,
    '--dust-vertical-offset': `${particle.verticalOffset}px`,
    left: isHorizontal ? `${particle.position}%` : (particle.side === 'left' ? '0%' : '100%'),
    top: isHorizontal ? (particle.side === 'bottom' ? '100%' : '0%') : `${particle.position}%`,
  };
}

/**
 * Dust particle effect component for defeated cards
 */
export function DustParticleEffect() {
  const particles = useMemo(() => generateDustParticles(), []);
  
  return (
    <div className="card-dust-container">
      {particles.map((particle, i) => (
        <div
          key={i}
          className={`card-dust-particle card-dust-${particle.side}`}
          style={getParticleStyle(particle)}
        />
      ))}
    </div>
  );
}

// Made with Bob
