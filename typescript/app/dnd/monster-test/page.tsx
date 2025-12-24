'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MonsterCreator from '../components/MonsterCreator';
import { CharacterCard } from '../components/CharacterCard';
import { Sparkles } from '../components/Sparkles';
import { applyAnimationClass } from '../utils/animations';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../constants';
import { DnDClass } from '../types';
import { getCharacterImageUrl } from '../components/utils/imageUtils';

interface CreatedMonster {
  monsterId: string;
  klass: string;
  prompt: string;
  createdAt: string;
  stats?: {
    hitPoints: number;
    maxHitPoints: number;
    armorClass: number;
    attackBonus: number;
    damageDie: string;
    description?: string;
  };
  imageUrl?: string;
}

export default function MonsterTestPage() {
  const router = useRouter();
  const [createdMonsters, setCreatedMonsters] = useState<CreatedMonster[]>([]);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);
  const [selectedKlass, setSelectedKlass] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combine all available classes and monsters for dropdown
  const allOptions = [
    ...FALLBACK_CLASSES.map(c => ({ name: c.name, type: 'class' as const })),
    ...FALLBACK_MONSTERS.map(m => ({ name: m.name, type: 'monster' as const }))
  ].sort((a, b) => a.name.localeCompare(b.name));
  
  // Card animation states (same as battle/test pages)
  const [shouldShake, setShouldShake] = useState(false);
  const [shouldSparkle, setShouldSparkle] = useState(false);
  const [shouldMiss, setShouldMiss] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [sparkleTrigger, setSparkleTrigger] = useState(0);
  const [missTrigger, setMissTrigger] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [sparkleIntensity, setSparkleIntensity] = useState(0);
  
  const animationRef = useRef<HTMLDivElement>(null);

  // Load existing monsters from API
  useEffect(() => {
    const loadMonsters = async () => {
      try {
        const response = await fetch('/api/monsters');
        if (response.ok) {
          const data = await response.json();
          const monsters: CreatedMonster[] = data.monsters.map((m: any) => ({
            monsterId: m.monsterId,
            klass: m.klass || 'Unknown',
            prompt: m.prompt || '',
            createdAt: m.createdAt || new Date().toISOString(),
            stats: m.stats,
            imageUrl: m.imageUrl,
          }));
          setCreatedMonsters(monsters);
          if (monsters.length > 0 && !selectedMonsterId) {
            setSelectedMonsterId(monsters[0].monsterId);
            setSelectedKlass(monsters[0].klass);
          }
        }
      } catch (e) {
        console.error('Failed to load monsters:', e);
      }
    };
    loadMonsters();
  }, []);

  // Update selectedKlass when monster selection changes
  useEffect(() => {
    if (selectedMonsterId) {
      const monster = createdMonsters.find(m => m.monsterId === selectedMonsterId);
      if (monster) {
        setSelectedKlass(monster.klass);
      }
    }
  }, [selectedMonsterId, createdMonsters]);

  const handleMonsterCreated = (monsterId: string, klass: string, imageUrl: string) => {
    const newMonster: CreatedMonster = {
      monsterId,
      klass: klass || 'Unknown',
      prompt: '',
      createdAt: new Date().toISOString(),
      imageUrl: getCharacterImageUrl(monsterId) || '',
    };
    const updated = [newMonster, ...createdMonsters];
    setCreatedMonsters(updated);
    setSelectedMonsterId(monsterId);
    setSelectedKlass(klass || 'Unknown');
  };

  const handleSaveAssociation = async () => {
    if (!selectedMonsterId || !selectedKlass) {
      setSaveError('Please select a class/monster type to associate');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/monsters', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monsterId: selectedMonsterId,
          klass: selectedKlass,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save association');
      }

      // Update local state
      setSaveSuccess(true);
      setCreatedMonsters(prev => prev.map(m => 
        m.monsterId === selectedMonsterId 
          ? { ...m, klass: selectedKlass }
          : m
      ));
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save association');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMonster = async (monsterId: string) => {
    try {
      const response = await fetch('/api/monsters', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monsterId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete monster');
      }

      const updated = createdMonsters.filter((m) => m.monsterId !== monsterId);
      setCreatedMonsters(updated);
      if (selectedMonsterId === monsterId) {
        setSelectedMonsterId(updated.length > 0 ? updated[0].monsterId : null);
        setSelectedKlass(updated.length > 0 ? updated[0].klass : '');
      }
    } catch (err) {
      console.error('Failed to delete monster:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete monster');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${createdMonsters.length} monsters? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/monsters', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete all monsters');
      }

      const data = await response.json();
      setCreatedMonsters([]);
      setSelectedMonsterId(null);
      setSelectedKlass('');
      alert(`Successfully deleted ${data.deletedCount} monster(s)`);
    } catch (err) {
      console.error('Failed to delete all monsters:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete all monsters');
    } finally {
      setIsLoading(false);
    }
  };

  // Create DnDClass object for the selected monster
  const selectedMonsterClass: DnDClass | null = selectedMonsterId ? (() => {
    const monster = createdMonsters.find(m => m.monsterId === selectedMonsterId);
    if (!monster) {
      // Return a default if monster not found
      return {
        name: 'Monster',
        hitPoints: 30,
        maxHitPoints: 30,
        armorClass: 14,
        attackBonus: 4,
        damageDie: 'd8',
        abilities: [],
        description: 'A monster created in the monster creator.',
        color: 'bg-slate-900',
      };
    }
    
    const klassToUse = selectedKlass || monster.klass || 'Monster';
    const fallbackClass = FALLBACK_CLASSES.find(c => c.name === klassToUse);
    const fallbackMonster = FALLBACK_MONSTERS.find(m => m.name === klassToUse);
    const fallback = fallbackClass || fallbackMonster;
    
    return {
      name: klassToUse,
      hitPoints: monster.stats?.hitPoints || fallback?.hitPoints || 30,
      maxHitPoints: monster.stats?.maxHitPoints || monster.stats?.hitPoints || fallback?.maxHitPoints || 30,
      armorClass: monster.stats?.armorClass || fallback?.armorClass || 14,
      attackBonus: monster.stats?.attackBonus || fallback?.attackBonus || 4,
      damageDie: monster.stats?.damageDie || fallback?.damageDie || 'd8',
      abilities: fallback?.abilities || [],
      description: monster.stats?.description || fallback?.description || `A ${klassToUse} created in the monster creator.`,
      color: fallback?.color || 'bg-slate-900',
    };
  })() : null;

  // Apply shake animation
  useEffect(() => {
    if (animationRef.current && shouldShake) {
      const intensity = shakeIntensity > 0 ? shakeIntensity : 1;
      const scale = 0.15 + (Math.sqrt(Math.min(intensity / 30, 1.0)) * 1.85); // Using 30 as default max HP
      animationRef.current.style.setProperty('--shake-intensity', scale.toString());
    }
    
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldShake,
      shakeTrigger,
      'shake',
      400,
      () => setShouldShake(false)
    );
    return cleanup;
  }, [shouldShake, shakeTrigger, shakeIntensity]);

  // Apply sparkle animation
  useEffect(() => {
    if (shouldSparkle && sparkleTrigger > 0) {
      const timer = setTimeout(() => {
        setShouldSparkle(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldSparkle, sparkleTrigger]);

  // Apply miss animation
  useEffect(() => {
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldMiss,
      missTrigger,
      'miss',
      600,
      () => setShouldMiss(false)
    );
    return cleanup;
  }, [shouldMiss, missTrigger]);

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

  const testApiDirectly = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Example: Create a monster with a test image URL
      // In a real scenario, you'd generate this with EverArt first
      const klass = 'TestMonster';
      const requestBody = {
        klass,
        prompt: 'A test monster for API testing',
        seed: Math.floor(Math.random() * 1000000),
        imageUrl: '', // Leave empty to test error handling, or provide a URL
        stats: {
          hitPoints: 25,
          maxHitPoints: 25,
          armorClass: 12,
          attackBonus: 3,
          damageDie: 'd6',
        },
      };

      const response = await fetch('/api/monsters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create monster');
      }

      const imageUrl = getCharacterImageUrl(data.monsterId) || '';
      handleMonsterCreated(data.monsterId, klass, imageUrl);
      alert(`Monster created successfully! ID: ${data.monsterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D1C9BA' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Home Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-semibold">Home</span>
          </button>

          {/* Center Title with Dragon Emblem */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              Monster
            </h1>
            {/* Red Dragon/Phoenix Emblem */}
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8 2 5 5 5 9c0 2 1 4 3 5-1 1-2 3-2 5 0 3 2 5 5 5 1 0 2 0 3-1 1 1 2 1 3 1 3 0 5-2 5-5 0-2-1-4-2-5 2-1 3-3 3-5 0-4-3-7-7-7z"
                fill="#DC2626"
              />
              <path
                d="M12 4c-2 0-4 1-4 3 0 1 1 2 2 2 1 0 2-1 2-2 0-1 1-1 2-1 1 0 2 0 2 1 0 1 1 2 2 2 1 0 2-1 2-2 0-2-2-3-4-3z"
                fill="#EF4444"
              />
              <path
                d="M10 8c-1 0-2 1-2 2 0 1 1 2 2 2 1 0 2-1 2-2 0-1-1-2-2-2zm4 0c-1 0-2 1-2 2 0 1 1 2 2 2 1 0 2-1 2-2 0-1-1-2-2-2z"
                fill="#991B1B"
              />
            </svg>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              Test
            </h1>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.push('/dnd')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-600 text-red-100 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Monster Creator */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-amber-100">Create New Monster</h2>
          <MonsterCreator onMonsterCreated={handleMonsterCreated} />
        </div>

        {/* Right Column: Preview & Controls */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-amber-100">Preview & Test</h2>

          {/* Monster Selection */}
          {createdMonsters.length > 0 ? (
            <div className="space-y-3 bg-amber-900/30 border border-amber-700 rounded p-4">
              <div>
                <label className="block text-sm font-medium text-amber-100 mb-2">
                  Select Monster
                </label>
                <select
                  value={selectedMonsterId || ''}
                  onChange={(e) => setSelectedMonsterId(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                >
                  {createdMonsters.map((monster) => (
                    <option key={monster.monsterId} value={monster.monsterId}>
                      {monster.klass} ({monster.monsterId.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Association Selection */}
              {selectedMonsterId && (
                <div className="space-y-3 pt-3 border-t border-amber-700">
                  <div>
                    <label className="block text-sm font-medium text-amber-100 mb-2">
                      Associate with Class/Monster Type
                    </label>
                    <select
                      value={selectedKlass}
                      onChange={(e) => setSelectedKlass(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                    >
                      <option value="">Select a class or monster...</option>
                      {allOptions.map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name} ({option.type === 'class' ? 'Class' : 'Monster'})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-amber-300 mt-1">
                      Choose which D&D class or monster type this created monster represents.
                    </p>
                  </div>

                  {saveError && (
                    <div className="p-2 bg-red-900/50 border border-red-600 text-red-100 rounded text-sm">
                      {saveError}
                    </div>
                  )}

                  <button
                    onClick={handleSaveAssociation}
                    disabled={isSaving || !selectedKlass}
                    className="w-full px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg border-2 border-green-600"
                  >
                    {isSaving ? '⏳ Saving...' : saveSuccess ? '✓ Association Saved!' : '💾 Save Association'}
                  </button>

                  {saveSuccess && (
                    <div className="p-3 bg-green-900/50 border border-green-600 text-green-100 rounded text-sm">
                      ✓ Monster successfully associated with <strong>{selectedKlass}</strong>! You can now use this monster in battles.
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  if (selectedMonsterId) {
                    handleDeleteMonster(selectedMonsterId);
                  }
                }}
                className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
              >
                Delete Selected Monster
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-900/30 border border-amber-700 rounded text-center text-amber-200">
              No monsters created yet. Create one to see the preview.
            </div>
          )}

          {/* Preview */}
          {selectedMonsterId && selectedMonsterClass ? (
            <div className="flex justify-center">
              <CharacterCard
                playerClass={selectedMonsterClass}
                characterName={selectedKlass || selectedMonsterClass.name || 'Monster'}
                monsterImageUrl={getCharacterImageUrl(selectedMonsterId)}
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
            </div>
          ) : selectedMonsterId ? (
            <div className="p-4 bg-amber-900/30 border border-amber-700 rounded text-center text-amber-200">
              Loading monster data...
            </div>
          ) : null}

          {/* Animation Controls - Show when monster is selected */}
          {selectedMonsterId && selectedMonsterClass && (
            <div className="border border-amber-700 rounded p-4 space-y-4 bg-amber-900/30">
              <h3 className="font-semibold text-amber-100">Animation Controls</h3>

              <div className="space-y-2">
                {/* Expression controls removed - not used in current implementation */}
              </div>

              {/* Card Animation Test Buttons */}
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs font-medium text-amber-200">Card Animations:</p>
                <div className="flex gap-2">
                  <button
                    onClick={testShake}
                    className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all"
                  >
                    Test Shake
                  </button>
                  <button
                    onClick={testSparkle}
                    className="px-3 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all"
                  >
                    Test Sparkle
                  </button>
                  <button
                    onClick={testMiss}
                    className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"
                  >
                    Test Miss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monster List */}
      {createdMonsters.length > 0 && (
        <div className="border border-amber-700 rounded p-4 bg-amber-900/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-amber-100">Created Monsters ({createdMonsters.length})</h2>
            <button
              onClick={handleDeleteAll}
              disabled={isLoading}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-red-600"
            >
              {isLoading ? 'Deleting...' : '🗑️ Delete All'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {createdMonsters.map((monster) => (
              <div
                key={monster.monsterId}
                className={`border rounded p-3 cursor-pointer transition-colors ${
                  selectedMonsterId === monster.monsterId
                    ? 'bg-amber-800/50 border-amber-500'
                    : 'bg-amber-900/30 border-amber-700 hover:bg-amber-800/40'
                }`}
                onClick={() => setSelectedMonsterId(monster.monsterId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-100">{monster.klass}</h3>
                    <p className="text-xs text-amber-200 mt-1">
                      ID: {monster.monsterId.slice(0, 12)}...
                    </p>
                    <p className="text-xs text-amber-300 mt-1">
                      {new Date(monster.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMonster(monster.monsterId);
                    }}
                    className="ml-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Testing Info */}
      <div className="border border-amber-700 rounded p-4 bg-amber-900/30">
        <h3 className="font-semibold mb-2 text-amber-100">API Testing Information</h3>
        <div className="text-sm space-y-2 text-amber-200">
          <p>
            <strong className="text-amber-100">Endpoint:</strong> <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">POST /api/monsters</code>
          </p>
          <p>
            <strong className="text-amber-100">Required Fields:</strong> <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">klass</code>,{' '}
            <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">prompt</code>
          </p>
          <p>
            <strong className="text-amber-100">Optional Fields:</strong> <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">seed</code>,{' '}
            <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">imageUrl</code>, <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">stats</code>
          </p>
          <p className="text-amber-200 mt-2">
            <strong className="text-amber-100">Note:</strong> If <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">imageUrl</code> is not provided, the API will attempt to generate an image.
            For best results, generate images using the EverArt API and provide the URL.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

