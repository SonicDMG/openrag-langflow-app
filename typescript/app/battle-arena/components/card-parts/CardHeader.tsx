import React, { memo } from 'react';
import { CharacterSource, BADGE_CONFIGS } from '../../utils/characterSource';

interface CardHeaderProps {
  source?: CharacterSource;
  showZoomButton: boolean;
  onZoom?: () => void;
  isCompact: boolean;
}

/**
 * Card header component displaying character source badge and zoom button
 */
export const CardHeader = memo(function CardHeader({
  source,
  showZoomButton,
  onZoom,
  isCompact,
}: CardHeaderProps) {
  // Get badge configuration if source is provided
  const badge = source ? BADGE_CONFIGS[source] : null;

  return (
    <>
      {/* Character Source Badge - top left corner */}
      {badge && (
        <div
          className={`absolute top-1 left-1 z-30 ${badge.bg} text-white text-[8px] font-medium px-1 py-0.5 rounded-sm shadow-sm border ${badge.border} leading-none`}
          title={badge.tooltip}
        >
          {badge.text}
        </div>
      )}

      {/* Zoom button - matches overlay text style for visibility */}
      {showZoomButton && onZoom && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onZoom();
          }}
          className="absolute top-2 right-2 z-30 transition-all cursor-pointer"
          style={{
            backgroundColor: 'transparent',
            color: '#F2ECDE',
            fontFamily: 'serif',
            fontWeight: 'bold',
            border: 'none',
            padding: 0,
            filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(0, 0, 0, 0.6))',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          title="View details"
          aria-label="View character details"
        >
          <svg className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
      )}
    </>
  );
});

// Made with Bob
