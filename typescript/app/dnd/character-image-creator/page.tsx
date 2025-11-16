'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MonsterCreator from '../components/MonsterCreator';
import { CharacterCard } from '../components/CharacterCard';
import { DnDClass } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../constants';
import { SearchableSelect } from '../components/SearchableSelect';
import { PageHeader } from '../components/PageHeader';
import { LandscapePrompt } from '../components/LandscapePrompt';

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
  hasCutout?: boolean; // Whether cutout images exist (false when skipCutout was true)
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
  const [allCreatedMonsters, setAllCreatedMonsters] = useState<Array<{ monsterId: string; klass: string; imageUrl: string; prompt?: string }>>([]);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);
  const [selectedMonsterForAssociation, setSelectedMonsterForAssociation] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // Load all created monsters
  const loadAllMonsters = useCallback(async () => {
    setIsLoadingMonsters(true);
    try {
      const response = await fetch('/api/monsters');
      if (response.ok) {
        const data = await response.json();
        const monsters = (data.monsters || []).map((m: any) => ({
          monsterId: m.monsterId,
          klass: m.klass || 'Unassociated',
          imageUrl: m.imageUrl || `/cdn/monsters/${m.monsterId}/280x200.png`,
          prompt: m.prompt,
        }));
        setAllCreatedMonsters(monsters);
      }
    } catch (error) {
      console.error('Failed to load created monsters:', error);
    } finally {
      setIsLoadingMonsters(false);
    }
  }, []);

  useEffect(() => {
    loadAllMonsters();
  }, [createdMonsterData?.monsterId, loadAllMonsters]); // Reload when a new monster is created

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
                hasCutout: monster.hasCutout,
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

  const handleMonsterCreated = useCallback(async (monsterId: string, klass: string, imageUrl: string) => {
    console.log('Monster created:', { monsterId, klass, imageUrl });
    
    // Fetch monster data including hasCutout from API
    try {
      const response = await fetch('/api/monsters');
      if (response.ok) {
        const data = await response.json();
        const monster = data.monsters.find((m: any) => m.monsterId === monsterId);
        if (monster) {
          setCreatedMonsterData({
            monsterId,
            klass: monster.klass || klass,
            prompt: monster.prompt || '',
            stats: monster.stats || {
              hitPoints: 30,
              maxHitPoints: 30,
              armorClass: 14,
              attackBonus: 4,
              damageDie: 'd8',
            },
            imageUrl: `/cdn/monsters/${monsterId}/280x200.png`, // Use the wider version for card display
            hasCutout: monster.hasCutout,
          });
          setSelectedKlass(monster.klass || klass);
        } else {
          // Fallback if monster not found in API
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
            imageUrl: `/cdn/monsters/${monsterId}/280x200.png`,
            hasCutout: undefined,
          });
          setSelectedKlass(klass);
        }
      }
    } catch (error) {
      console.error('Failed to load monster data after creation:', error);
      // Fallback on error
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
        imageUrl: `/cdn/monsters/${monsterId}/280x200.png`,
        hasCutout: undefined,
      });
      setSelectedKlass(klass);
    }
    
    setSaveSuccess(false);
    setSaveError(null);
  }, []);

  const handleSaveAssociation = async (monsterId?: string, klass?: string) => {
    const targetMonsterId = monsterId || createdMonsterData?.monsterId;
    const targetKlass = klass || selectedKlass;
    
    if (!targetMonsterId || !targetKlass) {
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
          monsterId: targetMonsterId,
          klass: targetKlass,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save association');
      }

      // Update local state
      setSaveSuccess(true);
      
      // Reload monsters from API to ensure we have the latest associations
      await loadAllMonsters();
      
      if (targetMonsterId === createdMonsterData?.monsterId) {
        // Update the current monster
        setCreatedMonsterData({
          ...createdMonsterData,
          klass: targetKlass,
        });
      }
      
      // Clear selection if it was from the list
      if (monsterId) {
        setSelectedMonsterForAssociation(null);
      }
      
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

  const handleDeleteMonster = async (monsterId: string) => {
    if (!confirm('Are you sure you want to delete this monster? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

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

      // Remove from list
      setAllCreatedMonsters(prev => prev.filter(m => m.monsterId !== monsterId));
      
      // If it was the currently created monster, clear it
      if (createdMonsterData?.monsterId === monsterId) {
        setCreatedMonsterData(null);
        setSelectedKlass('');
      }
      
      // Clear selection if it was selected for association
      if (selectedMonsterForAssociation === monsterId) {
        setSelectedMonsterForAssociation(null);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete monster');
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${allCreatedMonsters.length} monsters? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

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
      setAllCreatedMonsters([]);
      setCreatedMonsterData(null);
      setSelectedKlass('');
      setSelectedMonsterForAssociation(null);
      
      alert(`Successfully deleted ${data.deletedCount} monster(s)`);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete all monsters');
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D1C9BA' }}>
      {/* Landscape Orientation Prompt */}
      <LandscapePrompt />
      
      {/* Header */}
      <PageHeader
        title="Character"
        title2="Image Creator"
        decalImageUrl="/cdn/decals/character-image-creator.png"
      />
      
      <div className="container mx-auto p-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full">
            <MonsterCreator onMonsterCreated={handleMonsterCreated} />
          </div>

          {createdMonsterData && previewMonsterClass ? (
            <div className="space-y-4 w-full">
              <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl w-full">
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
                    onClick={() => handleSaveAssociation()}
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

                {/* Image Version Comparison */}
                {createdMonsterData.monsterId && (
                  <div className="mb-6 space-y-3">
                    <h3 className="text-lg font-semibold text-amber-100" style={{ fontFamily: 'serif' }}>
                      Image Versions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Background Only Version */}
                      <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber-200 mb-2">Background Only</h4>
                        <div 
                          className="rounded-lg overflow-hidden mx-auto flex items-center justify-center"
                          style={{ 
                            backgroundColor: '#E8E0D6',
                            border: '2px solid #D4C4B0',
                            width: '100%',
                            maxWidth: '280px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={createdMonsterData.monsterId ? `/cdn/monsters/${createdMonsterData.monsterId}/280x200-background.png` : createdMonsterData.imageUrl}
                            alt="Background only"
                            style={{
                              imageRendering: 'pixelated' as const,
                              maxWidth: '100%',
                              height: 'auto',
                              display: 'block',
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Fallback to placeholder if image fails to load (avoid infinite loop)
                              const placeholderUrl = '/cdn/placeholder.png';
                              if (!target.src.includes('placeholder.png')) {
                                console.warn('Background-only image not found, using placeholder');
                                target.onerror = null; // Prevent infinite loop
                                target.src = placeholderUrl;
                              }
                            }}
                          />
                        </div>
                        <p className="text-xs text-amber-300 mt-2 text-center">
                          New background scene (no character)
                        </p>
                      </div>

                      {/* Composite Version */}
                      <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber-200 mb-2">Composite Version</h4>
                        <div 
                          className="rounded-lg overflow-hidden mx-auto flex items-center justify-center"
                          style={{ 
                            backgroundColor: '#E8E0D6',
                            border: '2px solid #D4C4B0',
                            width: '100%',
                            maxWidth: '280px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={createdMonsterData.imageUrl}
                            alt="Composite version"
                            style={{
                              imageRendering: 'pixelated' as const,
                              maxWidth: '100%',
                              height: 'auto',
                              display: 'block',
                            }}
                          />
                        </div>
                        <p className="text-xs text-amber-300 mt-2 text-center">
                          Background with character composited on top
                        </p>
                      </div>

                      {/* Cut-out Version */}
                      <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber-200 mb-2">Cut-out Version</h4>
                        <div 
                          className="rounded-lg overflow-hidden mx-auto relative flex items-center justify-center"
                          style={{ 
                            backgroundColor: '#E8E0D6',
                            border: '2px solid #D4C4B0',
                            width: '100%',
                            maxWidth: '280px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            // Checkerboard pattern to show transparency
                            backgroundImage: `
                              linear-gradient(45deg, #ccc 25%, transparent 25%),
                              linear-gradient(-45deg, #ccc 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #ccc 75%),
                              linear-gradient(-45deg, transparent 75%, #ccc 75%)
                            `,
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                          }}
                        >
                          <img
                            src={`/cdn/monsters/${createdMonsterData.monsterId}/280x200-cutout.png`}
                            alt="Cut-out version"
                            className="character-cutout"
                            style={{
                              imageRendering: 'pixelated' as const,
                              maxWidth: '100%',
                              height: 'auto',
                              display: 'block',
                              position: 'relative',
                              zIndex: 1,
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Fallback to placeholder if image fails to load (avoid infinite loop)
                              const placeholderUrl = '/cdn/placeholder.png';
                              if (!target.src.includes('placeholder.png')) {
                                console.warn('Cut-out image not found, using placeholder:', `/cdn/monsters/${createdMonsterData.monsterId}/280x200-cutout.png`);
                                target.onerror = null; // Prevent infinite loop
                                target.src = placeholderUrl;
                              }
                            }}
                          />
                        </div>
                        <p className="text-xs text-amber-300 mt-2 text-center">
                          Character with transparent background (checkerboard shows transparency)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Character Card Preview */}
                <div className="flex justify-center">
                  <CharacterCard
                    playerClass={previewMonsterClass}
                    characterName={selectedKlass || createdMonsterData.klass || 'Monster'}
                    monsterImageUrl={createdMonsterData.imageUrl}
                    monsterCutOutImageUrl={createdMonsterData.hasCutout !== false && createdMonsterData.monsterId 
                      ? `/cdn/monsters/${createdMonsterData.monsterId}/280x200-cutout.png` 
                      : undefined}
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

        {/* All Created Monsters Section */}
        <div className="mt-8 w-full">
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-amber-100" style={{ fontFamily: 'serif' }}>
                All Generated Monsters
              </h2>
              {allCreatedMonsters.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-red-600"
                >
                  {isDeleting ? '⏳ Deleting...' : '🗑️ Delete All'}
                </button>
              )}
            </div>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-600 text-red-100 rounded text-sm">
                {deleteError}
              </div>
            )}
            
            {isLoadingMonsters ? (
              <div className="text-amber-200 text-center py-8">Loading monsters...</div>
            ) : allCreatedMonsters.length === 0 ? (
              <div className="text-amber-300 text-center py-8">
                No monsters created yet. Generate a monster using the form above!
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allCreatedMonsters.map((monster) => (
                    <div
                      key={monster.monsterId}
                      className={`bg-amber-800/50 border-2 rounded-lg p-4 transition-all relative ${
                        selectedMonsterForAssociation === monster.monsterId
                          ? 'border-green-500 shadow-lg'
                          : 'border-amber-700 hover:border-amber-600'
                      }`}
                    >
                      {/* Delete button (X) in top right corner */}
                      <button
                        onClick={() => handleDeleteMonster(monster.monsterId)}
                        disabled={isDeleting}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-700 hover:bg-red-600 text-white rounded-full text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
                        title="Delete this monster"
                      >
                        ×
                      </button>
                      
                      <div className="flex items-start gap-3">
                        <img
                          src={monster.imageUrl}
                          alt={monster.klass}
                          className="w-20 h-20 object-cover rounded border-2 border-amber-600"
                          style={{ imageRendering: 'pixelated' as const }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/cdn/placeholder.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-amber-100 mb-1 truncate">
                            {monster.klass}
                          </div>
                          <div className="text-xs text-amber-300 mb-2 truncate">
                            ID: {monster.monsterId.substring(0, 8)}...
                          </div>
                          
                          {selectedMonsterForAssociation === monster.monsterId ? (
                            <div className="space-y-2">
                              <SearchableSelect
                                options={allOptions}
                                value={selectedKlass}
                                onChange={setSelectedKlass}
                                placeholder="Select a class or monster..."
                                disabled={isLoadingCustom || isSaving}
                                label=""
                                helpText=""
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveAssociation(monster.monsterId, selectedKlass)}
                                  disabled={isSaving || !selectedKlass}
                                  className="flex-1 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMonsterForAssociation(null);
                                    setSelectedKlass(monster.klass);
                                  }}
                                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm font-semibold transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedMonsterForAssociation(monster.monsterId);
                                setSelectedKlass(monster.klass);
                              }}
                              className="w-full px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm font-semibold transition-all"
                            >
                              Associate with Class
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

