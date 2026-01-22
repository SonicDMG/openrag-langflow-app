import React, { memo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Hexagon01Icon } from '@hugeicons/core-free-icons';

// ============================================================================
// Type Definitions
// ============================================================================

interface DividerProps {
  isCompact: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Decorative divider with shapes icon
 * Matches design reference layout
 */
export const Divider = memo(function Divider({
  isCompact,
}: DividerProps) {
  // ===== DERIVED VALUES =====
  const iconSize = isCompact ? 10 : 14;

  // ===== STYLE CALCULATIONS =====
  // Container classes
  const containerClasses = [
    'flex',
    'items-center',
    'justify-center',
    isCompact ? 'px-3 my-2' : 'px-4 my-3',
  ].filter(Boolean).join(' ');

  // ===== RENDER =====
  return (
    <div className={containerClasses}>
      <div className="flex-1 border-t-2 border-stone-400" />
      <HugeiconsIcon
        icon={Hexagon01Icon}
        size={iconSize}
        strokeWidth={2.5}
        fill="currentColor"
        className="mx-2 text-stone-400"
      />
      <div className="flex-1 border-t-2 border-stone-400" />
    </div>
  );
});

// Made with Bob
