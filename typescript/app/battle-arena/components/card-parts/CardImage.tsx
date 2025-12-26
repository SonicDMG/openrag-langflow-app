import React, { memo, useState, useEffect } from 'react';
import { Character } from '../../types';
import { CardSizing } from '../../hooks/ui/useCardSizing';
import { CARD_THEME } from '../cardTheme';
import { getCharacterType } from '../utils/characterTypeUtils';
import { PLACEHOLDER_IMAGE_URL } from '../utils/imageUtils';

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


/**
 * Card image component with character name overlay
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
  const characterType = getCharacterType(playerClass);
  const [currentImageUrl, setCurrentImageUrl] = useState(monsterImageUrl);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [isCaching, setIsCaching] = useState(false);

  // Reset state when monsterImageUrl or everartFallbackUrl changes
  useEffect(() => {
    setCurrentImageUrl(monsterImageUrl);
    setHasTriedFallback(false);
    setImageError(false);
  }, [monsterImageUrl, everartFallbackUrl, characterName, monsterId, setImageError]);

  // Cache Everart image to local CDN via API
  const cacheImageToLocal = async (imageUrl: string, mId: string) => {
    if (isCaching) return; // Prevent duplicate requests
    
    setIsCaching(true);
    try {
      console.log(`[CardImage] Caching ${characterName} image to local CDN`);
      const response = await fetch('/api/cache-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsterId: mId, imageUrl }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[CardImage] ✓ ${characterName} image cached successfully`);
      } else {
        console.error(`[CardImage] Failed to cache ${characterName} image:`, await response.text());
      }
    } catch (error) {
      console.error(`[CardImage] Error caching ${characterName} image:`, error);
    } finally {
      setIsCaching(false);
    }
  };

  // Handle image load error with fallback to Everart URL
  const handleImageError = () => {
    if (!hasTriedFallback && everartFallbackUrl && currentImageUrl !== everartFallbackUrl) {
      // Try the Everart fallback URL
      console.log(`[CardImage] Local CDN failed for ${characterName}, trying Everart fallback`);
      setCurrentImageUrl(everartFallbackUrl);
      setHasTriedFallback(true);
    } else {
      // No fallback available or fallback also failed
      setImageError(true);
    }
  };

  // Handle successful image load
  const handleImageLoad = () => {
    setMainImageLoaded(true);
    
    // If we successfully loaded from Everart (fallback), cache it to local CDN
    if (hasTriedFallback && currentImageUrl === everartFallbackUrl && monsterId && everartFallbackUrl) {
      console.log(`[CardImage] ${characterName} loaded from Everart, caching to local CDN for future use`);
      cacheImageToLocal(everartFallbackUrl, monsterId);
    }
  };
  
  return (
    <div
      ref={characterImageRef}
      className="flex justify-center items-start overflow-hidden relative"
      style={{
        backgroundColor: CARD_THEME.colors.imageFrame,
        border: sizing.isCompact ? `1.5px solid ${CARD_THEME.colors.border}` : `2px solid ${CARD_THEME.colors.border}`,
        borderTopLeftRadius: sizing.innerBorderRadius,
        borderTopRightRadius: sizing.innerBorderRadius,
        borderBottomLeftRadius: sizing.isCompact ? '6px' : '8px',
        borderBottomRightRadius: sizing.isCompact ? '6px' : '8px',
        padding: '0',
        width: '100%',
        height: sizing.imageHeight,
        flexShrink: 0,
        marginBottom: imageMarginBottom || (sizing.isCompact ? '0.5rem' : '0.75rem'),
        position: 'relative',
      }}
    >
      {/* Name and class overlay on top of image */}
      <div
        className="absolute top-0 left-0 right-0 z-20"
        style={{
          background: CARD_THEME.gradients.imageOverlay,
          padding: sizing.padding,
          paddingBottom: sizing.isCompact ? '2rem' : '3rem',
        }}
      >
        {/* Character name */}
        <h3
          ref={nameRef}
          className={`${sizing.titleSize} font-bold mb-1`}
          style={{
            fontFamily: CARD_THEME.fonts.family,
            color: CARD_THEME.colors.textOverlay,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: CARD_THEME.shadows.textOverlay,
          }}
        >
          {characterName}
        </h3>

        {/* Character type */}
        <p
          className={sizing.typeSize}
          style={{
            color: CARD_THEME.colors.textOverlaySecondary,
            fontStyle: 'italic',
            textShadow: CARD_THEME.shadows.textOverlayLight,
          }}
        >
          {characterType}
        </p>
      </div>

      {/* Character image */}
      {currentImageUrl && !imageError ? (
        <img
          src={currentImageUrl}
          alt={characterName}
          style={{
            imageRendering: 'pixelated' as const,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: imagePosition
              ? `${imagePosition.offsetX}% ${imagePosition.offsetY}%`
              : 'center top',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <img
          src={PLACEHOLDER_IMAGE_URL}
          alt="Placeholder"
          style={{
            imageRendering: 'pixelated' as const,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block'
          }}
        />
      )}
    </div>
  );
});

// Made with Bob
