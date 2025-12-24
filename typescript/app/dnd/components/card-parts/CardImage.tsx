import React, { memo } from 'react';
import { DnDClass } from '../../types';
import { CardSizing } from '../../hooks/ui/useCardSizing';
import { CARD_THEME } from '../cardTheme';
import { getCharacterType } from '../utils/characterTypeUtils';
import { PLACEHOLDER_IMAGE_URL } from '../utils/imageUtils';

interface CardImageProps {
  playerClass: DnDClass;
  characterName: string;
  monsterImageUrl?: string;
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
      {monsterImageUrl && !imageError ? (
        <img
          src={monsterImageUrl}
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
          onLoad={() => setMainImageLoaded(true)}
          onError={() => setImageError(true)}
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
