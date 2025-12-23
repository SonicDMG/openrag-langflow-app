import { useState, useEffect, useRef } from 'react';
import { CardSizing } from './useCardSizing';

interface UseImageStateProps {
  monsterImageUrl?: string;
  characterName: string;
  sizing: CardSizing;
}

/**
 * Custom hook to manage image loading state and font size adjustments
 */
export function useImageState({ monsterImageUrl, characterName, sizing }: UseImageStateProps) {
  const [imageError, setImageError] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const nameRef = useRef<HTMLHeadingElement>(null);

  // Reset image error and loaded state when monsterImageUrl changes
  useEffect(() => {
    if (monsterImageUrl) {
      setImageError(false);
      setMainImageLoaded(false);
    }
  }, [monsterImageUrl]);

  // Adjust font size for long names to prevent wrapping
  useEffect(() => {
    const adjustFontSize = () => {
      if (!nameRef.current) return;
      
      const element = nameRef.current;
      const parent = element.parentElement;
      if (!parent) return;
      
      const isCompact = sizing.isCompact;
      
      // Get available width (parent width minus padding and icon space)
      const parentWidth = parent.offsetWidth;
      const paddingRight = isCompact ? 24 : 48; // 1.5rem = 24px, 3rem = 48px
      const availableWidth = parentWidth - paddingRight;
      
      // Reset to default size first to measure accurately
      element.style.fontSize = '';
      element.style.whiteSpace = 'nowrap';
      
      // Measure text width
      const textWidth = element.scrollWidth;
      
      // If text is too wide, calculate and apply smaller font size
      if (textWidth > availableWidth) {
        const baseFontSize = isCompact ? 16 : 20; // text-base = 16px, text-xl = 20px
        const scaleFactor = availableWidth / textWidth;
        const newFontSize = Math.max(baseFontSize * scaleFactor * 0.95, baseFontSize * 0.6); // Scale down, but not below 60% of base
        element.style.fontSize = `${newFontSize}px`;
      } else {
        // Reset to default if it fits
        element.style.fontSize = '';
      }
    };
    
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(adjustFontSize);
    });
    
    // Also handle window resize
    window.addEventListener('resize', adjustFontSize);
    
    return () => {
      window.removeEventListener('resize', adjustFontSize);
    };
  }, [characterName, sizing]);

  return {
    imageError,
    mainImageLoaded,
    nameRef,
    setImageError,
    setMainImageLoaded,
  };
}

// Made with Bob
