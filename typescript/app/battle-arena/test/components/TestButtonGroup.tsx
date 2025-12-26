/**
 * TestButtonGroup Component
 * Provides test action buttons for a player
 */

export type TestAction = 
  | 'highDamage'
  | 'lowDamage'
  | 'fullHeal'
  | 'lowHeal'
  | 'miss'
  | 'cast'
  | 'defeat';

export interface TestButtonGroupProps {
  player: 'player1' | 'player2';
  onTestAction: (action: TestAction) => void;
  isDisabled?: boolean;
}

interface ButtonConfig {
  action: TestAction;
  label: string;
  icon: string;
  colorClass: string;
}

const BUTTON_CONFIGS: ButtonConfig[] = [
  { action: 'highDamage', label: 'High Damage', icon: '💥', colorClass: 'bg-red-900 hover:bg-red-800 border-red-700' },
  { action: 'lowDamage', label: 'Low Damage', icon: '💥', colorClass: 'bg-orange-900 hover:bg-orange-800 border-orange-700' },
  { action: 'fullHeal', label: 'Full Heal', icon: '💚', colorClass: 'bg-green-900 hover:bg-green-800 border-green-700' },
  { action: 'lowHeal', label: 'Low Heal', icon: '💚', colorClass: 'bg-emerald-900 hover:bg-emerald-800 border-emerald-700' },
  { action: 'miss', label: 'Test Miss', icon: '❌', colorClass: 'bg-amber-800 hover:bg-amber-700 border-amber-600' },
  { action: 'cast', label: 'Test Cast', icon: '🔮', colorClass: 'bg-purple-800 hover:bg-purple-700 border-purple-600' },
  { action: 'defeat', label: 'Test Defeat', icon: '💀', colorClass: 'bg-red-900 hover:bg-red-800 border-red-700' },
];

export function TestButtonGroup({ player, onTestAction, isDisabled = false }: TestButtonGroupProps) {
  return (
    <div 
      className="flex flex-wrap gap-2"
      style={{ width: '100%', maxWidth: '320px' }}
    >
      {BUTTON_CONFIGS.map((config) => (
        <button
          key={config.action}
          onClick={() => {
            if (isDisabled) return;
            onTestAction(config.action);
          }}
          disabled={isDisabled}
          className={`px-2 py-1 text-white text-xs rounded border transition-all ${config.colorClass} ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {config.icon} {config.label}
        </button>
      ))}
    </div>
  );
}

// Made with Bob
