'use client';

import { useRouter } from 'next/navigation';
import { CARD_THEME } from '../../cardTheme';
import { useCardSizing, getCardSizeClasses } from '../../../hooks/ui/useCardSizing';

// ============================================================================
// Type Definitions
// ============================================================================

type CharacterType = 'hero' | 'monster';

interface AddCharacterCardProps {
  type: CharacterType;
  size?: 'normal' | 'compact';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Simplified add character card with dotted border
 * Matches dimensions of other character cards
 */
export function AddCharacterCard({ type, size = 'compact' }: AddCharacterCardProps) {
  // ===== HOOKS =====
  const router = useRouter();
  const sizing = useCardSizing(size);
  const sizeClasses = getCardSizeClasses(sizing.isCompact);

  // ===== DERIVED VALUES =====
  const label = type === 'hero' ? 'Add Hero' : 'Add Monster';

  // ===== STYLE CALCULATIONS =====
  // Container style - matches CharacterCard dimensions exactly
  const containerStyle = {
    width: sizing.maxWidth,
    minWidth: sizing.maxWidth,
    maxWidth: sizing.maxWidth,
    padding: sizing.framePadding,
  };

  // Container classes - no background, just dashed border
  const containerClasses = [
    'relative',
    'flex',
    'flex-col',
    'aspect-[3/4]',
    'overflow-visible',
    'transition-transform',
    'duration-200',
    'hover:scale-[1.02]',
    'hover:bg-amber-950/4',
    'rounded-xl',
    'border-2',
    'border-dashed',
    'border-amber-950/30',
    'items-center',
    'justify-center',
    'cursor-pointer',
  ].filter(Boolean).join(' ');

  // Label classes
  const labelClasses = [
    sizeClasses.titleSize,
    'font-semibold',
    'text-amber-950/30',
  ].filter(Boolean).join(' ');

  // ===== HANDLERS =====
  const handleClick = () => {
    router.push(`/battle-arena/unified-character-creator?type=${type}`);
  };

  // ===== RENDER =====
  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      style={containerStyle}
    >
      {/* Centered label */}
      <span
        className={labelClasses}
        style={{
          fontFamily: CARD_THEME.fonts.family,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// Made with Bob
