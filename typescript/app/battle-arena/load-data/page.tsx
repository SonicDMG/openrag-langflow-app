'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Character, Ability } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, CLASS_COLORS, FALLBACK_ABILITIES, MONSTER_COLORS, FALLBACK_MONSTER_ABILITIES } from '../constants';
import { fetchAvailableClasses, fetchClassStats, fetchAvailableMonsters, fetchMonsterStats, extractMonsterAbilities, processSingleCharacter } from '../services/apiService';
import { PageHeader } from '../components/ui/PageHeader';
import { LandscapePrompt } from '../components/ui/LandscapePrompt';
import { StagingConfirmationModal } from '../components/StagingConfirmationModal';
import { LoadDefaultHeroesCard } from '../components/LoadDefaultHeroesCard';
import { LoadDefaultMonstersCard } from '../components/LoadDefaultMonstersCard';
import { ExportDefaultHeroesCard } from '../components/ExportDefaultHeroesCard';
import { ExportDefaultMonstersCard } from '../components/ExportDefaultMonstersCard';

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
  const [classSearchContext, setClassSearchContext] = useState<string>('Battle Arena');
  const [monsterSearchContext, setMonsterSearchContext] = useState<string>('Battle Arena');
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);
  const [singleLookupName, setSingleLookupName] = useState<string>('');
  const [isLoadingSingle, setIsLoadingSingle] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const processedItemsRef = useRef<Character[]>([]);
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [discoveredItems, setDiscoveredItems] = useState<string[]>([]);
  const [pendingItemType, setPendingItemType] = useState<'heroes' | 'monsters'>('heroes');
  const [pendingSearchContext, setPendingSearchContext] = useState<string>('');
  const [pendingIngestionFn, setPendingIngestionFn] = useState<(() => Promise<void>) | null>(null);

  // Auto-scroll to bottom of log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logEntries]);

  // Warn user if they try to navigate away during an operation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoadingClasses || isLoadingMonsters || isLoadingSingle) {
        e.preventDefault();
        e.returnValue = 'A data loading operation is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoadingClasses, isLoadingMonsters, isLoadingSingle]);

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
          const existingClasses = JSON.parse(localStorage.getItem('battle_arena_loaded_classes') || '[]');
          const existingMonsters = JSON.parse(localStorage.getItem('battle_arena_loaded_monsters') || '[]');
          const mergedClasses = new Map<string, Character>();
          const mergedMonsters = new Map<string, Character>();
          existingClasses.forEach((c: Character) => mergedClasses.set(c.name, c));
          existingMonsters.forEach((m: Character) => mergedMonsters.set(m.name, m));
          processedItemsRef.current.forEach(item => {
            mergedClasses.set(item.name, item);
            mergedMonsters.set(item.name, item);
          });
          localStorage.setItem('battle_arena_loaded_classes', JSON.stringify(Array.from(mergedClasses.values())));
          localStorage.setItem('battle_arena_loaded_monsters', JSON.stringify(Array.from(mergedMonsters.values())));
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

  // Ingestion function for classes (called after confirmation)
  const ingestClassesFromOpenRAG = async (classNames: string[], searchContext?: string) => {
    setIsLoadingClasses(true);
    processedItemsRef.current = [];
    abortControllerRef.current = new AbortController();
    addLog('system', `📋 Fetching stats and abilities for ${classNames.length} classes...`);

    try {
      const fallbackClassMap = new Map(FALLBACK_CLASSES.map(c => [c.name, c]));
      const loadedClasses: Character[] = [];
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
          
          // Fetch stats and abilities together in one go (2 queries: search + follow-up)
          const results = await fetchClassStats(
            className,
            (type, msg) => addLog('system', msg),
            searchContext || undefined
          );
          
          const result = results[0]; // Get first result (should only be one for single class)
          const { stats, abilities } = result;
          
          if (fallback) {
            // Update existing class with new stats and abilities
            const updatedClass: Character = {
              ...fallback,
              hitPoints: stats?.hitPoints ?? fallback.hitPoints,
              maxHitPoints: stats?.maxHitPoints ?? stats?.hitPoints ?? fallback.maxHitPoints,
              armorClass: stats?.armorClass ?? fallback.armorClass,
              attackBonus: stats?.attackBonus ?? fallback.attackBonus,
              damageDie: stats?.damageDie ?? fallback.damageDie,
              abilities: abilities.length > 0 ? abilities : fallback.abilities,
              description: stats?.description ?? fallback.description,
            };
            loadedClasses.push(updatedClass);
            processedItemsRef.current.push(updatedClass); // Track for incremental save
            updateLogEntry(className, 'success', `✅ ${className} - Updated (HP: ${updatedClass.hitPoints}, AC: ${updatedClass.armorClass}, ${updatedClass.abilities.length} abilities)`);
            successCount++;
          } else {
            // New class - use fetched stats and abilities
            if (stats) {
              const newClass: Character = {
                name: className,
                hitPoints: stats.hitPoints || 25,
                maxHitPoints: stats.maxHitPoints || stats.hitPoints || 25,
                armorClass: stats.armorClass || 14,
                attackBonus: stats.attackBonus || 4,
                damageDie: stats.damageDie || 'd8',
                abilities: abilities,
                description: stats.description || `A ${className} character.`,
                color: CLASS_COLORS[className] || 'bg-slate-900',
                race: stats.race,
                sex: stats.sex,
                fromOpenRAG: true, // Mark as loaded from OpenRAG
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
      const allClasses = new Map<string, Character>();
      FALLBACK_CLASSES.forEach(c => allClasses.set(c.name, c));
      loadedClasses.forEach(c => allClasses.set(c.name, c));
      const finalClasses = Array.from(allClasses.values());

      // Store in localStorage
      try {
        localStorage.setItem('battle_arena_loaded_classes', JSON.stringify(finalClasses));
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
            searchContext: searchContext || undefined,
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

  // Discovery function for classes (shows confirmation before ingestion)
  const loadClassesFromOpenRAG = async () => {
    setIsLoadingClasses(true);
    setLogEntries([]);
    addLog('system', `🚀 Discovering classes from OpenRAG (context: ${classSearchContext || 'default'})...`);
    
    try {
      const { classNames } = await fetchAvailableClasses(
        (type, msg) => addLog(type === 'system' ? 'system' : 'system', msg),
        classSearchContext || undefined
      );
      
      if (classNames.length === 0) {
        const contextMsg = classSearchContext ? ` for "${classSearchContext}"` : '';
        addLog('error', `⚠️ No classes found${contextMsg}. This might mean the knowledge base doesn't contain data for this context. Try a different search context (e.g., "Battle Arena", "Pokemon") or leave it blank for default Battle Arena classes.`);
        setIsLoadingClasses(false);
        return;
      }

      addLog('system', `✅ Found ${classNames.length} classes: ${classNames.join(', ')}`);
      
      // Show confirmation modal
      setDiscoveredItems(classNames);
      setPendingItemType('heroes');
      setPendingSearchContext(classSearchContext);
      setPendingIngestionFn(() => () => ingestClassesFromOpenRAG(classNames, classSearchContext || undefined));
      setShowConfirmation(true);
      setIsLoadingClasses(false);
    } catch (error) {
      addLog('error', `❌ Error discovering classes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoadingClasses(false);
    }
  };

  const handleConfirmStaging = async () => {
    setShowConfirmation(false);
    if (pendingIngestionFn) {
      await pendingIngestionFn();
    }
    setPendingIngestionFn(null);
  };

  const handleCancelStaging = () => {
    setShowConfirmation(false);
    setDiscoveredItems([]);
    setPendingIngestionFn(null);
    addLog('system', '⚠️ Staging cancelled by user');
  };

  // Ingestion function for monsters (called after confirmation)
  const ingestMonstersFromOpenRAG = async (monsterNames: string[], searchContext?: string) => {
    setIsLoadingMonsters(true);
    processedItemsRef.current = [];
    abortControllerRef.current = new AbortController();
    addLog('system', `📋 Fetching stats and abilities for ${monsterNames.length} monsters...`);

    try {
      const fallbackMonsterMap = new Map(FALLBACK_MONSTERS.map(m => [m.name, m]));
      const loadedMonsters: Character[] = [];
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
            abilities = await extractMonsterAbilities(monsterName, searchContext || undefined);
            if (abilities.length > 0) {
              updateLogEntry(monsterName, 'loading', `Loading ${monsterName}... (abilities loaded)`);
            }
          } catch (error) {
            console.warn(`Failed to load abilities for ${monsterName}:`, error);
            abilities = fallback?.abilities || FALLBACK_MONSTER_ABILITIES[monsterName] || [];
          }
          
          if (fallback) {
            // Update existing monster with new abilities
            const updatedMonster: Character = {
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
              searchContext || undefined
            );
            
            if (stats) {
              const newMonster: Character = {
                name: monsterName,
                hitPoints: stats.hitPoints || 30,
                maxHitPoints: stats.maxHitPoints || stats.hitPoints || 30,
                armorClass: stats.armorClass || 14,
                attackBonus: stats.attackBonus || 4,
                damageDie: stats.damageDie || 'd8',
                abilities: abilities,
                description: stats.description || `A ${monsterName} monster.`,
                color: MONSTER_COLORS[monsterName] || 'bg-slate-900',
                fromOpenRAG: true, // Mark as loaded from OpenRAG
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
      const allMonsters = new Map<string, Character>();
      FALLBACK_MONSTERS.forEach(m => allMonsters.set(m.name, m));
      loadedMonsters.forEach(m => allMonsters.set(m.name, m));
      const finalMonsters = Array.from(allMonsters.values());

      // Store in localStorage
      try {
        localStorage.setItem('battle_arena_loaded_monsters', JSON.stringify(finalMonsters));
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
            searchContext: searchContext || undefined,
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

  // Discovery function for monsters (shows confirmation before ingestion)
  const loadMonstersFromOpenRAG = async () => {
    setIsLoadingMonsters(true);
    setLogEntries([]);
    addLog('system', `🚀 Discovering monsters from OpenRAG (context: ${monsterSearchContext || 'default'})...`);
    
    try {
      const { monsterNames } = await fetchAvailableMonsters(
        (type, msg) => addLog(type === 'system' ? 'system' : 'system', msg),
        monsterSearchContext || undefined
      );
      
      if (monsterNames.length === 0) {
        const contextMsg = monsterSearchContext ? ` for "${monsterSearchContext}"` : '';
        addLog('error', `⚠️ No monsters found${contextMsg}. This might mean the knowledge base doesn't contain data for this context. Try a different search context (e.g., "Battle Arena", "Pokemon") or leave it blank for default Battle Arena monsters.`);
        setIsLoadingMonsters(false);
        return;
      }

      addLog('system', `✅ Found ${monsterNames.length} monsters: ${monsterNames.join(', ')}`);
      
      // Show confirmation modal
      setDiscoveredItems(monsterNames);
      setPendingItemType('monsters');
      setPendingSearchContext(monsterSearchContext);
      setPendingIngestionFn(() => () => ingestMonstersFromOpenRAG(monsterNames, monsterSearchContext || undefined));
      setShowConfirmation(true);
      setIsLoadingMonsters(false);
    } catch (error) {
      addLog('error', `❌ Error discovering monsters: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoadingMonsters(false);
    }
  };

  const loadSingleHeroOrMonster = async () => {
    if (!singleLookupName.trim()) {
      addLog('error', '⚠️ Please enter a hero/class or monster name');
      return;
    }

    setIsLoadingSingle(true);
    setLogEntries([]);
    processedItemsRef.current = [];
    abortControllerRef.current = new AbortController();
    addLog('system', `🔍 Looking up "${singleLookupName}" (skipping list query, going directly to character details)...`);
    
    try {
      addLog('item', `Loading ${singleLookupName}...`, singleLookupName, 'loading');
      
      // Use processSingleCharacter directly - it does 2 queries: search + follow-up
      const result = await processSingleCharacter(
        singleLookupName.trim(),
        (type, msg) => addLog(type === 'system' ? 'system' : 'system', msg)
      );

      // Use the extracted character name from the character sheet, not the search term
      const characterName = result.characterName || singleLookupName.trim();

      // Check if character already exists (checked during processSingleCharacter)
      if (result.alreadyExists) {
        updateLogEntry(singleLookupName, 'success', `ℹ️ ${characterName} - Already exists in database`);
        setIsLoadingSingle(false);
        return;
      }

      if (!result.stats) {
        updateLogEntry(singleLookupName, 'failed', `❌ ${singleLookupName} - Character not found`);
        setIsLoadingSingle(false);
        return;
      }

      // Determine if it's a monster or hero/class (heuristic: check if name is in fallback monsters)
      // Use the original search term for this check, not the extracted name
      const isMonster = FALLBACK_MONSTERS.some(m => m.name.toLowerCase() === singleLookupName.toLowerCase());
      const fallbackMap = isMonster 
        ? new Map(FALLBACK_MONSTERS.map(m => [m.name, m]))
        : new Map(FALLBACK_CLASSES.map(c => [c.name, c]));
      const fallback = fallbackMap.get(singleLookupName);
      const colorMap = isMonster ? MONSTER_COLORS : CLASS_COLORS;
      const storageKey = isMonster ? 'battle_arena_loaded_monsters' : 'battle_arena_loaded_classes';
      const apiEndpoint = isMonster ? '/api/monsters-db' : '/api/heroes';
      const itemType = isMonster ? 'monster' : 'class';
      
      const newItem: Character = {
        name: characterName,
        hitPoints: result.stats.hitPoints || (isMonster ? 30 : 25),
        maxHitPoints: result.stats.maxHitPoints || result.stats.hitPoints || (isMonster ? 30 : 25),
        armorClass: result.stats.armorClass || 14,
        attackBonus: result.stats.attackBonus || 4,
        damageDie: result.stats.damageDie || 'd8',
        abilities: result.abilities,
        description: result.stats.description || `A ${characterName} ${itemType}.`,
        color: colorMap[characterName] || colorMap[singleLookupName] || 'bg-slate-900',
        race: result.stats.race,
        sex: result.stats.sex,
        fromOpenRAG: true, // Mark as loaded from OpenRAG
      };

      // Merge with existing items and save to localStorage
      const existingItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const allItems = new Map<string, Character>();
      existingItems.forEach((item: Character) => allItems.set(item.name, item));
      allItems.set(newItem.name, newItem);
      const finalItems = Array.from(allItems.values());

      try {
        localStorage.setItem(storageKey, JSON.stringify(finalItems));
        addLog('system', `💾 Saved ${characterName} to localStorage`);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
        addLog('error', `⚠️ Failed to save to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Save to Astra DB
      try {
        addLog('system', `💾 Saving ${characterName} to Astra DB...`);
        const response = await fetch(apiEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            [isMonster ? 'monsters' : 'heroes']: finalItems,
            searchContext: isMonster ? monsterSearchContext || undefined : classSearchContext || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save to Astra DB');
        }

        addLog('system', `✅ Successfully saved ${characterName} to Astra DB`);
      } catch (error) {
        console.error('Failed to save to Astra DB:', error);
        addLog('error', `⚠️ Failed to save to Astra DB: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      updateLogEntry(singleLookupName, 'success', `✅ ${characterName} - Loaded (HP: ${newItem.hitPoints}, AC: ${newItem.armorClass}, ${newItem.abilities.length} abilities)`);
      addLog('system', `✅ Completed loading ${characterName}`);
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        addLog('system', '⚠️ Operation cancelled');
      } else {
        addLog('error', `❌ Error loading ${singleLookupName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        updateLogEntry(singleLookupName, 'failed', `❌ ${singleLookupName} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoadingSingle(false);
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

  const clearAllHeroes = async () => {
    if (!confirm('Are you sure you want to delete ALL heroes from the database? This action cannot be undone.')) {
      return;
    }

    setLogEntries([]);
    addLog('system', '🗑️ Clearing all heroes from database...');
    
    try {
      // Get all heroes first
      const response = await fetch('/api/heroes');
      if (!response.ok) {
        throw new Error('Failed to fetch heroes');
      }
      
      const data = await response.json();
      const heroes = data.heroes || [];
      
      if (heroes.length === 0) {
        addLog('system', 'ℹ️ No heroes found in database');
        return;
      }
      
      addLog('system', `Found ${heroes.length} heroes to delete...`);
      
      // Delete each hero
      let successCount = 0;
      let failCount = 0;
      
      for (const hero of heroes) {
        try {
          const deleteResponse = await fetch(`/api/heroes?name=${encodeURIComponent(hero.name)}`, {
            method: 'DELETE',
          });
          
          if (deleteResponse.ok) {
            successCount++;
            addLog('success', `✅ Deleted: ${hero.name}`);
          } else {
            failCount++;
            addLog('error', `❌ Failed to delete: ${hero.name}`);
          }
        } catch (error) {
          failCount++;
          addLog('error', `❌ Error deleting ${hero.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Clear localStorage cache
      localStorage.removeItem('battle_arena_loaded_classes');
      addLog('system', '🧹 Cleared localStorage cache');
      
      addLog('system', `✅ Completed! Deleted ${successCount} heroes${failCount > 0 ? `, ${failCount} failed` : ''}`);
      
      // Reload page to refresh UI
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      addLog('error', `❌ Error clearing heroes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearAllMonsters = async () => {
    if (!confirm('Are you sure you want to delete ALL monsters from the database? This action cannot be undone.')) {
      return;
    }

    setLogEntries([]);
    addLog('system', '🗑️ Clearing all monsters from database...');
    
    try {
      // Get all monsters first
      const response = await fetch('/api/monsters-db');
      if (!response.ok) {
        throw new Error('Failed to fetch monsters');
      }
      
      const data = await response.json();
      const monsters = data.monsters || [];
      
      if (monsters.length === 0) {
        addLog('system', 'ℹ️ No monsters found in database');
        return;
      }
      
      addLog('system', `Found ${monsters.length} monsters to delete...`);
      
      // Delete each monster
      let successCount = 0;
      let failCount = 0;
      
      for (const monster of monsters) {
        try {
          const deleteResponse = await fetch(`/api/monsters-db?name=${encodeURIComponent(monster.name)}`, {
            method: 'DELETE',
          });
          
          if (deleteResponse.ok) {
            successCount++;
            addLog('success', `✅ Deleted: ${monster.name}`);
          } else {
            failCount++;
            addLog('error', `❌ Failed to delete: ${monster.name}`);
          }
        } catch (error) {
          failCount++;
          addLog('error', `❌ Error deleting ${monster.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Clear localStorage cache
      localStorage.removeItem('battle_arena_loaded_monsters');
      addLog('system', '🧹 Cleared localStorage cache');
      
      addLog('system', `✅ Completed! Deleted ${successCount} monsters${failCount > 0 ? `, ${failCount} failed` : ''}`);
      
      // Reload page to refresh UI
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      addLog('error', `❌ Error clearing monsters: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    <div className="min-h-screen" style={{ backgroundColor: '#D1C9BA' }}>
      {/* Landscape Orientation Prompt */}
      <LandscapePrompt />
      
      <PageHeader
        title="Load"
        title2="Data"
        decalImageUrl="/cdn/decals/load-data.png"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-0">
        <div className="space-y-6 overflow-visible">
          {/* Description Section */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Load Data from OpenRAG
            </h2>
            <p className="text-amber-200 mb-4">Import heroes and monsters from your OpenRAG knowledge base</p>
            <div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={saveFallbackDataToAstra}
                  className="px-4 py-2 bg-green-900 hover:bg-green-800 text-white font-semibold rounded-lg border-2 border-green-700 transition-all"
                >
                  💾 Save Fallback Data to Astra DB
                </button>
                <button
                  onClick={clearAllHeroes}
                  disabled={isLoadingClasses || isLoadingMonsters || isLoadingSingle}
                  className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white font-semibold rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  🗑️ Clear All Heroes
                </button>
                <button
                  onClick={clearAllMonsters}
                  disabled={isLoadingClasses || isLoadingMonsters || isLoadingSingle}
                  className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white font-semibold rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  🗑️ Clear All Monsters
                </button>
              </div>
              <p className="text-xs text-amber-300 mt-2">
                Save the default fallback classes and monsters to Astra DB (useful for initial setup), or clear all heroes/monsters to start fresh
              </p>
            </div>
          </div>

          {/* Single Hero/Class/Monster Lookup */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Single Hero/Class/Monster Lookup
            </h2>
            <p className="text-amber-200 mb-4">Look up a single hero, class, or monster by name (skips list query, goes directly to character details)</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-200 mb-2">
                  Hero/Class/Monster Name
                </label>
                <input
                  type="text"
                  value={singleLookupName}
                  onChange={(e) => setSingleLookupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoadingSingle) {
                      loadSingleHeroOrMonster();
                    }
                  }}
                  placeholder="e.g., Scanlan, Fighter, Goblin"
                  className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
                />
                <p className="text-xs text-amber-300 mt-1">
                  Enter the exact name of a hero, class, or monster to look up directly
                </p>
              </div>
              <button
                onClick={loadSingleHeroOrMonster}
                disabled={isLoadingSingle || isLoadingClasses || isLoadingMonsters || !singleLookupName.trim()}
                className="w-full px-6 py-3 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-lg border-2 border-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoadingSingle ? 'Looking up...' : 'Look Up Single Hero/Class/Monster'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classes Section */}
            <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
                Bulk Load Classes/Heroes
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-200 mb-2">
                    Search Context
                  </label>
                  <input
                    type="text"
                    value={classSearchContext}
                    onChange={(e) => setClassSearchContext(e.target.value)}
                    placeholder="e.g., Battle Arena, Pokemon"
                    className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
                  />
                  <p className="text-xs text-amber-300 mt-1">
                    Specify the context to search (e.g., "Battle Arena", "Pokemon"). Leave blank for default.
                  </p>
                </div>
                <button
                  onClick={loadClassesFromOpenRAG}
                  disabled={isLoadingClasses || isLoadingMonsters || isLoadingSingle}
                  className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg border-2 border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoadingClasses ? 'Loading Classes...' : 'Bulk Load Classes from OpenRAG'}
                </button>
              </div>
            </div>

            {/* Monsters Section */}
            <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
                Bulk Load Monsters
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-200 mb-2">
                    Search Context
                  </label>
                  <input
                    type="text"
                    value={monsterSearchContext}
                    onChange={(e) => setMonsterSearchContext(e.target.value)}
                    placeholder="e.g., Battle Arena, Pokemon"
                    className="w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 placeholder-amber-400"
                  />
                  <p className="text-xs text-amber-300 mt-1">
                    Specify the context to search (e.g., "Battle Arena", "Pokemon"). Leave blank for default.
                  </p>
                </div>
                <button
                  onClick={loadMonstersFromOpenRAG}
                  disabled={isLoadingClasses || isLoadingMonsters || isLoadingSingle}
                  className="w-full px-6 py-3 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoadingMonsters ? 'Loading Monsters...' : 'Bulk Load Monsters from OpenRAG'}
                </button>
              </div>
            </div>
          </div>

          {/* Load & Export Defaults Section */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Manage Default Heroes & Monsters
            </h2>
            
            {/* Load Defaults Subsection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-amber-200 mb-2">
                1️⃣ Load Defaults to Database
              </h3>
              <p className="text-amber-200 mb-4 text-sm">
                First, load the default heroes and monsters from JSON into the database (required before exporting)
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <LoadDefaultHeroesCard size="compact" />
                <LoadDefaultMonstersCard size="compact" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-amber-700/50 my-6"></div>

            {/* Export Defaults Subsection */}
            <div>
              <h3 className="text-lg font-semibold text-amber-200 mb-2">
                2️⃣ Export Edited Defaults to JSON
              </h3>
              <p className="text-amber-200 mb-4 text-sm">
                After editing defaults in the database, export them back to JSON files for version control
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <ExportDefaultHeroesCard size="compact" />
                <ExportDefaultMonstersCard size="compact" />
              </div>
              <p className="text-xs text-amber-300 mt-4">
                💡 After exporting, run <code className="bg-amber-950/50 px-2 py-1 rounded">npm run build</code> to rebuild the app with updated defaults
              </p>
            </div>
          </div>

          {/* Live Log */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-amber-100" style={{ fontFamily: 'serif' }}>
                Import Log
              </h2>
              <button
                onClick={clearLog}
                className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-sm rounded border border-amber-700 transition-all"
              >
                Clear Log
              </button>
            </div>
            <div className="bg-amber-950/50 border border-amber-800 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
              {logEntries.length === 0 ? (
                <div className="text-amber-300 italic">No log entries yet. Start loading data to see progress...</div>
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
                      <span className="flex-shrink-0 text-amber-400">
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

      {/* Confirmation Modal */}
      <StagingConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCancelStaging}
        onConfirm={handleConfirmStaging}
        items={discoveredItems}
        itemType={pendingItemType}
        searchContext={pendingSearchContext || undefined}
      />
    </div>
  );
}

