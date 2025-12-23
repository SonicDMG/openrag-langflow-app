'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MonsterCreator from '../components/MonsterCreator';
import { CharacterCard } from '../components/CharacterCard';
import { ImagePositionEditor } from '../components/ImagePositionEditor';
import { DnDClass, ImagePosition } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS } from '../constants';
import { SearchableSelect } from '../components/SearchableSelect';
import { PageHeader } from '../components/PageHeader';
import { LandscapePrompt } from '../components/LandscapePrompt';
import { loadHeroesFromDatabase, loadMonstersFromDatabase } from '../utils/dataLoader';

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
  imagePosition?: ImagePosition;
}

export default function MonsterCreatorPage() {
  const router = useRouter();
  const [createdMonsterData, setCreatedMonsterData] = useState<CreatedMonsterData | null>(null);
  const [selectedKlass, setSelectedKlass] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Image position state
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ offsetX: 50, offsetY: 50 });
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  
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
  // Store ALL heroes/monsters from database (including those that match fallback names)
  const [allDatabaseHeroes, setAllDatabaseHeroes] = useState<DnDClass[]>([]);
  const [allDatabaseMonsters, setAllDatabaseMonsters] = useState<DnDClass[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);
  const [allCreatedMonsters, setAllCreatedMonsters] = useState<Array<{ monsterId: string; klass: string; imageUrl: string; prompt?: string; createdAt?: string; imagePosition?: ImagePosition }>>([]);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);
  const [selectedMonsterForAssociation, setSelectedMonsterForAssociation] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load custom heroes and monsters from database (with localStorage fallback)
  const loadCustomCharacters = useCallback(async () => {
    setIsLoadingCustom(true);
    try {
      // Load ALL heroes from database (with localStorage fallback)
      const allHeroes = await loadHeroesFromDatabase();
      // Store all heroes for description lookup
      setAllDatabaseHeroes(allHeroes);
      // Store only truly custom heroes (not in fallbacks) for dropdown
      const custom = allHeroes.filter((h: DnDClass) => 
        !FALLBACK_CLASSES.some(fc => fc.name === h.name)
      );
      setCustomHeroes(custom);

      // Load ALL monsters from database (with localStorage fallback)
      const allMonsters = await loadMonstersFromDatabase();
      // Store all monsters for description lookup
      setAllDatabaseMonsters(allMonsters);
      // Store only truly custom monsters (not in fallbacks) for dropdown
      const customMonsters = allMonsters.filter((m: DnDClass) => 
        !FALLBACK_MONSTERS.some(fm => fm.name === m.name)
      );
      setCustomMonsters(customMonsters);
    } catch (error) {
      console.error('Failed to load custom characters:', error);
    } finally {
      setIsLoadingCustom(false);
    }
  }, []);

  // Load custom heroes and monsters on mount
  useEffect(() => {
    loadCustomCharacters();
  }, [loadCustomCharacters]);

  // Reload heroes/monsters when selectedKlass changes (to get latest descriptions)
  // Always reload when selectedKlass changes to ensure we have the latest data from database
  useEffect(() => {
    if (selectedKlass) {
      // Reload to get latest data for the selected class (including updated fallback classes)
      loadCustomCharacters();
    }
  }, [selectedKlass, loadCustomCharacters]);

  // Reload custom heroes/monsters when window regains focus (in case user updated class in another tab)
  useEffect(() => {
    const handleFocus = () => {
      loadCustomCharacters();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadCustomCharacters]);

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
          createdAt: m.createdAt,
          lastAssociatedAt: m.lastAssociatedAt, // Include lastAssociatedAt for proper sorting
          imagePosition: m.imagePosition || { offsetX: 50, offsetY: 50 }, // Include image position
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
    const klassName = selectedKlass || createdMonsterData.klass;
    
    // Check database first (includes updated versions of fallback classes)
    const databaseHero = allDatabaseHeroes.find(h => h.name === klassName);
    const databaseMonster = allDatabaseMonsters.find(m => m.name === klassName);
    
    // Check fallback classes/monsters
    const fallbackClass = FALLBACK_CLASSES.find(c => c.name === klassName);
    const fallbackMonster = FALLBACK_MONSTERS.find(m => m.name === klassName);
    
    // Prefer database over fallback
    const character = databaseHero || databaseMonster || fallbackClass || fallbackMonster;
    
    return {
      name: klassName || 'Monster',
      hitPoints: createdMonsterData.stats.hitPoints,
      maxHitPoints: createdMonsterData.stats.maxHitPoints,
      armorClass: createdMonsterData.stats.armorClass,
      attackBonus: createdMonsterData.stats.attackBonus,
      damageDie: createdMonsterData.stats.damageDie,
      abilities: character?.abilities || [],
      // Prefer database description over fallback, but use stats.description if it exists
      description: createdMonsterData.stats.description || character?.description || `A ${klassName} created in the monster creator.`,
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
    
    // Fetch monster data from API
    try {
      const response = await fetch('/api/monsters');
      if (response.ok) {
        const data = await response.json();
        const monster = data.monsters.find((m: any) => m.monsterId === monsterId);
        if (monster) {
          const monsterData = {
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
            imagePosition: monster.imagePosition || { offsetX: 50, offsetY: 50 },
          };
          setCreatedMonsterData(monsterData);
          setImagePosition(monsterData.imagePosition);
          setSelectedKlass(monster.klass || klass);
        } else {
          // Fallback if monster not found in API
          const fallbackData = {
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
            imagePosition: { offsetX: 50, offsetY: 50 },
          };
          setCreatedMonsterData(fallbackData);
          setImagePosition(fallbackData.imagePosition);
          setSelectedKlass(klass);
        }
      }
    } catch (error) {
      console.error('Failed to load monster data after creation:', error);
      // Fallback on error
      const fallbackData = {
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
        imagePosition: { offsetX: 50, offsetY: 50 },
      };
      setCreatedMonsterData(fallbackData);
      setImagePosition(fallbackData.imagePosition);
      setSelectedKlass(klass);
    }
    
    setSaveSuccess(false);
    setSaveError(null);
  }, []);

  const handleSaveImagePosition = async () => {
    if (!createdMonsterData?.monsterId) {
      setSaveError('No monster selected');
      return;
    }

    setIsSavingPosition(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/monsters', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monsterId: createdMonsterData.monsterId,
          klass: selectedKlass || createdMonsterData.klass,
          imagePosition,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save image position');
      }

      // Update local state
      if (createdMonsterData) {
        setCreatedMonsterData({
          ...createdMonsterData,
          imagePosition,
        });
      }

      // Reload monsters to get updated data
      await loadAllMonsters();

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save image position');
    } finally {
      setIsSavingPosition(false);
    }
  };

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
          imagePosition, // Also save current image position
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
          imagePosition,
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

  const handleDeleteAllInGroup = async (klass: string) => {
    const groupMonsters = allCreatedMonsters.filter(m => (m.klass || 'Unassociated') === klass);
    if (!confirm(`Are you sure you want to delete ALL ${groupMonsters.length} ${klass} monster(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Delete each monster in the group
      const deletePromises = groupMonsters.map(monster =>
        fetch('/api/monsters', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ monsterId: monster.monsterId }),
        })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} monster(s)`);
      }

      // Remove from list
      setAllCreatedMonsters(prev => prev.filter(m => (m.klass || 'Unassociated') !== klass));
      
      // If any deleted monster was the currently created monster, clear it
      if (createdMonsterData && groupMonsters.some(m => m.monsterId === createdMonsterData.monsterId)) {
        setCreatedMonsterData(null);
        setSelectedKlass('');
      }
      
      // Clear selection if it was selected for association
      if (selectedMonsterForAssociation && groupMonsters.some(m => m.monsterId === selectedMonsterForAssociation)) {
        setSelectedMonsterForAssociation(null);
      }
      
      alert(`Successfully deleted ${groupMonsters.length} ${klass} monster(s)`);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete monsters');
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllButLastInGroup = async (klass: string) => {
    const groupMonsters = allCreatedMonsters.filter(m => (m.klass || 'Unassociated') === klass);
    
    if (groupMonsters.length <= 1) {
      alert(`There is only 1 ${klass} monster. Nothing to delete.`);
      return;
    }

    // Sort by createdAt (newest first), keep the first one (most recent)
    const sorted = [...groupMonsters].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // Newest first
    });
    
    const toKeep = sorted[0]; // Most recent
    const toDelete = sorted.slice(1); // All others

    if (!confirm(`Are you sure you want to delete ${toDelete.length} ${klass} monster(s), keeping only the most recent one? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Delete all except the most recent
      const deletePromises = toDelete.map(monster =>
        fetch('/api/monsters', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ monsterId: monster.monsterId }),
        })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} monster(s)`);
      }

      // Remove deleted monsters from list
      const toDeleteIds = new Set(toDelete.map(m => m.monsterId));
      setAllCreatedMonsters(prev => prev.filter(m => !toDeleteIds.has(m.monsterId)));
      
      // If any deleted monster was the currently created monster, clear it
      if (createdMonsterData && toDeleteIds.has(createdMonsterData.monsterId)) {
        setCreatedMonsterData(null);
        setSelectedKlass('');
      }
      
      // Clear selection if it was selected for association
      if (selectedMonsterForAssociation && toDeleteIds.has(selectedMonsterForAssociation)) {
        setSelectedMonsterForAssociation(null);
      }
      
      alert(`Successfully deleted ${toDelete.length} ${klass} monster(s), kept the most recent one.`);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete monsters');
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
        title="Image"
        title2="Creator"
        decalImageUrl="/cdn/decals/character-image-creator.png"
      />
      
      <div className="container mx-auto p-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full">
            <MonsterCreator onMonsterCreated={handleMonsterCreated} />
          </div>

          {createdMonsterData && previewMonsterClass ? (
            <div className="space-y-4 w-full">
              {/* Association Selection */}
              <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl w-full">
                <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
                  Class/Monster Association
                  {saveSuccess && (
                    <span className="ml-2 text-sm text-green-400">✓ Saved!</span>
                  )}
                </h2>
                
                <div className="space-y-3">
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
              </div>

              {/* Image Position Editor with Card Preview */}
              <ImagePositionEditor
                imageUrl={createdMonsterData.imageUrl}
                currentPosition={imagePosition}
                onPositionChange={setImagePosition}
                onSave={handleSaveImagePosition}
                isSaving={isSavingPosition}
              >
                <CharacterCard
                  playerClass={previewMonsterClass}
                  characterName={selectedKlass || createdMonsterData.klass || 'Monster'}
                  monsterImageUrl={createdMonsterData.imageUrl}
                  imagePosition={imagePosition}
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
            ) : (() => {
              // Group monsters by klass
              const groupedMonsters = allCreatedMonsters.reduce((acc, monster) => {
                const klass = monster.klass || 'Unassociated';
                if (!acc[klass]) {
                  acc[klass] = [];
                }
                acc[klass].push(monster);
                return acc;
              }, {} as Record<string, typeof allCreatedMonsters>);

              // Sort klass names (Unassociated at the end)
              const sortedKlasses = Object.keys(groupedMonsters).sort((a, b) => {
                if (a === 'Unassociated') return 1;
                if (b === 'Unassociated') return -1;
                return a.localeCompare(b);
              });

              return (
                <div className="space-y-6">
                  {sortedKlasses.map((klass) => {
                    const monsters = groupedMonsters[klass];
                    return (
                      <div key={klass} className="space-y-3">
                        {/* Section Header */}
                        <div className="flex items-center justify-between pb-2 border-b-2 border-amber-700">
                          <h3 className="text-xl font-bold text-amber-100" style={{ fontFamily: 'serif' }}>
                            {klass}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-amber-300">
                              {monsters.length} {monsters.length === 1 ? 'image' : 'images'}
                            </span>
                            {monsters.length > 0 && (
                              <>
                                <button
                                  onClick={() => handleDeleteAllButLastInGroup(klass)}
                                  disabled={isDeleting || monsters.length <= 1}
                                  className="px-3 py-1.5 bg-orange-700 hover:bg-orange-600 text-white rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-orange-600"
                                  title={monsters.length <= 1 ? 'Need at least 2 images to delete all but last' : 'Delete all but the most recent image'}
                                >
                                  Delete All But Last
                                </button>
                                <button
                                  onClick={() => handleDeleteAllInGroup(klass)}
                                  disabled={isDeleting}
                                  className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-red-600"
                                  title="Delete all images in this group"
                                >
                                  Delete All
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Monsters Grid for this klass */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {monsters.map((monster) => (
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
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

