interface OpponentTypeToggleProps {
  opponentType: 'class' | 'monster';
  onOpponentTypeChange: (type: 'class' | 'monster') => void;
  onClearSelection: () => void;
}

/**
 * Toggle buttons for switching between class and monster opponent types.
 * Clears the current selection when switching types.
 */
export function OpponentTypeToggle({
  opponentType,
  onOpponentTypeChange,
  onClearSelection,
}: OpponentTypeToggleProps) {
  const handleTypeChange = (type: 'class' | 'monster') => {
    onOpponentTypeChange(type);
    onClearSelection();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleTypeChange('class')}
        className={`px-3 py-1 text-xs rounded border transition-all ${
          opponentType === 'class'
            ? 'bg-blue-800 text-white border-blue-600'
            : 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
        }`}
      >
        Class
      </button>
      <button
        onClick={() => handleTypeChange('monster')}
        className={`px-3 py-1 text-xs rounded border transition-all ${
          opponentType === 'monster'
            ? 'bg-red-800 text-white border-red-600'
            : 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
        }`}
      >
        Monster
      </button>
    </div>
  );
}

// Made with Bob