import { HugeiconsIcon } from '@hugeicons/react';
import { Sword03Icon, Crown02Icon } from '@hugeicons/core-free-icons';

// Constants
const ICON_SIZE = 16;

// Style constants - organized for easy modification
const STYLES = {
  container: 'flex items-center gap-2 sm:gap-3',
  label: {
    base: 'font-semibold text-xs sm:text-base text-stone-500',
  },
  toggle: {
    container: 'relative inline-flex items-center rounded-full transition-colors cursor-pointer',
    track: {
      base: 'relative h-10 w-16 rounded-full bg-amber-950/10 transition-colors duration-300',
    },
    thumb: {
      base: 'absolute h-8 w-8 rounded-full shadow-md transition-all duration-300 flex items-center justify-center top-1 left-0.5',
      monster: 'bg-rose-700 translate-x-0',
      hero: 'bg-emerald-700 translate-x-7',
    },
    icon: 'text-white',
  },
} as const;

interface OpponentTypeToggleProps {
  opponentType: 'class' | 'monster';
  onOpponentTypeChange: (type: 'class' | 'monster') => void;
  onClearSelection: () => void;
}

/**
 * Toggle buttons for switching between class and monster opponent types.
 * Clears the current selection when switching types.
 * Styled to match nav buttons with active state indication.
 */
export function OpponentTypeToggle({
  opponentType,
  onOpponentTypeChange,
  onClearSelection,
}: OpponentTypeToggleProps) {
  // ===== HANDLERS =====
  const handleToggle = () => {
    const newType = opponentType === 'class' ? 'monster' : 'class';
    onOpponentTypeChange(newType);
    onClearSelection();
  };

  // ===== COMPUTED VALUES =====
  const isMonster = opponentType === 'monster';
  const thumbClasses = `${STYLES.toggle.thumb.base} ${
    isMonster ? STYLES.toggle.thumb.monster : STYLES.toggle.thumb.hero
  }`;
  const ThumbIcon = isMonster ? Sword03Icon : Crown02Icon;

  // ===== RENDER =====
  return (
    <div className={STYLES.container}>
      {/* Monster label */}
      <span className={STYLES.label.base}>Monster</span>

      {/* Toggle switch */}
      <button
        type="button"
        onClick={handleToggle}
        className={STYLES.toggle.container}
        aria-label={`Switch to ${isMonster ? 'Hero' : 'Monster'}`}
      >
        <div className={STYLES.toggle.track.base}>
          <div className={thumbClasses}>
            <HugeiconsIcon 
              icon={ThumbIcon} 
              size={ICON_SIZE} 
              className={STYLES.toggle.icon}
            />
          </div>
        </div>
      </button>

      {/* Hero label */}
      <span className={STYLES.label.base}>Hero</span>
    </div>
  );
}

// Made with Bob