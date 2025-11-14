'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MonsterCreator from '../components/MonsterCreator';
import { CharacterCard } from '../components/CharacterCard';
import { DnDClass } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../constants';
import { SearchableSelect } from '../components/SearchableSelect';

interface CreatedMonsterData {
  monsterId: string;
  klass: string;
  prompt: string;
  stats: {
    hitPoints: number;
    maxHitPoints: number;
    armorClass: number;
    attackBonus: number;
    damageDie: string;
    description?: string;
  };
  imageUrl: string;
}

export default function MonsterCreatorPage() {
  const router = useRouter();
  const [createdMonsterData, setCreatedMonsterData] = useState<CreatedMonsterData | null>(null);
  const [selectedKlass, setSelectedKlass] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Card animation states
  const [shouldShake, setShouldShake] = useState(false);
  const [shouldSparkle, setShouldSparkle] = useState(false);
  const [shouldMiss, setShouldMiss] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [sparkleTrigger, setSparkleTrigger] = useState(0);
  const [missTrigger, setMissTrigger] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [sparkleIntensity, setSparkleIntensity] = useState(0);

  const [customHeroes, setCustomHeroes] = useState<DnDClass[]>([]);
  const [customMonsters, setCustomMonsters] = useState<DnDClass[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);

  // Load custom heroes and monsters from database
  useEffect(() => {
    const loadCustomCharacters = async () => {
      setIsLoadingCustom(true);
      try {
        // Load custom heroes
        const heroesResponse = await fetch('/api/heroes');
        if (heroesResponse.ok) {
          const heroesData = await heroesResponse.json();
          // Filter to only show custom heroes (those with searchContext 'Custom' or not from fallbacks)
          const custom = (heroesData.heroes || []).filter((h: DnDClass) => 
            !FALLBACK_CLASSES.some(fc => fc.name === h.name)
          );
          setCustomHeroes(custom);
        }

        // Load custom monsters
        const monstersResponse = await fetch('/api/monsters-db');
        if (monstersResponse.ok) {
          const monstersData = await monstersResponse.json();
          // Filter to only show custom monsters (those not from fallbacks)
          const custom = (monstersData.monsters || []).filter((m: DnDClass) => 
            !FALLBACK_MONSTERS.some(fm => fm.name === m.name)
          );
          setCustomMonsters(custom);
        }
      } catch (error) {
        console.error('Failed to load custom characters:', error);
      } finally {
        setIsLoadingCustom(false);
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

  // Load monster data when monsterId is set
  useEffect(() => {
    const loadMonsterData = async () => {
      if (createdMonsterData?.monsterId) {
        try {
          const response = await fetch('/api/monsters');
          if (response.ok) {
            const data = await response.json();
            const monster = data.monsters.find((m: any) => m.monsterId === createdMonsterData.monsterId);
            if (monster) {
              setCreatedMonsterData({
                ...createdMonsterData,
                klass: monster.klass,
                stats: monster.stats,
              });
              setSelectedKlass(monster.klass);
            }
          }
        } catch (error) {
          console.error('Failed to load monster data:', error);
        }
      }
    };
    loadMonsterData();
  }, [createdMonsterData?.monsterId]);

  // Create DnDClass object for the preview based on selected klass
  const previewMonsterClass: DnDClass | null = createdMonsterData ? (() => {
    // Check fallback classes first
    const fallbackClass = FALLBACK_CLASSES.find(c => c.name === selectedKlass || c.name === createdMonsterData.klass);
    const fallbackMonster = FALLBACK_MONSTERS.find(m => m.name === selectedKlass || m.name === createdMonsterData.klass);
    
    // Check custom heroes/monsters
    const customHero = customHeroes.find(h => h.name === selectedKlass || h.name === createdMonsterData.klass);
    const customMonster = customMonsters.find(m => m.name === selectedKlass || m.name === createdMonsterData.klass);
    
    // Prefer custom over fallback
    const character = customHero || customMonster || fallbackClass || fallbackMonster;
    
    return {
      name: selectedKlass || createdMonsterData.klass || 'Monster',
      hitPoints: createdMonsterData.stats.hitPoints,
      maxHitPoints: createdMonsterData.stats.maxHitPoints,
      armorClass: createdMonsterData.stats.armorClass,
      attackBonus: createdMonsterData.stats.attackBonus,
      damageDie: createdMonsterData.stats.damageDie,
      abilities: character?.abilities || [],
      description: createdMonsterData.stats.description || character?.description || `A ${selectedKlass || createdMonsterData.klass} created in the monster creator.`,
      color: character?.color || 'bg-slate-900',
    };
  })() : null;

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

  const handleMonsterCreated = useCallback((monsterId: string, klass: string, imageUrl: string) => {
    console.log('Monster created:', { monsterId, klass, imageUrl });
    setCreatedMonsterData({
      monsterId,
      klass,
      prompt: '',
      stats: {
        hitPoints: 30,
        maxHitPoints: 30,
        armorClass: 14,
        attackBonus: 4,
        damageDie: 'd8',
      },
      imageUrl: `/cdn/monsters/${monsterId}/280x200.png`, // Use the wider version for card display
    });
    setSelectedKlass(klass);
    setSaveSuccess(false);
    setSaveError(null);
  }, []);

  const handleSaveAssociation = async () => {
    if (!createdMonsterData || !selectedKlass) {
      setSaveError('Please select a class/monster type to associate');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Update the monster's klass association via API
      const response = await fetch('/api/monsters', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monsterId: createdMonsterData.monsterId,
          klass: selectedKlass,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save association');
      }

      // Update local state
      setSaveSuccess(true);
      setCreatedMonsterData({
        ...createdMonsterData,
        klass: selectedKlass,
      });
      
      // Show success message
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save association');
    } finally {
      setIsSaving(false);
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

          {/* Center Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              Character Image Creator
            </h1>
            {/* Image Icon */}
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="#DC2626" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="#EF4444" />
              <polyline points="21 15 16 10 5 21" stroke="#991B1B" strokeWidth="2" fill="none" />
            </svg>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dnd/create-character')}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold transition-all border-2 border-green-600"
            >
              ⚔️ Create Character
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <MonsterCreator onMonsterCreated={handleMonsterCreated} />
          </div>

          {createdMonsterData && previewMonsterClass ? (
            <div className="space-y-4">
              <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
                  Image Preview & Association
                  {saveSuccess && (
                    <span className="ml-2 text-sm text-green-400">✓ Saved!</span>
                  )}
                </h2>
                
                {/* Association Selection */}
                <div className="mb-4 space-y-3">
                  <div>
                    <SearchableSelect
                      options={allOptions}
                      value={selectedKlass}
                      onChange={setSelectedKlass}
                      placeholder={isLoadingCustom ? "Loading custom characters..." : "Select a class or monster..."}
                      disabled={isLoadingCustom}
                      label="Associate with Class/Monster Type"
                      helpText="Choose which D&D class or monster type this created monster represents. This determines its stats and abilities in battle."
                    />
                  </div>
                  
                  {saveError && (
                    <div className="p-3 bg-red-900/50 border border-red-600 text-red-100 rounded text-sm">
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

                {/* Character Card Preview */}
                <div className="flex justify-center">
                  <CharacterCard
                    playerClass={previewMonsterClass}
                    characterName={selectedKlass || createdMonsterData.klass || 'Monster'}
                    monsterImageUrl={createdMonsterData.imageUrl}
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
              </div>
            </div>
          ) : (
            <div className="bg-amber-900/30 border-2 border-amber-700 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-2 text-amber-100" style={{ fontFamily: 'serif' }}>
                Image Preview & Association
              </h2>
              <div className="space-y-3 text-amber-300 text-sm">
                <p>
                  <strong className="text-amber-100">Step 1:</strong> Generate or upload a pixel art image using the form on the left
                </p>
                <p>
                  <strong className="text-amber-100">Step 2:</strong> Once created, you'll see the preview here with:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>A searchable dropdown to select the class/monster type</li>
                  <li>A large <strong className="text-green-400">💾 Save Association</strong> button</li>
                  <li>The full character card preview</li>
                </ul>
                <p className="pt-2 border-t border-amber-700">
                  <strong className="text-amber-100">Tip:</strong> Need to create a new character with stats? Use the <strong className="text-green-400">⚔️ Create Character</strong> button above!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

