'use client';

import { useState, useRef, useEffect } from 'react';
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

const DND_CLASSES: DnDClass[] = [
  {
    name: 'Fighter',
    hitPoints: 30,
    maxHitPoints: 30,
    armorClass: 18,
    attackBonus: 5,
    damageDie: 'd10',
    abilities: [], // Will be populated dynamically from API
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
    abilities: [], // Will be populated dynamically from API
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
    abilities: [], // Will be populated dynamically from API
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
    abilities: [], // Will be populated dynamically from API
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
    abilities: [], // Will be populated dynamically from API
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
    abilities: [], // Will be populated dynamically from API
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
      <div className="grid grid-cols-2 gap-2">
        {availableClasses.map((dndClass) => (
          <button
            key={dndClass.name}
            onClick={() => onSelect({ ...dndClass, hitPoints: dndClass.maxHitPoints })}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedClass?.name === dndClass.name
                ? 'border-amber-400 bg-amber-800 shadow-lg scale-105'
                : 'border-amber-700 bg-amber-900/50 hover:bg-amber-800 hover:border-amber-600'
            }`}
          >
            <div className="font-bold text-sm text-amber-100">{dndClass.name}</div>
            <div className="text-xs text-amber-300 mt-1">{dndClass.hitPoints} HP</div>
          </button>
        ))}
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
    const timer = setTimeout(() => setSparkles([]), 1000);
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

// PlayerStats component to eliminate duplicate rendering code
interface PlayerStatsProps {
  playerClass: DnDClass;
  playerId: 'player1' | 'player2';
  currentTurn: 'player1' | 'player2';
  onAttack: () => void;
  onUseAbility: (index: number) => void;
  shouldShake: boolean;
  shouldSparkle: boolean;
  shakeTrigger: number;
  sparkleTrigger: number;
  onShakeComplete: () => void;
  onSparkleComplete: () => void;
}

function PlayerStats({ 
  playerClass, 
  playerId, 
  currentTurn, 
  onAttack, 
  onUseAbility,
  shouldShake,
  shouldSparkle,
  shakeTrigger,
  sparkleTrigger,
  onShakeComplete,
  onSparkleComplete
}: PlayerStatsProps) {
  const isActive = currentTurn === playerId;
  const shakeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldShake && shakeTrigger > 0 && shakeRef.current) {
      // Force reflow to restart animation
      shakeRef.current.classList.remove('shake');
      // Use requestAnimationFrame to ensure the class removal is processed
      let timer: NodeJS.Timeout;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (shakeRef.current) {
            shakeRef.current.classList.add('shake');
            timer = setTimeout(() => {
              shakeRef.current?.classList.remove('shake');
              onShakeComplete();
            }, 600);
          }
        });
      });
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [shouldShake, shakeTrigger, onShakeComplete]);

  useEffect(() => {
    if (shouldSparkle && sparkleTrigger > 0) {
      const timer = setTimeout(() => {
        onSparkleComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [shouldSparkle, sparkleTrigger, onSparkleComplete]);

  return (
    <div 
      ref={shakeRef}
      className={`bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl sparkle-container ${isActive ? 'ring-4 ring-amber-400' : ''}`}
    >
      {shouldSparkle && <Sparkles key={sparkleTrigger} trigger={sparkleTrigger} />}
      <h3 className="text-2xl font-bold mb-3 text-amber-100" style={{ fontFamily: 'serif' }}>
        {playerClass.name}
        {isActive && ' ⚡'}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-amber-300">Hit Points:</span>
          <span className="font-bold text-amber-100">
            {playerClass.hitPoints} / {playerClass.maxHitPoints}
          </span>
        </div>
        <div className="w-full bg-amber-950 rounded-full h-4 border-2 border-amber-800">
          <div
            className="bg-red-600 h-full rounded-full transition-all"
            style={{ width: `${(playerClass.hitPoints / playerClass.maxHitPoints) * 100}%` }}
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
                  disabled={!isActive}
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
            className="mt-4 w-full py-2 px-4 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border-2 border-red-700 transition-all"
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
  const [availableClasses] = useState<DnDClass[]>(DND_CLASSES);
  const [classDetails, setClassDetails] = useState<Record<string, string>>({});
  const [isLoadingClassDetails, setIsLoadingClassDetails] = useState(false);
  const [battleResponseId, setBattleResponseId] = useState<string | null>(null);
  const [shakingPlayer, setShakingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState({ player1: 0, player2: 0 });
  const [sparklingPlayer, setSparklingPlayer] = useState<'player1' | 'player2' | null>(null);
  const [sparkleTrigger, setSparkleTrigger] = useState({ player1: 0, player2: 0 });
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [battleLog]);

  // Helper function to update player HP
  const updatePlayerHP = (player: 'player1' | 'player2', newHP: number) => {
    if (player === 'player1') {
      setPlayer1Class((current) => current ? { ...current, hitPoints: newHP } : current);
    } else {
      setPlayer2Class((current) => current ? { ...current, hitPoints: newHP } : current);
    }
  };

  // Helper function to calculate attack roll
  const calculateAttackRoll = (attackerClass: DnDClass): { d20Roll: number; attackRoll: number } => {
    const d20Roll = rollDice('d20');
    const attackRoll = d20Roll + attackerClass.attackBonus;
    return { d20Roll, attackRoll };
  };

  // Helper function to log attack roll
  const logAttackRoll = (attackerClass: DnDClass, d20Roll: number, attackRoll: number, defenderAC: number) => {
    addLog('roll', `🎲 ${attackerClass.name} rolls ${d20Roll}${attackerClass.attackBonus > 0 ? ` + ${attackerClass.attackBonus}` : ''} = ${attackRoll} (needs ${defenderAC})`);
  };

  // Helper function to generate narrative and update response ID
  const generateAndLogNarrative = async (
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
  };

  // Helper function to handle victory condition
  const handleVictory = async (
    attackerClass: DnDClass,
    defenderClass: DnDClass,
    damage: number,
    attackerDetails: string = '',
    defenderDetails: string = '',
    eventDescription: string
  ): Promise<void> => {
    setIsBattleActive(false);
    await generateAndLogNarrative(
      eventDescription,
      attackerClass,
      { ...defenderClass, hitPoints: 0 },
      attackerDetails,
      defenderDetails
    );
    addLog('system', `🏆 ${attackerClass.name} wins!`);
  };

  // Helper function to switch turns
  const switchTurn = (currentAttacker: 'player1' | 'player2') => {
    setCurrentTurn(currentAttacker === 'player1' ? 'player2' : 'player1');
  };

  // Fetch detailed class information from OpenSearch knowledge base
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

      // Try to extract JSON from the response
      // Look for JSON object in the response (may be wrapped in markdown code blocks or plain text)
      let jsonString = accumulatedResponse.trim();
      
      console.log('Raw response received:', jsonString.substring(0, 200) + '...');
      
      // Remove markdown code block markers if present
      jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      
      // The response may contain multiple JSON objects (search queries + abilities)
      // We need to find the one that contains "abilities" field
      // Try to find all JSON objects and pick the one with "abilities"
      let abilitiesJsonString: string | null = null;
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
        
        // Check if this JSON contains "abilities" field
        if (candidateJson.includes('"abilities"') || candidateJson.includes("'abilities'")) {
          abilitiesJsonString = candidateJson;
          console.log('Found abilities JSON object at position', jsonStart, 'length:', candidateJson.length);
          break;
        }
        
        // Move search index past this JSON object
        searchIndex = jsonEnd;
      }
      
      if (!abilitiesJsonString) {
        console.error('No JSON object with "abilities" field found. Full response:', accumulatedResponse);
        return [];
      }
      
      jsonString = abilitiesJsonString;
      console.log('Extracted JSON string with abilities:', jsonString.substring(0, 200) + '...');

      try {
        const parsed = JSON.parse(jsonString);
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
        console.error('Extracted JSON string was:', jsonString);
        console.error('Full response was:', accumulatedResponse);
        // Fallback: return empty array if parsing fails
        return [];
      }
    } catch (error) {
      console.error('Error extracting abilities:', error);
      return [];
    }
  };

  const addLog = (type: BattleLog['type'], message: string) => {
    setBattleLog((prev) => [...prev, { type, message, timestamp: Date.now() }]);
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
    setIsLoadingClassDetails(false);
    
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
  };

  const performAttack = async (attacker: 'player1' | 'player2') => {
    if (!isBattleActive || !player1Class || !player2Class) return;

    const attackerClass = attacker === 'player1' ? player1Class : player2Class;
    const defenderClass = attacker === 'player1' ? player2Class : player1Class;
    const attackerDetails = classDetails[attackerClass.name] || '';
    const defenderDetails = classDetails[defenderClass.name] || '';

    // Roll attack
    const { d20Roll, attackRoll } = calculateAttackRoll(attackerClass);
    logAttackRoll(attackerClass, d20Roll, attackRoll, defenderClass.armorClass);

    if (attackRoll >= defenderClass.armorClass) {
      // Hit!
      const damage = rollDice(attackerClass.damageDie);
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
          `${attackerClass.name} attacks ${defenderClass.name} and deals ${damage} damage. ${defenderClass.name} is defeated with 0 HP remaining.`
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
      // Miss
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
  };

  const useAbility = async (attacker: 'player1' | 'player2', abilityIndex: number) => {
    if (!isBattleActive || !player1Class || !player2Class) return;

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

        // Roll all attacks
        for (let i = 0; i < numAttacks; i++) {
          const d20Roll = rollDice('d20');
          d20Rolls.push(d20Roll);
          const attackRoll = d20Roll + attackerClass.attackBonus;
          attackRolls.push(attackRoll);
          const hit = attackRoll >= defenderClass.armorClass;
          hits.push(hit);
          
          if (hit) {
            let damage = rollDiceWithNotation(attackAbility.damageDice);
            // Add bonus damage if applicable
            if (attackAbility.bonusDamageDice) {
              damage += rollDiceWithNotation(attackAbility.bonusDamageDice);
            }
            damages.push(damage);
            totalDamage += damage;
          } else {
            damages.push(0);
          }
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
            `${attackerClass.name} uses ${ability.name} and makes ${numAttacks} attacks. ${hitDetails} Total damage: ${totalDamage}. ${defenderClass.name} is defeated with 0 HP.`
          );
          switchTurn(attacker);
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
          // Hit
          let damage = rollDiceWithNotation(attackAbility.damageDice);
          // Add bonus damage if applicable
          if (attackAbility.bonusDamageDice) {
            damage += rollDiceWithNotation(attackAbility.bonusDamageDice);
          }
          
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
              `${attackerClass.name} uses ${ability.name} and attacks ${defenderClass.name} with an attack roll of ${attackRoll}. The attack hits for ${damage} damage. ${defenderClass.name} is defeated with 0 HP.`
            );
            switchTurn(attacker);
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
          // Miss
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
        const damage = rollDiceWithNotation(attackAbility.damageDice);
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
            `${attackerClass.name} uses ${ability.name} and deals ${damage} damage to ${defenderClass.name}. ${defenderClass.name} is defeated with 0 HP.`
          );
          switchTurn(attacker);
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
  };

  const resetBattle = () => {
    setIsBattleActive(false);
    setBattleLog([]);
    setPlayer1Class(null);
    setPlayer2Class(null);
    setClassDetails({});
    setBattleResponseId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 text-amber-50">
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
                {isLoadingClassDetails && (
                  <span className="ml-2 text-sm text-amber-300 italic">(Loading class information from knowledge base...)</span>
                )}
              </h2>
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

              <button
                onClick={startBattle}
                disabled={!player1Class || !player2Class}
                className="mt-6 w-full py-3 px-6 bg-red-900 hover:bg-red-800 text-white font-bold text-lg rounded-lg border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                style={{ fontFamily: 'serif' }}
              >
                Begin Battle! ⚔️
              </button>
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
                shakeTrigger={shakeTrigger.player1}
                sparkleTrigger={sparkleTrigger.player1}
                onShakeComplete={() => setShakingPlayer(null)}
                onSparkleComplete={() => setSparklingPlayer(null)}
              />
              <PlayerStats
                playerClass={player2Class}
                playerId="player2"
                currentTurn={currentTurn}
                onAttack={() => performAttack('player2')}
                onUseAbility={(idx) => useAbility('player2', idx)}
                shouldShake={shakingPlayer === 'player2'}
                shouldSparkle={sparklingPlayer === 'player2'}
                shakeTrigger={shakeTrigger.player2}
                sparkleTrigger={sparkleTrigger.player2}
                onShakeComplete={() => setShakingPlayer(null)}
                onSparkleComplete={() => setSparklingPlayer(null)}
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
                    <span>{log.message}</span>
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

