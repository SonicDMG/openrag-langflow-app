/**
 * EffectToggles Component
 * Provides UI controls for toggling visual effects on/off
 */

import { EffectType, EffectToggles as EffectTogglesType } from '../hooks/useEffectToggles';

export interface EffectTogglesProps {
  toggles: EffectTogglesType;
  onToggle: (effect: EffectType, enabled: boolean) => void;
  onLog: (message: string) => void;
}

interface EffectToggleConfig {
  key: EffectType;
  label: string;
  icon: string;
  title: string;
}

const EFFECT_CONFIGS: EffectToggleConfig[] = [
  { key: 'particle', label: 'Particle', icon: '🎨', title: 'Particle Effects' },
  { key: 'flash', label: 'Flash', icon: '⚡', title: 'Flash/Glow Effects' },
  { key: 'shake', label: 'Shake', icon: '💥', title: 'Shake Effects' },
  { key: 'sparkle', label: 'Sparkle', icon: '✨', title: 'Sparkle Effects' },
  { key: 'hit', label: 'Hit', icon: '⚔️', title: 'Hit Effects' },
  { key: 'miss', label: 'Miss', icon: '❌', title: 'Miss Effects' },
  { key: 'cast', label: 'Cast', icon: '🔮', title: 'Cast Effects' },
];

export function EffectToggles({ toggles, onToggle, onLog }: EffectTogglesProps) {
  const handleToggle = (config: EffectToggleConfig) => {
    const newValue = !toggles[config.key];
    onToggle(config.key, newValue);
    onLog(`${config.icon} ${config.label} effects ${newValue ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-amber-200 font-semibold">Effects:</label>
      {EFFECT_CONFIGS.map((config) => (
        <button
          key={config.key}
          onClick={() => handleToggle(config)}
          className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
            toggles[config.key]
              ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
              : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
          }`}
          title={config.title}
        >
          {config.label}: {toggles[config.key] ? 'ON' : 'OFF'}
        </button>
      ))}
    </div>
  );
}

// Made with Bob
