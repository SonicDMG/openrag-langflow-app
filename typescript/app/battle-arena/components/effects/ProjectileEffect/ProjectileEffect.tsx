'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ProjectileType } from '../../../utils/battle';
import styles from './ProjectileEffect.module.css';

interface ProjectileEffectProps {
  fromCardRef: React.RefObject<HTMLDivElement | null>;
  toCardRef: React.RefObject<HTMLDivElement | null>;
  isHit: boolean;
  onComplete: () => void;
  onHit?: () => void; // Called when projectile reaches target (for hit)
  fromCardRotation?: number; // Rotation angle of the attacking card in degrees (e.g., -5 for player1, 5 for player2)
  delay?: number; // Delay before starting animation in ms (for staggered multi-attacks)
  projectileType?: ProjectileType; // Type of projectile (fire, ice, etc.)
}

// Number of particles in the stream
const PARTICLE_COUNT = 12;
// Time between each particle in the stream (ms)
const PARTICLE_INTERVAL = 30;

interface Particle {
  id: number;
  horizontalOffset: number;
  startDelay: number;
  size: number;
  speed: number;
}

export function ProjectileEffect({
  fromCardRef,
  toCardRef,
  isHit,
  onComplete,
  onHit,
  fromCardRotation = 0,
  delay = 0,
  projectileType = 'magic',
}: ProjectileEffectProps) {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [endPos, setEndPos] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const completedParticlesRef = useRef(0);
  const onHitCalledRef = useRef(false);

  useEffect(() => {
    const updatePosition = () => {
      if (!toCardRef.current) {
        return;
      }

      const toRect = toCardRef.current.getBoundingClientRect();
      
      // Target position: center of the card being attacked
      const toX = toRect.left + toRect.width / 2;
      const toY = toRect.top + toRect.height / 2;

      // Start position: above the target card, dropping from the sky
      const dropHeight = Math.max(400, window.innerHeight * 0.5); // At least 400px or half viewport height
      const startY = toY - dropHeight;

      // For misses, particles drop past the target card
      let endX = toX;
      let endY = toY;
      if (!isHit) {
        // Miss: drop past the card, slightly offset
        endY = toRect.bottom + 100; // Drop past the bottom of the card
        endX = toX + (Math.random() - 0.5) * 80; // Random horizontal offset for miss
      }

      setStartPos({ x: toX, y: startY });
      setEndPos({ x: endX, y: endY });
      
      // For lightning, we don't need particles - we'll render full lines
      if (projectileType !== 'lightning') {
        // Generate particles for the stream
        const newParticles: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          newParticles.push({
            id: i,
            horizontalOffset: (Math.random() - 0.5) * 80, // -40px to +40px spread
            startDelay: i * PARTICLE_INTERVAL, // Stagger each particle
            size: 0.4 + Math.random() * 0.3, // 0.4 to 0.7 base size (smaller particles)
            speed: 0.8 + Math.random() * 0.4, // 0.8 to 1.2 speed multiplier
          });
        }
        setParticles(newParticles);
      }
      setIsVisible(true);
      completedParticlesRef.current = 0;
      onHitCalledRef.current = false;
    };

    // Try immediately
    updatePosition();

    // If not ready, try again shortly
    if (!toCardRef.current) {
      const timer = setTimeout(updatePosition, 50);
      return () => clearTimeout(timer);
    }

    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [toCardRef, isHit, projectileType]);

  // Track when all particles are done
  const handleParticleComplete = useCallback(() => {
    completedParticlesRef.current++;
    if (completedParticlesRef.current >= PARTICLE_COUNT) {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  // Call onHit when first particle reaches target
  const handleParticleHit = useCallback(() => {
    if (!onHitCalledRef.current && isHit) {
      onHitCalledRef.current = true;
      onHit?.();
    }
  }, [isHit, onHit]);

  // For lightning, render full-length jagged lines instead of particles
  if (projectileType === 'lightning') {
    if (!startPos || !endPos || !isVisible) return null;
    
    return (
      <LightningStrike
        startPos={startPos}
        endPos={endPos}
        isHit={isHit}
        delay={delay}
        onHit={onHit}
        onComplete={onComplete}
      />
    );
  }

  // For radiant, render soft light beam instead of particles
  if (projectileType === 'radiant') {
    if (!startPos || !endPos || !isVisible) return null;
    
    return (
      <RadiantBeam
        startPos={startPos}
        endPos={endPos}
        isHit={isHit}
        delay={delay}
        onHit={onHit}
        onComplete={onComplete}
      />
    );
  }

  // For fire, render fire breath effect instead of particles
  if (projectileType === 'fire') {
    if (!startPos || !endPos || !isVisible) return null;
    
    return (
      <FireBreath
        startPos={startPos}
        endPos={endPos}
        isHit={isHit}
        delay={delay}
        onHit={onHit}
        onComplete={onComplete}
      />
    );
  }

  if (!startPos || !endPos || !isVisible || particles.length === 0) return null;

  return (
    <>
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          particle={particle}
          startPos={startPos}
          endPos={endPos}
          isHit={isHit}
          projectileType={projectileType}
          baseDelay={delay}
          onComplete={handleParticleComplete}
          onHit={handleParticleHit}
        />
      ))}
    </>
  );
}

// Individual particle component
interface ParticleProps {
  particle: Particle;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  isHit: boolean;
  projectileType: ProjectileType;
  baseDelay: number;
  onComplete: () => void;
  onHit: () => void;
}

function Particle({
  particle,
  startPos,
  endPos,
  isHit,
  projectileType,
  baseDelay,
  onComplete,
  onHit,
}: ParticleProps) {
  const [progress, setProgress] = useState(0);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const totalDelay = baseDelay + particle.startDelay;
    const startTime = Date.now() + totalDelay;
    // Individual particle duration - faster for stream effect
    const duration = (isHit ? 400 : 600) * particle.speed; // 400-600ms scaled by speed

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        // Still waiting for delay
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentProgress = Math.min(elapsed / duration, 1);
      setProgress(currentProgress);

      // For hits: trigger onHit callback when particle reaches target (at ~80% of animation)
      if (isHit && !hasReachedTarget && currentProgress >= 0.8) {
        setHasReachedTarget(true);
        onHit();
      }

      if (currentProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [baseDelay, particle.startDelay, particle.speed, isHit, hasReachedTarget, onHit, onComplete]);

  // Calculate drop trajectory - particles fall straight down from sky
  // Use easing for more natural gravity effect
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedProgress = easeOutCubic(progress);
  
  // Calculate position with particle's horizontal offset
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  
  // Apply easing to Y (vertical drop) for gravity effect
  const finalX = startPos.x + dx * progress + particle.horizontalOffset * (1 - progress); // Converge to center as it falls
  const finalY = startPos.y + dy * easedProgress; // Eased vertical drop (gravity effect)
  
  // Scale and rotation effects
  let scale = particle.size * (0.5 + progress * 0.5); // Start at 50% of particle size, grow to full size
  let rotation = progress * 360; // Rotate as it falls for visual interest
  
  if (!isHit) {
    // For misses, continue dropping past the card
    // Fade out as it goes past
    if (progress > 0.7) {
      const fadeProgress = (progress - 0.7) / 0.3; // 0 to 1 after 70%
      scale = particle.size * (1 - fadeProgress * 0.6); // Shrink as it fades
    }
  } else if (isHit) {
    // On hit, scale up at impact for dramatic effect
    if (progress > 0.8) {
      const impactProgress = (progress - 0.8) / 0.2; // 0 to 1 in last 20%
      scale = particle.size * (1 + impactProgress * 1.2); // Scale up on impact
      // Slow rotation near impact
      rotation = 0.8 * 360 + impactProgress * 90; // Slow down rotation
    }
  }

  return (
    <div
      className={`projectile-effect projectile-${projectileType} ${isHit ? 'projectile-hit' : 'projectile-miss'}`}
      style={{
        position: 'fixed',
        left: finalX,
        top: finalY,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        opacity: isHit 
          ? (progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1)
          : (progress < 0.1 ? progress * 10 : progress > 0.7 ? Math.max(0, 1 - (progress - 0.7) / 0.3) : 1),
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'none',
      }}
    >
      {/* Projectile visual - varies by type */}
      {projectileType === 'fire' ? (
        <>
          <div className="projectile-fire-core" />
          <div className="projectile-fire-particles" />
        </>
      ) : projectileType === 'lightning' ? (
        <>
          <svg
            className="lightning-bolt"
            viewBox="0 0 100 200"
            preserveAspectRatio="none"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {/* Gradient definition - unique ID per particle */}
            <defs>
              <linearGradient id={`lightningGradient-${particle.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="30%" stopColor="#00BFFF" stopOpacity="1" />
                <stop offset="60%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#1E90FF" stopOpacity="0.9" />
              </linearGradient>
              <filter id={`lightningGlow-${particle.id}`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Main lightning bolt path - jagged zigzag */}
            <path
              d="M50,0 L45,30 L55,40 L40,70 L60,80 L35,120 L65,130 L30,170 L70,180 L50,200"
              fill="none"
              stroke={`url(#lightningGradient-${particle.id})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#lightningGlow-${particle.id})`}
            />
            {/* Secondary branch */}
            <path
              d="M55,40 L60,50 L50,60 L65,90 L45,100"
              fill="none"
              stroke={`url(#lightningGradient-${particle.id})`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            {/* Tertiary branch */}
            <path
              d="M40,70 L35,80 L45,90 L30,110 L50,120"
              fill="none"
              stroke={`url(#lightningGradient-${particle.id})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </svg>
          {/* Electrical sparks/crackling effect */}
          <div className="lightning-sparks" />
        </>
      ) : (
        <>
          <div className="projectile-core" />
          {isHit && <div className="projectile-trail" />}
        </>
      )}
    </div>
  );
}

// Lightning Strike Component - Full-length jagged lines
interface LightningStrikeProps {
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  isHit: boolean;
  delay: number;
  onHit?: () => void;
  onComplete: () => void;
}

function LightningStrike({
  startPos,
  endPos,
  isHit,
  delay,
  onHit,
  onComplete,
}: LightningStrikeProps) {
  const [progress, setProgress] = useState(0);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const uniqueIdRef = useRef(`lightning-${Date.now()}-${Math.random()}`);
  
  // Calculate distance and angle once
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Generate jagged lightning paths once and store in ref
  const pathsRef = useRef<{ main: string; branch1: string; branch2: string } | null>(null);
  
  if (!pathsRef.current) {
    // Generate jagged lightning path points
    const generateLightningPath = (segments: number = 8, startOffset: number = 0): string => {
      const points: Array<{ x: number; y: number }> = [];
      const segmentLength = distance / segments;
      
      // Start point with optional offset
      points.push({ x: startOffset, y: 0 });
      
      // Create jagged segments with more pronounced zigzag
      for (let i = 1; i < segments; i++) {
        const baseX = startOffset + (i / segments) * (distance - startOffset);
        const baseY = 0;
        
        // More pronounced jagged offsets for realistic lightning
        const offsetX = (Math.random() - 0.5) * (segmentLength * 0.6);
        const offsetY = (Math.random() - 0.5) * (segmentLength * 0.5);
        
        points.push({
          x: baseX + offsetX,
          y: baseY + offsetY,
        });
      }
      
      // End point
      points.push({ x: distance, y: 0 });
      
      // Convert to SVG path
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    pathsRef.current = {
      main: generateLightningPath(12),
      branch1: generateLightningPath(8, distance * 0.2),
      branch2: generateLightningPath(6, distance * 0.4),
    };
  }

  const { main: mainPath, branch1: branch1Path, branch2: branch2Path } = pathsRef.current;

  useEffect(() => {
    const startTime = Date.now() + delay;
    // Lightning strikes quickly - 200ms for the strike
    const duration = isHit ? 200 : 300;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentProgress = Math.min(elapsed / duration, 1);
      setProgress(currentProgress);

      // Trigger onHit when lightning reaches target (at ~70% for impact feel)
      if (isHit && !hasReachedTarget && currentProgress >= 0.7) {
        setHasReachedTarget(true);
        onHit?.();
      }

      if (currentProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Hold for a brief moment, then fade out
        setTimeout(() => {
          onComplete();
        }, 100);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [delay, isHit, hasReachedTarget, onHit, onComplete]);

  // Calculate current visible length based on progress
  const visibleLength = distance * progress;
  const opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;

  return (
    <div
      style={{
        position: 'fixed',
        left: startPos.x,
        top: startPos.y,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity,
      }}
    >
      <svg
        width={distance}
        height={Math.abs(dy)}
        style={{
          overflow: 'visible',
        }}
      >
        <defs>
          <linearGradient id={`lightningGrad-${uniqueIdRef.current}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="30%" stopColor="#00BFFF" stopOpacity="1" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#1E90FF" stopOpacity="0.9" />
          </linearGradient>
          <filter id={`lightningGlow-${uniqueIdRef.current}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main lightning bolt - visible portion based on progress */}
        <path
          d={mainPath}
          fill="none"
          stroke={`url(#lightningGrad-${uniqueIdRef.current})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#lightningGlow-${uniqueIdRef.current})`}
          style={{
            strokeDasharray: distance,
            strokeDashoffset: distance - visibleLength,
            transition: 'none',
          }}
        />
        
        {/* Secondary branch */}
        <path
          d={branch1Path}
          fill="none"
          stroke={`url(#lightningGrad-${uniqueIdRef.current})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
          style={{
            strokeDasharray: distance * 0.6,
            strokeDashoffset: distance * 0.6 - visibleLength * 0.6,
            transition: 'none',
          }}
        />
        
        {/* Tertiary branch */}
        <path
          d={branch2Path}
          fill="none"
          stroke={`url(#lightningGrad-${uniqueIdRef.current})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          style={{
            strokeDasharray: distance * 0.5,
            strokeDashoffset: distance * 0.5 - visibleLength * 0.5,
            transition: 'none',
          }}
        />
      </svg>
      
      {/* Impact effect at target */}
      {progress >= 0.7 && isHit && (
        <div
          className="lightning-impact"
          style={{
            position: 'absolute',
            left: distance,
            top: 0,
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(0, 191, 255, 0.7) 30%, transparent 70%)',
            boxShadow: `
              0 0 30px rgba(255, 255, 255, 0.9),
              0 0 60px rgba(0, 191, 255, 0.8),
              0 0 90px rgba(30, 144, 255, 0.6)
            `,
            animation: 'lightning-impact-pulse 0.2s ease-out',
          }}
        />
      )}
    </div>
  );
}

// Radiant Beam Component - Jagged lightning-style lines with radiant colors
interface RadiantBeamProps {
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  isHit: boolean;
  delay: number;
  onHit?: () => void;
  onComplete: () => void;
}

function RadiantBeam({
  startPos,
  endPos,
  isHit,
  delay,
  onHit,
  onComplete,
}: RadiantBeamProps) {
  const [progress, setProgress] = useState(0);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const uniqueIdRef = useRef(`radiant-${Date.now()}-${Math.random()}`);

  // Calculate distance and angle
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Generate jagged lightning paths once and store in ref
  const pathsRef = useRef<{ main: string; branch1: string; branch2: string } | null>(null);
  
  if (!pathsRef.current) {
    // Generate jagged lightning path points
    const generateLightningPath = (segments: number = 8, startOffset: number = 0): string => {
      const points: Array<{ x: number; y: number }> = [];
      const segmentLength = distance / segments;
      
      // Start point with optional offset
      points.push({ x: startOffset, y: 0 });
      
      // Create jagged segments with more pronounced zigzag
      for (let i = 1; i < segments; i++) {
        const baseX = startOffset + (i / segments) * (distance - startOffset);
        const baseY = 0;
        
        // More pronounced jagged offsets for realistic lightning
        const offsetX = (Math.random() - 0.5) * (segmentLength * 0.6);
        const offsetY = (Math.random() - 0.5) * (segmentLength * 0.5);
        
        points.push({
          x: baseX + offsetX,
          y: baseY + offsetY,
        });
      }
      
      // End point
      points.push({ x: distance, y: 0 });
      
      // Convert to SVG path
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    pathsRef.current = {
      main: generateLightningPath(12),
      branch1: generateLightningPath(8, distance * 0.2),
      branch2: generateLightningPath(6, distance * 0.4),
    };
  }

  const { main: mainPath, branch1: branch1Path, branch2: branch2Path } = pathsRef.current;

  useEffect(() => {
    const startTime = Date.now() + delay;
    // Radiant strikes quickly like lightning - 200ms
    const duration = isHit ? 200 : 300;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentProgress = Math.min(elapsed / duration, 1);
      setProgress(currentProgress);

      // Trigger onHit when beam reaches target (at ~70% for impact feel)
      if (isHit && !hasReachedTarget && currentProgress >= 0.7) {
        setHasReachedTarget(true);
        onHit?.();
      }

      if (currentProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Hold for a brief moment, then fade out
        setTimeout(() => {
          onComplete();
        }, 100);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [delay, isHit, hasReachedTarget, onHit, onComplete]);

  // Calculate current visible length based on progress
  const visibleLength = distance * progress;
  const opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;

  return (
    <div
      style={{
        position: 'fixed',
        left: startPos.x,
        top: startPos.y,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity,
      }}
    >
      <svg
        width={distance}
        height={Math.abs(dy)}
        style={{
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Radiant gradient - gold to white to orange */}
          <linearGradient id={`radiantGrad-${uniqueIdRef.current}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="60%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
          </linearGradient>
          {/* Radiant glow filter */}
          <filter id={`radiantGlow-${uniqueIdRef.current}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main lightning bolt - visible portion based on progress, bigger stroke */}
        <path
          d={mainPath}
          fill="none"
          stroke={`url(#radiantGrad-${uniqueIdRef.current})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#radiantGlow-${uniqueIdRef.current})`}
          style={{
            strokeDasharray: distance,
            strokeDashoffset: distance - visibleLength,
            transition: 'none',
          }}
        />
        
        {/* Secondary branch - bigger */}
        <path
          d={branch1Path}
          fill="none"
          stroke={`url(#radiantGrad-${uniqueIdRef.current})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
          style={{
            strokeDasharray: distance * 0.6,
            strokeDashoffset: distance * 0.6 - visibleLength * 0.6,
            transition: 'none',
          }}
        />
        
        {/* Tertiary branch - bigger */}
        <path
          d={branch2Path}
          fill="none"
          stroke={`url(#radiantGrad-${uniqueIdRef.current})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          style={{
            strokeDasharray: distance * 0.5,
            strokeDashoffset: distance * 0.5 - visibleLength * 0.5,
            transition: 'none',
          }}
        />
      </svg>
      
      {/* Impact effect at target */}
      {progress >= 0.7 && isHit && (
        <div
          className="radiant-impact"
          style={{
            position: 'absolute',
            left: distance,
            top: 0,
            transform: 'translate(-50%, -50%)',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 215, 0, 0.7) 30%, rgba(255, 165, 0, 0.4) 60%, transparent 100%)',
            boxShadow: `
              0 0 40px rgba(255, 255, 255, 0.8),
              0 0 80px rgba(255, 215, 0, 0.7),
              0 0 120px rgba(255, 165, 0, 0.5)
            `,
            animation: 'radiant-impact-pulse 0.4s ease-out',
          }}
        />
      )}
    </div>
  );
}

// Fire Breath Component - Realistic fire being breathed onto target
interface FireBreathProps {
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  isHit: boolean;
  delay: number;
  onHit?: () => void;
  onComplete: () => void;
}

function FireBreath({
  startPos,
  endPos,
  isHit,
  delay,
  onHit,
  onComplete,
}: FireBreathProps) {
  const [progress, setProgress] = useState(0);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const uniqueIdRef = useRef(`fire-${Date.now()}-${Math.random()}`);

  // Calculate distance and angle
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  useEffect(() => {
    const startTime = Date.now() + delay;
    // Fire breath is quick and intense - 400ms
    const duration = isHit ? 400 : 500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentProgress = Math.min(elapsed / duration, 1);
      setProgress(currentProgress);

      // Trigger onHit when fire reaches target (at ~70% for impact feel)
      if (isHit && !hasReachedTarget && currentProgress >= 0.7) {
        setHasReachedTarget(true);
        onHit?.();
      }

      if (currentProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Hold for a moment, then fade out
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [delay, isHit, hasReachedTarget, onHit, onComplete]);

  // Calculate visible length and opacity
  const visibleLength = distance * progress;
  const opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;

  // Generate fire wave pattern - wider at start, narrower at end
  const generateFirePath = (): string => {
    const segments = 15;
    const topPoints: Array<{ x: number; y: number }> = [];
    const bottomPoints: Array<{ x: number; y: number }> = [];
    
    // Start wider (breath origin)
    const startWidth = 40;
    // End narrower (impact point)
    const endWidth = 20;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = t * distance;
      const width = startWidth * (1 - t) + endWidth * t;
      
      // Create wavy flame pattern with random flickering
      const wave1 = Math.sin(t * Math.PI * 4) * (width * 0.3);
      const wave2 = Math.sin(t * Math.PI * 6 + Math.PI / 3) * (width * 0.2);
      const flicker = (Math.random() - 0.5) * (width * 0.1);
      
      const y = wave1 + wave2 + flicker;
      
      topPoints.push({ x, y: y - width / 2 });
      bottomPoints.push({ x, y: y + width / 2 });
    }
    
    // Create path: start at top-left, go down top edge, across bottom (reversed), up bottom edge
    const topPath = topPoints.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');
    const bottomPath = bottomPoints.reverse().map((p) => `L ${p.x} ${p.y}`).join(' ');
    
    return `${topPath} ${bottomPath} Z`;
  };

  const firePath = generateFirePath();

  return (
    <div
      style={{
        position: 'fixed',
        left: startPos.x,
        top: startPos.y,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity,
      }}
    >
      <svg
        width={distance}
        height={Math.abs(dy) + 100}
        style={{
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Fire gradient - red to orange to yellow */}
          <linearGradient id={`fireGrad-${uniqueIdRef.current}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4500" stopOpacity="1" />
            <stop offset="20%" stopColor="#FF6347" stopOpacity="1" />
            <stop offset="40%" stopColor="#FF8C00" stopOpacity="1" />
            <stop offset="60%" stopColor="#FFD700" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#FF8C00" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#DC143C" stopOpacity="0.7" />
          </linearGradient>
          {/* Inner bright core gradient */}
          <linearGradient id={`fireCoreGrad-${uniqueIdRef.current}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="30%" stopColor="#FFA500" stopOpacity="1" />
            <stop offset="60%" stopColor="#FF6347" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF4500" stopOpacity="0.8" />
          </linearGradient>
          {/* Fire glow filter */}
          <filter id={`fireGlow-${uniqueIdRef.current}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main fire shape - clipped to visible length */}
        <clipPath id={`fireClip-${uniqueIdRef.current}`}>
          <rect x="0" y="-100" width={visibleLength} height="200" />
        </clipPath>
        
        {/* Outer fire - wider and more transparent */}
        <path
          d={firePath}
          fill={`url(#fireGrad-${uniqueIdRef.current})`}
          filter={`url(#fireGlow-${uniqueIdRef.current})`}
          opacity="0.8"
          clipPath={`url(#fireClip-${uniqueIdRef.current})`}
        />
        
        {/* Inner bright core - narrower */}
        <path
          d={firePath}
          fill={`url(#fireCoreGrad-${uniqueIdRef.current})`}
          opacity="0.9"
          transform="scale(0.6) translate(33%, 0)"
          clipPath={`url(#fireClip-${uniqueIdRef.current})`}
        />
        
        {/* Flickering particles/sparks */}
        {Array.from({ length: 8 }).map((_, i) => {
          const sparkX = (visibleLength * (0.2 + i * 0.1)) % distance;
          const sparkY = (Math.sin(i * 2) * 15) + (Math.random() - 0.5) * 10;
          return (
            <circle
              key={i}
              cx={sparkX}
              cy={sparkY}
              r="3"
              fill="#FFD700"
              opacity="0.8"
              filter={`url(#fireGlow-${uniqueIdRef.current})`}
            />
          );
        })}
      </svg>
      
      {/* Impact effect at target */}
      {progress >= 0.7 && isHit && (
        <div
          className="fire-impact"
          style={{
            position: 'absolute',
            left: distance,
            top: 0,
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.9) 0%, rgba(255, 140, 0, 0.7) 30%, rgba(255, 69, 0, 0.5) 60%, transparent 100%)',
            boxShadow: `
              0 0 30px rgba(255, 69, 0, 0.9),
              0 0 60px rgba(255, 140, 0, 0.7),
              0 0 90px rgba(255, 215, 0, 0.5)
            `,
            animation: 'fire-impact-pulse 0.3s ease-out',
          }}
        />
      )}
    </div>
  );
}

