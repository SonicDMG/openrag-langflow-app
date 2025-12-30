'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, getRandomRace, CARD_SETTINGS, DEFAULT_SETTING } from '../../../lib/constants';
import { Character, CardSetting } from '../../../lib/types';
import { SearchableSelect } from '../../ui/SearchableSelect';
import { extractRaceFromDescription, extractSexFromDescription } from '../../../services/shared/characterGeneration';
import { loadHeroesFromDatabase, loadMonstersFromDatabase } from '../../../utils/data/dataLoader';

interface MonsterCreatorProps {
  onMonsterCreated?: (monsterId: string, klass: string, imageUrl: string) => void;
  initialKlass?: string;
  initialDescription?: string;
  initialRace?: string;
  initialSex?: string;
  onDescriptionChange?: (description: string) => void;
}

/**
 * Enhances a character description with race and sex information
 * @param description - The base character description
 * @param race - Character race (optional, use "n/a" if not applicable)
 * @param sex - Character sex (optional, use "n/a" if not applicable)
 * @returns Enhanced description with race and sex included
 */
function enhanceDescriptionWithRaceAndSex(description: string, race?: string, sex?: string): string {
  const parts: string[] = [];
  
  if (race && race !== 'n/a' && race.trim()) {
    parts.push(race.trim());
  }
  
  if (sex && sex !== 'n/a' && sex.trim()) {
    parts.push(sex.trim());
  }
  
  if (parts.length > 0) {
    return `${parts.join(' ')} ${description}`.trim();
  }
  
  return description;
}

/**
 * Builds the base pixel art prompt template with user's description
 * Always generates characters with backgrounds (no transparent background/cutout processing)
 * @param userPrompt - The user's character description
 * @param setting - The card setting/theme (medieval, futuristic, etc.)
 * @param race - Character race (optional, use "n/a" if not applicable)
 * @param sex - Character sex (optional, use "n/a" if not applicable)
 */
function buildBasePrompt(userPrompt: string = '', setting: CardSetting = DEFAULT_SETTING as CardSetting, race?: string, sex?: string): string {
  const paletteDescription = 'warm earth tones with vibrant accents';
  const settingConfig = CARD_SETTINGS[setting] || CARD_SETTINGS[DEFAULT_SETTING];
  
  // Use the user's prompt/description and enhance with race/sex
  const baseDescription = userPrompt.trim() || 'a fantasy character';
  const description = enhanceDescriptionWithRaceAndSex(baseDescription, race, sex);
  
  // Always generate with background
  return `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. ${description}, depicted in a distinctly ${settingConfig.settingPhrase} world. Character (facing the camera), centered in frame. Placed in a expansive ${settingConfig.settingPhrase} setting, rendered with simplified tile-like textures and deliberate low-color shading. Use a cohesive ${paletteDescription} palette. Retro SNES/Genesis style, ${settingConfig.technologyLevel}.`;
}

export default function MonsterCreator({
  onMonsterCreated,
  initialKlass = '',
  initialDescription = '',
  initialRace = '',
  initialSex = '',
  onDescriptionChange
}: MonsterCreatorProps) {
  const [klass, setKlass] = useState(initialKlass);
  const [userPrompt, setUserPrompt] = useState(initialDescription);
  const [fullPrompt, setFullPrompt] = useState('');
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000000));
  const [imageUrl, setImageUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [model, setModel] = useState('5000');
  const [setting, setSetting] = useState<CardSetting>(DEFAULT_SETTING as CardSetting);

  // Store ALL heroes/monsters from database
  const [allDatabaseHeroes, setAllDatabaseHeroes] = useState<Character[]>([]);
  const [allDatabaseMonsters, setAllDatabaseMonsters] = useState<Character[]>([]);

  // Load all heroes and monsters from database (with localStorage → FALLBACK_* fallback)
  const loadCustomCharacters = useCallback(async () => {
    try {
      // Load ALL heroes from database (includes both default and custom)
      const allHeroes = await loadHeroesFromDatabase();
      setAllDatabaseHeroes(allHeroes);

      // Load ALL monsters from database (includes both default and custom)
      const allMonsters = await loadMonstersFromDatabase();
      setAllDatabaseMonsters(allMonsters);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  }, []);

  // Update state when initial props change (e.g., when switching to image tab)
  useEffect(() => {
    if (initialKlass && !klass) {
      setKlass(initialKlass);
    }
    if (initialDescription && !userPrompt) {
      setUserPrompt(initialDescription);
    }
  }, [initialKlass, initialDescription, klass, userPrompt]);

  // Load custom heroes and monsters on mount
  useEffect(() => {
    loadCustomCharacters();
  }, [loadCustomCharacters]);

  // Reload heroes/monsters when klass changes (to get latest descriptions)
  // Always reload when klass changes to ensure we have the latest data from database
  useEffect(() => {
    if (klass) {
      // Reload to get latest data for the selected class (including updated fallback classes)
      loadCustomCharacters();
    }
  }, [klass, loadCustomCharacters]);

  // Reload custom heroes/monsters when window regains focus (in case user updated class in another tab)
  useEffect(() => {
    const handleFocus = () => {
      loadCustomCharacters();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadCustomCharacters]);

  // Combine all available classes and monsters for dropdown
  // Use database data if available, otherwise fall back to FALLBACK_* constants
  const allOptions = useMemo(() => {
    const heroes = allDatabaseHeroes.length > 0 ? allDatabaseHeroes : FALLBACK_CLASSES;
    const monsters = allDatabaseMonsters.length > 0 ? allDatabaseMonsters : FALLBACK_MONSTERS;
    
    return [
      ...heroes.map(c => ({ name: c.name, type: 'class' as const })),
      ...monsters.map(m => ({ name: m.name, type: 'monster' as const }))
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [allDatabaseHeroes, allDatabaseMonsters]);

  // Check if the selected klass is a class (not a monster)
  const isClass = useMemo(() => {
    if (!klass) return false;
    return allDatabaseHeroes.some(c => c.name === klass) ||
           (allDatabaseHeroes.length === 0 && FALLBACK_CLASSES.some(c => c.name === klass));
  }, [klass, allDatabaseHeroes]);

  // Get the selected class/monster description
  // IMPORTANT: Check database first (allDatabaseHeroes/allDatabaseMonsters) to get latest data,
  // then fall back to fallback classes/monsters if not in database
  const selectedDescription = useMemo(() => {
    if (!klass) return '';
    // First check database (this includes updated versions of fallback classes)
    const databaseHero = allDatabaseHeroes.find(c => c.name === klass);
    const databaseMonster = allDatabaseMonsters.find(m => m.name === klass);
    // Then check fallback classes/monsters
    const fallbackClass = FALLBACK_CLASSES.find(c => c.name === klass);
    const fallbackMonster = FALLBACK_MONSTERS.find(m => m.name === klass);
    // Prefer database over fallback
    return databaseHero?.description || databaseMonster?.description || fallbackClass?.description || fallbackMonster?.description || '';
  }, [klass, allDatabaseHeroes, allDatabaseMonsters]);

  // Get race and sex from selected class/monster
  // Check database first, then fallback
  const selectedRace = useMemo(() => {
    if (!klass) return undefined;
    const databaseHero = allDatabaseHeroes.find(c => c.name === klass);
    const databaseMonster = allDatabaseMonsters.find(m => m.name === klass);
    const fallbackClass = FALLBACK_CLASSES.find(c => c.name === klass);
    const fallbackMonster = FALLBACK_MONSTERS.find(m => m.name === klass);
    return databaseHero?.race || databaseMonster?.race || fallbackClass?.race || fallbackMonster?.race;
  }, [klass, allDatabaseHeroes, allDatabaseMonsters]);

  const selectedSex = useMemo(() => {
    if (!klass) return undefined;
    const databaseHero = allDatabaseHeroes.find(c => c.name === klass);
    const databaseMonster = allDatabaseMonsters.find(m => m.name === klass);
    const fallbackClass = FALLBACK_CLASSES.find(c => c.name === klass);
    const fallbackMonster = FALLBACK_MONSTERS.find(m => m.name === klass);
    return databaseHero?.sex || databaseMonster?.sex || fallbackClass?.sex || fallbackMonster?.sex;
  }, [klass, allDatabaseHeroes, allDatabaseMonsters]);

  // When klass changes, populate the description field with the description from the database
  // Use the description as-is from the database without any modifications
  useEffect(() => {
    if (klass && selectedDescription) {
      // Use the description directly from the database as-is
      setUserPrompt(selectedDescription);
    } else if (klass && !selectedDescription) {
      // If there's no description, use the class name
      setUserPrompt(klass);
    }
  }, [klass, selectedDescription]); // Update when klass changes or selectedDescription changes

  // Update full prompt when userPrompt, setting, race, or sex changes
  // Always generate with background (no transparent background/cutout processing)
  useEffect(() => {
    if (userPrompt.trim()) {
      const basePrompt = buildBasePrompt(userPrompt, setting, selectedRace, selectedSex);
      setFullPrompt(basePrompt);
    } else {
      setFullPrompt('');
    }
  }, [userPrompt, setting, selectedRace, selectedSex]);

  const handleGenerateImage = async () => {
    if (!fullPrompt) {
      setError('Please select a class/monster or enter a prompt first');
      return;
    }

    setIsGeneratingImage(true);
    setError(null);

    try {
      // Use the full editable prompt for image generation
      // Always generate with background (no transparent background)
      const characterPrompt = fullPrompt;
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: characterPrompt,
          seed,
          model,
          transparentBackground: false, // Always generate with background
          aspectRatio: '16:9', // 16:9 aspect ratio for perfect fit
          setting, // Include setting in the request
          race: selectedRace, // Pass race from selected class
          sex: selectedSex,   // Pass sex from selected class
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
    if (!fullPrompt) {
      setError('Prompt is required');
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
          klass: klass || 'Unassociated', // Use "Unassociated" if no class selected
          prompt: fullPrompt,
          seed,
          imageUrl,
          setting,
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
          helpText="Select from available Battle Arena classes and monsters. This links your created monster to its playing card stats."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-100">
          Description
          <textarea
            value={userPrompt}
            onChange={(e) => {
              setUserPrompt(e.target.value);
              // Notify parent of description change
              if (onDescriptionChange) {
                onDescriptionChange(e.target.value);
              }
            }}
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
          Setting/Theme
          <select
            value={setting}
            onChange={(e) => setSetting(e.target.value as CardSetting)}
            className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
          >
            {Object.entries(CARD_SETTINGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-amber-300 mt-1">
            {CARD_SETTINGS[setting]?.description || 'Select the setting/theme for your card generation'}
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
        disabled={isCreating || !fullPrompt || !imageUrl}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          !fullPrompt ? 'Please ensure a prompt is generated' :
          !imageUrl ? 'Please generate an image or provide an image URL' :
          undefined
        }
      >
        {isCreating ? 'Creating...' : 'Create Image'}
      </button>
      {(!fullPrompt || !imageUrl) && !isCreating && (
        <p className="text-xs text-amber-300 text-center">
          {!fullPrompt && '⚠️ Prompt required • '}
          {!imageUrl && '⚠️ Image URL required'}
        </p>
      )}
    </div>
  );
}

