import React, { memo, useState, useEffect, useCallback } from 'react';
import { Character } from '../../../../lib/types';
import { CardSizing, getCardSizeClasses } from '../../../../hooks/ui/useCardSizing';
import { CARD_THEME } from '../../../cardTheme';
import { getCharacterType } from '../../../utils/characterTypeUtils';
import { PLACEHOLDER_IMAGE_URL } from '../../../utils/imageUtils';

// ============================================================================
// Type Definitions
// ============================================================================

interface CardImageProps {
  playerClass: Character;
  characterName: string;
  monsterImageUrl?: string;
  everartFallbackUrl?: string;
  monsterId?: string;
  imagePosition?: { offsetX: number; offsetY: number };
  imageError: boolean;
  setImageError: (error: boolean) => void;
  setMainImageLoaded: (loaded: boolean) => void;
  nameRef: React.RefObject<HTMLHeadingElement | null>;
  characterImageRef: React.RefObject<HTMLDivElement | null>;
  sizing: CardSizing;
  imageMarginBottom?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Card image component with character name overlay
 * Handles image loading, fallback, and caching to local CDN
 */
export const CardImage = memo(function CardImage({
  playerClass,
  characterName,
  monsterImageUrl,
  everartFallbackUrl,
  monsterId,
  imagePosition,
  imageError,
  setImageError,
  setMainImageLoaded,
  nameRef,
  characterImageRef,
  sizing,
  imageMarginBottom,
}: CardImageProps) {
  // ===== STATE =====
  const [currentImageUrl, setCurrentImageUrl] = useState(monsterImageUrl);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [isCaching, setIsCaching] = useState(false);

  // ===== DERIVED VALUES =====
  const sizeClasses = getCardSizeClasses(sizing.isCompact);
  const characterType = getCharacterType(playerClass);

  // ===== EFFECTS =====
  // Reset state when image URLs or character changes
  useEffect(() => {
    setCurrentImageUrl(monsterImageUrl);
    setHasTriedFallback(false);
    setImageError(false);
  }, [monsterImageUrl, everartFallbackUrl, characterName, monsterId, setImageError]);

  // ===== HANDLERS =====
  /**
   * Cache Everart image to local CDN via API
   * Prevents duplicate requests with isCaching flag
   */
  const cacheImageToLocal = useCallback(async (imageUrl: string, mId: string) => {
    if (isCaching) return;
    
    setIsCaching(true);
    try {
      console.log(`[CardImage] Caching ${characterName} image to local CDN`);
      const response = await fetch('/api/cache-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsterId: mId, imageUrl }),
      });
      
      if (response.ok) {
        console.log(`[CardImage] ✓ ${characterName} image cached successfully`);
      } else {
        console.error(`[CardImage] Failed to cache ${characterName} image:`, await response.text());
      }
    } catch (error) {
      console.error(`[CardImage] Error caching ${characterName} image:`, error);
    } finally {
      setIsCaching(false);
    }
  }, [characterName, isCaching]);

  /**
   * Handle image load error with fallback to Everart URL
   */
  const handleImageError = useCallback(() => {
    if (!hasTriedFallback && everartFallbackUrl && currentImageUrl !== everartFallbackUrl) {
      console.log(`[CardImage] Local CDN failed for ${characterName}, trying Everart fallback`);
      setCurrentImageUrl(everartFallbackUrl);
      setHasTriedFallback(true);
    } else {
      setImageError(true);
    }
  }, [hasTriedFallback, everartFallbackUrl, currentImageUrl, characterName, setImageError]);

  /**
   * Handle successful image load
   * If loaded from Everart fallback, cache it to local CDN
   */
  const handleImageLoad = useCallback(() => {
    setMainImageLoaded(true);
    
    if (hasTriedFallback && currentImageUrl === everartFallbackUrl && monsterId && everartFallbackUrl) {
      console.log(`[CardImage] ${characterName} loaded from Everart, caching to local CDN for future use`);
      cacheImageToLocal(everartFallbackUrl, monsterId);
    }
  }, [hasTriedFallback, currentImageUrl, everartFallbackUrl, monsterId, characterName, setMainImageLoaded, cacheImageToLocal]);

  // ===== STYLE CALCULATIONS =====
  // Object position: bounding box offset (0-100%) maps directly to object-position percentages
  const objectPosition = imagePosition
    ? `${imagePosition.offsetX}% ${imagePosition.offsetY}%`
    : '50% 0%';

  // Container classes
  const containerClasses = [
    'flex',
    'justify-center',
    'items-start',
    'overflow-hidden',
    'relative',
    'w-full',
    'shrink-0',
    'bg-stone-800',
    'border-stone-100',
    sizing.isCompact ? 'mb-2' : 'mb-3',
  ].filter(Boolean).join(' ');

  // Overlay classes
  const overlayClasses = [
    'absolute',
    'top-0',
    'left-0',
    'right-0',
    'z-20',
    'bg-gradient-to-b',
    'from-black',
    'to-transparent',
    sizing.isCompact ? 'p-3 pb-8' : 'p-4 pb-12',
  ].filter(Boolean).join(' ');

  // Name heading classes
  const nameClasses = [
    sizeClasses.titleSize,
    'font-semibold',
    'text-sm',
    'overflow-hidden',
    'text-ellipsis',
    'text-stone-100',
  ].filter(Boolean).join(' ');

  // Type paragraph classes
  const typeClasses = [
    sizeClasses.typeSize,
    'font-medium',
    'text-stone-100/75',
  ].filter(Boolean).join(' ');

  // Image classes (shared between main and placeholder)
  const imageClasses = [
    'w-full',
    'h-full',
    'object-cover',
    'block',
    'absolute',
    'top-0',
    'left-0',
  ].filter(Boolean).join(' ');

  // ===== RENDER =====
  return (
    <div
      ref={characterImageRef}
      className={containerClasses}
      style={{
        height: sizing.imageHeight,
        marginBottom: imageMarginBottom,
      }}
    >
      {/* Name and class overlay */}
      <div className={overlayClasses}>
        <h3
          ref={nameRef}
          className={nameClasses}
          style={{
            fontFamily: CARD_THEME.fonts.family,
          }}
        >
          {characterName}
        </h3>
        <p className={typeClasses}>
          {characterType}
        </p>
      </div>

      {/* Character image */}
      {currentImageUrl && !imageError ? (
        <img
          src={currentImageUrl}
          alt={characterName}
          className={imageClasses}
          style={{
            imageRendering: 'pixelated' as const,
            objectPosition,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <img
          src={PLACEHOLDER_IMAGE_URL}
          alt="Placeholder"
          className={imageClasses}
          style={{
            imageRendering: 'pixelated' as const,
            objectPosition: 'center top',
          }}
        />
      )}
    </div>
  );
});

// Made with Bob
