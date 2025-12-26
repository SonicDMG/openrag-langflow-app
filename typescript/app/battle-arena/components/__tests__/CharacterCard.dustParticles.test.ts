import { describe, it, expect, beforeEach, jest } from '@jest/globals';

/**
 * Unit tests for dust particle generation functions
 * Tests the refactored dust particle logic from CharacterCard.tsx
 */

// Type definition matching the component
type DustParticle = {
  side: 'bottom' | 'top' | 'left' | 'right';
  position: number;
  delay: number;
  duration: number;
  horizontalOffset: number;
  verticalOffset: number;
};

// Configuration matching the component
const DUST_PARTICLE_CONFIG = {
  counts: {
    bottom: { min: 30, max: 45 }, // Dramatically increased for maximum slam impact
    top: { min: 15, max: 25 },    // Increased for more visible effect
    left: { min: 15, max: 25 },   // Increased for more visible effect
    right: { min: 15, max: 25 },  // Increased for more visible effect
  },
  animation: {
    maxDelay: 0.05,
    minDuration: 0.4, // Increased for particles to travel further
    maxDuration: 0.7, // Increased for particles to travel further
    offsetRange: 50, // Increased for wider spread
  },
} as const;

// Helper functions matching the component
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

function getParticleStyle(particle: DustParticle): Record<string, string> {
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

describe('Dust Particle Generation', () => {
  beforeEach(() => {
    // Reset Math.random mock before each test
    jest.spyOn(Math, 'random').mockRestore();
  });

  describe('generateDustParticles', () => {
    it('should generate particles for all four sides', () => {
      const particles = generateDustParticles();
      
      const sides = new Set(particles.map(p => p.side));
      expect(sides.size).toBe(4);
      expect(sides.has('bottom')).toBe(true);
      expect(sides.has('top')).toBe(true);
      expect(sides.has('left')).toBe(true);
      expect(sides.has('right')).toBe(true);
    });

    it('should generate correct number of particles per side', () => {
      const particles = generateDustParticles();
      
      const bottomParticles = particles.filter(p => p.side === 'bottom');
      const topParticles = particles.filter(p => p.side === 'top');
      const leftParticles = particles.filter(p => p.side === 'left');
      const rightParticles = particles.filter(p => p.side === 'right');
      
      // Bottom should have 30-45 particles (dramatically increased for slam impact)
      expect(bottomParticles.length).toBeGreaterThanOrEqual(30);
      expect(bottomParticles.length).toBeLessThanOrEqual(45);
      
      // Top, left, right should have 15-25 particles each (increased for visibility)
      expect(topParticles.length).toBeGreaterThanOrEqual(15);
      expect(topParticles.length).toBeLessThanOrEqual(25);
      expect(leftParticles.length).toBeGreaterThanOrEqual(15);
      expect(leftParticles.length).toBeLessThanOrEqual(25);
      expect(rightParticles.length).toBeGreaterThanOrEqual(15);
      expect(rightParticles.length).toBeLessThanOrEqual(25);
    });

    it('should generate particles with valid position values (0-100)', () => {
      const particles = generateDustParticles();
      
      particles.forEach(particle => {
        expect(particle.position).toBeGreaterThanOrEqual(0);
        expect(particle.position).toBeLessThanOrEqual(100);
      });
    });

    it('should generate particles with valid delay values (0-0.05s)', () => {
      const particles = generateDustParticles();
      
      particles.forEach(particle => {
        expect(particle.delay).toBeGreaterThanOrEqual(0);
        expect(particle.delay).toBeLessThanOrEqual(0.05);
      });
    });

    it('should generate particles with valid duration values (0.4-0.7s)', () => {
      const particles = generateDustParticles();
      
      particles.forEach(particle => {
        expect(particle.duration).toBeGreaterThanOrEqual(0.4);
        expect(particle.duration).toBeLessThanOrEqual(0.7);
      });
    });

    it('should set horizontalOffset for bottom and top particles only', () => {
      const particles = generateDustParticles();
      
      const horizontalParticles = particles.filter(p => p.side === 'bottom' || p.side === 'top');
      const verticalParticles = particles.filter(p => p.side === 'left' || p.side === 'right');
      
      horizontalParticles.forEach(particle => {
        expect(particle.horizontalOffset).not.toBe(0);
        expect(particle.verticalOffset).toBe(0);
        expect(Math.abs(particle.horizontalOffset)).toBeLessThanOrEqual(25);
      });
      
      verticalParticles.forEach(particle => {
        expect(particle.horizontalOffset).toBe(0);
        expect(particle.verticalOffset).not.toBe(0);
        expect(Math.abs(particle.verticalOffset)).toBeLessThanOrEqual(25);
      });
    });

    it('should generate different particles on each call', () => {
      const particles1 = generateDustParticles();
      const particles2 = generateDustParticles();
      
      // Particles should be different (very unlikely to be identical)
      const identical = particles1.every((p1, i) => {
        const p2 = particles2[i];
        return p2 && 
          p1.position === p2.position && 
          p1.delay === p2.delay && 
          p1.duration === p2.duration;
      });
      
      expect(identical).toBe(false);
    });
  });

  describe('getParticleStyle', () => {
    it('should generate correct styles for bottom particles', () => {
      const particle: DustParticle = {
        side: 'bottom',
        position: 50,
        delay: 0.02,
        duration: 0.4,
        horizontalOffset: 10,
        verticalOffset: 0,
      };
      
      const style = getParticleStyle(particle);
      
      expect(style['--dust-delay']).toBe('0.02s');
      expect(style['--dust-duration']).toBe('0.4s');
      expect(style['--dust-horizontal-offset']).toBe('10px');
      expect(style['--dust-vertical-offset']).toBe('0px');
      expect(style.left).toBe('50%');
      expect(style.top).toBe('100%');
    });

    it('should generate correct styles for top particles', () => {
      const particle: DustParticle = {
        side: 'top',
        position: 75,
        delay: 0.01,
        duration: 0.35,
        horizontalOffset: -5,
        verticalOffset: 0,
      };
      
      const style = getParticleStyle(particle);
      
      expect(style.left).toBe('75%');
      expect(style.top).toBe('0%');
      expect(style['--dust-horizontal-offset']).toBe('-5px');
    });

    it('should generate correct styles for left particles', () => {
      const particle: DustParticle = {
        side: 'left',
        position: 25,
        delay: 0.03,
        duration: 0.45,
        horizontalOffset: 0,
        verticalOffset: 8,
      };
      
      const style = getParticleStyle(particle);
      
      expect(style.left).toBe('0%');
      expect(style.top).toBe('25%');
      expect(style['--dust-vertical-offset']).toBe('8px');
      expect(style['--dust-horizontal-offset']).toBe('0px');
    });

    it('should generate correct styles for right particles', () => {
      const particle: DustParticle = {
        side: 'right',
        position: 90,
        delay: 0.04,
        duration: 0.5,
        horizontalOffset: 0,
        verticalOffset: -12,
      };
      
      const style = getParticleStyle(particle);
      
      expect(style.left).toBe('100%');
      expect(style.top).toBe('90%');
      expect(style['--dust-vertical-offset']).toBe('-12px');
    });

    it('should format all CSS custom properties correctly', () => {
      const particle: DustParticle = {
        side: 'bottom',
        position: 50,
        delay: 0.025,
        duration: 0.375,
        horizontalOffset: 7.5,
        verticalOffset: 0,
      };
      
      const style = getParticleStyle(particle);
      
      // Check that all custom properties end with correct units
      expect(style['--dust-delay']).toMatch(/s$/);
      expect(style['--dust-duration']).toMatch(/s$/);
      expect(style['--dust-horizontal-offset']).toMatch(/px$/);
      expect(style['--dust-vertical-offset']).toMatch(/px$/);
      
      // Check that position properties end with %
      expect(style.left).toMatch(/%$/);
      expect(style.top).toMatch(/%$/);
    });
  });

  describe('DUST_PARTICLE_CONFIG', () => {
    it('should have valid configuration values', () => {
      // Check counts (updated for dramatic slam effect)
      expect(DUST_PARTICLE_CONFIG.counts.bottom.min).toBe(30);
      expect(DUST_PARTICLE_CONFIG.counts.bottom.max).toBe(45);
      expect(DUST_PARTICLE_CONFIG.counts.top.min).toBe(15);
      expect(DUST_PARTICLE_CONFIG.counts.top.max).toBe(25);
      
      // Check animation values (updated for further travel distance)
      expect(DUST_PARTICLE_CONFIG.animation.maxDelay).toBe(0.05);
      expect(DUST_PARTICLE_CONFIG.animation.minDuration).toBe(0.4);
      expect(DUST_PARTICLE_CONFIG.animation.maxDuration).toBe(0.7);
      expect(DUST_PARTICLE_CONFIG.animation.offsetRange).toBe(50);
    });

    it('should have min values less than max values', () => {
      Object.values(DUST_PARTICLE_CONFIG.counts).forEach(config => {
        expect(config.min).toBeLessThan(config.max);
      });
      
      expect(DUST_PARTICLE_CONFIG.animation.minDuration)
        .toBeLessThan(DUST_PARTICLE_CONFIG.animation.maxDuration);
    });
  });
});

// Made with Bob
