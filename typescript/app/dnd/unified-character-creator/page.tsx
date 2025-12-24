'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DnDClass, Ability, AttackAbility, HealingAbility, ImagePosition } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { generateCharacterStats } from '../services/characterGeneration';
import { CLASS_COLORS, MONSTER_COLORS } from '../constants';
import { PageHeader } from '../components/PageHeader';
import { LandscapePrompt } from '../components/LandscapePrompt';
import MonsterCreator from '../components/MonsterCreator';
import { ImagePositionEditor } from '../components/ImagePositionEditor';
import { getCharacterImageUrl } from '../components/utils/imageUtils';

type CharacterType = 'hero' | 'monster';
type TabType = 'details' | 'image';

interface CharacterFormData {
  name: string;
  class: string;
  description: string;
  race: string;
  sex: string;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  abilities: Ability[];
  color: string;
}

interface ImageFormData {
  monsterId: string | null;
  imageUrl: string | null;
  imagePosition: ImagePosition;
  prompt: string;
}

function UnifiedCharacterCreatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');  // Character _id (works for both database and fallback)
  const editType = searchParams.get('type') as CharacterType | null;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('details');
  
  // Character state
  const [characterType, setCharacterType] = useState<CharacterType>('hero');
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    class: '',
    description: '',
    race: '',
    sex: '',
    hitPoints: 25,
    maxHitPoints: 25,
    armorClass: 14,
    attackBonus: 4,
    damageDie: 'd8',
    abilities: [],
    color: CLASS_COLORS['Fighter'] || 'bg-slate-900',
  });

  // Image state
  const [imageData, setImageData] = useState<ImageFormData>({
    monsterId: null,
    imageUrl: null,
    imagePosition: { offsetX: 50, offsetY: 50 },
    prompt: '',
  });

  // All created images state
  const [allCreatedMonsters, setAllCreatedMonsters] = useState<Array<{
    monsterId: string;
    klass: string;
    imageUrl: string;
    prompt?: string;
    createdAt?: string;
    imagePosition?: ImagePosition
  }>>([]);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Card animation states for image tab
  const [shouldShake, setShouldShake] = useState(false);
  const [shouldSparkle, setShouldSparkle] = useState(false);
  const [shouldMiss, setShouldMiss] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [sparkleTrigger, setSparkleTrigger] = useState(0);
  const [missTrigger, setMissTrigger] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [sparkleIntensity, setSparkleIntensity] = useState(0);

  // Load all created monsters/images
  const loadAllMonsters = useCallback(async () => {
    setIsLoadingMonsters(true);
    try {
      const response = await fetch('/api/monsters');
      if (response.ok) {
        const data = await response.json();
        const monsters = (data.monsters || []).map((m: any) => ({
          monsterId: m.monsterId,
          klass: m.klass || 'Unassociated',
          imageUrl: m.imageUrl || getCharacterImageUrl(m.monsterId) || '',
          prompt: m.prompt,
          createdAt: m.createdAt,
          imagePosition: m.imagePosition || { offsetX: 50, offsetY: 50 },
        }));
        setAllCreatedMonsters(monsters);
      }
    } catch (error) {
      console.error('Failed to load created monsters:', error);
    } finally {
      setIsLoadingMonsters(false);
    }
  }, []);

  // Load all monsters on mount
  useEffect(() => {
    loadAllMonsters();
  }, [loadAllMonsters]);

  // Load existing character for editing
  useEffect(() => {
    const loadCharacter = async () => {
      if (!editId || !editType) return;

      setIsLoading(true);
      setError(null);

      try {
        const endpoint = editType === 'hero' ? '/api/heroes' : '/api/monsters-db';
        let character: DnDClass | null = null;

        // Strategy 1: Try database lookup by ID
        console.log(`[Edit Character] Looking up ${editType} by ID: ${editId}`);
        const idResponse = await fetch(`${endpoint}?id=${encodeURIComponent(editId)}`);
        
        if (idResponse.ok) {
          const idData = await idResponse.json();
          character = editType === 'hero' ? idData.hero : idData.monster;
          if (character) {
            console.log(`[Edit Character] Found ${editType} in database: ${character.name}`);
          }
        }

        // Strategy 2: If not in database, check fallback data (all fallback data now has IDs)
        if (!character) {
          console.log(`[Edit Character] Not in database, checking fallback data for ID: ${editId}`);
          
          // Import fallback data dynamically
          const { FALLBACK_CLASSES, FALLBACK_MONSTERS } = await import('../constants');
          const fallbackData = editType === 'hero' ? FALLBACK_CLASSES : FALLBACK_MONSTERS;
          
          console.log(`[Edit Character] Fallback data loaded: ${fallbackData.length} ${editType}s`);
          console.log(`[Edit Character] First few IDs:`, fallbackData.slice(0, 3).map(c => ({ _id: c._id, name: c.name })));
          console.log(`[Edit Character] Looking for ID: ${editId}`);
          
          // Find in fallback data by _id
          character = fallbackData.find((c: DnDClass) => c._id === editId) || null;
          
          if (character) {
            console.log(`[Edit Character] Found ${editType} in fallback data: ${character.name}`);
          } else {
            console.log(`[Edit Character] NOT FOUND in fallback data. Available IDs:`, fallbackData.map(c => c._id));
          }
        }

        if (character) {
          setCharacterType(editType);
          setFormData({
            name: character.name,
            class: character.class || '',
            description: character.description || '',
            race: character.race || '',
            sex: character.sex || '',
            hitPoints: character.hitPoints,
            maxHitPoints: character.maxHitPoints,
            armorClass: character.armorClass,
            attackBonus: character.attackBonus,
            damageDie: character.damageDie,
            abilities: character.abilities || [],
            color: character.color || (editType === 'hero' ? CLASS_COLORS['Fighter'] : MONSTER_COLORS['Goblin']) || 'bg-slate-900',
          });

          // Load associated image from monsters API
          const monstersResponse = await fetch('/api/monsters');
          if (monstersResponse.ok) {
            const monstersData = await monstersResponse.json();
            // Find the MOST RECENT image associated with this character
            // IMPORTANT: Check both character.name AND character.class because:
            // - Custom heroes like "Sylvan the Hunter" have name="Sylvan the Hunter", class="Ranger"
            // - Images might be stored with klass="Ranger" (the class) or klass="Sylvan the Hunter" (the character name)
            // - Default heroes have name=class (e.g., name="Ranger", class="Ranger")
            // Sort by createdAt descending to get the newest first
            const associatedImages = monstersData.monsters
              .filter((m: any) => m.klass === character.name || m.klass === character.class)
              .sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA; // Most recent first
              });
            
            console.log(`[Edit Character] Searching for images with klass="${character.name}" or klass="${character.class}"`);
            console.log(`[Edit Character] Found ${associatedImages.length} image(s)`);
            if (associatedImages.length > 0) {
              console.log('Images sorted by date (newest first):', associatedImages.map((img: any) => ({
                monsterId: img.monsterId,
                createdAt: img.createdAt,
                imageUrl: img.imageUrl
              })));
            }
            
            const associatedImage = associatedImages[0]; // Get the most recent
            if (associatedImage) {
              const imageUrl = getCharacterImageUrl(associatedImage.monsterId);
              console.log(`[Edit Character] Loading most recent image: ${associatedImage.monsterId}`);
              console.log(`[Edit Character] Image URL: ${imageUrl}`);
              setImageData({
                monsterId: associatedImage.monsterId,
                imageUrl: imageUrl || '',
                imagePosition: associatedImage.imagePosition || { offsetX: 50, offsetY: 50 },
                prompt: associatedImage.prompt || '',
              });
              
              // Clean up old images (keep only the most recent)
              const oldImages = associatedImages.slice(1); // All except the first (most recent)
              if (oldImages.length > 0) {
                console.log(`[Edit Character] Cleaning up ${oldImages.length} old image(s) for character "${character.name}"`);
                for (const oldImage of oldImages) {
                  try {
                    console.log(`[Edit Character] Deleting old image: ${oldImage.monsterId} (created: ${oldImage.createdAt})`);
                    await fetch('/api/monsters', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ monsterId: oldImage.monsterId }),
                    });
                    console.log(`[Edit Character] ✓ Deleted old image ${oldImage.monsterId}`);
                  } catch (err) {
                    console.warn(`[Edit Character] ✗ Failed to delete old image ${oldImage.monsterId}:`, err);
                  }
                }
                console.log(`[Edit Character] Cleanup complete. Kept only the most recent image.`);
              }
            }
          }
        } else {
          setError(`Character with ID "${editId}" not found in database or fallback data`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load character');
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacter();
  }, [editId, editType]);

  // Update color when character type changes
  useEffect(() => {
    if (!editId && !editType) {
      const defaultColor = characterType === 'hero' 
        ? CLASS_COLORS['Fighter'] || 'bg-slate-900'
        : MONSTER_COLORS['Goblin'] || 'bg-slate-900';
      setFormData(prev => ({ ...prev, color: defaultColor }));
    }
  }, [characterType, editId, editType]);

  const handleGenerateStats = useCallback(async () => {
    if (!formData.description.trim()) {
      setError('Please enter a description first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateCharacterStats(
        formData.name || '',
        formData.description,
        characterType
      );

      if (result.name) {
        setFormData(prev => ({
          ...prev,
          name: result.name || prev.name,
        }));
      }

      if (result.stats) {
        const stats = result.stats;
        setFormData(prev => ({
          ...prev,
          name: result.name || prev.name,
          hitPoints: stats.hitPoints || prev.hitPoints,
          maxHitPoints: stats.maxHitPoints || stats.hitPoints || prev.hitPoints,
          armorClass: stats.armorClass || prev.armorClass,
          attackBonus: stats.attackBonus || prev.attackBonus,
          damageDie: stats.damageDie || prev.damageDie,
          description: stats.description || prev.description,
          race: result.race || stats?.race || prev.race,
          sex: result.sex || stats?.sex || prev.sex,
        }));
      }

      if (result.race || result.sex) {
        setFormData(prev => ({
          ...prev,
          race: result.race || prev.race || '',
          sex: result.sex || prev.sex || '',
        }));
      }

      if (result.abilities && result.abilities.length > 0) {
        setFormData(prev => ({
          ...prev,
          abilities: result.abilities,
        }));
      }

      setSuccess(result.name ? 'Name, stats, and abilities generated successfully!' : 'Stats and abilities generated successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate stats');
    } finally {
      setIsGenerating(false);
    }
  }, [formData.description, formData.name, characterType]);

  const handleAddAbility = useCallback((type: 'attack' | 'healing') => {
    const newAbility: Ability = type === 'attack'
      ? {
        name: 'New Attack',
        type: 'attack',
        damageDice: '1d8',
        attackRoll: true,
        attacks: 1,
        description: '',
      }
      : {
        name: 'New Healing',
        type: 'healing',
        healingDice: '1d8+3',
        description: '',
      };

    setFormData(prev => ({
      ...prev,
      abilities: [...prev.abilities, newAbility],
    }));
  }, []);

  const handleUpdateAbility = useCallback((index: number, ability: Ability) => {
    setFormData(prev => {
      const newAbilities = [...prev.abilities];
      newAbilities[index] = ability;
      return { ...prev, abilities: newAbilities };
    });
  }, []);

  const handleRemoveAbility = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      abilities: prev.abilities.filter((_, i) => i !== index),
    }));
  }, []);

  const handleMonsterCreated = useCallback(async (monsterId: string, klass: string, imageUrl: string) => {
    try {
      // First, delete any old images associated with this character
      if (formData.name) {
        const response = await fetch('/api/monsters');
        if (response.ok) {
          const data = await response.json();
          const oldImages = data.monsters.filter(
            (m: any) => m.klass === formData.name && m.monsterId !== monsterId
          );
          
          // Delete old images
          for (const oldImage of oldImages) {
            try {
              await fetch('/api/monsters', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monsterId: oldImage.monsterId }),
              });
              console.log(`Deleted old image ${oldImage.monsterId} for character ${formData.name}`);
            } catch (err) {
              console.warn(`Failed to delete old image ${oldImage.monsterId}:`, err);
            }
          }
        }
      }
      
      // Now load the new monster data
      const response = await fetch('/api/monsters');
      if (response.ok) {
        const data = await response.json();
        const monster = data.monsters.find((m: any) => m.monsterId === monsterId);
        if (monster) {
          setImageData({
            monsterId,
            imageUrl: getCharacterImageUrl(monsterId) || imageUrl,
            imagePosition: monster.imagePosition || { offsetX: 50, offsetY: 50 },
            prompt: monster.prompt || '',
          });
        } else {
          setImageData({
            monsterId,
            imageUrl: getCharacterImageUrl(monsterId) || imageUrl,
            imagePosition: { offsetX: 50, offsetY: 50 },
            prompt: '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load monster data:', error);
      setImageData({
        monsterId,
        imageUrl: getCharacterImageUrl(monsterId) || imageUrl,
        imagePosition: { offsetX: 50, offsetY: 50 },
        prompt: '',
      });
    }
    
    // Reload all monsters to update the list
    await loadAllMonsters();
  }, [formData.name, loadAllMonsters]);

  const validateCharacterDetails = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    return true;
  };

  const handleSaveImagePosition = useCallback(async () => {
    if (!imageData.monsterId) {
      setError('No image to save position for');
      return;
    }

    setIsSavingPosition(true);
    setError(null);

    try {
      const response = await fetch('/api/monsters', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monsterId: imageData.monsterId,
          klass: formData.name || 'Unassociated',
          imagePosition: imageData.imagePosition,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save image position');
      }

      setSuccess('Image position saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save image position');
    } finally {
      setIsSavingPosition(false);
    }
  }, [imageData, formData.name]);

  const handleTabSwitch = (tab: TabType) => {
    if (tab === 'image' && !validateCharacterDetails()) {
      return;
    }
    setError(null);
    setActiveTab(tab);
  };

  const handleSave = useCallback(async () => {
    if (!validateCharacterDetails()) {
      setActiveTab('details');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Save character data
      const character: DnDClass = {
        name: formData.name.trim(),
        class: formData.class.trim() || undefined,
        hitPoints: formData.hitPoints,
        maxHitPoints: formData.maxHitPoints,
        armorClass: formData.armorClass,
        attackBonus: formData.attackBonus,
        damageDie: formData.damageDie,
        abilities: formData.abilities,
        description: formData.description || `A ${characterType === 'hero' ? 'hero' : 'monster'} named ${formData.name}.`,
        color: formData.color,
        race: formData.race.trim() || undefined,
        sex: formData.sex.trim() || undefined,
      };

      const endpoint = characterType === 'hero' ? '/api/heroes' : '/api/monsters-db';
      const body = characterType === 'hero'
        ? { hero: character, searchContext: 'Custom' }
        : { monster: character, searchContext: 'Custom' };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save character');
      }

      // 2. If image exists, clean up old images and associate the new one
      if (imageData.monsterId) {
        // First, get all images associated with this character
        const monstersResponse = await fetch('/api/monsters');
        if (monstersResponse.ok) {
          const monstersData = await monstersResponse.json();
          const oldImages = monstersData.monsters.filter(
            (m: any) => m.klass === formData.name && m.monsterId !== imageData.monsterId
          );
          
          // Delete all old images for this character
          for (const oldImage of oldImages) {
            try {
              await fetch('/api/monsters', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ monsterId: oldImage.monsterId }),
              });
            } catch (err) {
              console.warn(`Failed to delete old image ${oldImage.monsterId}:`, err);
            }
          }
        }

        // Now associate the new image
        const imageResponse = await fetch('/api/monsters', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            monsterId: imageData.monsterId,
            klass: formData.name, // Associate with character name
            imagePosition: imageData.imagePosition,
          }),
        });

        if (!imageResponse.ok) {
          console.warn('Failed to associate image, but character was saved');
        }
      }

      setSuccess(`${characterType === 'hero' ? 'Hero' : 'Monster'} ${editId ? 'updated' : 'saved'} successfully!`);
      
      // Clear localStorage cache to force battle page to reload fresh data
      localStorage.removeItem('dnd_loaded_classes');
      localStorage.removeItem('dnd_loaded_monsters');
      console.log('[UnifiedCharacterCreator] Cleared localStorage cache');
      
      setTimeout(() => {
        setSuccess(null);
        router.push('/dnd');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save character');
    } finally {
      setIsSaving(false);
    }
  }, [formData, characterType, imageData, router, editId]);

  const previewCharacter: DnDClass = {
    name: formData.name || 'Unnamed Character',
    class: formData.class.trim() || undefined,
    hitPoints: formData.hitPoints,
    maxHitPoints: formData.maxHitPoints,
    armorClass: formData.armorClass,
    attackBonus: formData.attackBonus,
    damageDie: formData.damageDie,
    abilities: formData.abilities,
    description: formData.description,
    color: formData.color,
    race: formData.race.trim() || undefined,
    sex: formData.sex.trim() || undefined,
  };

  const testShake = useCallback(() => {
    setShakeIntensity(10);
    setShouldShake(true);
    setShakeTrigger(prev => prev + 1);
  }, []);

  const testSparkle = useCallback(() => {
    setSparkleIntensity(15);
    setShouldSparkle(true);
    setSparkleTrigger(prev => prev + 1);
  }, []);

  const testMiss = useCallback(() => {
    setShouldMiss(true);
    setMissTrigger(prev => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D1C9BA' }}>
        <div className="text-xl text-gray-700">Loading character...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D1C9BA' }}>
      <LandscapePrompt />
      
      <PageHeader
        title={editId ? 'Edit' : 'Create'}
        title2="Character"
        decalImageUrl="/cdn/decals/create-character.png"
      />

      {/* Tab Navigation */}
      <div className="container mx-auto px-8 pt-4">
        <div className="flex gap-2 border-b-2 border-amber-800">
          <button
            onClick={() => handleTabSwitch('details')}
            className={`px-6 py-3 font-bold text-lg transition-all ${
              activeTab === 'details'
                ? 'bg-amber-900/70 text-amber-100 border-t-4 border-x-4 border-amber-800 rounded-t-lg'
                : 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50'
            }`}
          >
            📝 Character Details
          </button>
          <button
            onClick={() => handleTabSwitch('image')}
            className={`px-6 py-3 font-bold text-lg transition-all ${
              activeTab === 'image'
                ? 'bg-amber-900/70 text-amber-100 border-t-4 border-x-4 border-amber-800 rounded-t-lg'
                : 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50'
            }`}
          >
            🎨 Character Image
          </button>
        </div>
      </div>

      <div className="container mx-auto p-8 max-w-7xl">
        {/* Tab Content */}
        {activeTab === 'details' ? (
          <CharacterDetailsTab
            characterType={characterType}
            setCharacterType={setCharacterType}
            formData={formData}
            setFormData={setFormData}
            isGenerating={isGenerating}
            handleGenerateStats={handleGenerateStats}
            handleAddAbility={handleAddAbility}
            handleUpdateAbility={handleUpdateAbility}
            handleRemoveAbility={handleRemoveAbility}
            previewCharacter={previewCharacter}
            imageData={imageData}
            error={error}
            success={success}
            editId={editId}
            onContinue={() => handleTabSwitch('image')}
          />
        ) : (
          <CharacterImageTab
            characterName={formData.name}
            characterType={characterType}
            imageData={imageData}
            setImageData={setImageData}
            previewCharacter={previewCharacter}
            handleMonsterCreated={handleMonsterCreated}
            allCreatedMonsters={allCreatedMonsters}
            isLoadingMonsters={isLoadingMonsters}
            handleSaveImagePosition={handleSaveImagePosition}
            isSavingPosition={isSavingPosition}
            shouldShake={shouldShake}
            shouldSparkle={shouldSparkle}
            shouldMiss={shouldMiss}
            shakeTrigger={shakeTrigger}
            sparkleTrigger={sparkleTrigger}
            missTrigger={missTrigger}
            shakeIntensity={shakeIntensity}
            sparkleIntensity={sparkleIntensity}
            setShouldShake={setShouldShake}
            setShouldSparkle={setShouldSparkle}
            setShouldMiss={setShouldMiss}
            testShake={testShake}
            testSparkle={testSparkle}
            testMiss={testMiss}
            onBack={() => setActiveTab('details')}
            onSave={handleSave}
            isSaving={isSaving}
            error={error}
            success={success}
          />
        )}
      </div>
    </div>
  );
}

// Character Details Tab Component
interface CharacterDetailsTabProps {
  characterType: CharacterType;
  setCharacterType: (type: CharacterType) => void;
  formData: CharacterFormData;
  setFormData: React.Dispatch<React.SetStateAction<CharacterFormData>>;
  isGenerating: boolean;
  handleGenerateStats: () => void;
  handleAddAbility: (type: 'attack' | 'healing') => void;
  handleUpdateAbility: (index: number, ability: Ability) => void;
  handleRemoveAbility: (index: number) => void;
  previewCharacter: DnDClass;
  imageData: ImageFormData;
  error: string | null;
  success: string | null;
  editId: string | null;
  onContinue: () => void;
}

function CharacterDetailsTab({
  characterType,
  setCharacterType,
  formData,
  setFormData,
  isGenerating,
  handleGenerateStats,
  handleAddAbility,
  handleUpdateAbility,
  handleRemoveAbility,
  previewCharacter,
  imageData,
  error,
  success,
  editId,
  onContinue,
}: CharacterDetailsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="space-y-6">
        <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
            Character Details
          </h2>

          {/* Character Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-amber-100 mb-2">
              Character Type <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="hero"
                  checked={characterType === 'hero'}
                  onChange={(e) => setCharacterType(e.target.value as CharacterType)}
                  disabled={!!editId}
                  className="mr-2"
                />
                <span className="text-amber-100">Hero</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="monster"
                  checked={characterType === 'monster'}
                  onChange={(e) => setCharacterType(e.target.value as CharacterType)}
                  disabled={!!editId}
                  className="mr-2"
                />
                <span className="text-amber-100">Monster</span>
              </label>
            </div>
            <p className="text-xs text-amber-300 mt-1">
              <strong>Important:</strong> Select "Monster" if you're creating an enemy/creature. This determines where the character is saved and how it appears in battles.
            </p>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-amber-100 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
              rows={3}
              placeholder="Describe your character (used for AI generation)"
            />
            <button
              onClick={handleGenerateStats}
              disabled={isGenerating || !formData.description.trim()}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : '🤖 Generate Name & Stats from Description'}
            </button>
            <p className="text-xs text-amber-300 mt-1">
              Enter a description and click the button to automatically generate a name, stats, and abilities for your character.
            </p>
          </div>

          {/* Race and Sex */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-100 mb-2">
                Race
              </label>
              <input
                type="text"
                value={formData.race}
                onChange={(e) => setFormData(prev => ({ ...prev, race: e.target.value }))}
                className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
                placeholder="e.g., Human, Elf, Dwarf"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-100 mb-2">
                Sex
              </label>
              <input
                type="text"
                value={formData.sex}
                onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value }))}
                className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
                placeholder="e.g., male, female, other"
              />
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-amber-100 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
              placeholder="Enter character name"
            />
          </div>

          {/* Class */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-amber-100 mb-2">
              Class
            </label>
            <input
              type="text"
              value={formData.class}
              onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
              className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
              placeholder="e.g., Fighter, Wizard, Rogue (optional)"
            />
          </div>

          {/* Stats Grid */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-amber-100 mb-3" style={{ fontFamily: 'serif' }}>
              Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-100 mb-1">
                  Hit Points
                </label>
                <input
                  type="number"
                  value={formData.hitPoints}
                  onChange={(e) => {
                    const hp = parseInt(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, hitPoints: hp, maxHitPoints: hp }));
                  }}
                  className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-100 mb-1">
                  Armor Class
                </label>
                <input
                  type="number"
                  value={formData.armorClass}
                  onChange={(e) => setFormData(prev => ({ ...prev, armorClass: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-100 mb-1">
                  Attack Bonus
                </label>
                <input
                  type="number"
                  value={formData.attackBonus}
                  onChange={(e) => setFormData(prev => ({ ...prev, attackBonus: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-100 mb-1">
                  Damage Die
                </label>
                <select
                  value={formData.damageDie}
                  onChange={(e) => setFormData(prev => ({ ...prev, damageDie: e.target.value }))}
                  className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                >
                  <option value="d4">d4</option>
                  <option value="d6">d6</option>
                  <option value="d8">d8</option>
                  <option value="d10">d10</option>
                  <option value="d12">d12</option>
                </select>
              </div>
            </div>
          </div>

          {/* Abilities Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-amber-100" style={{ fontFamily: 'serif' }}>
                Abilities ({formData.abilities.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddAbility('attack')}
                  className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-600"
                >
                  + Attack
                </button>
                <button
                  onClick={() => handleAddAbility('healing')}
                  className="px-3 py-1 bg-green-700 text-white rounded text-sm hover:bg-green-600"
                >
                  + Healing
                </button>
              </div>
            </div>

            {formData.abilities.length === 0 ? (
              <p className="text-sm text-amber-300">No abilities yet. Add some using the buttons above.</p>
            ) : (
              <div className="space-y-3">
                {formData.abilities.map((ability, index) => (
                  <AbilityEditor
                    key={index}
                    ability={ability}
                    index={index}
                    onUpdate={handleUpdateAbility}
                    onRemove={handleRemoveAbility}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-600 text-red-100 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-600 text-green-100 rounded text-sm">
              {success}
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={onContinue}
            disabled={!formData.name.trim()}
            className="w-full px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg border-2 border-blue-600"
          >
            Continue to Image →
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-4">
        <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
            Preview
          </h2>
          <div className="flex justify-center">
            <CharacterCard
              playerClass={previewCharacter}
              characterName={previewCharacter.name}
              monsterImageUrl={imageData.imageUrl || undefined}
              imagePosition={imageData.imagePosition}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Character Image Tab Component
interface CharacterImageTabProps {
  characterName: string;
  characterType: CharacterType;
  imageData: ImageFormData;
  setImageData: React.Dispatch<React.SetStateAction<ImageFormData>>;
  previewCharacter: DnDClass;
  handleMonsterCreated: (monsterId: string, klass: string, imageUrl: string) => void;
  allCreatedMonsters: Array<{
    monsterId: string;
    klass: string;
    imageUrl: string;
    prompt?: string;
    createdAt?: string;
    imagePosition?: ImagePosition
  }>;
  isLoadingMonsters: boolean;
  handleSaveImagePosition: () => Promise<void>;
  isSavingPosition: boolean;
  shouldShake: boolean;
  shouldSparkle: boolean;
  shouldMiss: boolean;
  shakeTrigger: number;
  sparkleTrigger: number;
  missTrigger: number;
  shakeIntensity: number;
  sparkleIntensity: number;
  setShouldShake: (value: boolean) => void;
  setShouldSparkle: (value: boolean) => void;
  setShouldMiss: (value: boolean) => void;
  testShake: () => void;
  testSparkle: () => void;
  testMiss: () => void;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
  error: string | null;
  success: string | null;
}

function CharacterImageTab({
  characterName,
  characterType,
  imageData,
  setImageData,
  previewCharacter,
  handleMonsterCreated,
  allCreatedMonsters,
  isLoadingMonsters,
  handleSaveImagePosition,
  isSavingPosition,
  shouldShake,
  shouldSparkle,
  shouldMiss,
  shakeTrigger,
  sparkleTrigger,
  missTrigger,
  shakeIntensity,
  sparkleIntensity,
  setShouldShake,
  setShouldSparkle,
  setShouldMiss,
  testShake,
  testSparkle,
  testMiss,
  onBack,
  onSave,
  isSaving,
  error,
  success,
}: CharacterImageTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image Tools Section */}
      <div className="space-y-6">
        <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
            Character Image
          </h2>

          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-sm text-amber-200">
            <p className="mb-2">
              <strong className="text-amber-100">💡 Tip:</strong> Generate or upload a pixel art image for <strong>{characterName || 'your character'}</strong>.
            </p>
            <p className="text-xs">
              • Your character description has been pre-filled below<br/>
              • The Class/Type dropdown is optional - you can leave it blank or select a similar class for reference<br/>
              • The image will be automatically associated with "{characterName}" when you save<br/>
              • Creating a new image will replace any existing image for this character
            </p>
          </div>

          <MonsterCreator
            onMonsterCreated={handleMonsterCreated}
            initialKlass=""
            initialDescription={previewCharacter.description || `${characterName || 'A character'}`}
            initialRace={previewCharacter.race}
            initialSex={previewCharacter.sex}
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-4">
        {imageData.imageUrl ? (
          <ImagePositionEditor
            imageUrl={imageData.imageUrl}
            currentPosition={imageData.imagePosition}
            onPositionChange={(position) => setImageData(prev => ({ ...prev, imagePosition: position }))}
            onSave={handleSaveImagePosition}
            isSaving={isSavingPosition}
          >
            <CharacterCard
              playerClass={previewCharacter}
              characterName={characterName || 'Character'}
              monsterImageUrl={imageData.imageUrl}
              imagePosition={imageData.imagePosition}
              shouldShake={shouldShake}
              shouldSparkle={shouldSparkle}
              shouldMiss={shouldMiss}
              shakeTrigger={shakeTrigger}
              sparkleTrigger={sparkleTrigger}
              missTrigger={missTrigger}
              shakeIntensity={shakeIntensity}
              sparkleIntensity={sparkleIntensity}
              onShakeComplete={() => setShouldShake(false)}
              onSparkleComplete={() => setShouldSparkle(false)}
              onMissComplete={() => setShouldMiss(false)}
              testButtons={[
                {
                  label: 'Test Shake',
                  onClick: testShake,
                  className: 'px-2 py-0.5 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all'
                },
                {
                  label: 'Test Sparkle',
                  onClick: testSparkle,
                  className: 'px-2 py-0.5 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all'
                },
                {
                  label: 'Test Miss',
                  onClick: testMiss,
                  className: 'px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all'
                }
              ]}
            />
          </ImagePositionEditor>
        ) : (
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Preview
            </h2>
            <div className="flex justify-center">
              <CharacterCard
                playerClass={previewCharacter}
                characterName={characterName || 'Character'}
              />
            </div>
            <p className="text-amber-300 text-sm text-center mt-4">
              Generate or upload an image to see it on the card
            </p>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-600 text-red-100 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-900/50 border border-green-600 text-green-100 rounded text-sm">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-lg transition-all shadow-lg border-2 border-amber-600"
          >
            ← Back to Details
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg border-2 border-green-600"
          >
            {isSaving ? 'Saving...' : '💾 Save Character'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Ability Editor Component (reused from create-character)
interface AbilityEditorProps {
  ability: Ability;
  index: number;
  onUpdate: (index: number, ability: Ability) => void;
  onRemove: (index: number) => void;
}

function AbilityEditor({ ability, index, onUpdate, onRemove }: AbilityEditorProps) {
  const isAttack = ability.type === 'attack';
  const attackAbility = isAttack ? (ability as AttackAbility) : null;

  const handleChange = (field: string, value: any) => {
    if (isAttack && attackAbility) {
      onUpdate(index, {
        ...attackAbility,
        [field]: value,
      } as AttackAbility);
    } else {
      const healingAbility = ability as HealingAbility;
      onUpdate(index, {
        ...healingAbility,
        [field]: value,
      } as HealingAbility);
    }
  };

  return (
    <div className="border border-amber-700 rounded p-3 bg-amber-900/30">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-amber-200 uppercase">
          {isAttack ? '⚔️ Attack' : '💚 Healing'}
        </span>
        <button
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-300 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs text-amber-100 mb-1">Name</label>
          <input
            type="text"
            value={ability.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-amber-700 rounded bg-amber-900/50 text-amber-100"
          />
        </div>

        {isAttack && attackAbility ? (
          <>
            <div>
              <label className="block text-xs text-amber-100 mb-1">Damage Dice</label>
              <input
                type="text"
                value={attackAbility.damageDice}
                onChange={(e) => handleChange('damageDice', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                placeholder="e.g., 1d10, 3d6"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center text-xs text-amber-100">
                <input
                  type="checkbox"
                  checked={attackAbility.attackRoll}
                  onChange={(e) => handleChange('attackRoll', e.target.checked)}
                  className="mr-1"
                />
                Requires Attack Roll
              </label>
              <div>
                <label className="block text-xs text-amber-100 mb-1">Attacks</label>
                <input
                  type="number"
                  value={attackAbility.attacks || 1}
                  onChange={(e) => handleChange('attacks', parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-sm border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                  min="1"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs text-amber-100 mb-1">Healing Dice</label>
            <input
              type="text"
              value={(ability as HealingAbility).healingDice}
              onChange={(e) => handleChange('healingDice', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-amber-700 rounded bg-amber-900/50 text-amber-100"
              placeholder="e.g., 1d8+3, 2d4+2"
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-amber-100 mb-1">Description</label>
          <textarea
            value={ability.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-amber-700 rounded bg-amber-900/50 text-amber-100"
            rows={2}
            placeholder="Brief description of the ability"
          />
        </div>
      </div>
    </div>
  );
}

export default function UnifiedCharacterCreatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D1C9BA' }}>
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    }>
      <UnifiedCharacterCreatorContent />
    </Suspense>
  );
}

// Made with Bob
