interface ScrollButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
}

/**
 * ScrollButton component for horizontal scrolling navigation
 * Displays arrow buttons on left/right sides
 */
export function ScrollButton({ direction, onClick }: ScrollButtonProps) {
  const isLeft = direction === 'left';
  const ariaLabel = `Scroll ${direction}`;
  const positionClass = isLeft ? 'left-0' : 'right-0';
  
  return (
    <button
      onClick={onClick}
      className={`absolute ${positionClass} top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-1 sm:p-1.5 md:p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all`}
      aria-label={ariaLabel}
    >
      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d={isLeft ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} 
        />
      </svg>
    </button>
  );
}

// Made with Bob
