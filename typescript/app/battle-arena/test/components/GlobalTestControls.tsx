/**
 * GlobalTestControls Component
 * Provides AI mode toggle and reset functionality
 */

export interface GlobalTestControlsProps {
  isAIModeActive: boolean;
  onToggleAIMode: () => void;
  onReset: () => void;
}

export function GlobalTestControls({
  isAIModeActive,
  onToggleAIMode,
  onReset,
}: GlobalTestControlsProps) {
  return (
    <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-4 shadow-2xl">
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onToggleAIMode}
          className={`py-2 px-4 font-semibold rounded-lg border-2 transition-all ${
            isAIModeActive
              ? 'bg-green-900 hover:bg-green-800 text-white border-green-700'
              : 'bg-blue-900 hover:bg-blue-800 text-white border-blue-700'
          }`}
        >
          {isAIModeActive ? '🤖 AI Mode: ON' : '🤖 AI Mode: OFF'}
        </button>
        <button
          onClick={onReset}
          className="py-2 px-4 bg-amber-800 hover:bg-amber-700 text-white font-semibold rounded-lg border-2 border-amber-700 transition-all"
        >
          🔄 Reset Test
        </button>
      </div>
      {isAIModeActive && (
        <div className="mt-3 text-center">
          <p className="text-amber-200 text-sm italic">
            🤖 AI Mode Active: Player 2 (opponent) will automatically play when it's their turn
          </p>
        </div>
      )}
    </div>
  );
}

// Made with Bob
