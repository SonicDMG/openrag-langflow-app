'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DnDClass, Ability } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, CLASS_COLORS, FALLBACK_ABILITIES, MONSTER_COLORS, FALLBACK_MONSTER_ABILITIES } from '../constants';
import { fetchAvailableClasses, fetchClassStats, extractAbilities, fetchAvailableMonsters, fetchMonsterStats, extractMonsterAbilities } from '../services/apiService';

type LogEntry = {
  id: string;
  timestamp: Date;
  type: 'system' | 'item' | 'error' | 'success';
  message: string;
  itemName?: string;
  status?: 'loading' | 'success' | 'failed' | 'skipped';
};

export default function LoadDataPage() {
  const router = useRouter();
  const [classSearchContext, setClassSearchContext] = useState<string>('D&D');
  const [monsterSearchContext, setMonsterSearchContext] = useState<string>('D&D');
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const processedItemsRef = useRef<DnDClass[]>([]);

  // Auto-scroll to bottom of log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logEntries]);

  // Warn user if they try to navigate away during an operation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoadingClasses || isLoadingMonsters) {
        e.preventDefault();
        e.returnValue = 'A data loading operation is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoadingClasses, isLoadingMonsters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Save any processed items before unmounting (both classes and monsters use same ref)
      if (processedItemsRef.current.length > 0) {
        try {
          // Try to determine if these are classes or monsters by checking if loading state
          // Since we can't know for sure, save to both (they'll be merged properly on next load)
          const existingClasses = JSON.parse(localStorage.getItem('dnd_loaded_classes') || '[]');
          const existingMonsters = JSON.parse(localStorage.getItem('dnd_loaded_monsters') || '[]');
          const mergedClasses = new Map<string, DnDClass>();
          const mergedMonsters = new Map<string, DnDClass>();
          existingClasses.forEach((c: DnDClass) => mergedClasses.set(c.name, c));
          existingMonsters.forEach((m: DnDClass) => mergedMonsters.set(m.name, m));
          processedItemsRef.current.forEach(item => {
            mergedClasses.set(item.name, item);
            mergedMonsters.set(item.name, item);
          });
          localStorage.setItem('dnd_loaded_classes', JSON.stringify(Array.from(mergedClasses.values())));
          localStorage.setItem('dnd_loaded_monsters', JSON.stringify(Array.from(mergedMonsters.values())));
          console.log(`Saved ${processedItemsRef.current.length} items to localStorage before unmount`);
        } catch (error) {
          console.error('Failed to save items before unmount:', error);
        }
      }
    };
  }, []);

  const addLog = (type: LogEntry['type'], message: string, itemName?: string, status?: LogEntry['status']) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type,
      message,
      itemName,
      status,
    };
    setLogEntries(prev => [...prev, entry]);
  };

  const updateLogEntry = (itemName: string, status: LogEntry['status'], message?: string) => {
    setLogEntries(prev => prev.map(entry => 
      entry.itemName === itemName 
        ? { ...entry, status, message: message || entry.message }
        : entry
    ));
  };

  const loadClassesFromOpenRAG = async () => {
    setIsLoadingClasses(true);
    setLogEntries([]);
    processedItemsRef.current = [];
    abortControllerRef.current = new AbortController();
    addLog('system', `🚀 Starting to load classes from OpenRAG (context: ${classSearchContext || 'default'})...`);
    
    try {
      const { classNames } = await fetchAvailableClasses(
        (type, msg) => addLog(type === 'system' ? 'system' : 'system', msg),
        classSearchContext || undefined
      );
      
      if (classNames.length === 0) {
        const contextMsg = classSearchContext ? ` for "${classSearchContext}"` : '';
        addLog('error', `⚠️ No classes found${contextMsg}. This might mean the knowledge base doesn't contain data for this context. Try a different search context (e.g., "D&D", "Pokemon") or leave it blank for default D&D classes.`);
        setIsLoadingClasses(false);
        return;
      }

      addLog('system', `✅ Found ${classNames.length} classes: ${classNames.join(', ')}`);
      addLog('system', `📋 Fetching stats and abilities for ${classNames.length} classes...`);

      const fallbackClassMap = new Map(FALLBACK_CLASSES.map(c => [c.name, c]));
      const loadedClasses: DnDClass[] = [];
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      // Process classes one by one to show live updates
      for (const className of classNames) {
        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          addLog('system', '⚠️ Operation cancelled');
          break;
        }

        addLog('item', `Loading ${className}...`, className, 'loading');
        
        try {
          const fallback = fallbackClassMap.get(className);
          
          // Fetch abilities
          let abilities: Ability[] = [];
          try {
            abilities = await extractAbilities(className, classSearchContext || undefined);
            if (abilities.length > 0) {
              updateLogEntry(className, 'loading', `Loading ${className}... (abilities loaded)`);
            }
          } catch (error) {
            console.warn(`Failed to load abilities for ${className}:`, error);
            abilities = fallback?.abilities || FALLBACK_ABILITIES[className] || [];
          }
          
          if (fallback) {
            // Update existing class with new abilities
            const updatedClass: DnDClass = {
              ...fallback,
              abilities: abilities.length > 0 ? abilities : fallback.abilities,
            };
            loadedClasses.push(updatedClass);
            processedItemsRef.current.push(updatedClass); // Track for incremental save
            updateLogEntry(className, 'success', `✅ ${className} - Updated with ${abilities.length} abilities`);
            successCount++;
          } else {
            // Fetch stats for new class
            const { stats } = await fetchClassStats(
              className,
              (type, msg) => addLog('system', msg),
              classSearchContext || undefined
            );
            
            if (stats) {
              const newClass: DnDClass = {
                name: className,
                hitPoints: stats.hitPoints || 25,
                maxHitPoints: stats.maxHitPoints || stats.hitPoints || 25,
                armorClass: stats.armorClass || 14,
                attackBonus: stats.attackBonus || 4,
                damageDie: stats.damageDie || 'd8',
                abilities: abilities,
                description: stats.description || `A ${className} character.`,
                color: CLASS_COLORS[className] || 'bg-slate-900',
              };
              loadedClasses.push(newClass);
              processedItemsRef.current.push(newClass); // Track for incremental save
              updateLogEntry(className, 'success', `✅ ${className} - Loaded (HP: ${stats.hitPoints}, AC: ${stats.armorClass}, ${abilities.length} abilities)`);
              successCount++;
            } else {
              updateLogEntry(className, 'failed', `❌ ${className} - Stats not found`);
              failedCount++;
            }
          }
        } catch (error) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          updateLogEntry(className, 'failed', `❌ ${className} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failedCount++;
        }
      }

      // Merge with fallback classes and store in localStorage
      const allClasses = new Map<string, DnDClass>();
      FALLBACK_CLASSES.forEach(c => allClasses.set(c.name, c));
      loadedClasses.forEach(c => allClasses.set(c.name, c));
      const finalClasses = Array.from(allClasses.values());

      // Store in localStorage
      try {
        localStorage.setItem('dnd_loaded_classes', JSON.stringify(finalClasses));
        addLog('system', `💾 Saved ${finalClasses.length} classes to localStorage`);
      } catch (error) {
        console.error('Failed to save classes to localStorage:', error);
        addLog('error', `⚠️ Failed to save classes to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Store in Astra DB
      try {
        addLog('system', `💾 Saving ${finalClasses.length} classes to Astra DB...`);
        const response = await fetch('/api/heroes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            heroes: finalClasses,
            searchContext: classSearchContext || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save to Astra DB');
        }

        addLog('system', `✅ Successfully saved ${finalClasses.length} classes to Astra DB`);
      } catch (error) {
        console.error('Failed to save classes to Astra DB:', error);
        addLog('error', `⚠️ Failed to save classes to Astra DB: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      addLog('system', `✅ Completed: ${successCount} successful, ${failedCount} failed, ${skippedCount} skipped`);
    } catch (error) {
      addLog('error', `❌ Error loading classes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const loadMonstersFromOpenRAG = async () => {
    setIsLoadingMonsters(true);
    setLogEntries([]);
    processedItemsRef.current = [];
    abortControllerRef.current = new AbortController();
    addLog('system', `🚀 Starting to load monsters from OpenRAG (context: ${monsterSearchContext || 'default'})...`);
    
    try {
      const { monsterNames } = await fetchAvailableMonsters(
        (type, msg) => addLog(type === 'system' ? 'system' : 'system', msg),
        monsterSearchContext || undefined
      );
      
      if (monsterNames.length === 0) {
        const contextMsg = monsterSearchContext ? ` for "${monsterSearchContext}"` : '';
        addLog('error', `⚠️ No monsters found${contextMsg}. This might mean the knowledge base doesn't contain data for this context. Try a different search context (e.g., "D&D", "Pokemon") or leave it blank for default D&D monsters.`);
        setIsLoadingMonsters(false);
        return;
      }

      addLog('system', `✅ Found ${monsterNames.length} monsters: ${monsterNames.join(', ')}`);
      addLog('system', `📋 Fetching stats and abilities for ${monsterNames.length} monsters...`);

      const fallbackMonsterMap = new Map(FALLBACK_MONSTERS.map(m => [m.name, m]));
      const loadedMonsters: DnDClass[] = [];
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      // Process monsters one by one to show live updates
      for (const monsterName of monsterNames) {
        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          addLog('system', '⚠️ Operation cancelled');
          break;
        }

        addLog('item', `Loading ${monsterName}...`, monsterName, 'loading');
        
        try {
          const fallback = fallbackMonsterMap.get(monsterName);
          
          // Fetch abilities
          let abilities: Ability[] = [];
          try {
            abilities = await extractMonsterAbilities(monsterName, monsterSearchContext || undefined);
            if (abilities.length > 0) {
              updateLogEntry(monsterName, 'loading', `Loading ${monsterName}... (abilities loaded)`);
            }
          } catch (error) {
            console.warn(`Failed to load abilities for ${monsterName}:`, error);
            abilities = fallback?.abilities || FALLBACK_MONSTER_ABILITIES[monsterName] || [];
          }
          
          if (fallback) {
            // Update existing monster with new abilities
            const updatedMonster: DnDClass = {
              ...fallback,
              abilities: abilities.length > 0 ? abilities : fallback.abilities,
            };
              loadedMonsters.push(updatedMonster);
              processedItemsRef.current.push(updatedMonster); // Track for incremental save
              updateLogEntry(monsterName, 'success', `✅ ${monsterName} - Updated with ${abilities.length} abilities`);
              successCount++;
          } else {
            // Fetch stats for new monster
            const { stats } = await fetchMonsterStats(
              monsterName,
              (type, msg) => addLog('system', msg),
              monsterSearchContext || undefined
            );
            
            if (stats) {
              const newMonster: DnDClass = {
                name: monsterName,
                hitPoints: stats.hitPoints || 30,
                maxHitPoints: stats.maxHitPoints || stats.hitPoints || 30,
                armorClass: stats.armorClass || 14,
                attackBonus: stats.attackBonus || 4,
                damageDie: stats.damageDie || 'd8',
                abilities: abilities,
                description: stats.description || `A ${monsterName} monster.`,
                color: MONSTER_COLORS[monsterName] || 'bg-slate-900',
              };
              loadedMonsters.push(newMonster);
              processedItemsRef.current.push(newMonster); // Track for incremental save
              updateLogEntry(monsterName, 'success', `✅ ${monsterName} - Loaded (HP: ${stats.hitPoints}, AC: ${stats.armorClass}, ${abilities.length} abilities)`);
              successCount++;
            } else {
              updateLogEntry(monsterName, 'failed', `❌ ${monsterName} - Stats not found`);
              failedCount++;
            }
          }
        } catch (error) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          updateLogEntry(monsterName, 'failed', `❌ ${monsterName} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failedCount++;
        }
      }

      // Merge with fallback monsters and store in localStorage
      const allMonsters = new Map<string, DnDClass>();
      FALLBACK_MONSTERS.forEach(m => allMonsters.set(m.name, m));
      loadedMonsters.forEach(m => allMonsters.set(m.name, m));
      const finalMonsters = Array.from(allMonsters.values());

      // Store in localStorage
      try {
        localStorage.setItem('dnd_loaded_monsters', JSON.stringify(finalMonsters));
        addLog('system', `💾 Saved ${finalMonsters.length} monsters to localStorage`);
      } catch (error) {
        console.error('Failed to save monsters to localStorage:', error);
        addLog('error', `⚠️ Failed to save monsters to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Store in Astra DB
      try {
        addLog('system', `💾 Saving ${finalMonsters.length} monsters to Astra DB...`);
        const response = await fetch('/api/monsters-db', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            monsters: finalMonsters,
            searchContext: monsterSearchContext || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save to Astra DB');
        }

        addLog('system', `✅ Successfully saved ${finalMonsters.length} monsters to Astra DB`);
      } catch (error) {
        console.error('Failed to save monsters to Astra DB:', error);
        addLog('error', `⚠️ Failed to save monsters to Astra DB: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      addLog('system', `✅ Completed: ${successCount} successful, ${failedCount} failed, ${skippedCount} skipped`);
    } catch (error) {
      addLog('error', `❌ Error loading monsters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingMonsters(false);
    }
  };

  const clearLog = () => {
    setLogEntries([]);
  };

  const saveFallbackDataToAstra = async () => {
    setLogEntries([]);
    addLog('system', '🚀 Saving fallback classes and monsters to Astra DB...');
    
    try {
      // Save fallback classes
      addLog('system', `💾 Saving ${FALLBACK_CLASSES.length} fallback classes to Astra DB...`);
      const classesResponse = await fetch('/api/heroes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroes: FALLBACK_CLASSES,
          searchContext: 'fallback',
        }),
      });

      if (!classesResponse.ok) {
        const errorData = await classesResponse.json();
        throw new Error(`Failed to save classes: ${errorData.error || 'Unknown error'}`);
      }

      addLog('success', `✅ Successfully saved ${FALLBACK_CLASSES.length} fallback classes to Astra DB`);

      // Save fallback monsters
      addLog('system', `💾 Saving ${FALLBACK_MONSTERS.length} fallback monsters to Astra DB...`);
      const monstersResponse = await fetch('/api/monsters-db', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monsters: FALLBACK_MONSTERS,
          searchContext: 'fallback',
        }),
      });

      if (!monstersResponse.ok) {
        const errorData = await monstersResponse.json();
        throw new Error(`Failed to save monsters: ${errorData.error || 'Unknown error'}`);
      }

      addLog('success', `✅ Successfully saved ${FALLBACK_MONSTERS.length} fallback monsters to Astra DB`);
      addLog('system', `✅ Completed! Saved ${FALLBACK_CLASSES.length} classes and ${FALLBACK_MONSTERS.length} monsters to Astra DB`);
    } catch (error) {
      addLog('error', `❌ Error saving fallback data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status?: LogEntry['status']) => {
    switch (status) {
      case 'loading':
        return '⏳';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'skipped':
        return '⏭️';
      default:
        return '';
    }
  };

  const getStatusColor = (type: LogEntry['type'], status?: LogEntry['status']) => {
    if (status === 'success') return 'text-green-400';
    if (status === 'failed') return 'text-red-400';
    if (status === 'loading') return 'text-yellow-400';
    if (status === 'skipped') return 'text-gray-400';
    if (type === 'error') return 'text-red-400';
    if (type === 'success') return 'text-green-400';
    return 'text-amber-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded-lg border-2 border-amber-700 transition-all"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-amber-100 mb-2">Load Data from OpenRAG</h1>
          <p className="text-amber-300">Import heroes and monsters from your OpenRAG knowledge base</p>
          <div className="mt-4">
            <button
              onClick={saveFallbackDataToAstra}
              className="px-4 py-2 bg-green-900 hover:bg-green-800 text-white font-semibold rounded-lg border-2 border-green-700 transition-all"
            >
              💾 Save Fallback Data to Astra DB
            </button>
            <p className="text-xs text-amber-400 mt-2">
              Save the default fallback classes and monsters to Astra DB (useful for initial setup)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Classes Section */}
          <div className="bg-amber-900/50 border-2 border-amber-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-amber-100 mb-4">Load Classes/Heroes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-200 mb-2">
                  Search Context
                </label>
                <input
                  type="text"
                  value={classSearchContext}
                  onChange={(e) => setClassSearchContext(e.target.value)}
                  placeholder="e.g., D&D, Pokemon"
                  className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
                />
                <p className="text-xs text-amber-400 mt-1">
                  Specify the context to search (e.g., "D&D", "Pokemon"). Leave blank for default.
                </p>
              </div>
              <button
                onClick={loadClassesFromOpenRAG}
                disabled={isLoadingClasses || isLoadingMonsters}
                className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg border-2 border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoadingClasses ? 'Loading Classes...' : 'Load Classes from OpenRAG'}
              </button>
            </div>
          </div>

          {/* Monsters Section */}
          <div className="bg-amber-900/50 border-2 border-amber-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-amber-100 mb-4">Load Monsters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-200 mb-2">
                  Search Context
                </label>
                <input
                  type="text"
                  value={monsterSearchContext}
                  onChange={(e) => setMonsterSearchContext(e.target.value)}
                  placeholder="e.g., D&D, Pokemon"
                  className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
                />
                <p className="text-xs text-amber-400 mt-1">
                  Specify the context to search (e.g., "D&D", "Pokemon"). Leave blank for default.
                </p>
              </div>
              <button
                onClick={loadMonstersFromOpenRAG}
                disabled={isLoadingClasses || isLoadingMonsters}
                className="w-full px-6 py-3 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoadingMonsters ? 'Loading Monsters...' : 'Load Monsters from OpenRAG'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Log */}
        <div className="bg-amber-900/50 border-2 border-amber-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-amber-100">Import Log</h2>
            <button
              onClick={clearLog}
              className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-sm rounded border border-amber-700 transition-all"
            >
              Clear Log
            </button>
          </div>
          <div className="bg-amber-950/50 border border-amber-800 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logEntries.length === 0 ? (
              <div className="text-amber-500 italic">No log entries yet. Start loading data to see progress...</div>
            ) : (
              <div className="space-y-1">
                {logEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-2 ${getStatusColor(entry.type, entry.status)}`}
                  >
                    <span className="flex-shrink-0">
                      {getStatusIcon(entry.status)}
                    </span>
                    <span className="flex-shrink-0 text-amber-600">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="flex-1 break-words">
                      {entry.message}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

