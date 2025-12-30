'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalButton() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [portalPosition, setPortalPosition] = useState<{ x: number; y: number } | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (isAnimating) return;
    
    // Get button position for centered zoom effect
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      setPortalPosition({ x: centerX, y: centerY });
      setIsAnimating(true);
    }
  };

  // Trigger animation after portal element is rendered
  useEffect(() => {
    if (isAnimating && portalPosition) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (portalRef.current) {
            portalRef.current.classList.add('portal-zoom-active');
          }
          if (overlayRef.current) {
            overlayRef.current.classList.add('portal-overlay');
          }
        });
      });
      
      // Navigate after animation completes
      const timeoutId = setTimeout(() => {
        router.push('/battle-arena');
      }, 500); // Match animation duration
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAnimating, portalPosition, router]);

  // Reset animation state when component mounts (in case of back navigation)
  useEffect(() => {
    if (portalRef.current) {
      portalRef.current.classList.remove('portal-zoom-active');
    }
    if (overlayRef.current) {
      overlayRef.current.classList.remove('portal-overlay');
    }
    setIsAnimating(false);
    setPortalPosition(null);
  }, []);

  return (
    <>
      {/* Overlay for darkening effect */}
      <div ref={overlayRef} className="portal-overlay" style={{ opacity: 0 }} />
      
      {/* Portal zoom element - appears at button position when clicked */}
      {isAnimating && portalPosition && (
        <div
          ref={portalRef}
          className="portal-zoom-element"
          style={{
            position: 'fixed',
            left: `${portalPosition.x}px`,
            top: `${portalPosition.y}px`,
            width: '48px',
            height: '48px',
            transform: 'translate(-50%, -50%)',
            transformOrigin: 'center center',
            imageRendering: 'pixelated',
            zIndex: 9999,
          }}
        >
          <img
            src="/cdn/decals/battle-arena.png"
            alt="Portal"
            className="w-full h-full"
            style={{
              imageRendering: 'pixelated',
            }}
          />
        </div>
      )}
      
      {/* Portal Button */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="portal-button group"
        title="Enter the Battle Arena"
        disabled={isAnimating}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: isAnimating ? 'wait' : 'pointer',
          padding: 0,
          opacity: isAnimating ? 0 : 1,
          transition: 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          className="portal-button-pulse relative"
          style={{
            imageRendering: 'pixelated',
            width: '48px',
            height: '48px',
          }}
        >
          <img
            src="/cdn/decals/battle-arena.png"
            alt="Portal to Battle Arena"
            className="w-full h-full"
            style={{
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 0 8px rgba(139, 111, 71, 0.4))',
            }}
          />
          {/* Subtle glow ring */}
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              boxShadow: '0 0 20px rgba(139, 111, 71, 0.6), inset 0 0 20px rgba(139, 111, 71, 0.3)',
              borderRadius: '50%',
            }}
          />
        </div>
      </button>
    </>
  );
}

