'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DnDClass, BattleLog, CharacterEmotion, Ability, AttackAbility } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, isMonster } from '../constants';
import { rollDice, rollDiceWithNotation, parseDiceNotation } from '../utils/dice';
import { generateCharacterName, generateDeterministicCharacterName } from '../utils/names';
import { createHitVisualEffects, createMissVisualEffects, createHealingVisualEffects, getOpponent, buildDamageDiceArray, getProjectileType, type PendingVisualEffect, type ProjectileType } from '../utils/battle';
import { FloatingNumber, FloatingNumberType } from '../components/FloatingNumber';
import { CharacterCard } from '../components/CharacterCard';
import { ClassSelection } from '../components/ClassSelection';
import { useAIOpponent } from '../hooks/useAIOpponent';
import { PageHeader } from '../components/PageHeader';
import { LandscapePrompt } from '../components/LandscapePrompt';
import { ProjectileEffect } from '../components/ProjectileEffect';

// Mock battle narrative generator (doesn't call agent)
const mockBattleNarrative = (eventDescription: string): string => {
  return `[MOCK] ${eventDescription}`;
};

export default function DnDTestPage() {
  const router = useRouter();
  
  // Type selection for player 2 only (player 1 is always a class)
  const [player2Type, setPlayer2Type] = useState<'class' | 'monster'>('class');
  
  // Scroll ref for monster selection
  const monsterScrollRef = useRef<HTMLDivElement>(null);
  
  // Monster IDs for displaying monster images
  const [player1MonsterId, setPlayer1MonsterId] = useState<string | null>(null);
  const [player2MonsterId, setPlayer2MonsterId] = useState<string | null>(null);
  
  // Created monsters (with IDs and images)
  const [createdMonsters, setCreatedMonsters] = useState<Array<DnDClass & { monsterId: string; imageUrl: string }>>([]);
  const [isLoadingCreatedMonsters, setIsLoadingCreatedMonsters] = useState(false);
  
  // Custom heroes and monsters from database
  const [customHeroes, setCustomHeroes] = useState<DnDClass[]>([]);
  const [customMonsters, setCustomMonsters] = useState<DnDClass[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);
  
  // Test player setup - preserve actual abilities from classes
  const [player1Class, setPlayer1Class] = useState<DnDClass>(() => ({
    ...FALLBACK_CLASSES[0],
    hitPoints: FALLBACK_CLASSES[0].maxHitPoints,
    abilities: FALLBACK_CLASSES[0].abilities || [],
  }));
  
  const [player2Class, setPlayer2Class] = useState<DnDClass>(() => ({
    ...FALLBACK_CLASSES[1],
    hitPoints: FALLBACK_CLASSES[1].maxHitPoints,
    abilities: FALLBACK_CLASSES[1].abilities || [],
  }));
  
  // Helper to create a test class/monster preserving actual abilities and monster metadata
  const createTestEntity = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }): DnDClass & { monsterId?: string; imageUrl?: string } => {
    return {
      ...entity,
      hitPoints: entity.maxHitPoints,
      // Preserve actual abilities from the entity, or use empty array if none
      abilities: entity.abilities && entity.abilities.length > 0 ? entity.abilities : [],
      // Preserve monsterId and imageUrl if they exist
      ...(entity.monsterId && { monsterId: entity.monsterId }),
      ...(entity.imageUrl && { imageUrl: entity.imageUrl }),
    };
  }, []);
  
  // Helper to find associated monster for a class/monster type
  const findAssociatedMonster = useCallback((className: string): (DnDClass & { monsterId: string; imageUrl: string }) | null => {
    // Find the most recently created monster associated with this class/monster type
    const associated = createdMonsters
      .filter(m => {
        // For created monsters, match by klass field; for regular monsters, match by name
        const monsterKlass = (m as any).klass;
        return monsterKlass ? monsterKlass === className : m.name === className;
      })
      .sort((a, b) => {
        // Sort by monsterId (UUIDs) - most recent first (assuming newer UUIDs are later in sort)
        return b.monsterId.localeCompare(a.monsterId);
      });
    return associated.length > 0 ? associated[0] : null;
  }, [createdMonsters]);

  // Handle player 1 selection
  const handlePlayer1Select = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }) => {
    const testEntity = createTestEntity(entity);
    setPlayer1Class(testEntity);
    // Use the same logic as selection cards:
    // - Created monsters: entity.name is already the character name
    // - Custom heroes: entity.name is already the character name
    // - Regular monsters: entity.name is the monster type name (use directly)
    // - Regular classes: generate a deterministic name
    const isCreatedMonster = !!(entity as any).klass && !!(entity as any).monsterId;
    const isCustomHero = !isCreatedMonster && !isMonster(entity.name) && !FALLBACK_CLASSES.some(fc => fc.name === entity.name);
    const entityIsMonster = isMonster(entity.name);
    const nameToUse = isCreatedMonster || isCustomHero
      ? entity.name // Created monsters and custom heroes already have the character name
      : (entityIsMonster 
          ? entity.name // Regular monsters use their type name
          : generateDeterministicCharacterName(entity.name)); // Regular classes get generated name
    setPlayer1Name(nameToUse);
    
    // Check if this entity already has a monsterId (explicitly selected created monster)
    if (testEntity.monsterId) {
      setPlayer1MonsterId(testEntity.monsterId);
    } else {
      // Otherwise, check if there's an associated monster for this class/monster type
      // For created monsters, use klass to find associated monster; for regular classes, use name
      const lookupName = isCreatedMonster ? (entity as any).klass : entity.name;
      const associatedMonster = findAssociatedMonster(lookupName);
      if (associatedMonster) {
        setPlayer1MonsterId(associatedMonster.monsterId);
      } else {
        setPlayer1MonsterId(null);
      }
    }
  }, [createTestEntity, findAssociatedMonster]);
  
  // Handle player 2 selection
  const handlePlayer2Select = useCallback((entity: DnDClass & { monsterId?: string; imageUrl?: string }) => {
    const testEntity = createTestEntity(entity);
    setPlayer2Class(testEntity);
    // Use the same logic as selection cards:
    // - Created monsters: entity.name is already the character name
    // - Custom heroes: entity.name is already the character name
    // - Regular monsters: entity.name is the monster type name (use directly)
    // - Regular classes: generate a deterministic name
    const isCreatedMonster = !!(entity as any).klass && !!(entity as any).monsterId;
    const isCustomHero = !isCreatedMonster && !isMonster(entity.name) && !FALLBACK_CLASSES.some(fc => fc.name === entity.name);
    const entityIsMonster = isMonster(entity.name);
    const nameToUse = isCreatedMonster || isCustomHero
      ? entity.name // Created monsters and custom heroes already have the character name
      : (entityIsMonster 
          ? entity.name // Regular monsters use their type name
          : generateDeterministicCharacterName(entity.name)); // Regular classes get generated name
    setPlayer2Name(nameToUse);
    
    // Check if this entity already has a monsterId (explicitly selected created monster)
    if (testEntity.monsterId) {
      setPlayer2MonsterId(testEntity.monsterId);
    } else {
      // Otherwise, check if there's an associated monster for this class/monster type
      // For created monsters, use klass to find associated monster; for regular classes, use name
      const lookupName = isCreatedMonster ? (entity as any).klass : entity.name;
      const associatedMonster = findAssociatedMonster(lookupName);
      if (associatedMonster) {
        setPlayer2MonsterId(associatedMonster.monsterId);
      } else {
        setPlayer2MonsterId(null);
      }
    }
  }, [createTestEntity, findAssociatedMonster]);
  
  // Initialize names as null to prevent hydration mismatch
  // Names will be generated on the client side only
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  
  // Generate names only on client side to avoid hydration mismatch
  // Use deterministic names so they match what's shown in selection cards
  // Use the same logic as selection cards and selection handlers
  useEffect(() => {
    // Player 1
    const p1IsCreatedMonster = !!(player1Class as any).klass && !!(player1Class as any).monsterId;
    const p1IsCustomHero = !p1IsCreatedMonster && !isMonster(player1Class.name) && !FALLBACK_CLASSES.some(fc => fc.name === player1Class.name);
    const p1IsMonster = isMonster(player1Class.name);
    const p1Name = p1IsCreatedMonster || p1IsCustomHero
      ? player1Class.name
      : (p1IsMonster ? player1Class.name : generateDeterministicCharacterName(player1Class.name));
    setPlayer1Name(p1Name);
    
    // Player 2
    const p2IsCreatedMonster = !!(player2Class as any).klass && !!(player2Class as any).monsterId;
    const p2IsCustomHero = !p2IsCreatedMonster && !isMonster(player2Class.name) && !FALLBACK_CLASSES.some(fc => fc.name === player2Class.name);
    const p2IsMonster = isMonster(player2Class.name);
    const p2Name = p2IsCreatedMonster || p2IsCustomHero
      ? player2Class.name
      : (p2IsMonster ? player2Class.name : generateDeterministicCharacterName(player2Class.name));
    setPlayer2Name(p2Name);
  }, [player1Class.name, player2Class.name]);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  
  // Visual effect states
  const [shakingPlayer, setShakingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState({ player1: 0, player2: 0 });
  const [sparklingPlayer, setSparklingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [sparkleTrigger, setSparkleTrigger] = useState({ player1: 0, player2: 0 });
  const [missingPlayer, setMissingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [missTrigger, setMissTrigger] = useState({ player1: 0, player2: 0 });
  const [hittingPlayer, setHittingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [hitTrigger, setHitTrigger] = useState({ player1: 0, player2: 0 });
  const [castingPlayer, setCastingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [castTrigger, setCastTrigger] = useState({ player1: 0, player2: 0 });
  const [flashingPlayer, setFlashingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [flashTrigger, setFlashTrigger] = useState({ player1: 0, player2: 0 });
  const [flashProjectileType, setFlashProjectileType] = useState<{ player1: ProjectileType | null; player2: ProjectileType | null }>({ player1: null, player2: null });
  const [castProjectileType, setCastProjectileType] = useState<{ player1: ProjectileType | null; player2: ProjectileType | null }>({ player1: null, player2: null });
  const [shakeIntensity, setShakeIntensity] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [sparkleIntensity, setSparkleIntensity] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [defeatedPlayer, setDefeatedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [victorPlayer, setVictorPlayer] = useState<'player1' | 'player2' | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  
  // Floating numbers state - replaces dice roll system
  type FloatingNumberData = {
    id: string;
    value: number | string;
    type: FloatingNumberType;
    targetPlayer: 'player1' | 'player2';
    persistent?: boolean;
  };
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumberData[]>([]);
  
  // Projectile effects state
  type ProjectileData = {
    id: string;
    fromPlayer: 'player1' | 'player2';
    toPlayer: 'player1' | 'player2';
    isHit: boolean;
    onHit?: () => void;
    onComplete?: () => void;
    fromCardRotation?: number;
    delay?: number;
    projectileType?: ProjectileType;
  };
  const [projectileEffects, setProjectileEffects] = useState<ProjectileData[]>([]);
  
  // Refs for character cards to position floating numbers
  const player1CardRef = useRef<HTMLDivElement | null>(null);
  const player2CardRef = useRef<HTMLDivElement | null>(null);
  
  const [manualEmotion1, setManualEmotion1] = useState<CharacterEmotion | null>(null);
  const [manualEmotion2, setManualEmotion2] = useState<CharacterEmotion | null>(null);
  const [isAIModeActive, setIsAIModeActive] = useState(false);
  const [isOpponentAutoPlaying, setIsOpponentAutoPlaying] = useState(false);
  const [isMoveInProgress, setIsMoveInProgress] = useState(false);
  const [particleEffectsEnabled, setParticleEffectsEnabled] = useState(true);
  const [flashEffectsEnabled, setFlashEffectsEnabled] = useState(true);
  const [shakeEffectsEnabled, setShakeEffectsEnabled] = useState(true);
  const [sparkleEffectsEnabled, setSparkleEffectsEnabled] = useState(true);
  const [hitEffectsEnabled, setHitEffectsEnabled] = useState(true);
  const [missEffectsEnabled, setMissEffectsEnabled] = useState(true);
  const [castEffectsEnabled, setCastEffectsEnabled] = useState(true);
  
  // Load custom heroes and monsters from database
  useEffect(() => {
    const loadCustomCharacters = async () => {
      setIsLoadingCustom(true);
      try {
        // Load custom heroes
        const heroesResponse = await fetch('/api/heroes');
        if (heroesResponse.ok) {
          const heroesData = await heroesResponse.json();
          // Filter to only show custom heroes (those not from fallbacks)
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

  // Load created monsters on mount
  useEffect(() => {
    const loadCreatedMonsters = async () => {
      setIsLoadingCreatedMonsters(true);
      try {
        const response = await fetch('/api/monsters');
        if (response.ok) {
          const data = await response.json();
          // Convert created monsters to DnDClass format
          const convertedMonsters = data.monsters.map((m: any) => {
            // Find matching class/monster from fallbacks to get stats and abilities
            const fallbackClass = FALLBACK_CLASSES.find(c => c.name === m.klass);
            const fallbackMonster = FALLBACK_MONSTERS.find(m2 => m2.name === m.klass);
            const fallback = fallbackClass || fallbackMonster;
            
            // Also check custom heroes/monsters
            const customHero = customHeroes.find(h => h.name === m.klass);
            const customMonster = customMonsters.find(m2 => m2.name === m.klass);
            const custom = customHero || customMonster;
            
            // Prefer custom over fallback
            const character = custom || fallback;
            
            // Extract character name from prompt if available
            // The prompt format is usually: "CharacterName: description" or "CharacterName ClassName: description"
            // or "ClassName RaceName: description"
            let characterName = m.klass; // Default to klass
            if (m.prompt) {
              // Try to extract name from prompt - look for pattern like "Name:" or "Name ClassName:"
              // First, try to find the part before the first colon
              const colonIndex = m.prompt.indexOf(':');
              if (colonIndex > 0) {
                const beforeColon = m.prompt.substring(0, colonIndex).trim();
                const parts = beforeColon.split(/\s+/);
                
                // Check if the klass appears in the parts
                const klassIndex = parts.findIndex((p: string) => p === m.klass);
                
                if (klassIndex > 0) {
                  // Pattern like "Onyx Champion" - extract "Onyx" (everything before klass)
                  characterName = parts.slice(0, klassIndex).join(' ');
                } else if (klassIndex === -1 && parts.length > 0) {
                  // Klass not found in parts - check if first part is different from klass
                  if (parts[0] !== m.klass && parts.length === 1) {
                    // Single word that's not the klass - likely the character name
                    characterName = parts[0];
                  } else if (parts.length === 2 && parts[0] === m.klass) {
                    // Pattern like "Champion Human" - klass is first, so use klass as name
                    characterName = m.klass;
                  } else if (parts.length > 1 && parts[0] !== m.klass) {
                    // Multiple words, first is not klass - might be "Name Race" or "Name Class"
                    // Use first word as character name
                    characterName = parts[0];
                  }
                }
                // If klassIndex === 0, then klass is first word, so use klass as name (already set)
              }
            }
            
            // Construct imageUrl from monsterId if not provided
            const imageUrl = m.imageUrl || `/cdn/monsters/${m.monsterId}/280x200.png`;
            
            return {
              name: characterName, // Use extracted character name instead of klass
              hitPoints: m.stats?.hitPoints || character?.hitPoints || 30,
              maxHitPoints: m.stats?.maxHitPoints || m.stats?.hitPoints || character?.maxHitPoints || 30,
              armorClass: m.stats?.armorClass || character?.armorClass || 14,
              attackBonus: m.stats?.attackBonus || character?.attackBonus || 4,
              damageDie: m.stats?.damageDie || character?.damageDie || 'd8',
              abilities: character?.abilities || [],
              description: m.stats?.description || character?.description || `A ${m.klass} created in the monster creator.`,
              color: character?.color || 'bg-slate-900',
              monsterId: m.monsterId,
              imageUrl: imageUrl.replace('/256.png', '/280x200.png').replace('/200.png', '/280x200.png'),
              hasCutout: m.hasCutout ?? false, // Preserve hasCutout flag from API
              lastAssociatedAt: m.lastAssociatedAt, // Preserve last association time
              // Store the klass separately so we can use it for class type display
              klass: m.klass,
            } as DnDClass & { monsterId: string; imageUrl: string; hasCutout?: boolean; lastAssociatedAt?: string; klass?: string };
          });
          setCreatedMonsters(convertedMonsters);
        }
      } catch (error) {
        console.error('Failed to load created monsters:', error);
      } finally {
        setIsLoadingCreatedMonsters(false);
      }
    };
    loadCreatedMonsters();
  }, [customHeroes, customMonsters]);

  // Update monster IDs when createdMonsters loads or changes, if players already have classes selected
  useEffect(() => {
    if (player1Class && !player1MonsterId) {
      const associatedMonster = findAssociatedMonster(player1Class.name);
      if (associatedMonster) {
        setPlayer1MonsterId(associatedMonster.monsterId);
      }
    }
    if (player2Class && !player2MonsterId) {
      const associatedMonster = findAssociatedMonster(player2Class.name);
      if (associatedMonster) {
        setPlayer2MonsterId(associatedMonster.monsterId);
      }
    }
  }, [createdMonsters, player1Class, player2Class, player1MonsterId, player2MonsterId, findAssociatedMonster]);
  
  
  const addLog = useCallback((type: BattleLog['type'], message: string) => {
    setBattleLog((prev) => [...prev, { type, message, timestamp: Date.now() }]);
  }, []);
  
  const updatePlayerHP = useCallback((player: 'player1' | 'player2', newHP: number) => {
    if (player === 'player1') {
      setPlayer1Class((current) => current ? { ...current, hitPoints: newHP } : current);
    } else {
      setPlayer2Class((current) => current ? { ...current, hitPoints: newHP } : current);
    }
  }, []);
  
  // Helper function to trigger flash effect on attacking card
  const triggerFlashEffect = useCallback((attacker: 'player1' | 'player2', projectileType?: ProjectileType) => {
    if (!flashEffectsEnabled) {
      console.log('[TestPage] Flash effects disabled, skipping flash trigger');
      return;
    }
    console.log('[TestPage] Triggering flash effect for', attacker, 'with type', projectileType);
    setFlashingPlayer(attacker);
    setFlashTrigger(prev => {
      const newValue = prev[attacker] + 1;
      console.log('[TestPage] Flash trigger updated:', { attacker, newValue });
      return { ...prev, [attacker]: newValue };
    });
    if (projectileType) {
      setFlashProjectileType(prev => ({ ...prev, [attacker]: projectileType }));
      setCastProjectileType(prev => ({ ...prev, [attacker]: projectileType }));
    }
  }, [flashEffectsEnabled]);

  // Helper function to apply a visual effect (respects effect toggles)
  const applyVisualEffect = useCallback((effect: PendingVisualEffect) => {
    switch (effect.type) {
      case 'shake':
        if (!shakeEffectsEnabled) return;
        setShakingPlayer(effect.player);
        setShakeTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        if (effect.intensity !== undefined) {
          setShakeIntensity(prev => ({ ...prev, [effect.player]: effect.intensity! }));
        }
        break;
      case 'sparkle':
        if (!sparkleEffectsEnabled) return;
        setSparklingPlayer(effect.player);
        setSparkleTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        if (effect.intensity !== undefined) {
          setSparkleIntensity(prev => ({ ...prev, [effect.player]: effect.intensity! }));
        }
        break;
      case 'miss':
        if (!missEffectsEnabled) return;
        setMissingPlayer(effect.player);
        setMissTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'hit':
        if (!hitEffectsEnabled) return;
        setHittingPlayer(effect.player);
        setHitTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
      case 'cast':
        if (!castEffectsEnabled) return;
        setCastingPlayer(effect.player);
        setCastTrigger(prev => ({ ...prev, [effect.player]: prev[effect.player] + 1 }));
        break;
    }
  }, [shakeEffectsEnabled, sparkleEffectsEnabled, missEffectsEnabled, hitEffectsEnabled, castEffectsEnabled]);
  
  // Helper function to show floating numbers and apply effects immediately
  const showFloatingNumbers = useCallback((
    numbers: Array<{ value: number | string; type: FloatingNumberType; targetPlayer: 'player1' | 'player2'; persistent?: boolean }>,
    visualEffects: PendingVisualEffect[] = [],
    callbacks: (() => void)[] = []
  ) => {
    // Show floating numbers immediately
    const numberData: FloatingNumberData[] = numbers.map((n, idx) => ({
      id: `${Date.now()}-${idx}`,
      ...n,
    }));
    setFloatingNumbers(prev => [...prev, ...numberData]);
    
    // Apply visual effects immediately
    visualEffects.forEach(effect => {
      applyVisualEffect(effect);
    });
    
    // Execute callbacks immediately (with a tiny delay to ensure state updates)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        callbacks.forEach(callback => callback());
      });
    });
  }, [applyVisualEffect]);

  // Handle floating number completion (cleanup)
  const handleFloatingNumberComplete = useCallback((id: string) => {
    setFloatingNumbers(prev => prev.filter(n => n.id !== id));
  }, []);

  // Ref to track recent projectile creations to prevent duplicates
  const lastProjectileTimeRef = useRef<{ [key: string]: number }>({});
  
  // Helper function to show projectile effect
  const showProjectileEffect = useCallback((
    fromPlayer: 'player1' | 'player2',
    toPlayer: 'player1' | 'player2',
    isHit: boolean,
    onHit?: () => void,
    onComplete?: () => void,
    fromCardRotation?: number,
    delay?: number,
    projectileType?: ProjectileType
  ) => {
    // If particle effects are disabled, execute callbacks immediately without showing projectile
    if (!particleEffectsEnabled) {
      // Execute onHit callback immediately for hits
      if (isHit && onHit) {
        // Small delay to maintain timing feel
        setTimeout(() => {
          onHit();
        }, 50);
      }
      // Execute onComplete callback
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, isHit ? 100 : 150);
      }
      return;
    }
    
    // Create a unique key for this attack (fromPlayer + toPlayer + delay)
    // This prevents duplicate projectiles for the same attack within 200ms
    const attackKey = `${fromPlayer}-${toPlayer}-${delay || 0}`;
    const now = Date.now();
    const lastTime = lastProjectileTimeRef.current[attackKey] || 0;
    
    // Prevent duplicate projectiles within 200ms for the same attack
    if (now - lastTime < 200) {
      return;
    }
    
    lastProjectileTimeRef.current[attackKey] = now;
    
    const projectileId = `projectile-${now}-${Math.random()}`;
    setProjectileEffects(prev => [...prev, {
      id: projectileId,
      fromPlayer,
      toPlayer,
      isHit,
      onHit,
      onComplete,
      fromCardRotation,
      delay,
      projectileType,
    }]);
  }, [particleEffectsEnabled]);

  // Helper function to remove projectile effect
  const removeProjectileEffect = useCallback((id: string) => {
    setProjectileEffects(prev => prev.filter(p => p.id !== id));
  }, []);
  
  // Test functions
  const testDiceRoll = () => {
    // Show random numbers floating on both cards
    const numbers: Array<{ value: number | string; type: FloatingNumberType; targetPlayer: 'player1' | 'player2' }> = [
      { value: Math.floor(Math.random() * 20) + 1, type: 'attack-roll', targetPlayer: 'player1' },
      { value: Math.floor(Math.random() * 10) + 1, type: 'damage', targetPlayer: 'player2' },
      { value: Math.floor(Math.random() * 8) + 1, type: 'damage', targetPlayer: 'player1' },
      { value: Math.floor(Math.random() * 6) + 1, type: 'healing', targetPlayer: 'player2' },
    ];
    showFloatingNumbers(numbers);
    addLog('system', '🎲 Test floating numbers triggered');
  };
  
  const testAttackHit = (attacker: 'player1' | 'player2') => {
    console.log('[TestPage] testAttackHit called for', attacker);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const defender = getOpponent(attacker);
    
    // Get projectile type for flash effect
    const projectileType = getProjectileType(null, undefined, attackerClass.name);
    // Trigger flash effect on attacking card with projectile type
    triggerFlashEffect(attacker, projectileType);
    
    // Create visual effects to check for cast effect
    const allVisualEffects = createHitVisualEffects(attacker, defender, 0, defenderClass, attackerClass);
    // Trigger cast effect immediately if present
    const castEffect = allVisualEffects.find(effect => effect.type === 'cast');
    if (castEffect) {
      console.log('[TestPage] Triggering cast effect for', attacker, 'castEffect:', castEffect);
      applyVisualEffect(castEffect);
    } else {
      console.log('[TestPage] No cast effect for', attacker, 'attackerClass:', attackerClass.name);
    }
    
    console.log('[TestPage] Attacker:', attackerClass.name, 'Defender:', defenderClass.name);
    
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    const damage = rollDice(attackerClass.damageDie);
    
    console.log('[TestPage] Attack roll:', attackRoll, 'Damage:', damage);
    
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (hits AC ${defenderClass.armorClass})`);
    
    const newHP = Math.max(0, defenderClass.hitPoints - damage);
    
    // Create visual effects, but exclude shake (will be triggered by projectile hit)
    const visualEffects = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
      .filter(effect => effect.type !== 'shake'); // Remove shake, will be triggered on projectile hit
    
    // Show projectile effect with card rotation angle
    const cardRotation = attacker === 'player1' ? -5 : 5;
    // projectileType already defined above for flash effect
    showProjectileEffect(
      attacker,
      defender,
      true, // isHit
      () => {
        // On projectile hit: trigger shake and show damage
        const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, attackerClass)
          .find(effect => effect.type === 'shake');
        if (shakeEffect) {
          applyVisualEffect(shakeEffect);
        }
        
        // Show floating damage number when projectile hits
        showFloatingNumbers(
          [{ value: damage, type: 'damage', targetPlayer: defender }],
          visualEffects, // Other effects (hit, cast) shown immediately
          [
            () => {
              console.log('[TestPage] HP update callback for', defender, 'newHP:', newHP);
              updatePlayerHP(defender, newHP);
            },
            () => {
              console.log('[TestPage] Attack complete callback for', attacker);
              addLog('attack', `⚔️ ${attackerClass.name} hits for ${damage} damage!`);
              addLog('narrative', mockBattleNarrative(`${attackerClass.name} attacks ${defenderClass.name} and deals ${damage} damage.`));
              
              if (newHP <= 0) {
                setDefeatedPlayer(defender);
                setVictorPlayer(attacker);
                setConfettiTrigger(prev => prev + 1);
                
                // Show floating "DEFEATED!" text (persistent - stays on card)
                showFloatingNumbers(
                  [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: defender, persistent: true }],
                  [],
                  []
                );
                
                addLog('system', `🏆 ${attackerClass.name} wins!`);
              } else {
                // Switch turns after attack completes
                const nextTurn = attacker === 'player1' ? 'player2' : 'player1';
                console.log('[TestPage] Switching turn from', attacker, 'to', nextTurn);
                setTimeout(() => {
                  setCurrentTurn(nextTurn);
                  setIsMoveInProgress(false);
                }, 450);
                return; // Early return to prevent double execution
              }
            }
          ]
        );
      },
      undefined, // onComplete
      cardRotation,
      undefined, // delay
      projectileType
    );
  };
  
  const testCast = (attacker: 'player1' | 'player2') => {
    console.log('[TestPage] testCast called for', attacker);
    // Directly trigger cast effect
    setCastingPlayer(attacker);
    setCastTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
    addLog('system', `🔮 Cast effect triggered for ${attacker === 'player1' ? player1Class.name : player2Class.name}`);
  };

  const testAttackMiss = (attacker: 'player1' | 'player2') => {
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const defender = getOpponent(attacker);
    
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (misses AC ${defenderClass.armorClass})`);
    
    // Get projectile type for flash effect
    const projectileType = getProjectileType(null, undefined, attackerClass.name);
    // Trigger flash effect on attacking card with projectile type
    triggerFlashEffect(attacker, projectileType);
    
    // Trigger cast effect immediately if present
    const missVisualEffects = createMissVisualEffects(attacker, attackerClass);
    const castEffect = missVisualEffects.find(effect => effect.type === 'cast');
    if (castEffect) {
      applyVisualEffect(castEffect);
    }
    
    // Show projectile effect that misses the target
    const cardRotation = attacker === 'player1' ? -5 : 5;
    showProjectileEffect(
      attacker,
      defender,
      false, // isHit
      undefined, // onHit
      () => {
        // After projectile misses, show miss effects
        showFloatingNumbers(
          [{ value: 'MISS', type: 'miss', targetPlayer: attacker }],
          createMissVisualEffects(attacker, attackerClass),
          [
            () => {
              addLog('attack', `❌ ${attackerClass.name} misses!`);
              addLog('narrative', mockBattleNarrative(`${attackerClass.name} attacks ${defenderClass.name} but misses.`));
              // Switch turns after miss
              const nextTurn = attacker === 'player1' ? 'player2' : 'player1';
              setTimeout(() => {
                setCurrentTurn(nextTurn);
                setIsMoveInProgress(false);
              }, 650);
            }
          ]
        );
      },
      cardRotation,
      undefined, // delay
      projectileType
    );
  };
  
  const testHeal = (player: 'player1' | 'player2') => {
    const playerClass = player === 'player1' ? player1Class : player2Class;
    
    const heal = rollDiceWithNotation('1d8+3');
    
    addLog('roll', `✨ ${playerClass.name} uses Test Heal!`);
    
    const newHP = Math.min(playerClass.maxHitPoints, playerClass.hitPoints + heal);
    
    // Build visual effects array using the proper helper function (includes cast effect for spell-casting classes)
    const visualEffects = createHealingVisualEffects(player, heal, playerClass);
    
    // Show floating healing number immediately
    showFloatingNumbers(
      [{ value: heal, type: 'healing', targetPlayer: player }],
      visualEffects,
      [
        () => updatePlayerHP(player, newHP),
        () => {
          addLog('ability', `💚 ${playerClass.name} heals for ${heal} HP!`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} uses Test Heal and recovers ${heal} HP.`));
          // Switch turns after heal
          const nextTurn = player === 'player1' ? 'player2' : 'player1';
          setTimeout(() => {
            setCurrentTurn(nextTurn);
            setIsMoveInProgress(false);
          }, 450);
        }
      ]
    );
  };
  
  const testLowDamage = (target: 'player1' | 'player2') => {
    const targetClass = target === 'player1' ? player1Class : player2Class;
    const attackerName = target === 'player1' ? 'Test Attacker' : 'Test Attacker';
    
    // Deal minimal damage (1-2 HP) to test low intensity shake
    const damage = Math.floor(Math.random() * 2) + 1; // 1 or 2 damage
    
    addLog('roll', `💥 ${attackerName} uses Low Damage Test!`);
    
    const newHP = Math.max(0, targetClass.hitPoints - damage);
    
    // Show floating damage number immediately
    showFloatingNumbers(
      [{ value: damage, type: 'damage', targetPlayer: target }],
      [{ type: 'shake', player: target, intensity: damage }],
      [
        () => updatePlayerHP(target, newHP),
        () => {
          addLog('attack', `💥 ${attackerName} deals ${damage} damage to ${targetClass.name}! (Low damage test)`);
          addLog('narrative', mockBattleNarrative(`${attackerName} deals minimal ${damage} damage to ${targetClass.name}!`));
          
          if (newHP <= 0) {
            setDefeatedPlayer(target);
            
            // Show floating "DEFEATED!" text (persistent - stays on card)
            showFloatingNumbers(
              [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: target, persistent: true }],
              [],
              []
            );
            
            addLog('system', `💀 ${targetClass.name} is defeated!`);
          }
        }
      ]
    );
  };

  const testLowHeal = (player: 'player1' | 'player2') => {
    const playerClass = player === 'player1' ? player1Class : player2Class;
    const heal = Math.floor(Math.random() * 2) + 1; // 1 or 2 healing
    
    addLog('roll', `✨ ${playerClass.name} uses Low Heal!`);
    
    const newHP = Math.min(playerClass.maxHitPoints, playerClass.hitPoints + heal);
    
    // Show floating healing number immediately
    showFloatingNumbers(
      [{ value: heal, type: 'healing', targetPlayer: player }],
      [{ type: 'sparkle', player, intensity: heal }],
      [
        () => updatePlayerHP(player, newHP),
        () => {
          addLog('ability', `💚 ${playerClass.name} heals for ${heal} HP! (Low heal test)`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} uses Low Heal and recovers ${heal} HP.`));
        }
      ]
    );
  };

  const testHighDamage = (target: 'player1' | 'player2') => {
    const targetClass = target === 'player1' ? player1Class : player2Class;
    const attackerName = target === 'player1' ? 'Test Attacker' : 'Test Attacker';
    
    // Calculate high damage (40% of max HP or 50% of current HP, whichever is larger)
    const damageFromMaxPercent = Math.ceil(targetClass.maxHitPoints * 0.4);
    const damageFromCurrentPercent = Math.ceil(targetClass.hitPoints * 0.5);
    const damage = Math.max(damageFromMaxPercent, damageFromCurrentPercent);
    
    addLog('roll', `💥 ${attackerName} uses High Damage Test!`);
    
    const newHP = Math.max(0, targetClass.hitPoints - damage);
    
    // Show floating damage number immediately
    showFloatingNumbers(
      [{ value: damage, type: 'damage', targetPlayer: target }],
      [{ type: 'shake', player: target, intensity: damage }],
      [
        () => updatePlayerHP(target, newHP),
        () => {
          addLog('attack', `💥 ${attackerName} deals ${damage} damage to ${targetClass.name}!`);
          addLog('narrative', mockBattleNarrative(`${attackerName} deals massive ${damage} damage to ${targetClass.name}!`));
          
          if (newHP <= 0) {
            setDefeatedPlayer(target);
            
            // Show floating "DEFEATED!" text (persistent - stays on card)
            showFloatingNumbers(
              [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: target, persistent: true }],
              [],
              []
            );
            
            addLog('system', `💀 ${targetClass.name} is defeated!`);
          }
        }
      ]
    );
  };
  
  const testFullHeal = (player: 'player1' | 'player2') => {
    const playerClass = player === 'player1' ? player1Class : player2Class;
    const healAmount = playerClass.maxHitPoints - playerClass.hitPoints;
    
    if (healAmount <= 0) {
      addLog('system', `💚 ${playerClass.name} is already at full health!`);
      return;
    }
    
    addLog('roll', `✨ ${playerClass.name} uses Full Heal!`);
    
    // Show floating healing number immediately
    showFloatingNumbers(
      [{ value: healAmount, type: 'healing', targetPlayer: player }],
      [{ type: 'sparkle', player, intensity: healAmount }],
      [
        () => updatePlayerHP(player, playerClass.maxHitPoints),
        () => {
          addLog('ability', `💚 ${playerClass.name} fully heals to ${playerClass.maxHitPoints} HP!`);
          addLog('narrative', mockBattleNarrative(`${playerClass.name} is fully restored to maximum health!`));
        }
      ]
    );
  };

  // Test ability handler - handles all ability types
  const testUseAbility = (player: 'player1' | 'player2', abilityIndex: number) => {
    if (isMoveInProgress) return;
    
    setIsMoveInProgress(true);
    const attackerClass = player === 'player1' ? player1Class : player2Class;
    const defenderClass = player === 'player1' ? player2Class : player1Class;
    const ability = attackerClass.abilities[abilityIndex];
    
    if (!ability) {
      setIsMoveInProgress(false);
      return;
    }
    
    addLog('roll', `✨ ${attackerClass.name} uses ${ability.name}!`);
    
    if (ability.type === 'healing') {
      // Handle healing ability
      const heal = rollDiceWithNotation(ability.healingDice);
      const newHP = Math.min(attackerClass.maxHitPoints, attackerClass.hitPoints + heal);
      
      // Show floating healing number immediately
      showFloatingNumbers(
        [{ value: heal, type: 'healing', targetPlayer: player }],
        createHealingVisualEffects(player, heal, attackerClass),
        [
          () => updatePlayerHP(player, newHP),
          () => {
            addLog('ability', `💚 ${attackerClass.name} heals for ${heal} HP!`);
            addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} and heals for ${heal} HP.`));
            const nextTurn = player === 'player1' ? 'player2' : 'player1';
            setTimeout(() => {
              setCurrentTurn(nextTurn);
              setIsMoveInProgress(false);
            }, 450);
          }
        ]
      );
    } else if (ability.type === 'attack') {
      const attackAbility = ability as AttackAbility;
      const numAttacks = attackAbility.attacks || 1;
      const defender = getOpponent(player);
      const cardRotation = player === 'player1' ? -5 : 5;
      const projectileType = getProjectileType(attackAbility, undefined, attackerClass.name);
      
      // Trigger flash and cast effects for attack abilities only
      triggerFlashEffect(player, projectileType);
      // Trigger cast effect immediately for attacks
      const attackVisualEffects = createHitVisualEffects(player, defender, 0, defenderClass, attackerClass);
      const castEffect = attackVisualEffects.find(effect => effect.type === 'cast');
      if (castEffect) {
        applyVisualEffect(castEffect);
      }
      
      if (numAttacks > 1) {
        // Handle multi-attack
        const attackRolls: number[] = [];
        const d20Rolls: number[] = [];
        const damages: number[] = [];
        const hits: boolean[] = [];
        let totalDamage = 0;
        
        for (let i = 0; i < numAttacks; i++) {
          const d20Roll = rollDice('d20');
          d20Rolls.push(d20Roll);
          const attackRoll = d20Roll + attackerClass.attackBonus;
          attackRolls.push(attackRoll);
          const hit = attackRoll >= defenderClass.armorClass;
          hits.push(hit);
          
          if (hit) {
            const { totalDamage: damage } = buildDamageDiceArray(
              attackAbility.damageDice,
              rollDiceWithNotation,
              parseDiceNotation,
              attackAbility.bonusDamageDice
            );
            damages.push(damage);
            totalDamage += damage;
          } else {
            damages.push(0);
          }
        }
        
        const newHP = totalDamage > 0 ? Math.max(0, defenderClass.hitPoints - totalDamage) : defenderClass.hitPoints;
        const successfulHits = hits.map((hit, i) => ({ hit, damage: damages[i], index: i })).filter(h => h.hit);
        
        if (successfulHits.length > 0) {
          // Show one projectile per successful hit with staggered delays
          const damageNumbers: Array<{ value: number; type: FloatingNumberType; targetPlayer: 'player1' | 'player2' }> = [];
          const completedHitsRef = { count: 0 };
          
          successfulHits.forEach((hitData, hitIndex) => {
            const delay = hitIndex * 100; // 100ms delay between each projectile
            
            showProjectileEffect(
              player,
              defender,
              true, // isHit
              () => {
                // On projectile hit: trigger shake and show individual damage
                const shakeEffect = createHitVisualEffects(player, defender, hitData.damage, defenderClass, attackerClass)
                  .find(effect => effect.type === 'shake');
                if (shakeEffect) {
                  applyVisualEffect(shakeEffect);
                }
                
                // Add this hit's damage to the numbers array
                damageNumbers.push({ value: hitData.damage, type: 'damage', targetPlayer: defender });
                completedHitsRef.count++;
                
                // If this is the last hit, show all damage numbers and complete
                if (completedHitsRef.count === successfulHits.length) {
                  const visualEffects = createHitVisualEffects(player, defender, totalDamage, defenderClass, attackerClass)
                    .filter(effect => effect.type !== 'shake');
                  
                  showFloatingNumbers(
                    damageNumbers,
                    visualEffects,
                    [
                      () => updatePlayerHP(defender, newHP),
                      () => {
                        addLog('roll', `🎲 ${attackerClass.name} makes ${numAttacks} attacks: ${attackRolls.join(', ')}`);
                        const hitDetails = hits.map((hit, i) => 
                          hit ? `Attack ${i + 1} hits for ${damages[i]} damage.` : `Attack ${i + 1} misses.`
                        ).join(' ');
                        addLog('attack', `⚔️ ${attackerClass.name} uses ${ability.name}: ${hitDetails} Total damage: ${totalDamage}!`);
                        addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. Total damage: ${totalDamage}.`));
                        
                        if (newHP <= 0) {
                          setDefeatedPlayer(defender);
                          setVictorPlayer(player);
                          setConfettiTrigger(prev => prev + 1);
                          
                          // Show floating "DEFEATED!" text
                          showFloatingNumbers(
                            [{ value: 'DEFEATED!', type: 'defeated', targetPlayer: defender }],
                            [],
                            []
                          );
                          
                          addLog('system', `🏆 ${attackerClass.name} wins!`);
                        } else {
                          const nextTurn = player === 'player1' ? 'player2' : 'player1';
                          setTimeout(() => {
                            setCurrentTurn(nextTurn);
                            setIsMoveInProgress(false);
                          }, 450);
                        }
                      }
                    ]
                  );
                }
              },
              undefined, // onComplete - handled in onHit for last projectile
              cardRotation,
              delay,
              projectileType
            );
          });
        } else {
          // All attacks missed - show projectile effect that misses the target
          showProjectileEffect(
            player,
            defender,
            false, // isHit
            undefined, // onHit
            () => {
              // After projectile misses, show miss effects
              showFloatingNumbers(
                [{ value: 'MISS', type: 'miss', targetPlayer: player }],
                createMissVisualEffects(player, attackerClass),
                [
                  () => {
                    addLog('roll', `🎲 ${attackerClass.name} makes ${numAttacks} attacks: ${attackRolls.join(', ')}`);
                    addLog('attack', `❌ ${attackerClass.name} uses ${ability.name} but all attacks miss!`);
                    addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} but all attacks miss.`));
                    const nextTurn = player === 'player1' ? 'player2' : 'player1';
                    setTimeout(() => {
                      setCurrentTurn(nextTurn);
                      setIsMoveInProgress(false);
                    }, 650);
                  }
                ]
              );
            },
            cardRotation,
            undefined, // delay
            projectileType
          );
        }
      } else if (attackAbility.attackRoll) {
        // Handle single attack with roll
        const d20Roll = rollDice('d20');
        const attackRoll = d20Roll + attackerClass.attackBonus;
        
        addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll} + ${attackerClass.attackBonus} = ${attackRoll} (vs AC ${defenderClass.armorClass})`);
        
        if (attackRoll >= defenderClass.armorClass) {
          const { totalDamage: damage } = buildDamageDiceArray(
            attackAbility.damageDice,
            rollDiceWithNotation,
            parseDiceNotation,
            attackAbility.bonusDamageDice
          );
          
          const newHP = Math.max(0, defenderClass.hitPoints - damage);
          
          // Create visual effects, but exclude shake (will be triggered by projectile hit)
          const visualEffects = createHitVisualEffects(player, defender, damage, defenderClass, attackerClass)
            .filter(effect => effect.type !== 'shake'); // Remove shake, will be triggered on projectile hit
          
          // Show projectile effect
          showProjectileEffect(
            player,
            defender,
            true, // isHit
            () => {
              // On projectile hit: trigger shake and show damage
              const shakeEffect = createHitVisualEffects(player, defender, damage, defenderClass, attackerClass)
                .find(effect => effect.type === 'shake');
              if (shakeEffect) {
                applyVisualEffect(shakeEffect);
              }
              
              // Show floating damage number when projectile hits
              showFloatingNumbers(
                [{ value: damage, type: 'damage', targetPlayer: defender }],
                visualEffects, // Other effects (hit, cast) shown immediately
                [
                  () => updatePlayerHP(defender, newHP),
                  () => {
                    addLog('attack', `⚔️ ${attackerClass.name} hits for ${damage} damage!`);
                    addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} and hits for ${damage} damage.`));
                    
                    if (newHP <= 0) {
                      setDefeatedPlayer(defender);
                      setVictorPlayer(player);
                      setConfettiTrigger(prev => prev + 1);
                      addLog('system', `🏆 ${attackerClass.name} wins!`);
                    } else {
                      const nextTurn = player === 'player1' ? 'player2' : 'player1';
                      setTimeout(() => {
                        setCurrentTurn(nextTurn);
                        setIsMoveInProgress(false);
                      }, 450);
                    }
                  }
                ]
              );
            },
            undefined, // onComplete
            cardRotation,
            undefined, // delay
            projectileType
          );
        } else {
          // Miss - show projectile effect that misses the target
          showProjectileEffect(
            player,
            defender,
            false, // isHit
            undefined, // onHit
            () => {
              // After projectile misses, show miss effects
              showFloatingNumbers(
                [{ value: 'MISS', type: 'miss', targetPlayer: player }],
                createMissVisualEffects(player, attackerClass),
                [
                  () => {
                    addLog('attack', `❌ ${attackerClass.name} misses!`);
                    addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} but misses.`));
                    const nextTurn = player === 'player1' ? 'player2' : 'player1';
                    setTimeout(() => {
                      setCurrentTurn(nextTurn);
                      setIsMoveInProgress(false);
                    }, 650);
                  }
                ]
              );
            },
            cardRotation,
            undefined, // delay
            projectileType
          );
        }
      } else {
        // Handle automatic damage (no attack roll)
        const { totalDamage: damage } = buildDamageDiceArray(
          attackAbility.damageDice,
          rollDiceWithNotation,
          parseDiceNotation,
          attackAbility.bonusDamageDice
        );
        const newHP = Math.max(0, defenderClass.hitPoints - damage);
        
        // Create visual effects, but exclude shake (will be triggered by projectile hit)
        const visualEffects = createHitVisualEffects(player, defender, damage, defenderClass, attackerClass)
          .filter(effect => effect.type !== 'shake'); // Remove shake, will be triggered on projectile hit
        
        // Show projectile effect
        showProjectileEffect(
          player,
          defender,
          true, // isHit
          () => {
            // On projectile hit: trigger shake and show damage
            const shakeEffect = createHitVisualEffects(player, defender, damage, defenderClass, attackerClass)
              .find(effect => effect.type === 'shake');
            if (shakeEffect) {
              applyVisualEffect(shakeEffect);
            }
            
            // Show floating damage number when projectile hits
            showFloatingNumbers(
              [{ value: damage, type: 'damage', targetPlayer: defender }],
              visualEffects, // Other effects (hit, cast) shown immediately
              [
                () => updatePlayerHP(defender, newHP),
                () => {
                  addLog('attack', `⚔️ ${attackerClass.name} deals ${damage} damage!`);
                  addLog('narrative', mockBattleNarrative(`${attackerClass.name} uses ${ability.name} and deals ${damage} damage.`));
                  
                  if (newHP <= 0) {
                    setDefeatedPlayer(defender);
                    setVictorPlayer(player);
                    setConfettiTrigger(prev => prev + 1);
                    addLog('system', `🏆 ${attackerClass.name} wins!`);
                  } else {
                    const nextTurn = player === 'player1' ? 'player2' : 'player1';
                    setTimeout(() => {
                      setCurrentTurn(nextTurn);
                      setIsMoveInProgress(false);
                    }, 450);
                  }
                }
              ]
            );
          },
          undefined, // onComplete
          cardRotation,
          undefined, // delay
          projectileType
        );
      }
    }
  };
  
  // Use AI opponent hook
  const aiOpponentCleanup = useAIOpponent({
    isActive: isAIModeActive,
    currentTurn,
    isMoveInProgress,
    defeatedPlayer,
    opponentClass: player2Class,
    playerId: 'player2', // Which player this AI controls
    callbacks: {
      onAttack: () => testAttackHit('player2'),
      onUseAbility: (abilityIndex: number) => {
        testUseAbility('player2', abilityIndex);
      },
      onHeal: () => testHeal('player2'),
    },
    onStateChange: setIsOpponentAutoPlaying,
    onMoveInProgressChange: setIsMoveInProgress,
    debugLog: (message: string) => console.log(message),
  });

  const resetTest = () => {
    setPlayer1Class(prev => ({ ...prev, hitPoints: prev.maxHitPoints }));
    setPlayer2Class(prev => ({ ...prev, hitPoints: prev.maxHitPoints }));
    setBattleLog([]);
    setDefeatedPlayer(null);
    setVictorPlayer(null);
    setShakingPlayer(null);
    setSparklingPlayer(null);
    setMissingPlayer(null);
    setHittingPlayer(null);
    setShakeTrigger({ player1: 0, player2: 0 });
    setSparkleTrigger({ player1: 0, player2: 0 });
    setMissTrigger({ player1: 0, player2: 0 });
    setHitTrigger({ player1: 0, player2: 0 });
    setCastingPlayer(null);
    setCastTrigger({ player1: 0, player2: 0 });
    setFlashingPlayer(null);
    setFlashTrigger({ player1: 0, player2: 0 });
    setFlashProjectileType({ player1: null, player2: null });
    setCastProjectileType({ player1: null, player2: null });
    setShakeIntensity({ player1: 0, player2: 0 });
    setSparkleIntensity({ player1: 0, player2: 0 });
    setManualEmotion1(null);
    setManualEmotion2(null);
    setCurrentTurn('player1');
    setIsMoveInProgress(false);
    setIsOpponentAutoPlaying(false);
    // Clear floating numbers
    setFloatingNumbers([]);
    // Clear projectile effects
    setProjectileEffects([]);
    // Clear projectile tracking ref
    lastProjectileTimeRef.current = {};
    // Note: We don't reset monster IDs here - they should persist with the selected character
    aiOpponentCleanup.cleanup();
    addLog('system', '🔄 Test reset');
  };

  // Memoized callback functions for animation completion to prevent unnecessary re-renders
  const handlePlayer1ShakeComplete = useCallback(() => {
    setShakingPlayer(null);
  }, []);

  const handlePlayer1SparkleComplete = useCallback(() => {
    setSparklingPlayer(null);
  }, []);

  const handlePlayer1MissComplete = useCallback(() => {
    setMissingPlayer(null);
  }, []);

  const handlePlayer1HitComplete = useCallback(() => {
    setHittingPlayer(null);
  }, []);

  const handlePlayer2ShakeComplete = useCallback(() => {
    setShakingPlayer(null);
  }, []);

  const handlePlayer2SparkleComplete = useCallback(() => {
    setSparklingPlayer(null);
  }, []);

  const handlePlayer2MissComplete = useCallback(() => {
    setMissingPlayer(null);
  }, []);

  const handlePlayer2HitComplete = useCallback(() => {
    setHittingPlayer(null);
  }, []);

  const handlePlayer1CastComplete = useCallback(() => {
    setCastingPlayer(null);
  }, []);

  const handlePlayer2CastComplete = useCallback(() => {
    setCastingPlayer(null);
  }, []);

  const handlePlayer1FlashComplete = useCallback(() => {
    setFlashingPlayer(null);
  }, []);

  const handlePlayer2FlashComplete = useCallback(() => {
    setFlashingPlayer(null);
  }, []);
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#D1C9BA' }}>
      {/* Landscape Orientation Prompt */}
      <LandscapePrompt />
      
      {/* Floating Numbers */}
      {floatingNumbers.map((number) => (
        <FloatingNumber
          key={number.id}
          value={number.value}
          type={number.type}
          targetCardRef={number.targetPlayer === 'player1' ? player1CardRef : player2CardRef}
          onComplete={() => handleFloatingNumberComplete(number.id)}
          persistent={number.persistent}
        />
      ))}
      
      {/* Projectile Effects */}
      {projectileEffects.map((projectile) => (
        <ProjectileEffect
          key={projectile.id}
          fromCardRef={projectile.fromPlayer === 'player1' ? player1CardRef : player2CardRef}
          toCardRef={projectile.toPlayer === 'player1' ? player1CardRef : player2CardRef}
          isHit={projectile.isHit}
          onHit={projectile.onHit}
          onComplete={() => {
            if (projectile.onComplete) {
              projectile.onComplete();
            }
            removeProjectileEffect(projectile.id);
          }}
          fromCardRotation={projectile.fromCardRotation}
          delay={projectile.delay}
          projectileType={projectile.projectileType}
        />
      ))}
      
      {/* Header */}
      <PageHeader
        title="Test"
        title2="Page"
        decalImageUrl="/cdn/decals/test-page.png"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-0">
        <div className="space-y-6 overflow-visible">
          {/* Global Test Controls */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-4 shadow-2xl">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={testDiceRoll}
                className="py-2 px-4 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg border-2 border-purple-700 transition-all"
              >
                🎲 Test Dice Roll
              </button>
              <button
                onClick={() => {
                  setIsAIModeActive(!isAIModeActive);
                  addLog('system', isAIModeActive ? '🤖 AI mode disabled' : '🤖 AI mode enabled - Player 2 will auto-play');
                }}
                className={`py-2 px-4 font-semibold rounded-lg border-2 transition-all ${
                  isAIModeActive
                    ? 'bg-green-900 hover:bg-green-800 text-white border-green-700'
                    : 'bg-blue-900 hover:bg-blue-800 text-white border-blue-700'
                }`}
              >
                {isAIModeActive ? '🤖 AI Mode: ON' : '🤖 AI Mode: OFF'}
              </button>
              <button
                onClick={resetTest}
                className="py-2 px-4 bg-amber-800 hover:bg-amber-700 text-white font-semibold rounded-lg border-2 border-amber-700 transition-all"
              >
                🔄 Reset Test
              </button>
            </div>
            {isAIModeActive && (
              <div className="mt-3 text-center">
                <p className="text-amber-200 text-sm italic">
                  🤖 AI Mode Active: Player 2 (opponent) will automatically play when it's their turn
                </p>
              </div>
            )}
          </div>

          {/* Character Selection */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Select Characters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player 1 Selection - Always a Class */}
              <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-amber-200">Player 1 (Class)</h3>
                <ClassSelection
                  title="Select Class"
                  availableClasses={[...FALLBACK_CLASSES, ...customHeroes]}
                  selectedClass={player1Class}
                  onSelect={handlePlayer1Select}
                  createdMonsters={createdMonsters}
                />
              </div>

              {/* Player 2 Selection - Can be Class or Monster */}
              <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-amber-200">Player 2</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPlayer2Type('class');
                        const firstClass = FALLBACK_CLASSES[1];
                        setPlayer2Class(createTestEntity(firstClass));
                        setPlayer2Name(generateDeterministicCharacterName(firstClass.name));
                      }}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        player2Type === 'class'
                          ? 'bg-blue-800 text-white border-blue-600'
                          : 'bg-amber-800/50 text-amber-300 border-amber-700 hover:bg-amber-700'
                      }`}
                    >
                      Class
                    </button>
                    <button
                      onClick={() => {
                        setPlayer2Type('monster');
                        const firstMonster = FALLBACK_MONSTERS[0];
                        setPlayer2Class(createTestEntity(firstMonster));
                        setPlayer2Name(firstMonster.name); // Monsters use their type name directly
                      }}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        player2Type === 'monster'
                          ? 'bg-red-800 text-white border-red-600'
                          : 'bg-amber-800/50 text-amber-300 border-amber-700 hover:bg-amber-700'
                      }`}
                    >
                      Monster
                    </button>
                  </div>
                </div>
                {player2Type === 'class' ? (
                  <ClassSelection
                    title="Select Class"
                    availableClasses={[...FALLBACK_CLASSES, ...customHeroes]}
                    selectedClass={player2Class}
                    onSelect={handlePlayer2Select}
                    createdMonsters={createdMonsters}
                  />
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-amber-200">Select Monster</h3>
                    <div className="relative">
                      {/* Left scroll button */}
                      <button
                        onClick={() => {
                          if (monsterScrollRef.current) {
                            monsterScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' }); // Scaled for compact cards
                          }
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
                        aria-label="Scroll left"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Scrollable container */}
                      <div
                        ref={monsterScrollRef}
                        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-4 px-10"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }}
                      >
                        {[...FALLBACK_MONSTERS, ...customMonsters].map((monster, index) => {
                          const isSelected = player2Class?.name === monster.name;
                          // For created monsters, use klass to find associated monster; for regular monsters, use name
                          const isCreatedMonster = !!(monster as any).klass && !!(monster as any).monsterId;
                          const lookupName = isCreatedMonster ? (monster as any).klass : monster.name;
                          const associatedMonster = findAssociatedMonster(lookupName);
                          const monsterImageUrl = associatedMonster 
                            ? `/cdn/monsters/${associatedMonster.monsterId}/280x200.png`
                            : undefined;
                          // Generate cutout URL if monster has cutout images (hasCutout === true)
                          // For backward compatibility, also try if hasCutout is undefined (old monsters)
                          // CharacterCard will handle 404s gracefully if cutout doesn't exist
                          const hasCutout = (associatedMonster as any)?.hasCutout;
                          const monsterCutOutImageUrl = associatedMonster && hasCutout !== false
                            ? `/cdn/monsters/${associatedMonster.monsterId}/280x200-cutout.png`
                            : undefined;
                          
                          return (
                            <div
                              key={monster.name}
                              onClick={() => handlePlayer2Select(createTestEntity(monster))}
                              className="flex-shrink-0 cursor-pointer transition-all"
                              style={{
                                transform: isSelected ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
                                padding: '4px', // Add padding to accommodate zoom without overflow
                              }}
                            >
                              <CharacterCard
                                playerClass={{ ...monster, hitPoints: monster.maxHitPoints }}
                                characterName={monster.name}
                                monsterImageUrl={monsterImageUrl}
                                monsterCutOutImageUrl={monsterCutOutImageUrl}
                                size="compact"
                                cardIndex={index}
                                totalCards={FALLBACK_MONSTERS.length + customMonsters.length}
                                isSelected={isSelected}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Right scroll button */}
                      <button
                        onClick={() => {
                          if (monsterScrollRef.current) {
                            monsterScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' }); // Scaled for compact cards
                          }
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-amber-900/90 hover:bg-amber-800 text-amber-100 p-2 rounded-full border-2 border-amber-700 shadow-lg transition-all"
                        aria-label="Scroll right"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className="relative flex items-center justify-center gap-4 md:gap-8 -mx-4 sm:-mx-6 overflow-visible">
            {/* Darker band background */}
            <div 
              className="absolute rounded-lg"
              style={{ 
                backgroundColor: '#BDB6A8',
                top: '20%',
                bottom: '20%',
                left: '-60px',
                right: '-60px',
                width: 'calc(100% + 120px)',
              }}
            />
            {/* Left Card - Rotated counter-clockwise (outward) */}
            <div ref={player1CardRef} className="relative z-10 space-y-3" style={{ transform: 'rotate(-5deg)', overflow: 'visible' }}>
              <CharacterCard
                playerClass={player1Class}
                characterName={player1Name || 'Loading...'}
                monsterImageUrl={player1MonsterId ? `/cdn/monsters/${player1MonsterId}/280x200.png` : undefined}
                monsterCutOutImageUrl={(() => {
                  if (!player1MonsterId || !player1Class) return undefined;
                  const associatedMonster = findAssociatedMonster(player1Class.name);
                  // For backward compatibility, try if hasCutout is not explicitly false
                  const hasCutout = (associatedMonster as any)?.hasCutout;
                  return associatedMonster && hasCutout !== false
                    ? `/cdn/monsters/${player1MonsterId}/280x200-cutout.png`
                    : undefined;
                })()}
                onAttack={() => {
                  setIsMoveInProgress(true);
                  testAttackHit('player1');
                }}
                onUseAbility={(index) => {
                  testUseAbility('player1', index);
                }}
                isOpponent={false}
                isMoveInProgress={isMoveInProgress}
                shouldShake={shakingPlayer === 'player1'}
                shouldSparkle={sparklingPlayer === 'player1'}
                shouldMiss={missingPlayer === 'player1'}
                shouldHit={hittingPlayer === 'player1'}
                shouldCast={castingPlayer === 'player1'}
                shouldFlash={flashingPlayer === 'player1'}
                castTrigger={castTrigger.player1}
                flashTrigger={flashTrigger.player1}
                flashProjectileType={flashProjectileType.player1}
                castProjectileType={castProjectileType.player1}
                shakeTrigger={shakeTrigger.player1}
                sparkleTrigger={sparkleTrigger.player1}
                missTrigger={missTrigger.player1}
                hitTrigger={hitTrigger.player1}
                shakeIntensity={shakeIntensity.player1}
                sparkleIntensity={sparkleIntensity.player1}
                isActive={currentTurn === 'player1'}
                isDefeated={defeatedPlayer === 'player1'}
                isVictor={victorPlayer === 'player1'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={handlePlayer1ShakeComplete}
                onSparkleComplete={handlePlayer1SparkleComplete}
                onMissComplete={handlePlayer1MissComplete}
                onHitComplete={handlePlayer1HitComplete}
                onCastComplete={handlePlayer1CastComplete}
                onFlashComplete={handlePlayer1FlashComplete}
                allowAllTurns={!isAIModeActive}
                imageMarginBottom="1.75rem"
              />
              {/* Test buttons for Player 1 */}
              <div 
                className="flex flex-wrap gap-2"
                style={{ width: '100%', maxWidth: '320px' }}
              >
                <button
                  onClick={() => testHighDamage('player1')}
                  className="px-2 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all"
                >
                  💥 High Damage
                </button>
                <button
                  onClick={() => testLowDamage('player1')}
                  className="px-2 py-1 bg-orange-900 hover:bg-orange-800 text-white text-xs rounded border border-orange-700 transition-all"
                >
                  💥 Low Damage
                </button>
                <button
                  onClick={() => testFullHeal('player1')}
                  className="px-2 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all"
                >
                  💚 Full Heal
                </button>
                <button
                  onClick={() => testLowHeal('player1')}
                  className="px-2 py-1 bg-emerald-900 hover:bg-emerald-800 text-white text-xs rounded border border-emerald-700 transition-all"
                >
                  💚 Low Heal
                </button>
                <button
                  onClick={() => testAttackMiss('player1')}
                  className="px-2 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"
                >
                  ❌ Test Miss
                </button>
                <button
                  onClick={() => testCast('player1')}
                  className="px-2 py-1 bg-purple-800 hover:bg-purple-700 text-purple-100 text-xs rounded border border-purple-600 transition-all"
                >
                  🔮 Test Cast
                </button>
              </div>
            </div>
            {/* VS Graphic */}
            <div className="relative z-10 flex-shrink-0">
              <span className="text-5xl md:text-6xl font-bold" style={{ color: '#E0D9C9', fontFamily: 'serif' }}>
                VS
              </span>
            </div>
            {/* Right Card - Rotated clockwise (outward) */}
            <div ref={player2CardRef} className="relative z-10 space-y-3" style={{ transform: 'rotate(5deg)', overflow: 'visible' }}>
              <CharacterCard
                playerClass={player2Class}
                characterName={player2Name || 'Loading...'}
                monsterImageUrl={player2MonsterId ? `/cdn/monsters/${player2MonsterId}/280x200.png` : undefined}
                monsterCutOutImageUrl={(() => {
                  if (!player2MonsterId || !player2Class) return undefined;
                  const associatedMonster = findAssociatedMonster(player2Class.name);
                  // For backward compatibility, try if hasCutout is not explicitly false
                  const hasCutout = (associatedMonster as any)?.hasCutout;
                  return associatedMonster && hasCutout !== false
                    ? `/cdn/monsters/${player2MonsterId}/280x200-cutout.png`
                    : undefined;
                })()}
                onAttack={() => {
                  if (isAIModeActive) return; // Don't allow manual control in AI mode
                  setIsMoveInProgress(true);
                  testAttackHit('player2');
                }}
                onUseAbility={(index) => {
                  if (isAIModeActive) return; // Don't allow manual control in AI mode
                  testUseAbility('player2', index);
                }}
                isOpponent={true}
                isMoveInProgress={isMoveInProgress}
                shouldShake={shakingPlayer === 'player2'}
                shouldSparkle={sparklingPlayer === 'player2'}
                shouldMiss={missingPlayer === 'player2'}
                shouldHit={hittingPlayer === 'player2'}
                shouldCast={castingPlayer === 'player2'}
                shouldFlash={flashingPlayer === 'player2'}
                castTrigger={castTrigger.player2}
                flashTrigger={flashTrigger.player2}
                flashProjectileType={flashProjectileType.player2}
                castProjectileType={castProjectileType.player2}
                shakeTrigger={shakeTrigger.player2}
                sparkleTrigger={sparkleTrigger.player2}
                missTrigger={missTrigger.player2}
                hitTrigger={hitTrigger.player2}
                shakeIntensity={shakeIntensity.player2}
                sparkleIntensity={sparkleIntensity.player2}
                isActive={currentTurn === 'player2'}
                isDefeated={defeatedPlayer === 'player2'}
                isVictor={victorPlayer === 'player2'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={handlePlayer2ShakeComplete}
                onSparkleComplete={handlePlayer2SparkleComplete}
                onMissComplete={handlePlayer2MissComplete}
                onHitComplete={handlePlayer2HitComplete}
                onCastComplete={handlePlayer2CastComplete}
                onFlashComplete={handlePlayer2FlashComplete}
                allowAllTurns={!isAIModeActive}
                imageMarginBottom="1.75rem"
              />
              {/* Test buttons for Player 2 */}
              <div 
                className="flex flex-wrap gap-2"
                style={{ width: '100%', maxWidth: '320px' }}
              >
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testHighDamage('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💥 High Damage
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testLowDamage('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-orange-900 hover:bg-orange-800 text-white text-xs rounded border border-orange-700 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💥 Low Damage
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testFullHeal('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💚 Full Heal
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testLowHeal('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-emerald-900 hover:bg-emerald-800 text-white text-xs rounded border border-emerald-700 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💚 Low Heal
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testAttackMiss('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ❌ Test Miss
                </button>
                <button
                  onClick={() => {
                    if (isAIModeActive) return;
                    testCast('player2');
                  }}
                  disabled={isAIModeActive}
                  className={`px-2 py-1 bg-purple-800 hover:bg-purple-700 text-purple-100 text-xs rounded border border-purple-600 transition-all ${isAIModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🔮 Test Cast
                </button>
              </div>
            </div>
          </div>

          {/* Projectile Type Test Buttons */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <h3 className="text-lg font-bold text-amber-100" style={{ fontFamily: 'serif' }}>
                Test Projectile Types
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-amber-200 font-semibold">Effects:</label>
                {/* Particle Effects Toggle */}
                <button
                  onClick={() => {
                    setParticleEffectsEnabled(!particleEffectsEnabled);
                    addLog('system', `🎨 Particle effects ${!particleEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    particleEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Particle Effects"
                >
                  Particle: {particleEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Flash Effects Toggle */}
                <button
                  onClick={() => {
                    setFlashEffectsEnabled(!flashEffectsEnabled);
                    addLog('system', `⚡ Flash effects ${!flashEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    flashEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Flash/Glow Effects"
                >
                  Flash: {flashEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Shake Effects Toggle */}
                <button
                  onClick={() => {
                    setShakeEffectsEnabled(!shakeEffectsEnabled);
                    addLog('system', `💥 Shake effects ${!shakeEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    shakeEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Shake Effects"
                >
                  Shake: {shakeEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Sparkle Effects Toggle */}
                <button
                  onClick={() => {
                    setSparkleEffectsEnabled(!sparkleEffectsEnabled);
                    addLog('system', `✨ Sparkle effects ${!sparkleEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    sparkleEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Sparkle Effects"
                >
                  Sparkle: {sparkleEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Hit Effects Toggle */}
                <button
                  onClick={() => {
                    setHitEffectsEnabled(!hitEffectsEnabled);
                    addLog('system', `⚔️ Hit effects ${!hitEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    hitEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Hit Effects"
                >
                  Hit: {hitEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Miss Effects Toggle */}
                <button
                  onClick={() => {
                    setMissEffectsEnabled(!missEffectsEnabled);
                    addLog('system', `❌ Miss effects ${!missEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    missEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Miss Effects"
                >
                  Miss: {missEffectsEnabled ? 'ON' : 'OFF'}
                </button>
                {/* Cast Effects Toggle */}
                <button
                  onClick={() => {
                    setCastEffectsEnabled(!castEffectsEnabled);
                    addLog('system', `🔮 Cast effects ${!castEffectsEnabled ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded border-2 transition-all ${
                    castEffectsEnabled
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                      : 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  }`}
                  title="Cast Effects"
                >
                  Cast: {castEffectsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {(['fire', 'ice', 'water', 'earth', 'air', 'poison', 'psychic', 'necrotic', 'radiant', 'lightning', 'acid', 'melee', 'ranged', 'magic', 'shadow'] as ProjectileType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const attacker = 'player1';
                    const defender = 'player2';
                    const cardRotation = attacker === 'player1' ? -5 : 5;
                    // Trigger flash effect on attacking card with projectile type
                    triggerFlashEffect(attacker, type);
                    // Trigger cast effect for spell-casting classes
                    const visualEffects = createHitVisualEffects(attacker, defender, 5, player2Class, player1Class);
                    const castEffect = visualEffects.find(effect => effect.type === 'cast');
                    if (castEffect) {
                      applyVisualEffect(castEffect);
                    }
                    showProjectileEffect(
                      attacker,
                      defender,
                      true, // isHit
                      () => {
                        const damage = 5;
                        const defenderClass = player2Class;
                        const newHP = Math.max(0, defenderClass.hitPoints - damage);
                        const shakeEffect = createHitVisualEffects(attacker, defender, damage, defenderClass, player1Class)
                          .find(effect => effect.type === 'shake');
                        if (shakeEffect) {
                          applyVisualEffect(shakeEffect);
                        }
                        showFloatingNumbers(
                          [{ value: damage, type: 'damage', targetPlayer: defender }],
                          createHitVisualEffects(attacker, defender, damage, defenderClass, player1Class)
                            .filter(effect => effect.type !== 'shake'),
                          [
                            () => updatePlayerHP(defender, newHP),
                            () => addLog('system', `🧪 Test ${type} projectile`)
                          ]
                        );
                      },
                      undefined, // onComplete
                      cardRotation,
                      undefined, // delay
                      type
                    );
                  }}
                  className="py-2 px-3 bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold rounded border border-amber-600 transition-all capitalize"
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => {
                  const attacker = 'player1';
                  const defender = 'player2';
                  const cardRotation = attacker === 'player1' ? -5 : 5;
                  // Trigger flash effect on attacking card with projectile type
                  triggerFlashEffect(attacker, 'magic');
                  showProjectileEffect(
                    attacker,
                    defender,
                    false, // isHit - miss
                    undefined, // onHit
                    () => {
                      showFloatingNumbers(
                        [{ value: 'MISS', type: 'miss', targetPlayer: attacker }],
                        createMissVisualEffects(attacker, player1Class),
                        [() => addLog('system', '🧪 Test projectile miss')]
                      );
                    },
                    cardRotation,
                    undefined, // delay
                    'magic'
                  );
                }}
                className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded border border-gray-500 transition-all"
              >
                Test Miss
              </button>
            </div>
          </div>

          {/* Test Log */}
          <div 
            className="bg-white p-6 shadow-lg overflow-y-auto -mx-4 sm:-mx-6 border-t-4 border-l-4 border-r-4" 
            style={{ 
              borderColor: '#5C4033',
              borderTopLeftRadius: '0.5rem',
              borderTopRightRadius: '0.5rem',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
              marginBottom: '-1.5rem',
              marginLeft: '-1rem',
              marginRight: '-1rem',
              minHeight: 'calc(100vh - 500px)',
              paddingBottom: '2rem',
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              Test Log
            </h2>
            <div className="space-y-2 text-sm">
              {battleLog.length === 0 && (
                <div className="text-gray-500 italic">Test log is empty...</div>
              )}
              {[...battleLog].reverse().map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded ${
                    log.type === 'attack' ? 'bg-red-50 text-red-800 font-mono' :
                    log.type === 'ability' ? 'bg-purple-50 text-purple-800 font-mono' :
                    log.type === 'roll' ? 'text-red-600' :
                    log.type === 'narrative' ? 'text-gray-800' :
                    'bg-gray-50 text-gray-700 font-mono'
                  }`}
                >
                  <span style={log.type === 'roll' ? { color: '#DC2626', fontFamily: 'serif' } : {}}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

