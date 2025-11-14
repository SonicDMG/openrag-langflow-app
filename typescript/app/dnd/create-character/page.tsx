'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DnDClass, Ability, AttackAbility, HealingAbility } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { generateCharacterStats } from '../services/characterGeneration';
import { CLASS_COLORS, MONSTER_COLORS } from '../constants';

type CharacterType = 'hero' | 'monster';

interface CharacterFormData {
  name: string;
  description: string;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  abilities: Ability[];
  color: string;
}

export default function CharacterCreatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const editType = searchParams.get('type') as CharacterType | null;

  const [characterType, setCharacterType] = useState<CharacterType>('hero');
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    description: '',
    hitPoints: 25,
    maxHitPoints: 25,
    armorClass: 14,
    attackBonus: 4,
    damageDie: 'd8',
    abilities: [],
    color: CLASS_COLORS['Fighter'] || 'bg-slate-900',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing character for editing
  useEffect(() => {
    const loadCharacter = async () => {
      if (!editId || !editType) return;

      setIsLoading(true);
      setError(null);

      try {
        const endpoint = editType === 'hero' ? '/api/heroes' : '/api/monsters-db';
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Failed to load characters');
        }

        const data = await response.json();
        const characters = editType === 'hero' ? data.heroes : data.monsters;
        const character = characters.find((c: DnDClass) => c.name === editId);

        if (character) {
          setCharacterType(editType);
          setFormData({
            name: character.name,
            description: character.description || '',
            hitPoints: character.hitPoints,
            maxHitPoints: character.maxHitPoints,
            armorClass: character.armorClass,
            attackBonus: character.attackBonus,
            damageDie: character.damageDie,
            abilities: character.abilities || [],
            color: character.color || (editType === 'hero' ? CLASS_COLORS['Fighter'] : MONSTER_COLORS['Goblin']) || 'bg-slate-900',
          });
        } else {
          setError(`Character "${editId}" not found`);
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
        formData.name || 'Character',
        formData.description,
        characterType
      );

      if (result.stats) {
        const stats = result.stats;
        setFormData(prev => ({
          ...prev,
          hitPoints: stats.hitPoints || prev.hitPoints,
          maxHitPoints: stats.maxHitPoints || stats.hitPoints || prev.hitPoints,
          armorClass: stats.armorClass || prev.armorClass,
          attackBonus: stats.attackBonus || prev.attackBonus,
          damageDie: stats.damageDie || prev.damageDie,
          description: stats.description || prev.description,
        }));
      }

      if (result.abilities && result.abilities.length > 0) {
        setFormData(prev => ({
          ...prev,
          abilities: result.abilities,
        }));
      }

      setSuccess('Stats and abilities generated successfully!');
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

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const character: DnDClass = {
        name: formData.name.trim(),
        hitPoints: formData.hitPoints,
        maxHitPoints: formData.maxHitPoints,
        armorClass: formData.armorClass,
        attackBonus: formData.attackBonus,
        damageDie: formData.damageDie,
        abilities: formData.abilities,
        description: formData.description || `A ${characterType === 'hero' ? 'hero' : 'monster'} named ${formData.name}.`,
        color: formData.color,
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

      setSuccess(`${characterType === 'hero' ? 'Hero' : 'Monster'} saved successfully!`);
      setTimeout(() => {
        setSuccess(null);
        router.push('/dnd');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save character');
    } finally {
      setIsSaving(false);
    }
  }, [formData, characterType, router]);

  const previewCharacter: DnDClass = {
    name: formData.name || 'Unnamed Character',
    hitPoints: formData.hitPoints,
    maxHitPoints: formData.maxHitPoints,
    armorClass: formData.armorClass,
    attackBonus: formData.attackBonus,
    damageDie: formData.damageDie,
    abilities: formData.abilities,
    description: formData.description,
    color: formData.color,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D1C9BA' }}>
        <div className="text-xl text-gray-700">Loading character...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D1C9BA' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dnd')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-semibold">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              {editId ? 'Edit' : 'Create'} Character
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dnd/character-image-creator')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all border-2 border-blue-600"
            >
              🎨 Create Image
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
                Character Details
              </h2>
              
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-sm text-amber-200">
                <p className="mb-2">
                  <strong className="text-amber-100">💡 Tip:</strong> This page creates characters with stats and abilities. 
                  To add a pixel art image to your character, use the <strong className="text-blue-300">🎨 Create Image</strong> button above after saving.
                </p>
              </div>

              {/* Character Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-100 mb-2">
                  Character Type
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
                  {isGenerating ? 'Generating...' : '🤖 Generate Stats from Description'}
                </button>
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
                      Max Hit Points
                    </label>
                    <input
                      type="number"
                      value={formData.maxHitPoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxHitPoints: parseInt(e.target.value) || 0 }))}
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
                  <div className="col-span-2">
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
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-amber-100 mb-1">
                      Card Color
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                      placeholder="e.g., bg-red-900, bg-blue-600"
                    />
                    <p className="text-xs text-amber-300 mt-1">
                      Tailwind CSS color class (e.g., bg-red-900, bg-blue-600)
                    </p>
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

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name.trim()}
                className="w-full px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg border-2 border-green-600"
              >
                {isSaving ? 'Saving...' : editId ? 'Update Character' : 'Save Character'}
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
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ability Editor Component
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
            {attackAbility.bonusDamageDice !== undefined && (
              <div>
                <label className="block text-xs text-amber-100 mb-1">Bonus Damage Dice (optional)</label>
                <input
                  type="text"
                  value={attackAbility.bonusDamageDice || ''}
                  onChange={(e) => handleChange('bonusDamageDice', e.target.value || undefined)}
                  className="w-full px-2 py-1 text-sm border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                  placeholder="e.g., 2d6"
                />
              </div>
            )}
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

