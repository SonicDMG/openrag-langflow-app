'use client';

import { useState, useEffect, useMemo } from 'react';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, getRandomRace } from '../constants';
import { DnDClass } from '../types';
import { SearchableSelect } from './SearchableSelect';

interface MonsterCreatorProps {
  onMonsterCreated?: (monsterId: string, klass: string, imageUrl: string) => void;
}

/**
 * Builds the base pixel art prompt template with user's description
 * @param userPrompt - The user's character description
 * @param transparentBackground - If true, removes background references from prompt
 */
function buildBasePrompt(userPrompt: string = '', transparentBackground: boolean = false): string {
  const paletteDescription = 'warm earth tones with vibrant accents';
  
  // Use the user's prompt/description
  const description = userPrompt.trim() || 'a fantasy character';
  
  if (transparentBackground) {
    // For transparent background, focus on isolated character only - no background references
    return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro fantasy aesthetic. ${description}, isolated character sprite, no background scene, no environment, no setting. Rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, no modern objects or technology. Centered composition, transparent background. --style raw`;
  }
  
  // Original prompt with background (for reference, though we now always use transparent)
  return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro fantasy aesthetic. ${description}, depicted in a distinctly medieval high-fantasy world. Placed in a expansive medieval high-fantasy setting, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Position the character in the lower third of the frame, (facing the camera), viewed from a pulled-back wide-angle perspective showing expansive landscape surrounding them. The character should occupy only 60-70% of the composition, with dominant landscape and sky filling the remainder. Retro SNES/Genesis style, no modern objects or technology. --style raw`;
}

export default function MonsterCreator({ onMonsterCreated }: MonsterCreatorProps) {
  const [klass, setKlass] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [fullPrompt, setFullPrompt] = useState('');
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000000));
  const [imageUrl, setImageUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [model, setModel] = useState('5000');
  const [skipCutout, setSkipCutout] = useState(true);

  const [customHeroes, setCustomHeroes] = useState<DnDClass[]>([]);
  const [customMonsters, setCustomMonsters] = useState<DnDClass[]>([]);

  // Load custom heroes and monsters from database
  useEffect(() => {
    const loadCustomCharacters = async () => {
      try {
        // Load custom heroes
        const heroesResponse = await fetch('/api/heroes');
        if (heroesResponse.ok) {
          const heroesData = await heroesResponse.json();
          const custom = (heroesData.heroes || []).filter((h: DnDClass) => 
            !FALLBACK_CLASSES.some(fc => fc.name === h.name)
          );
          setCustomHeroes(custom);
        }

        // Load custom monsters
        const monstersResponse = await fetch('/api/monsters-db');
        if (monstersResponse.ok) {
          const monstersData = await monstersResponse.json();
          const custom = (monstersData.monsters || []).filter((m: DnDClass) => 
            !FALLBACK_MONSTERS.some(fm => fm.name === m.name)
          );
          setCustomMonsters(custom);
        }
      } catch (error) {
        console.error('Failed to load custom characters:', error);
      }
    };

    loadCustomCharacters();
  }, []);

  // Combine all available classes and monsters for dropdown
  const allOptions = [
    ...FALLBACK_CLASSES.map(c => ({ name: c.name, type: 'class' as const, isCustom: false })),
    ...FALLBACK_MONSTERS.map(m => ({ name: m.name, type: 'monster' as const, isCustom: false })),
    ...customHeroes.map(c => ({ name: c.name, type: 'class' as const, isCustom: true })),
    ...customMonsters.map(m => ({ name: m.name, type: 'monster' as const, isCustom: true }))
  ].sort((a, b) => {
    // Sort: fallback first, then custom, then alphabetically
    if (a.isCustom !== b.isCustom) {
      return a.isCustom ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  // Check if the selected klass is a class (not a monster)
  const isClass = useMemo(() => {
    if (!klass) return false;
    return FALLBACK_CLASSES.some(c => c.name === klass) || customHeroes.some(c => c.name === klass);
  }, [klass, customHeroes]);

  // Get the selected class/monster description
  const selectedDescription = useMemo(() => {
    if (!klass) return '';
    const fallbackClass = FALLBACK_CLASSES.find(c => c.name === klass);
    const fallbackMonster = FALLBACK_MONSTERS.find(m => m.name === klass);
    const customHero = customHeroes.find(c => c.name === klass);
    const customMonster = customMonsters.find(m => m.name === klass);
    // Prefer custom over fallback
    return customHero?.description || customMonster?.description || fallbackClass?.description || fallbackMonster?.description || '';
  }, [klass, customHeroes, customMonsters]);

  // When klass changes, populate the description field with the class/monster name and description
  // For classes, also include a randomly selected race
  useEffect(() => {
    if (klass && selectedDescription) {
      if (isClass) {
        // For player classes, include a random race
        const race = getRandomRace();
        setUserPrompt(`${klass} ${race.name}: ${race.description}. ${selectedDescription}`);
      } else {
        // For monsters, just include the name and description
        setUserPrompt(`${klass}: ${selectedDescription}`);
      }
    } else if (klass && !selectedDescription) {
      // If there's no description, just use the name (with race for classes)
      if (isClass) {
        const race = getRandomRace();
        setUserPrompt(`${klass} ${race.name}`);
      } else {
        setUserPrompt(klass);
      }
    }
  }, [klass, selectedDescription, isClass]); // Update when klass changes

  // Update full prompt when userPrompt or skipCutout changes
  // Use different base prompts based on skipCutout option
  useEffect(() => {
    if (userPrompt.trim()) {
      // If skipCutout is true, use background prompt (character on background)
      // If skipCutout is false, use cutout prompt (transparent background, isolated character)
      const basePrompt = buildBasePrompt(userPrompt, !skipCutout); // !skipCutout = transparent background when false
      setFullPrompt(basePrompt);
    } else {
      setFullPrompt('');
    }
  }, [userPrompt, skipCutout]);

  const handleGenerateImage = async () => {
    if (!fullPrompt) {
      setError('Please select a class/monster or enter a prompt first');
      return;
    }

    setIsGeneratingImage(true);
    setError(null);

    try {
      // Use the full editable prompt for image generation
      let characterPrompt = fullPrompt;
      
      if (skipCutout) {
        // Generate character directly on background (no transparent background)
        // Remove transparent background references and add background scene
        if (characterPrompt.toLowerCase().includes('transparent') || 
            characterPrompt.toLowerCase().includes('no background') ||
            characterPrompt.toLowerCase().includes('isolated character')) {
          // Rebuild prompt with background
          const description = characterPrompt
            .replace(/transparent background[,\s]*/gi, '')
            .replace(/isolated character[,\s]*/gi, '')
            .replace(/no background scene[,\s]*/gi, '')
            .replace(/no environment[,\s]*/gi, '')
            .replace(/no setting[,\s]*/gi, '')
            .trim();
          characterPrompt = `${description}, depicted in a medieval high-fantasy setting with atmospheric background, ancient ruins, mystical lighting`;
        } else if (!characterPrompt.toLowerCase().includes('background') && 
                   !characterPrompt.toLowerCase().includes('setting')) {
          // Add background if not present
          characterPrompt = `${characterPrompt}, medieval high-fantasy background scene with atmospheric lighting`;
        }
      } else {
        // Generate character with transparent background (no background scene)
        // Rebuild prompt without background references if it's a template prompt
        if (fullPrompt.includes('depicted in a distinctly medieval high-fantasy world') || 
            fullPrompt.includes('Placed in a medieval high-fantasy setting')) {
          // Extract the character description from the existing prompt
          // Try to extract the description part (between the style description and "depicted")
          const match = fullPrompt.match(/retro fantasy aesthetic\.\s*(.+?)(?:,\s*depicted|$)/i);
          const description = match ? match[1].trim() : userPrompt || 'a fantasy character';
          characterPrompt = buildBasePrompt(description, true); // true = transparent background
        } else {
          // Custom prompt - just ensure transparent background is requested
          if (!characterPrompt.toLowerCase().includes('transparent') && 
              !characterPrompt.toLowerCase().includes('no background')) {
            characterPrompt = characterPrompt + ', transparent background, isolated character, no background scene, no environment';
          }
        }
      }
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: characterPrompt,
          seed,
          model,
          transparentBackground: !skipCutout, // Generate with transparent background only if skipCutout is false
          aspectRatio: '16:9', // 16:9 aspect ratio for perfect fit
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
    if (!klass || !fullPrompt) {
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
          prompt: fullPrompt,
          seed,
          imageUrl,
          skipCutout,
          stats: {
            hitPoints: 30,
            maxHitPoints: 30,
            armorClass: 14,
            attackBonus: 4,
            damageDie: 'd8',
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create monster');
      }

      const data = await response.json();
      setSuccess(`Monster created! ID: ${data.monsterId}`);
      
      if (onMonsterCreated) {
        onMonsterCreated(data.monsterId, klass, imageUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="border border-amber-700 rounded p-4 space-y-4 w-full bg-amber-900/30">
      <h2 className="text-xl font-bold text-amber-100">Create Character Image</h2>
      
      <div className="space-y-2">
        <SearchableSelect
          options={allOptions}
          value={klass}
          onChange={setKlass}
          placeholder="Select a class or monster..."
          label="Class/Type"
          helpText="Select from available D&D classes and monsters. This links your created monster to its playing card stats."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-100">
          Description
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Describe the character (e.g., 'A master of weapons and armor, the Fighter excels in combat')"
            className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
            rows={3}
          />
          <p className="text-xs text-amber-300 mt-1">
            {klass && selectedDescription 
              ? 'The description from the selected class/monster has been pre-filled. You can edit it to customize your character.'
              : 'Enter a description of your character. If you select a class/monster, its description will be pre-filled here.'}
          </p>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-100">
          Full Image Generation Prompt (Editable)
          <textarea
            value={fullPrompt}
            onChange={(e) => setFullPrompt(e.target.value)}
            placeholder="The full prompt will appear here after selecting a class/monster..."
            className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400 font-mono text-xs"
            rows={6}
          />
          <p className="text-xs text-amber-300 mt-1">
            This is the complete prompt that will be sent to the image generator. It includes the base pixel art style template and your description. You can edit it directly to customize the image generation.
          </p>
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

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={skipCutout}
            onChange={(e) => setSkipCutout(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-amber-900/50 border-amber-700 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-amber-100">
            Skip cutout creation (reserve for special monsters)
          </span>
        </label>
        <p className="text-xs text-amber-300 ml-6">
          When enabled, the character will be generated directly on a background (no transparent background processing). A placeholder cutout will be created. Cutout versions are reserved for special monsters that need isolated character sprites.
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
              disabled={isGeneratingImage || !fullPrompt}
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
        disabled={isCreating || !klass || !fullPrompt || !imageUrl}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          !klass ? 'Please enter a Class/Type' :
          !fullPrompt ? 'Please ensure a prompt is generated' :
          !imageUrl ? 'Please generate an image or provide an image URL' :
          undefined
        }
      >
        {isCreating ? 'Creating...' : 'Create Image'}
      </button>
      {(!klass || !fullPrompt || !imageUrl) && !isCreating && (
        <p className="text-xs text-amber-300 text-center">
          {!klass && '⚠️ Class/Type required • '}
          {!fullPrompt && '⚠️ Prompt required (select a class/monster) • '}
          {!imageUrl && '⚠️ Image URL required'}
        </p>
      )}
    </div>
  );
}

