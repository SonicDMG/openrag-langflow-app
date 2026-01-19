import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeftBigIcon, ArrowRightBigIcon } from '@hugeicons/core-free-icons';

interface ScrollButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
}

/**
 * ScrollButton component for horizontal scrolling navigation
 * Displays arrow buttons on left/right sides, positioned next to the card container
 */
export function ScrollButton({ direction, onClick }: ScrollButtonProps) {
  const isLeft = direction === 'left';
  const ariaLabel = `Scroll ${direction}`;
  const Icon = isLeft ? ArrowLeftBigIcon : ArrowRightBigIcon;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center p-2 rounded-full text-amber-950/30 hover:text-[var(--page-background)] hover:bg-amber-950/30 transition-colors"
      aria-label={ariaLabel}
    >
      <HugeiconsIcon 
        icon={Icon} 
        size={32} 
        className="text-current"
      />
    </button>
  );
}

// Made with Bob
