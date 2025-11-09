'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Ability type definitions
interface AttackAbility {
  name: string;
  type: 'attack';
  damageDice: string; // e.g., "1d10", "3d6", "2d8"
  attackRoll: boolean; // Whether this requires an attack roll (true) or is automatic damage (false)
  attacks?: number; // Number of attacks (for multi-attack abilities, default: 1)
  bonusDamageDice?: string; // Optional bonus damage dice (e.g., "2d6" for sneak attack)
  description: string;
}

interface HealingAbility {
  name: string;
  type: 'healing';
  healingDice: string; // e.g., "1d8+3", "2d4+2"
  description: string;
}

type Ability = AttackAbility | HealingAbility;

// D&D Class definitions
interface DnDClass {
  name: string;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  abilities: Ability[];
  description: string;
  color: string;
}

// Default fallback classes in case OpenRAG fetch fails
const FALLBACK_CLASSES: DnDClass[] = [
  {
    name: 'Fighter',
    hitPoints: 30,
    maxHitPoints: 30,
    armorClass: 18,
    attackBonus: 5,
    damageDie: 'd10',
    abilities: [],
    description: 'A master of weapons and armor, the Fighter excels in combat.',
    color: 'bg-red-900',
  },
  {
    name: 'Wizard',
    hitPoints: 20,
    maxHitPoints: 20,
    armorClass: 12,
    attackBonus: 3,
    damageDie: 'd6',
    abilities: [],
    description: 'A wielder of arcane magic, the Wizard commands powerful spells.',
    color: 'bg-blue-900',
  },
  {
    name: 'Rogue',
    hitPoints: 24,
    maxHitPoints: 24,
    armorClass: 15,
    attackBonus: 4,
    damageDie: 'd8',
    abilities: [],
    description: 'A stealthy combatant who strikes from the shadows.',
    color: 'bg-purple-900',
  },
  {
    name: 'Cleric',
    hitPoints: 26,
    maxHitPoints: 26,
    armorClass: 16,
    attackBonus: 4,
    damageDie: 'd8',
    abilities: [],
    description: 'A holy warrior who channels divine power.',
    color: 'bg-yellow-900',
  },
  {
    name: 'Barbarian',
    hitPoints: 35,
    maxHitPoints: 35,
    armorClass: 14,
    attackBonus: 5,
    damageDie: 'd12',
    abilities: [],
    description: 'A fierce warrior who fights with primal fury.',
    color: 'bg-orange-900',
  },
  {
    name: 'Ranger',
    hitPoints: 28,
    maxHitPoints: 28,
    armorClass: 15,
    attackBonus: 4,
    damageDie: 'd10',
    abilities: [],
    description: 'A skilled tracker and archer of the wilderness.',
    color: 'bg-green-900',
  },
];

interface BattleLog {
  type: 'attack' | 'ability' | 'roll' | 'narrative' | 'system';
  message: string;
  timestamp: number;
}

// Roll dice function
function rollDice(dice: string): number {
  // Handle both formats: "d10" (defaults to 1 die) and "1d10" (explicit count)
  let match = dice.match(/(\d+)d(\d+)/);
  if (!match) {
    // Try format without count (e.g., "d10" means "1d10")
    match = dice.match(/d(\d+)/);
    if (!match) return 0;
    const sides = parseInt(match[1]);
    return Math.floor(Math.random() * sides) + 1;
  }
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

// Roll with modifier
function rollWithModifier(dice: string, modifier: number = 0): number {
  return rollDice(dice) + modifier;
}

// Parse dice notation with modifiers (e.g., "1d8+3", "2d6+2", "3d6")
// Returns { dice: string, modifier: number }
function parseDiceNotation(notation: string): { dice: string; modifier: number } {
  const match = notation.match(/(\d+d\d+)([+-]\d+)?/);
  if (!match) {
    // Try format without count (e.g., "d8+3")
    const match2 = notation.match(/(d\d+)([+-]\d+)?/);
    if (match2) {
      return {
        dice: `1${match2[1]}`, // Add 1 prefix
        modifier: match2[2] ? parseInt(match2[2]) : 0,
      };
    }
    return { dice: 'd6', modifier: 0 }; // Fallback
  }
  return {
    dice: match[1],
    modifier: match[2] ? parseInt(match[2]) : 0,
  };
}

// Roll dice with notation that may include modifiers (e.g., "1d8+3")
function rollDiceWithNotation(notation: string): number {
  const { dice, modifier } = parseDiceNotation(notation);
  return rollDice(dice) + modifier;
}

// Utility function to extract JSON from API responses (handles markdown code blocks and multiple JSON objects)
function extractJsonFromResponse(
  content: string,
  requiredFields?: string[],
  excludeFields?: string[]
): string | null {
  let jsonString = content.trim();
  
  // Remove markdown code block markers if present
  jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  
  let searchIndex = 0;
  
  while (searchIndex < jsonString.length) {
    // Find the next opening brace
    const jsonStart = jsonString.indexOf('{', searchIndex);
    if (jsonStart === -1) break;
    
    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < jsonString.length; i++) {
      if (jsonString[i] === '{') {
        braceCount++;
      } else if (jsonString[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    
    if (jsonEnd === -1) {
      // Incomplete JSON, skip to next
      searchIndex = jsonStart + 1;
      continue;
    }
    
    // Extract this JSON object
    const candidateJson = jsonString.substring(jsonStart, jsonEnd);
    
    // Skip JSON objects that contain exclude fields but not required fields
    if (excludeFields && excludeFields.some(field => candidateJson.includes(`"${field}"`))) {
      const hasRequired = !requiredFields || requiredFields.some(field => candidateJson.includes(`"${field}"`));
      if (!hasRequired) {
        searchIndex = jsonEnd;
        continue;
      }
    }
    
    // Check if this JSON contains required fields
    if (requiredFields && requiredFields.some(field => candidateJson.includes(`"${field}"`))) {
      return candidateJson;
    }
    
    // If no required fields specified, return first valid JSON
    if (!requiredFields) {
      try {
        JSON.parse(candidateJson);
        return candidateJson;
      } catch {
        // Invalid JSON, continue searching
      }
    }
    
    // Move search index past this JSON object
    searchIndex = jsonEnd;
  }
  
  return null;
}

// Helper function to parse SSE stream responses
async function parseSSEResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk?: (content: string) => void,
  onDone?: (responseId: string | null) => void
): Promise<{ content: string; responseId: string | null }> {
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedResponse = '';
  let responseId: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'chunk') {
            accumulatedResponse += data.content;
            onChunk?.(accumulatedResponse);
          } else if (data.type === 'done' && data.responseId) {
            responseId = data.responseId;
            onDone?.(responseId);
          }
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError);
        }
      }
    }
  }

  return { content: accumulatedResponse, responseId };
}

// Class icon mapping for pixel art style graphics
const CLASS_ICONS: Record<string, string> = {
  'Fighter': '⚔️',
  'Wizard': '🧙',
  'Rogue': '🗡️',
  'Cleric': '⛪',
  'Barbarian': '🪓',
  'Ranger': '🏹',
  'Paladin': '🛡️',
  'Bard': '🎵',
  'Sorcerer': '🔮',
  'Warlock': '👁️',
  'Monk': '🥋',
  'Druid': '🌿',
  'Artificer': '⚙️',
};

// Class color mapping - consolidated single source of truth
const CLASS_COLORS: Record<string, string> = {
  'Fighter': 'bg-red-900',
  'Wizard': 'bg-blue-900',
  'Rogue': 'bg-purple-900',
  'Cleric': 'bg-yellow-900',
  'Barbarian': 'bg-orange-900',
  'Ranger': 'bg-green-900',
  'Paladin': 'bg-pink-900',
  'Bard': 'bg-indigo-900',
  'Sorcerer': 'bg-cyan-900',
  'Warlock': 'bg-violet-900',
  'Monk': 'bg-amber-900',
  'Druid': 'bg-emerald-900',
  'Artificer': 'bg-teal-900',
};

// ClassSelection component to eliminate duplicate selection UI
interface ClassSelectionProps {
  title: string;
  availableClasses: DnDClass[];
  selectedClass: DnDClass | null;
  onSelect: (dndClass: DnDClass) => void;
}

function ClassSelection({ title, availableClasses, selectedClass, onSelect }: ClassSelectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-amber-200">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {availableClasses.map((dndClass) => {
          const icon = CLASS_ICONS[dndClass.name] || '⚔️';
          return (
          <button
            key={dndClass.name}
            onClick={() => onSelect({ ...dndClass, hitPoints: dndClass.maxHitPoints })}
              className={`py-2 px-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
              selectedClass?.name === dndClass.name
                ? 'border-amber-400 bg-amber-800 shadow-lg scale-105'
                : 'border-amber-700 bg-amber-900/50 hover:bg-amber-800 hover:border-amber-600'
            }`}
          >
              <span 
                className="text-2xl leading-none"
                style={{ 
                  imageRendering: 'pixelated' as const,
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'
                }}
              >
                {icon}
              </span>
              <div className="font-bold text-xs text-amber-100 text-center">{dndClass.name}</div>
          </button>
          );
        })}
      </div>
    </div>
  );
}

// Sparkle component for healing effects
function Sparkles({ trigger }: { trigger: number }) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Generate random sparkle positions
    const newSparkles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setSparkles(newSparkles);

    // Clean up sparkles after animation
    const timer = setTimeout(() => setSparkles([]), 800);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.id * 0.05}s`,
          }}
        />
      ))}
    </>
  );
}

// Confetti component for victory effects
function Confetti({ trigger }: { trigger: number }) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Generate random confetti pieces
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1, // 2-3 seconds
    }));
    setConfetti(newConfetti);

    // Clean up confetti after animation
    const timer = setTimeout(() => setConfetti([]), 3000);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="confetti">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.x}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Single Dice Component
interface SingleDiceProps {
  diceType: string;
  result: number;
  startX: number;
  startY: number;
  delay: number;
  showResult: boolean;
}

function SingleDice({ diceType, result, startX, startY, delay, showResult }: SingleDiceProps) {
  const sides = parseInt(diceType.replace(/[^\d]/g, '')) || 6;
  
  // Determine dice class based on type
  const getDiceClass = () => {
    if (sides === 20) return 'dice-d20';
    if (sides === 12) return 'dice-d12';
    if (sides === 10) return 'dice-d10';
    if (sides === 8) return 'dice-d8';
    if (sides === 6) return 'dice-d6';
    if (sides === 4) return 'dice-d4';
    return 'dice-d6'; // Default to d6
  };

  // Get appropriate number of dots/faces to show while rolling
  const getRollingFaces = () => {
    if (sides === 20) return 20;
    if (sides === 12) return 12;
    if (sides === 10) return 10;
    if (sides === 8) return 8;
    if (sides === 6) return 6;
    if (sides === 4) return 4;
    return Math.min(sides, 9);
  };

  return (
    <div
      className={`dice-roll ${getDiceClass()} ${showResult ? 'dice-roll-result' : 'dice-roll-rolling'}`}
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        animationDelay: `${delay}s`,
      } as React.CSSProperties}
    >
      <div className="dice-face">
        {showResult ? (
          <span className="dice-result">{result}</span>
        ) : (
          <div className="dice-rolling-content">
            {sides === 20 && <span className="dice-label">d20</span>}
            {sides === 12 && <span className="dice-label">d12</span>}
            {sides === 10 && <span className="dice-label">d10</span>}
            {sides === 8 && <span className="dice-label">d8</span>}
            {sides === 6 && (
              <div className="dice-dots d6-dots">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="dice-dot" style={{ animationDelay: `${i * 0.03}s` }} />
                ))}
              </div>
            )}
            {sides === 4 && <span className="dice-label">d4</span>}
            {![20, 12, 10, 8, 6, 4].includes(sides) && (
              <span className="dice-label">d{sides}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Dice Roll Animation Component - Now supports multiple dice
interface DiceRollProps {
  trigger: number;
  diceRolls: Array<{ diceType: string; result: number }>; // Array of dice to show
  onComplete?: () => void;
}

function DiceRoll({ trigger, diceRolls, onComplete }: DiceRollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // Use useMemo to fix positions so they don't change on re-renders
  const positions = useMemo(() => {
    if (trigger === 0 || diceRolls.length === 0) return null;
    
    // Generate positions for multiple dice, spread them out but keep them on screen
    const baseY = 35 + Math.random() * 15; // 35-50% from top (more centered)
    const maxDice = diceRolls.length;
    const totalWidth = Math.min(maxDice * 12, 60); // Limit total width to 60%
    const startXBase = (100 - totalWidth) / 2; // Center the dice group
    
    return diceRolls.map((_, index) => {
      const spacing = totalWidth / maxDice; // Even spacing
      const startX = startXBase + (index * spacing) + Math.random() * 3; // Small random offset
      return {
        startX: Math.max(5, Math.min(85, startX)), // Clamp between 5% and 85%
        startY: Math.max(25, Math.min(65, baseY + (index % 2 === 0 ? 0 : 3))), // Clamp Y position
        delay: index * 0.08, // Stagger animations slightly
      };
    });
  }, [trigger, diceRolls]);

  useEffect(() => {
    if (trigger > 0 && positions) {
      setIsVisible(true);
      setShowResult(false);
      
      // Show result after rolling animation completes (0.8s - faster!)
      const resultTimer = setTimeout(() => {
        setShowResult(true);
      }, 800);
      
      // Hide after result has been displayed (2s pause - faster but still readable)
      // Total: 0.8s roll + 0.3s bounce + 2s display = 3.1s
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setShowResult(false);
        onComplete?.();
      }, 3100);
      
      return () => {
        clearTimeout(resultTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [trigger, positions, onComplete]);

  if (!isVisible || !positions) return null;

  return (
    <div 
      className="dice-roll-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {diceRolls.map((dice, index) => (
        <SingleDice
          key={`${dice.diceType}-${index}`}
          diceType={dice.diceType}
          result={dice.result}
          startX={positions[index].startX}
          startY={positions[index].startY}
          delay={positions[index].delay}
          showResult={showResult}
        />
      ))}
    </div>
  );
}

// Helper function to apply CSS class animation with restart capability
function applyAnimationClass(
  element: HTMLDivElement | null,
  shouldTrigger: boolean,
  trigger: number,
  className: string,
  duration: number,
  onComplete: () => void
): (() => void) | void {
  if (!shouldTrigger || trigger <= 0 || !element) return;
  
  // Force reflow to restart animation
  element.classList.remove(className);
  let timer: NodeJS.Timeout;
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (element) {
        element.classList.add(className);
        timer = setTimeout(() => {
          element.classList.remove(className);
          onComplete();
        }, duration);
      }
    });
  });
  
  return () => {
    if (timer) clearTimeout(timer);
  };
}

// PlayerStats component to eliminate duplicate rendering code
interface PlayerStatsProps {
  playerClass: DnDClass;
  playerId: 'player1' | 'player2';
  currentTurn: 'player1' | 'player2';
  onAttack: () => void;
  onUseAbility: (index: number) => void;
  shouldShake: boolean;
  shouldSparkle: boolean;
  shouldMiss: boolean;
  shakeTrigger: number;
  sparkleTrigger: number;
  missTrigger: number;
  isMoveInProgress: boolean;
  isDefeated: boolean;
  isVictor: boolean;
  confettiTrigger: number;
  onShakeComplete: () => void;
  onSparkleComplete: () => void;
  onMissComplete: () => void;
}

function PlayerStats({ 
  playerClass, 
  playerId, 
  currentTurn, 
  onAttack, 
  onUseAbility,
  shouldShake,
  shouldSparkle,
  shouldMiss,
  shakeTrigger,
  sparkleTrigger,
  missTrigger,
  isMoveInProgress,
  isDefeated,
  isVictor,
  confettiTrigger,
  onShakeComplete,
  onSparkleComplete,
  onMissComplete
}: PlayerStatsProps) {
  const isActive = currentTurn === playerId && !isDefeated;
  const isDisabled = (isActive && isMoveInProgress) || isDefeated;
  const animationRef = useRef<HTMLDivElement>(null);

  // Apply shake animation
  useEffect(() => {
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldShake,
      shakeTrigger,
      'shake',
      400,
      onShakeComplete
    );
    return cleanup;
  }, [shouldShake, shakeTrigger, onShakeComplete]);

  // Apply sparkle animation (timeout-based)
  useEffect(() => {
    if (shouldSparkle && sparkleTrigger > 0) {
      const timer = setTimeout(() => {
        onSparkleComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldSparkle, sparkleTrigger, onSparkleComplete]);

  // Apply miss animation
  useEffect(() => {
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldMiss,
      missTrigger,
      'miss',
      600,
      onMissComplete
    );
    return cleanup;
  }, [shouldMiss, missTrigger, onMissComplete]);

  return (
    <div 
      ref={animationRef}
      className={`bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl sparkle-container relative ${isActive ? 'ring-4 ring-amber-400' : ''} ${isDefeated ? 'opacity-60' : ''}`}
    >
      {isDefeated && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-8xl text-red-900 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.8))' }}>
            ☠️
          </div>
        </div>
      )}
      {isVictor && <Confetti key={confettiTrigger} trigger={confettiTrigger} />}
      {shouldSparkle && <Sparkles key={sparkleTrigger} trigger={sparkleTrigger} />}
      <h3 className="text-2xl font-bold mb-3 text-amber-100" style={{ fontFamily: 'serif' }}>
        {playerClass.name}
        {isActive && ' ⚡'}
        {isDefeated && ' 💀'}
        {isVictor && ' 🏆'}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-amber-300">Hit Points:</span>
          <span className="font-bold text-amber-100">
            {isDefeated ? 0 : playerClass.hitPoints} / {playerClass.maxHitPoints}
          </span>
        </div>
        <div className="w-full bg-amber-950 rounded-full h-4 border-2 border-amber-800">
          <div
            className="bg-red-600 h-full rounded-full transition-all"
            style={{ width: `${isDefeated ? 0 : (playerClass.hitPoints / playerClass.maxHitPoints) * 100}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-amber-300">Armor Class:</span>
          <span className="font-bold text-amber-100">{playerClass.armorClass}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-300">Attack Bonus:</span>
          <span className="font-bold text-amber-100">+{playerClass.attackBonus}</span>
        </div>
        <div className="mt-4">
          <div className="text-amber-300 mb-2">Abilities: {playerClass.abilities.length > 0 ? `(${playerClass.abilities.length})` : '(none)'}</div>
          <div className="flex flex-wrap gap-2">
            {playerClass.abilities.length > 0 ? (
              playerClass.abilities.map((ability, idx) => (
                <button
                  key={idx}
                  onClick={() => onUseAbility(idx)}
                  disabled={!isActive || isDisabled}
                  className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={ability.description || undefined}
                >
                  {ability.name}
                </button>
              ))
            ) : (
              <span className="text-amber-400 text-xs italic">No abilities loaded</span>
            )}
          </div>
        </div>
        {isActive && (
          <button
            onClick={onAttack}
            disabled={isDisabled}
            className="mt-4 w-full py-2 px-4 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Attack! ⚔️
          </button>
        )}
      </div>
    </div>
  );
}

export default function DnDBattle() {
  const router = useRouter();
  const [player1Class, setPlayer1Class] = useState<DnDClass | null>(null);
  const [player2Class, setPlayer2Class] = useState<DnDClass | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [availableClasses, setAvailableClasses] = useState<DnDClass[]>(FALLBACK_CLASSES);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [classDetails, setClassDetails] = useState<Record<string, string>>({});
  const [isLoadingClassDetails, setIsLoadingClassDetails] = useState(false);
  const [battleResponseId, setBattleResponseId] = useState<string | null>(null);
  const [shakingPlayer, setShakingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState({ player1: 0, player2: 0 });
  const [sparklingPlayer, setSparklingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [sparkleTrigger, setSparkleTrigger] = useState({ player1: 0, player2: 0 });
  const [missingPlayer, setMissingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [missTrigger, setMissTrigger] = useState({ player1: 0, player2: 0 });
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const [isMoveInProgress, setIsMoveInProgress] = useState(false);
  const [defeatedPlayer, setDefeatedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [victorPlayer, setVictorPlayer] = useState<'player1' | 'player2' | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [diceRollTrigger, setDiceRollTrigger] = useState(0);
  const [diceRollData, setDiceRollData] = useState<Array<{ diceType: string; result: number }>>([]);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const diceQueueRef = useRef<Array<Array<{ diceType: string; result: number }>>>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [battleLog]);

  // Helper function to add log entries (defined early as it's used by many functions)
  const addLog = useCallback((type: BattleLog['type'], message: string) => {
    setBattleLog((prev) => [...prev, { type, message, timestamp: Date.now() }]);
  }, []);

  // Helper function to update player HP
  const updatePlayerHP = useCallback((player: 'player1' | 'player2', newHP: number) => {
    if (player === 'player1') {
      setPlayer1Class((current) => current ? { ...current, hitPoints: newHP } : current);
    } else {
      setPlayer2Class((current) => current ? { ...current, hitPoints: newHP } : current);
    }
  }, []);

  // Helper function to trigger dice roll animation (supports multiple dice at once)
  const triggerDiceRoll = useCallback((diceRolls: Array<{ diceType: string; result: number }>) => {
    if (isDiceRolling) {
      // Queue the dice rolls if one is already in progress
      diceQueueRef.current.push(diceRolls);
      return;
    }
    
    setIsDiceRolling(true);
    setDiceRollData(diceRolls);
    setDiceRollTrigger(prev => prev + 1);
  }, [isDiceRolling]);
  
  // Process next dice in queue when current one completes
  const handleDiceRollComplete = useCallback(() => {
    setIsDiceRolling(false);
    
    // Process next dice in queue after a short delay
    if (diceQueueRef.current.length > 0) {
      setTimeout(() => {
        const nextDice = diceQueueRef.current.shift();
        if (nextDice) {
          setIsDiceRolling(true);
          setDiceRollData(nextDice);
          setDiceRollTrigger(prev => prev + 1);
        }
      }, 150);
    }
  }, []);

  // Helper function to calculate attack roll
  const calculateAttackRoll = useCallback((attackerClass: DnDClass): { d20Roll: number; attackRoll: number } => {
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    // Don't trigger dice roll here - will be triggered with damage dice together
    return { d20Roll, attackRoll };
  }, []);

  // Helper function to log attack roll
  const logAttackRoll = useCallback((attackerClass: DnDClass, d20Roll: number, attackRoll: number, defenderAC: number) => {
    const bonusText = attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus} (attack bonus)` : '';
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll}${bonusText} = ${attackRoll} (needs ${defenderAC})`);
  }, [addLog]);

  // Helper function to calculate damage from an attack ability
  const calculateAbilityDamage = useCallback((ability: AttackAbility): number => {
    let damage = rollDiceWithNotation(ability.damageDice);
    if (ability.bonusDamageDice) {
      damage += rollDiceWithNotation(ability.bonusDamageDice);
    }
    return damage;
  }, []);

  // Helper function to apply damage and update HP
  const applyDamage = useCallback((
    defender: 'player1' | 'player2',
    damage: number,
    defenderClass: DnDClass
  ): { newHP: number; isDefeated: boolean } => {
    const newHP = Math.max(0, defenderClass.hitPoints - damage);
    updatePlayerHP(defender, newHP);
    return { newHP, isDefeated: newHP <= 0 };
  }, [updatePlayerHP]);

  // Helper function to generate narrative and update response ID
  const generateAndLogNarrative = useCallback(async (
    eventDescription: string,
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    attackerDetails: string = '',
    defenderDetails: string = ''
  ): Promise<void> => {
    setIsWaitingForAgent(true);
    try {
      const { narrative, responseId } = await getBattleNarrative(
        eventDescription,
        attackerClass,
        defenderClass,
        attackerDetails,
        defenderDetails,
        battleResponseId
      );
      setBattleResponseId(responseId);
      addLog('narrative', narrative);
    } finally {
      setIsWaitingForAgent(false);
    }
  }, [battleResponseId, addLog]);

  // Helper function to handle victory condition
  const handleVictory = useCallback(async (
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    damage: number,
    attackerDetails: string = '',
    defenderDetails: string = '',
    eventDescription: string,
    defender: 'player1' | 'player2'
  ): Promise<void> => {
    // Set the defender's HP to 0
    updatePlayerHP(defender, 0);
    // Mark the defender as defeated
    setDefeatedPlayer(defender);
    // Mark the attacker as victor
    const victor = defender === 'player1' ? 'player2' : 'player1';
    setVictorPlayer(victor);
    setConfettiTrigger(prev => prev + 1);
    await generateAndLogNarrative(
      eventDescription,
      attackerClass,
      { ...defenderClass, hitPoints: 0 },
      attackerDetails,
      defenderDetails
    );
    addLog('system', `🏆 ${attackerClass.name} wins! ${defenderClass.name} has been defeated!`);
  }, [updatePlayerHP, generateAndLogNarrative, addLog]);

  // Helper function to switch turns
  const switchTurn = useCallback((currentAttacker: 'player1' | 'player2') => {
    const nextPlayer = currentAttacker === 'player1' ? 'player2' : 'player1';
    // Don't switch to a defeated player - battle is over
    if (defeatedPlayer === nextPlayer) {
      return;
    }
    setCurrentTurn(nextPlayer);
  }, [defeatedPlayer]);

  // Fetch all available D&D classes from OpenRAG
  const fetchAvailableClasses = async (): Promise<{ classNames: string[]; response: string }> => {
    try {
      const query = `List all available D&D 5th edition character classes. Return only a JSON array of class names, like ["Fighter", "Wizard", "Rogue", ...]. Do not include any other text, just the JSON array.`;
      
      addLog('system', '🔍 Querying OpenRAG for available D&D classes...');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          previousResponseId: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const { content } = await parseSSEResponse(reader);
      
      // Log the agent response
      addLog('narrative', `**OpenRAG Response (Class List):**\n\n${content}`);
      
      // Try to extract JSON array from response
      let jsonString = content.trim();
      // Remove markdown code block markers if present
      jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      
      // Find JSON array in the response
      const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            return { classNames: parsed, response: content };
          }
        } catch {
          // Continue to fallback
        }
      }
      
      // Fallback: try to parse the whole response
      try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          return { classNames: parsed, response: content };
        }
      } catch {
        // If parsing fails, try to extract class names from text
        const classNames: string[] = [];
        const commonClasses = Object.keys(CLASS_ICONS);
        for (const className of commonClasses) {
          if (content.toLowerCase().includes(className.toLowerCase())) {
            classNames.push(className);
          }
        }
        if (classNames.length > 0) {
          return { classNames, response: content };
        }
      }
      
      console.warn('Could not parse class list from response:', content.substring(0, 200));
      return { classNames: [], response: content };
    } catch (error) {
      console.error('Error fetching available classes:', error);
      addLog('system', `❌ Error fetching classes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { classNames: [], response: '' };
    }
  };

  // Fetch class stats from OpenRAG
  const fetchClassStats = async (className: string): Promise<{ stats: Partial<DnDClass> | null; response: string }> => {
    try {
      const query = `For the D&D 5th edition ${className} class, provide the following information in JSON format:
{
  "hitPoints": number (typical starting HP at level 1-3, around 20-35),
  "armorClass": number (typical AC, between 12-18),
  "attackBonus": number (typical attack bonus modifier, between 3-5),
  "damageDie": string (typical weapon damage die like "d6", "d8", "d10", or "d12"),
  "description": string (brief 1-2 sentence description of the class)
}

Return ONLY valid JSON, no other text. Use typical values for a level 1-3 character.`;
      
      addLog('system', `🔍 Querying OpenRAG for ${className} class stats...`);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          previousResponseId: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const { content } = await parseSSEResponse(reader);
      
      // Log the agent response
      addLog('narrative', `**OpenRAG Response (${className} Stats):**\n\n${content}`);
      
      // Extract JSON from response using utility function
      const statsJsonString = extractJsonFromResponse(
        content,
        ['hitPoints', 'armorClass', 'attackBonus', 'damageDie'], // required fields
        ['search_query'] // exclude fields (unless they also have required fields)
      );
      
      if (statsJsonString) {
        try {
          const parsed = JSON.parse(statsJsonString);
          // Normalize damageDie format (convert "1d6" to "d6" for consistency)
          let damageDie = parsed.damageDie || 'd8';
          if (damageDie.match(/^\d+d\d+$/)) {
            damageDie = 'd' + damageDie.split('d')[1];
          }
          
          return {
            stats: {
              hitPoints: parsed.hitPoints || 25,
              maxHitPoints: parsed.hitPoints || 25,
              armorClass: parsed.armorClass || 14,
              attackBonus: parsed.attackBonus || 4,
              damageDie: damageDie,
              description: parsed.description || `A ${className} character.`,
            },
            response: content,
          };
        } catch (parseError) {
          console.warn(`Error parsing stats JSON for ${className}:`, parseError);
          // Try to extract partial data even if JSON is incomplete
          const hitPointsMatch = statsJsonString.match(/"hitPoints"\s*:\s*(\d+)/);
          const armorClassMatch = statsJsonString.match(/"armorClass"\s*:\s*(\d+)/);
          const attackBonusMatch = statsJsonString.match(/"attackBonus"\s*:\s*(\d+)/);
          const damageDieMatch = statsJsonString.match(/"damageDie"\s*:\s*"([^"]+)"/);
          const descriptionMatch = statsJsonString.match(/"description"\s*:\s*"([^"]*)"/);
          
          if (hitPointsMatch || armorClassMatch) {
            let damageDie = damageDieMatch ? damageDieMatch[1] : 'd8';
            // Normalize damageDie format
            if (damageDie.match(/^\d+d\d+$/)) {
              damageDie = 'd' + damageDie.split('d')[1];
            }
            
            return {
              stats: {
                hitPoints: hitPointsMatch ? parseInt(hitPointsMatch[1]) : 25,
                maxHitPoints: hitPointsMatch ? parseInt(hitPointsMatch[1]) : 25,
                armorClass: armorClassMatch ? parseInt(armorClassMatch[1]) : 14,
                attackBonus: attackBonusMatch ? parseInt(attackBonusMatch[1]) : 4,
                damageDie: damageDie,
                description: descriptionMatch ? descriptionMatch[1] : `A ${className} character.`,
              },
              response: content,
            };
          }
        }
      }
      
      console.warn(`Could not parse stats for ${className}:`, content.substring(0, 200));
      return { stats: null, response: content };
    } catch (error) {
      console.error(`Error fetching stats for ${className}:`, error);
      addLog('system', `❌ Error fetching stats for ${className}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { stats: null, response: '' };
    }
  };

  // Load all classes from OpenRAG (called manually via button)
  const loadClassesFromOpenRAG = async () => {
    setIsLoadingClasses(true);
    addLog('system', '🚀 Starting to load classes from OpenRAG...');
    try {
      const { classNames, response: classListResponse } = await fetchAvailableClasses();
      
      if (classNames.length === 0) {
        console.warn('No classes found, using fallback classes');
        addLog('system', '⚠️ No classes found in response, using fallback classes');
        setAvailableClasses(FALLBACK_CLASSES);
        setClassesLoaded(true);
        setIsLoadingClasses(false);
        return;
      }

      addLog('system', `✅ Found ${classNames.length} classes: ${classNames.join(', ')}`);
      addLog('system', `📋 Fetching stats for ${classNames.length} classes...`);

      // Fetch stats for each class
      const classPromises = classNames.map(async (className) => {
        const { stats, response: statsResponse } = await fetchClassStats(className);
        if (stats) {
          return {
            name: className,
            hitPoints: stats.hitPoints || 25,
            maxHitPoints: stats.maxHitPoints || stats.hitPoints || 25,
            armorClass: stats.armorClass || 14,
            attackBonus: stats.attackBonus || 4,
            damageDie: stats.damageDie || 'd8',
            abilities: [],
            description: stats.description || `A ${className} character.`,
            color: CLASS_COLORS[className] || 'bg-slate-900',
          } as DnDClass;
        }
        return null;
      });

      const loadedClasses = (await Promise.all(classPromises)).filter((cls): cls is DnDClass => cls !== null);
      
      if (loadedClasses.length > 0) {
        setAvailableClasses(loadedClasses);
        addLog('system', `✅ Successfully loaded ${loadedClasses.length} classes from OpenRAG: ${loadedClasses.map(c => c.name).join(', ')}`);
        console.log(`Loaded ${loadedClasses.length} classes from OpenRAG:`, loadedClasses.map(c => c.name).join(', '));
      } else {
        console.warn('No classes could be loaded, using fallback classes');
        addLog('system', '⚠️ No classes could be loaded, using fallback classes');
        setAvailableClasses(FALLBACK_CLASSES);
      }
      setClassesLoaded(true);
    } catch (error) {
      console.error('Error loading classes:', error);
      addLog('system', `❌ Error loading classes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailableClasses(FALLBACK_CLASSES);
      setClassesLoaded(true);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Fetch detailed class information from OpenRAG knowledge base
  const fetchClassDetails = async (className: string): Promise<string> => {
    try {
      const query = `Show me class abilities for the ${className.toLowerCase()}, focusing specifically on attack abilities (both physical and magical) and healing abilities.`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          previousResponseId: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No response body');
      }

      const { content } = await parseSSEResponse(reader);
      return content;
    } catch (error) {
      console.error(`Error fetching class details for ${className}:`, error);
      return '';
    }
  };

  // Extract structured abilities directly from the knowledge base
  // Uses AI to return attack and healing abilities in a well-defined JSON structure
  const extractAbilities = async (className: string): Promise<Ability[]> => {
    try {
      // Ask the AI to return a random selection of abilities in a structured JSON format
      // Randomly select 1-3 attack abilities and 1-3 healing abilities to keep responses small
      const numAttacks = Math.floor(Math.random() * 3) + 1; // 1-3
      const numHeals = Math.floor(Math.random() * 3) + 1; // 1-3
      
      const extractionPrompt = `You are a D&D expert. From the D&D knowledge base, find information about the ${className} class and select abilities.

Return your response as a JSON object with this exact structure:
{
  "abilities": [
    {
      "name": "Ability Name",
      "type": "attack" or "healing",
      "damageDice": "XdY" (for attacks, e.g., "1d10", "3d6", "2d8"),
      "attackRoll": true or false (for attacks: true if requires attack roll, false if automatic damage),
      "attacks": number (optional, for multi-attack abilities, default: 1),
      "bonusDamageDice": "XdY" (optional, for attacks with bonus damage like sneak attack),
      "healingDice": "XdY+Z" (for healing abilities, e.g., "1d8+3", "2d4+2"),
      "description": "Brief description of the ability"
    }
  ]
}

Important rules:
- For attack abilities: include "damageDice" and "attackRoll" fields
- For healing abilities: include "healingDice" field
- Use standard D&D dice notation (e.g., "1d10", "3d6", "2d8+4")
- Return ONLY valid JSON, no other text before or after
- Try to randomly select ${numAttacks} attack ability/abilities and ${numHeals} healing ability/abilities, but if the class doesn't have that many of a type, just return what's available
- If the class has no attack abilities, return only healing abilities (and vice versa)
- If the class has no abilities of either type, return an empty abilities array: {"abilities": []}
- It's OK if you can't find all requested abilities - just provide what's available for this class`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: extractionPrompt,
          previousResponseId: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No response body');
      }

      const { content: accumulatedResponse } = await parseSSEResponse(reader);

      // Extract JSON from response using utility function
      const abilitiesJsonString = extractJsonFromResponse(
        accumulatedResponse,
        ['abilities'] // required field
      );
      
      if (!abilitiesJsonString) {
        console.error('No JSON object with "abilities" field found. Full response:', accumulatedResponse.substring(0, 200) + '...');
        return [];
      }
      
      console.log('Extracted JSON string with abilities:', abilitiesJsonString.substring(0, 200) + '...');

      try {
        const parsed = JSON.parse(abilitiesJsonString);
        if (parsed.abilities && Array.isArray(parsed.abilities)) {
          // Validate and normalize abilities
          const validAbilities: Ability[] = [];
          
          for (const ability of parsed.abilities) {
            if (ability.type === 'attack' && ability.name && ability.damageDice) {
              validAbilities.push({
                name: ability.name,
                type: 'attack',
                damageDice: ability.damageDice,
                attackRoll: ability.attackRoll !== undefined ? ability.attackRoll : true,
                attacks: ability.attacks || 1,
                bonusDamageDice: ability.bonusDamageDice,
                description: ability.description || '',
              } as AttackAbility);
            } else if (ability.type === 'healing' && ability.name && ability.healingDice) {
              validAbilities.push({
                name: ability.name,
                type: 'healing',
                healingDice: ability.healingDice,
                description: ability.description || '',
              } as HealingAbility);
            } else {
              console.warn('Skipping invalid ability:', ability);
            }
          }
          
          console.log(`Validated ${validAbilities.length} abilities from ${parsed.abilities.length} total`);
          
          if (validAbilities.length > 0) {
            // Agent already returns a random selection of 1-3 attacks and 1-3 heals
            // Just return what the agent selected (it's already randomized)
            console.log(`Received ${validAbilities.length} abilities from agent for ${className}:`, 
              `${validAbilities.filter(a => a.type === 'attack').length} attacks,`,
              `${validAbilities.filter(a => a.type === 'healing').length} heals`);
            
            return validAbilities;
          }
        }
        // If we parsed successfully but got no valid abilities, return empty array
        console.warn('Parsed JSON but found no valid abilities:', parsed);
        return [];
      } catch (parseError) {
        console.error('Error parsing JSON from AI response:', parseError);
        console.error('Extracted JSON string was:', abilitiesJsonString);
        console.error('Full response was:', accumulatedResponse.substring(0, 200) + '...');
        // Fallback: return empty array if parsing fails
        return [];
      }
    } catch (error) {
      console.error('Error extracting abilities:', error);
      return [];
    }
  };

  // Get AI-generated battle narrative from Langflow API
  // Returns both the narrative text and the response ID for conversation continuity
  const getBattleNarrative = async (
    eventDescription: string,
    attackerClass: DnDClass | null,
    defenderClass: DnDClass | null,
    attackerDetails: string = '',
    defenderDetails: string = '',
    previousResponseId: string | null = null
  ): Promise<{ narrative: string; responseId: string | null }> => {
    try {
      if (!attackerClass || !defenderClass) {
        return { narrative: eventDescription, responseId: previousResponseId };
      }

      const prompt = `A D&D battle is happening between a ${attackerClass.name} and a ${defenderClass.name}.

Current battle state:
- ${attackerClass.name}: ${attackerClass.hitPoints}/${attackerClass.maxHitPoints} HP, AC ${attackerClass.armorClass}
- ${defenderClass.name}: ${defenderClass.hitPoints}/${defenderClass.maxHitPoints} HP, AC ${defenderClass.armorClass}

${attackerDetails ? `\n${attackerClass.name} class information:\n${attackerDetails}` : ''}
${defenderDetails ? `\n${defenderClass.name} class information:\n${defenderDetails}` : ''}

Battle event: ${eventDescription}

Provide a brief, dramatic narrative description (2-3 sentences) of this battle event. Make it exciting and descriptive, incorporating the class abilities and combat styles.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          previousResponseId: previousResponseId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No response body');
      }

      const { content: accumulatedResponse, responseId } = await parseSSEResponse(reader);
      const finalResponseId = responseId || previousResponseId;

      return { narrative: accumulatedResponse || eventDescription, responseId: finalResponseId };
    } catch (error) {
      console.error('Error getting battle narrative:', error);
      return { narrative: eventDescription, responseId: previousResponseId };
    }
  };

  const startBattle = async () => {
    if (!player1Class || !player2Class) {
      addLog('system', 'Please select both combatants!');
      return;
    }

    setIsLoadingClassDetails(true);
    addLog('system', 'Loading class abilities from knowledge base...');

    try {
      // Extract abilities directly from the knowledge base (with structured JSON)
      const [p1Abilities, p2Abilities] = await Promise.all([
        extractAbilities(player1Class.name),
        extractAbilities(player2Class.name),
      ]);
      
      // Store empty class details (we don't need the full text anymore)
      setClassDetails({
        [player1Class.name]: '',
        [player2Class.name]: '',
      });

      // Reset classes to fresh instances with updated abilities
      console.log('Setting abilities:', { 
        p1Name: player1Class.name, 
        p1Abilities: p1Abilities.length,
        p2Name: player2Class.name,
        p2Abilities: p2Abilities.length 
      });
      
      const p1 = { 
        ...player1Class, 
        hitPoints: player1Class.maxHitPoints,
        abilities: p1Abilities,
      };
      const p2 = { 
        ...player2Class, 
        hitPoints: player2Class.maxHitPoints,
        abilities: p2Abilities,
      };
      
      console.log('Updated classes:', { 
        p1Abilities: p1.abilities.length, 
        p2Abilities: p2.abilities.length 
      });
      
      setPlayer1Class(p1);
      setPlayer2Class(p2);
      setIsBattleActive(true);
      setBattleLog([]);
      setCurrentTurn('player1');
      
      // Initialize battle conversation with opening narrative
      setIsWaitingForAgent(true);
      try {
        const { narrative: openingNarrative, responseId } = await getBattleNarrative(
          `The battle begins between ${p1.name} and ${p2.name}. Both combatants are at full health and ready to fight.`,
          p1,
          p2,
          '', // Class details no longer needed
          '', // Class details no longer needed
          null // Start new conversation
        );
        setBattleResponseId(responseId);
        addLog('narrative', openingNarrative);
      } finally {
        setIsWaitingForAgent(false);
      }
    } finally {
      setIsLoadingClassDetails(false);
    }
  };

  const performAttack = async (attacker: 'player1' | 'player2') => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;

    setIsMoveInProgress(true);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    // Roll attack
    const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
    logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass);

    if (attackRoll >= defenderClass.armorClass) {
      // Hit! Show both attack roll and damage dice
      const damage = rollDice(attackerClass.damageDie);
      triggerDiceRoll([
        { diceType: 'd20', result: d20Roll },
        { diceType: attackerClass.damageDie, result: damage }
      ]);
      const newHP = Math.max(0, defenderClass.hitPoints - damage);
      
      // Update the defender's HP
      const defender = attacker === 'player1' ? 'player2' : 'player1';
      updatePlayerHP(defender, newHP);
      
      // Trigger shake animation on defender
      setShakingPlayer(defender);
      setShakeTrigger(prev => ({ ...prev, [defender]: prev[defender] + 1 }));

      if (newHP <= 0) {
        await handleVictory(
          attackerClass,
          defenderClass,
          damage,
          attackerDetails,
          defenderDetails,
          `${attackerClass.name} attacks ${defenderClass.name} and deals ${damage} damage. ${defenderClass.name} is defeated with 0 HP remaining.`,
          defender
        );
      } else {
        await generateAndLogNarrative(
          `${attackerClass.name} attacks ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack hits! ${defenderClass.name} takes ${damage} damage and is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
          attackerClass,
          { ...defenderClass, hitPoints: newHP },
          attackerDetails,
          defenderDetails
        );
      }
    } else {
      // Miss - show the attack roll dice
      triggerDiceRoll([{ diceType: 'd20', result: d20Roll }]);
      
      // Trigger miss animation on attacker
      setMissingPlayer(attacker);
      setMissTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
      
      await generateAndLogNarrative(
        `${attackerClass.name} attacks ${defenderClass.name} with an attack roll of ${attackRoll} (rolled ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''}). The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
        attackerClass,
        defenderClass,
        attackerDetails,
        defenderDetails
      );
    }

    // Switch turns
    switchTurn(attacker);
    setIsMoveInProgress(false);
  };

  const useAbility = async (attacker: 'player1' | 'player2', abilityIndex: number) => {
    if (!isBattleActive || !player1Class || !player2Class || isMoveInProgress) return;

    setIsMoveInProgress(true);
    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const ability = attackerClass.abilities[abilityIndex];
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    if (!ability) return;

    addLog('roll', `✨ ${attackerClass.name} uses ${ability.name}!`);

    // Handle healing abilities
    if (ability.type === 'healing') {
      const heal = rollDiceWithNotation(ability.healingDice);
      const { dice } = parseDiceNotation(ability.healingDice);
      triggerDiceRoll([{ diceType: dice, result: heal }]);
      const newHP = Math.min(attackerClass.maxHitPoints, attackerClass.hitPoints + heal);
      
      updatePlayerHP(attacker, newHP);
      
      // Trigger sparkle animation on healer
      setSparklingPlayer(attacker);
      setSparkleTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));

      await generateAndLogNarrative(
        `${attackerClass.name} uses ${ability.name} and heals for ${heal} HP. ${attackerClass.name} is now at ${newHP}/${attackerClass.maxHitPoints} HP.`,
        attackerClass,
        defenderClass,
        attackerDetails,
        defenderDetails
      );
    } 
    // Handle attack abilities
    else if (ability.type === 'attack') {
      const attackAbility = ability as AttackAbility;
      const numAttacks = attackAbility.attacks || 1;
      
      // Handle multi-attack abilities
      if (numAttacks > 1) {
        const attackRolls: number[] = [];
        const d20Rolls: number[] = [];
        const damages: number[] = [];
        const hits: boolean[] = [];
      let totalDamage = 0;

        // Roll all attacks and collect dice for display
        const diceToShow: Array<{ diceType: string; result: number }> = [];
        
        for (let i = 0; i < numAttacks; i++) {
          const d20Roll = rollDice('d20');
          d20Rolls.push(d20Roll);
          const attackRoll = d20Roll + attackerClass.attackBonus;
          attackRolls.push(attackRoll);
          const hit = attackRoll >= defenderClass.armorClass;
          hits.push(hit);
          
          if (hit) {
            const { dice } = parseDiceNotation(attackAbility.damageDice);
            let damage = rollDiceWithNotation(attackAbility.damageDice);
            diceToShow.push({ diceType: 'd20', result: d20Roll });
            diceToShow.push({ diceType: dice, result: damage });
            
            // Add bonus damage if applicable
            if (attackAbility.bonusDamageDice) {
              const { dice: bonusDice } = parseDiceNotation(attackAbility.bonusDamageDice);
              const bonusDamage = rollDiceWithNotation(attackAbility.bonusDamageDice);
              diceToShow.push({ diceType: bonusDice, result: bonusDamage });
              damage += bonusDamage;
            }
            damages.push(damage);
            totalDamage += damage;
          } else {
            diceToShow.push({ diceType: 'd20', result: d20Roll });
            damages.push(0);
          }
        }
        
        // Show all dice at once
        if (diceToShow.length > 0) {
          triggerDiceRoll(diceToShow);
        }

        addLog('roll', `🎲 ${attackerClass.name} makes ${numAttacks} attacks: ${attackRolls.join(', ')}`);

      if (totalDamage > 0) {
        const newHP = Math.max(0, defenderClass.hitPoints - totalDamage);
        const defender = attacker === 'player1' ? 'player2' : 'player1';
        updatePlayerHP(defender, newHP);
        
        // Trigger shake animation on defender
        setShakingPlayer(defender);

        const hitDetails = hits.map((hit, i) => 
          hit ? `Attack ${i + 1} hits for ${damages[i]} damage.` : `Attack ${i + 1} misses.`
        ).join(' ');

        if (newHP <= 0) {
          await handleVictory(
            attackerClass,
            defenderClass,
            totalDamage,
            attackerDetails,
            defenderDetails,
            `${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. ${hitDetails} Total damage: ${totalDamage}. ${defenderClass.name} is defeated with 0 HP.`,
            defender
          );
          switchTurn(attacker);
          setIsMoveInProgress(false);
          return;
        } else {
          await generateAndLogNarrative(
            `${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. ${hitDetails} Total damage: ${totalDamage}. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
            attackerClass,
            { ...defenderClass, hitPoints: newHP },
            attackerDetails,
            defenderDetails
          );
        }
      } else {
        // All attacks missed - trigger miss animation on attacker
        setMissingPlayer(attacker);
        setMissTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
        
        await generateAndLogNarrative(
          `${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. All attacks miss. ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
          attackerClass,
          defenderClass,
          attackerDetails,
          defenderDetails
        );
      }
      }
      // Single attack with attack roll
      else if (attackAbility.attackRoll) {
        const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
        logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass);

        if (attackRoll >= defenderClass.armorClass) {
          // Hit - show both attack and damage dice
          let damage = rollDiceWithNotation(attackAbility.damageDice);
          const { dice } = parseDiceNotation(attackAbility.damageDice);
          const diceToShow: Array<{ diceType: string; result: number }> = [
            { diceType: 'd20', result: d20Roll },
            { diceType: dice, result: damage }
          ];
          
          // Add bonus damage if applicable
          if (attackAbility.bonusDamageDice) {
            const bonusDamage = rollDiceWithNotation(attackAbility.bonusDamageDice);
            const { dice: bonusDice } = parseDiceNotation(attackAbility.bonusDamageDice);
            diceToShow.push({ diceType: bonusDice, result: bonusDamage });
            damage += bonusDamage;
          }
          
          triggerDiceRoll(diceToShow);
          
          const newHP = Math.max(0, defenderClass.hitPoints - damage);
          const defender = attacker === 'player1' ? 'player2' : 'player1';
          updatePlayerHP(defender, newHP);
          
          // Trigger shake animation on defender
          setShakingPlayer(defender);
      
          if (newHP <= 0) {
            await handleVictory(
              attackerClass,
              defenderClass,
              damage,
              attackerDetails,
              defenderDetails,
              `${attackerClass.name} uses ${ability.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is defeated with 0 HP.`,
              defender
            );
            switchTurn(attacker);
            setIsMoveInProgress(false);
            return;
          } else {
            await generateAndLogNarrative(
              `${attackerClass.name} uses ${ability.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
              attackerClass,
              { ...defenderClass, hitPoints: newHP },
              attackerDetails,
              defenderDetails
            );
          }
        } else {
          // Miss - show the attack roll dice
          triggerDiceRoll([{ diceType: 'd20', result: d20Roll }]);
          
          // Trigger miss animation on attacker
          setMissingPlayer(attacker);
          setMissTrigger(prev => ({ ...prev, [attacker]: prev[attacker] + 1 }));
          
          await generateAndLogNarrative(
            `${attackerClass.name} uses ${ability.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack misses! ${defenderClass.name}'s AC is ${defenderClass.armorClass}.`,
            attackerClass,
            defenderClass,
            attackerDetails,
            defenderDetails
          );
        }
      }
      // Automatic damage (no attack roll, like Fireball)
      else {
        const { dice } = parseDiceNotation(attackAbility.damageDice);
        const damage = rollDiceWithNotation(attackAbility.damageDice);
        triggerDiceRoll([{ diceType: dice, result: damage }]);
        const newHP = Math.max(0, defenderClass.hitPoints - damage);
        const defender = attacker === 'player1' ? 'player2' : 'player1';
        updatePlayerHP(defender, newHP);
        
        // Trigger shake animation on defender
        setShakingPlayer(defender);

        if (newHP <= 0) {
          await handleVictory(
            attackerClass,
            defenderClass,
            damage,
            attackerDetails,
            defenderDetails,
            `${attackerClass.name} uses ${ability.name} and deals ${damage} damage to ${defenderClass.name}. ${defenderClass.name} is defeated with 0 HP.`,
            defender
          );
          switchTurn(attacker);
          setIsMoveInProgress(false);
          return;
        } else {
          await generateAndLogNarrative(
            `${attackerClass.name} uses ${ability.name} and deals ${damage} damage to ${defenderClass.name}. ${defenderClass.name} is now at ${newHP}/${defenderClass.maxHitPoints} HP.`,
            attackerClass,
            { ...defenderClass, hitPoints: newHP },
            attackerDetails,
            defenderDetails
          );
        }
      }
    }

    // Switch turns
    switchTurn(attacker);
    setIsMoveInProgress(false);
  };

  const resetBattle = () => {
    setIsBattleActive(false);
    setBattleLog([]);
    setPlayer1Class(null);
    setPlayer2Class(null);
    setClassDetails({});
    setBattleResponseId(null);
    setIsMoveInProgress(false);
    setDefeatedPlayer(null);
    setVictorPlayer(null);
    setMissingPlayer(null);
    setMissTrigger({ player1: 0, player2: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 text-amber-50">
      {/* Dice Roll Animation */}
      {diceRollData.length > 0 && (
        <DiceRoll
          key={diceRollTrigger}
          trigger={diceRollTrigger}
          diceRolls={diceRollData}
          onComplete={handleDiceRollComplete}
        />
      )}
      
      {/* Header */}
      <div className="border-b-4 border-amber-800 px-4 sm:px-6 py-4 bg-amber-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-100 mb-2" style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              ⚔️ D&D Battle Arena ⚔️
            </h1>
            <p className="text-sm text-amber-200 italic">
              Choose your champions and engage in epic one-on-one combat
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold rounded-lg border-2 border-amber-700 transition-all"
          >
            ← Back to Chat
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Character Selection */}
          {!isBattleActive && (
            <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
                Select Combatants
                {isLoadingClasses && (
                  <span className="ml-2 text-sm text-amber-300 italic">
                    (Loading classes from OpenRAG...)
                    <span className="waiting-indicator ml-2 inline-block">
                      <span className="waiting-dot"></span>
                      <span className="waiting-dot"></span>
                      <span className="waiting-dot"></span>
                    </span>
                  </span>
                )}
                {isLoadingClassDetails && !isLoadingClasses && (
                  <span className="ml-2 text-sm text-amber-300 italic">(Loading class information from knowledge base...)</span>
                )}
              </h2>
              {!classesLoaded && !isLoadingClasses && (
                <div className="text-center py-8 mb-4">
                  <div className="text-amber-200 mb-4">
                    Click the button below to load all available D&D classes from OpenRAG.
                    <br />
                    <span className="text-sm text-amber-300">You can also use the fallback classes shown below.</span>
                  </div>
                  <button
                    onClick={loadClassesFromOpenRAG}
                    disabled={isLoadingClasses}
                    className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg border-2 border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    {isLoadingClasses ? 'Loading...' : 'Load Classes from OpenRAG'}
                  </button>
                </div>
              )}
              {isLoadingClasses ? (
                <div className="text-center py-8">
                  <div className="text-amber-200 mb-4">Loading available D&D classes from OpenRAG...</div>
                  <div className="waiting-indicator">
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                  </div>
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClassSelection
                  title="Combatant 1"
                  availableClasses={availableClasses}
                  selectedClass={player1Class}
                  onSelect={setPlayer1Class}
                />
                <ClassSelection
                  title="Combatant 2"
                  availableClasses={availableClasses}
                  selectedClass={player2Class}
                  onSelect={setPlayer2Class}
                />
              </div>

                  {classesLoaded && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={loadClassesFromOpenRAG}
                        disabled={isLoadingClasses}
                        className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 text-sm font-semibold rounded-lg border-2 border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isLoadingClasses ? 'Refreshing...' : '🔄 Refresh Classes from OpenRAG'}
                      </button>
                    </div>
                  )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={startBattle}
                  disabled={!player1Class || !player2Class}
                  className="w-full py-3 px-6 bg-red-900 hover:bg-red-800 text-white font-bold text-lg rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  style={{ fontFamily: 'serif' }}
                >
                  Begin Battle! ⚔️
                </button>
                <button
                  onClick={() => {
                    // Test dice roll with various dice types
                    const testRolls = [
                      { diceType: 'd20', result: Math.floor(Math.random() * 20) + 1 },
                      { diceType: 'd10', result: Math.floor(Math.random() * 10) + 1 },
                      { diceType: 'd8', result: Math.floor(Math.random() * 8) + 1 },
                      { diceType: 'd6', result: Math.floor(Math.random() * 6) + 1 },
                    ];
                    triggerDiceRoll(testRolls);
                  }}
                  className="w-full py-2 px-4 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg border-2 border-purple-700 transition-all shadow-md"
                >
                  🎲 Test Dice Roll
                </button>
              </div>
                </>
              )}
            </div>
          )}

          {/* Battle Stats */}
          {isBattleActive && player1Class && player2Class && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlayerStats
                playerClass={player1Class}
                playerId="player1"
                currentTurn={currentTurn}
                onAttack={() => performAttack('player1')}
                onUseAbility={(idx) => useAbility('player1', idx)}
                shouldShake={shakingPlayer === 'player1'}
                shouldSparkle={sparklingPlayer === 'player1'}
                shouldMiss={missingPlayer === 'player1'}
                shakeTrigger={shakeTrigger.player1}
                sparkleTrigger={sparkleTrigger.player1}
                missTrigger={missTrigger.player1}
                isMoveInProgress={isMoveInProgress}
                isDefeated={defeatedPlayer === 'player1'}
                isVictor={victorPlayer === 'player1'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={() => setShakingPlayer(null)}
                onSparkleComplete={() => setSparklingPlayer(null)}
                onMissComplete={() => setMissingPlayer(null)}
              />
              <PlayerStats
                playerClass={player2Class}
                playerId="player2"
                currentTurn={currentTurn}
                onAttack={() => performAttack('player2')}
                onUseAbility={(idx) => useAbility('player2', idx)}
                shouldShake={shakingPlayer === 'player2'}
                shouldSparkle={sparklingPlayer === 'player2'}
                shouldMiss={missingPlayer === 'player2'}
                shakeTrigger={shakeTrigger.player2}
                sparkleTrigger={sparkleTrigger.player2}
                missTrigger={missTrigger.player2}
                isMoveInProgress={isMoveInProgress}
                isDefeated={defeatedPlayer === 'player2'}
                isVictor={victorPlayer === 'player2'}
                confettiTrigger={confettiTrigger}
                onShakeComplete={() => setShakingPlayer(null)}
                onSparkleComplete={() => setSparklingPlayer(null)}
                onMissComplete={() => setMissingPlayer(null)}
              />
            </div>
          )}

          {/* Battle Log */}
          <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
              Battle Log 📜
            </h2>
            <div className="space-y-2 text-sm">
              {battleLog.length === 0 && (
                <div className="text-amber-400 italic">The battle log is empty...</div>
              )}
              {battleLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded ${
                    log.type === 'attack' ? 'bg-red-900/30 text-red-200 font-mono' :
                    log.type === 'ability' ? 'bg-purple-900/30 text-purple-200 font-mono' :
                    log.type === 'roll' ? 'bg-blue-900/30 text-blue-200 font-mono' :
                    log.type === 'narrative' ? 'bg-amber-800/50 text-amber-100' :
                    'bg-amber-950/50 text-amber-300 font-mono'
                  }`}
                >
                  {log.type === 'narrative' ? (
                    <div className="prose prose-invert prose-amber max-w-none text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-amber-50">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-amber-50">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-amber-50">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-amber-50">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          code: ({ children }) => <code className="bg-amber-900/50 px-1 rounded text-xs font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-amber-600 pl-2 italic">{children}</blockquote>,
                        }}
                      >
                        {log.message}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>
                      {log.message}
                      {log.type === 'system' && 
                       log.message === 'Loading class abilities from knowledge base...' && 
                       isLoadingClassDetails && (
                        <span className="waiting-indicator ml-2">
                          <span className="waiting-dot"></span>
                          <span className="waiting-dot"></span>
                          <span className="waiting-dot"></span>
                        </span>
                      )}
                    </span>
                  )}
                </div>
              ))}
              {isWaitingForAgent && (
                <div className="p-2 rounded bg-amber-800/50 text-amber-100">
                  <span className="waiting-indicator">
                    Waiting for agent response
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                  </span>
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {isBattleActive && (
            <button
              onClick={resetBattle}
              className="w-full py-2 px-4 bg-amber-800 hover:bg-amber-700 text-amber-100 font-bold rounded-lg border-2 border-amber-700 transition-all"
            >
              Reset Battle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

