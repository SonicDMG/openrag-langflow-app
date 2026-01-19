'use client';

import { useRouter } from 'next/navigation';
import { CARD_THEME, getCardBoxShadowClass } from '../../cardTheme';
import { useCardSizing } from '../../../hooks/ui/useCardSizing';

type CharacterType = 'hero' | 'monster';

interface AddCharacterCardProps {
  type: CharacterType;
  size?: 'normal' | 'compact';
}

/**
 * Unified component for adding heroes or monsters
 * Replaces AddHeroCard and AddMonsterCard with a single, theme-consistent component
 */
export function AddCharacterCard({ type, size = 'compact' }: AddCharacterCardProps) {
  const router = useRouter();
  const sizing = useCardSizing(size);
  
  // Dynamic text based on type
  const title = type === 'hero' ? 'Add Your Hero' : 'Add Monster';
  const buttonText = type === 'hero' ? 'Add Hero' : 'Add Monster';
  const footerText = type === 'hero' ? 'Create a new hero' : 'Create a new monster';

  const handleClick = () => {
    router.push(`/battle-arena/unified-character-creator?type=${type}`);
  };

  return (
    <div 
      className={`relative flex flex-col cursor-pointer transition-transform duration-200 hover:scale-[1.02] shadow-lg`}
      onClick={handleClick}
      style={{ 
        backgroundColor: CARD_THEME.colors.frame,
        borderRadius: sizing.borderRadius,
        width: '100%',
        maxWidth: sizing.maxWidth,
        aspectRatio: '3/4',
        padding: sizing.framePadding,
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Inner card */}
      <div 
        className="relative overflow-hidden shadow-inner"
        style={{ 
          backgroundColor: CARD_THEME.colors.innerCard,
          borderRadius: sizing.innerBorderRadius,
          flex: 1,
          minHeight: 0,
        }}
      >

        {/* Card Content */}
        <div className="h-full flex flex-col relative z-10" style={{ padding: sizing.padding }}>
          {/* Header */}
          <div className="relative" style={{ marginBottom: sizing.isCompact ? '0.5rem' : '0.75rem' }}>
            <h3 
              className={`${sizing.titleSize} font-bold mb-1`}
              style={{ 
                fontFamily: CARD_THEME.fonts.family,
                color: CARD_THEME.colors.text,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
            </h3>
            <p 
              className={sizing.typeSize}
              style={{ 
                color: CARD_THEME.colors.textLight,
                fontStyle: 'italic'
              }}
            >
              Click to load
            </p>
          </div>

          {/* Placeholder image area */}
          <div 
            className="rounded-lg flex justify-center items-center overflow-hidden relative"
            style={{ 
              backgroundColor: CARD_THEME.colors.imageFrame,
              border: sizing.isCompact ? `1.5px solid ${CARD_THEME.colors.border}` : `2px solid ${CARD_THEME.colors.border}`,
              borderRadius: sizing.isCompact ? '6px' : '8px',
              padding: '0',
              width: `calc(100% + ${sizing.padding} + ${sizing.padding})`,
              height: sizing.imageHeight,
              aspectRatio: '280/200',
              marginBottom: sizing.isCompact ? '1.5rem' : '0.75rem',
              marginLeft: `-${sizing.padding}`,
              marginRight: `-${sizing.padding}`,
            }}
          >
            {/* Plus icon */}
            <div className="flex flex-col items-center justify-center gap-2">
              <svg 
                className="w-12 h-12 sm:w-16 sm:h-16" 
                fill="none" 
                stroke={CARD_THEME.colors.textLight} 
                viewBox="0 0 24 24"
                style={{ strokeWidth: 2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span 
                className="text-xs sm:text-sm"
                style={{ 
                  color: CARD_THEME.colors.textLight,
                  fontFamily: CARD_THEME.fonts.family,
                  fontWeight: 'bold'
                }}
              >
                {buttonText}
              </span>
            </div>
          </div>

          {/* Divider with diamond icon */}
          <div className="flex items-center justify-center" style={{ marginBottom: sizing.isCompact ? '0.5rem' : '0.75rem' }}>
            <div className="flex-1 border-t" style={{ borderColor: CARD_THEME.colors.text }}></div>
            <div 
              className="mx-2"
              style={{
                width: sizing.diamondSize,
                height: sizing.diamondSize,
                backgroundColor: CARD_THEME.colors.text,
                transform: 'rotate(45deg)'
              }}
            ></div>
            <div className="flex-1 border-t" style={{ borderColor: CARD_THEME.colors.text }}></div>
          </div>

          {/* Footer text */}
          <div className="mt-auto text-center">
            <p 
              className={sizing.typeSize}
              style={{ 
                color: CARD_THEME.colors.textLight,
                fontFamily: CARD_THEME.fonts.family,
                fontStyle: 'italic'
              }}
            >
              {footerText}
            </p>
          </div>
        </div>
      </div>

      {/* Footer text in dark frame area */}
      <div 
        className="relative flex items-center"
        style={{ 
          marginTop: sizing.isCompact ? '4px' : '6px',
          paddingTop: '0',
          paddingBottom: '0',
          height: sizing.isCompact ? '16px' : '20px'
        }}
      >
        {/* Small symbol in center bottom */}
        <div 
          className="absolute"
          style={{
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: sizing.isCompact ? '8px' : '10px',
            height: sizing.isCompact ? '8px' : '10px',
            backgroundColor: CARD_THEME.colors.textOverlay,
            opacity: 0.6
          }}
        ></div>

        {/* "2025 OpenRAG" in bottom right */}
        <span 
          className={sizing.isCompact ? 'text-[8px]' : 'text-[10px]'}
          style={{ 
            color: CARD_THEME.colors.textOverlay,
            fontFamily: CARD_THEME.fonts.family,
            fontWeight: 'bold',
            marginLeft: 'auto'
          }}
        >
          2025 OpenRAG
        </span>
      </div>
    </div>
  );
}

// Made with Bob
