'use client';

import { useEffect, useState, useRef } from 'react';
import { ProjectileType } from '../utils/battle';

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
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const [progress, setProgress] = useState(0);
  const projectileRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const updatePosition = () => {
      if (!fromCardRef.current || !toCardRef.current) {
        return;
      }

      const fromRect = fromCardRef.current.getBoundingClientRect();
      const toRect = toCardRef.current.getBoundingClientRect();

      // Calculate center positions
      const fromX = fromRect.left + fromRect.width / 2;
      const fromY = fromRect.top + fromRect.height / 2;
      let toX = toRect.left + toRect.width / 2;
      let toY = toRect.top + toRect.height / 2;

      // For misses, calculate a point that grazes past the target card and continues off-screen
      if (!isHit) {
        // Calculate direction from attacker to defender
        const directionX = toX - fromX;
        const directionY = toY - fromY;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedX = directionX / directionLength;
        const normalizedY = directionY / directionLength;
        
        // Graze past the target card (slightly offset to the side) and continue off-screen
        // Offset to the right side of the target card
        const grazeOffset = 60; // Distance to graze past the card
        const screenOffset = 300; // Distance to continue off-screen
        toX = toRect.right + grazeOffset + screenOffset * normalizedX;
        toY = toY + (Math.random() - 0.5) * 40 + screenOffset * normalizedY; // Random vertical offset + continue direction
      }

      setStartPos({ x: fromX, y: fromY });
      setEndPos({ x: toX, y: toY });
      setIsVisible(true);
      setProgress(0);
    };

    // Try immediately
    updatePosition();

    // If not ready, try again shortly
    if (!fromCardRef.current || !toCardRef.current) {
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
  }, [fromCardRef, toCardRef, isHit]);

  // Animate projectile movement with lobbed arc trajectory
  useEffect(() => {
    if (!isVisible || !startPos || !endPos) return;

    const startTime = Date.now() + delay;
    // For misses, use longer duration so it can travel off-screen
    const duration = isHit ? 400 : 600; // 400ms for hits, 600ms for misses (to travel off-screen)

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        // Still waiting for delay
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentProgress = Math.min(elapsed / duration, 1);

      setProgress(currentProgress);

      // For hits: trigger onHit callback when projectile reaches target (at ~75% of animation)
      if (isHit && !hasReachedTarget && currentProgress >= 0.75) {
        setHasReachedTarget(true);
        onHit?.();
      }

      if (currentProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsVisible(false);
        onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, startPos, endPos, isHit, hasReachedTarget, onHit, onComplete, delay]);

  if (!startPos || !endPos || !isVisible) return null;

  // Calculate lobbed arc trajectory
  // Calculate distance and direction
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Convert rotation angle to radians
  const rotationRad = (fromCardRotation * Math.PI) / 180;
  
  // Create arc trajectory: start at card center, go up and out at rotation angle, then arc down
  // Use a parabolic arc with peak at 50% progress
  const arcHeight = distance * 0.3; // Arc height is 30% of horizontal distance
  
  // Calculate initial launch direction based on card rotation
  // For player1 (rotated -5deg), projectile goes slightly left and up
  // For player2 (rotated 5deg), projectile goes slightly right and up
  const launchAngle = rotationRad; // Use card rotation as launch angle
  const launchSpeed = distance * 0.5; // Initial velocity magnitude
  
  // Calculate arc position with initial launch angle
  // Start with initial velocity in the direction of card rotation
  const initialVx = Math.sin(launchAngle) * launchSpeed;
  const initialVy = -Math.cos(launchAngle) * launchSpeed;
  
  // Blend between initial launch direction and target direction
  // Early in trajectory: more influenced by launch angle
  // Later in trajectory: more influenced by target direction
  const launchInfluence = Math.max(0, 1 - progress * 2); // Fades out in first 50%
  const targetInfluence = 1 - launchInfluence;
  
  // Calculate arc position
  // X: blend between launch direction and target
  const arcX = startPos.x + (initialVx * launchInfluence + dx * targetInfluence) * progress;
  
  // Y: parabolic arc with launch influence - goes up then down
  // At progress 0: at start Y
  // At progress 0.5: at peak (start Y - arcHeight)
  // At progress 1: at end Y
  const verticalLaunch = initialVy * launchInfluence;
  const arcY = startPos.y + (verticalLaunch + dy) * progress - (4 * arcHeight * progress * (1 - progress));
  
  // For misses, continue in a straight line past the target and off-screen
  let finalX = arcX;
  let finalY = arcY;
  let scale = 0.8 + progress * 0.7; // Scale from 0.8 to 1.5 (larger base size)
  let rotation = 0;

  if (!isHit) {
    // For misses, use linear trajectory that continues past the target
    // Calculate direction vector
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    
    // Use linear interpolation for misses (straight line, no arc)
    finalX = startPos.x + dx * progress;
    finalY = startPos.y + dy * progress;
    
    // Add slight rotation as it travels
    rotation = progress * 180; // Rotate 180 degrees as it travels
    
    // Fade out as it goes off-screen (fade starts at 75% progress, after clearing the target card)
    if (progress > 0.75) {
      const fadeProgress = (progress - 0.75) * 4; // 0 to 1 after 75%
      scale = 1.5 * (1 - fadeProgress * 0.5); // Slightly shrink as it fades
    }
  } else if (isHit && progress > 0.75) {
    // On hit, scale up at impact (larger impact)
    const impactProgress = (progress - 0.75) * 4; // 0 to 1 in last 25%
    scale = 1.8 + impactProgress * 1.2; // Scale from 1.8 to 3.0 (much larger impact)
  }

  return (
    <div
      ref={projectileRef}
      className={`projectile-effect projectile-${projectileType} ${isHit ? 'projectile-hit' : 'projectile-miss'}`}
      style={{
        position: 'fixed',
        left: finalX,
        top: finalY,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        opacity: isHit 
          ? (progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1)
          : (progress < 0.1 ? progress * 10 : progress > 0.75 ? Math.max(0, 1 - (progress - 0.75) * 4) : 1), // For misses, fade out after clearing target card (at 75% progress)
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'none', // Disable CSS transitions, we're animating manually
      }}
    >
      {/* Projectile visual - varies by type */}
      {projectileType === 'fire' ? (
        <>
          <div className="projectile-fire-core" />
          <div className="projectile-fire-particles" />
        </>
      ) : (
        <>
          <div className="projectile-core" />
          {isHit && <div className="projectile-trail" />}
          {/* No fizzle for misses - projectile continues off-screen */}
        </>
      )}
    </div>
  );
}

