import React, { memo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowExpandIcon } from '@hugeicons/core-free-icons';
import { CharacterSource, BADGE_CONFIGS } from '../../../../utils/character/characterSource';

// ============================================================================
// Type Definitions
// ============================================================================

interface CardHeaderProps {
  source?: CharacterSource;
  showZoomButton: boolean;
  onZoom?: () => void;
  isCompact: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Card header component displaying character source badge and zoom button
 * Badge stretches full width above the card image with zoom button inside, right-aligned
 */
export const CardHeader = memo(function CardHeader({
  source,
  showZoomButton,
  onZoom,
  isCompact,
}: CardHeaderProps) {
  // ===== DERIVED VALUES =====
  const badge = source ? BADGE_CONFIGS[source] : null;
  const zoomIconSize = isCompact ? 10 : 14;

  // ===== STYLE CALCULATIONS =====
  // Badge container classes - full width bar
  const badgeContainerClasses = [
    'w-full',
    'flex',
    'items-center',
    'justify-between',
    'px-1.5',
    isCompact ? 'py-1' : 'py-1',
    badge?.bg || 'bg-stone-800',
    'text-white/75',
    'text-[8px]',
    'font-bold',
  ].filter(Boolean).join(' ');

  // Zoom button classes
  const zoomButtonClasses = [
    'bg-transparent',
    'text-white/50',
    'border-none',
    'p-0',
    'transition-all',
    'cursor-pointer',
    'hover:opacity-80',
    'flex',
    'items-center',
    'justify-center',
  ].filter(Boolean).join(' ');

  // ===== HANDLERS =====
  const handleZoomClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onZoom?.();
  };

  // ===== RENDER =====
  // Only render if we have a badge or zoom button
  if (!badge && (!showZoomButton || !onZoom)) {
    return null;
  }

  return (
    <div className={badgeContainerClasses} title={badge?.tooltip}>
      {/* Badge text - left side */}
      {badge && (
        <span className="flex-shrink-0">
          {badge.text}
        </span>
      )}

      {/* Zoom button - right side */}
      {showZoomButton && onZoom && (
        <button
          onClick={handleZoomClick}
          className={zoomButtonClasses}
          title="View details"
          aria-label="View character details"
        >
          <HugeiconsIcon
            icon={ArrowExpandIcon}
            size={zoomIconSize}
            strokeWidth={2.5}
          />
        </button>
      )}
    </div>
  );
});

// Made with Bob
