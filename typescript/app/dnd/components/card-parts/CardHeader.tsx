import React, { memo } from 'react';
import { CardSizing } from '../hooks/useCardSizing';

interface CardHeaderProps {
  isDefault?: boolean;
  showZoomButton: boolean;
  onZoom?: () => void;
  isCompact: boolean;
}

/**
 * Card header component displaying default badge and zoom button
 */
export const CardHeader = memo(function CardHeader({
  isDefault,
  showZoomButton,
  onZoom,
  isCompact,
}: CardHeaderProps) {
  return (
    <>
      {/* Default Hero Badge - top left corner */}
      {isDefault && (
        <div
          className="absolute top-2 left-2 z-30 bg-amber-600/90 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg border border-amber-400/50"
          title="Default Hero - loaded from game defaults"
        >
          DEFAULT
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
