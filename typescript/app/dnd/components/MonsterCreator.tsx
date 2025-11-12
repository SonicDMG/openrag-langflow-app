'use client';

import { useState } from 'react';
import { AnimationConfig } from '../utils/rigTypes';

interface MonsterCreatorProps {
  onMonsterCreated?: (monsterId: string) => void;
}

// Available parts that can be affected by wind
const WIND_PARTS = [
  { value: 'hair', label: 'Hair' },
  { value: 'hatTip', label: 'Hat Tip' },
  { value: 'beard', label: 'Beard' },
  { value: 'cape', label: 'Cape' },
  { value: 'robeL', label: 'Robe Left' },
  { value: 'robeR', label: 'Robe Right' },
  { value: 'sleeveL', label: 'Sleeve Left' },
  { value: 'sleeveR', label: 'Sleeve Right' },
  { value: 'wingL', label: 'Wing Left' },
  { value: 'wingR', label: 'Wing Right' },
  { value: 'tail', label: 'Tail' },
];

// Available weapon/spell source parts
const WEAPON_PARTS = [
  { value: 'staffTip', label: 'Staff Tip' },
  { value: 'swordTip', label: 'Sword Tip' },
  { value: 'wandTip', label: 'Wand Tip' },
  { value: 'wingL', label: 'Wing Left' },
  { value: 'wingR', label: 'Wing Right' },
  { value: 'tail', label: 'Tail' },
  { value: 'mouth', label: 'Mouth (Breath Weapon)' },
];

export default function MonsterCreator({ onMonsterCreated }: MonsterCreatorProps) {
  const [klass, setKlass] = useState('');
  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000000));
  const [imageUrl, setImageUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [model, setModel] = useState('5000');
  
  // Animation configuration
  const [windParts, setWindParts] = useState<string[]>(['hair', 'robeL', 'robeR', 'cape']);
  const [weaponPart, setWeaponPart] = useState<string>('staffTip');
  const [spellEffectType, setSpellEffectType] = useState<'particles' | 'fire' | 'sparkles' | 'glow'>('particles');
  
  // Background removal options
  const [transparentBackground, setTransparentBackground] = useState(true);
  const [removeBg, setRemoveBg] = useState(false);

  const handleGenerateImage = async () => {
    if (!prompt) {
      setError('Please enter a prompt first');
      return;
    }

    setIsGeneratingImage(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          seed,
          model,
          transparentBackground,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
      setSuccess('Image generated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCreate = async () => {
    if (!klass || !prompt) {
      setError('Class and prompt are required');
      return;
    }

    if (!imageUrl) {
      setError('Please generate an image first or provide an image URL');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/monsters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          klass,
          prompt,
          seed,
          imageUrl,
          stats: {
            hitPoints: 30,
            maxHitPoints: 30,
            armorClass: 14,
            attackBonus: 4,
            damageDie: 'd8',
          },
          animationConfig: {
            windParts,
            weaponPart,
            spellEffectType,
          },
          removeBg,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create monster');
      }

      const data = await response.json();
      setSuccess(`Monster created! ID: ${data.monsterId}`);
      
      if (onMonsterCreated) {
        onMonsterCreated(data.monsterId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="border border-amber-700 rounded p-4 space-y-4 max-w-2xl bg-amber-900/30">
      <h2 className="text-xl font-bold text-amber-100">Create New Monster</h2>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-100">
          Class/Type
          <input
            type="text"
            value={klass}
            onChange={(e) => setKlass(e.target.value)}
            placeholder="e.g., Wizard, Dragon, Goblin"
            className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-100">
          Prompt
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the monster (e.g., 'A blue wizard with a long beard and pointy hat')"
            className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
            rows={3}
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-100">
          Model
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
          >
            <option value="5000">FLUX1.1 (Standard)</option>
            <option value="9000">FLUX1.1-ultra (Ultra High Quality)</option>
            <option value="6000">SD3.5</option>
            <option value="7000">Recraft-Real (Photorealistic)</option>
            <option value="8000">Recraft-Vector (Vector Art)</option>
          </select>
        </label>
      </div>

      {/* Background Options */}
      <div className="space-y-2 border-t border-amber-700 pt-4">
        <h3 className="text-sm font-semibold text-amber-100">Background Options</h3>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={transparentBackground}
            onChange={(e) => setTransparentBackground(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-amber-200">
            Request transparent background in prompt
          </span>
        </label>
        <p className="text-xs text-amber-300 ml-6">
          Adds "transparent background" to the image generation prompt
        </p>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={removeBg}
            onChange={(e) => setRemoveBg(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-amber-200">
            Remove background (post-processing)
          </span>
        </label>
        <p className="text-xs text-amber-300 ml-6">
          Automatically removes background from generated/downloaded images using edge detection
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-amber-100">
              Image URL
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Will be generated automatically or paste URL here"
                className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
              />
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !prompt}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isGeneratingImage ? 'Generating...' : 'Generate Image'}
            </button>
          </div>
        </div>
        <p className="text-xs text-amber-200">
          Click "Generate Image" to create an image using EverArt API, or paste an existing image URL.
        </p>
        {imageUrl && (
          <div className="mt-2">
            <img
              src={imageUrl}
              alt="Generated preview"
              className="max-w-full h-auto border rounded"
              onError={() => setError('Failed to load image. Please check the URL.')}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-100">
          Seed
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
          />
        </label>
        <button
          onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
          className="text-xs text-amber-300 hover:text-amber-200 hover:underline"
        >
          Generate random seed
        </button>
      </div>

      {/* Animation Configuration */}
      <div className="border-t border-amber-700 pt-4 space-y-4">
        <h3 className="text-lg font-semibold text-amber-100">Animation Configuration</h3>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-amber-100">
            Wind-Affected Parts
            <p className="text-xs text-amber-300 mb-2">Select parts that should sway in the wind</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WIND_PARTS.map((part) => (
                <label key={part.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={windParts.includes(part.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setWindParts([...windParts, part.value]);
                      } else {
                        setWindParts(windParts.filter(p => p !== part.value));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-amber-200">{part.label}</span>
                </label>
              ))}
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-amber-100">
            Weapon/Spell Source
            <select
              value={weaponPart}
              onChange={(e) => setWeaponPart(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
            >
              {WEAPON_PARTS.map((part) => (
                <option key={part.value} value={part.value}>
                  {part.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-amber-300 mt-1">Where spell effects should originate from</p>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-amber-100">
            Spell Effect Type
            <select
              value={spellEffectType}
              onChange={(e) => setSpellEffectType(e.target.value as any)}
              className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
            >
              <option value="particles">Particles (Default)</option>
              <option value="fire">Fire</option>
              <option value="sparkles">Sparkles</option>
              <option value="glow">Glow Only</option>
            </select>
            <p className="text-xs text-amber-300 mt-1">Visual style for spell effects</p>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-600 text-red-100 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-900/50 border border-green-600 text-green-100 rounded">
          {success}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={isCreating || !klass || !prompt || !imageUrl}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          !klass ? 'Please enter a Class/Type' :
          !prompt ? 'Please enter a Prompt' :
          !imageUrl ? 'Please generate an image or provide an image URL' :
          undefined
        }
      >
        {isCreating ? 'Creating...' : 'Create Monster'}
      </button>
      {(!klass || !prompt || !imageUrl) && !isCreating && (
        <p className="text-xs text-amber-300 text-center">
          {!klass && '⚠️ Class/Type required • '}
          {!prompt && '⚠️ Prompt required • '}
          {!imageUrl && '⚠️ Image URL required'}
        </p>
      )}
    </div>
  );
}

