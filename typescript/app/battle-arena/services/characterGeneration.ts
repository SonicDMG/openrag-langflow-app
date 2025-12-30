import { Character, Ability } from '../lib/types';
import { extractJsonFromResponse, parseSSEResponse } from '../utils/api';
import { PLAYER_RACES } from '../lib/constants';

interface GeneratedStats {
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  race?: string;
  sex?: string;
}

interface GenerationResult {
  name?: string;
  stats: GeneratedStats | null;
  abilities: Ability[];
  race?: string;
  sex?: string;
}

/**
 * Entity scale categories with stat ranges
 * These ranges serve as guidelines, not absolute constraints
 */
interface EntityScale {
  category: string;
  hitPoints: { min: number; max: number };
  armorClass: { min: number; max: number };
  attackBonus: { min: number; max: number };
  description: string;
}

const ENTITY_SCALES: Record<string, EntityScale> = {
  tiny: {
    category: 'Tiny',
    hitPoints: { min: 5, max: 15 },
    armorClass: { min: 15, max: 20 },
    attackBonus: { min: 2, max: 4 },
    description: 'Very small creatures like fairies, pixies, sprites, insects, or mice',
  },
  small: {
    category: 'Small',
    hitPoints: { min: 10, max: 25 },
    armorClass: { min: 13, max: 17 },
    attackBonus: { min: 2, max: 5 },
    description: 'Small creatures like goblins, kobolds, halflings, gnomes, or children',
  },
  medium: {
    category: 'Medium',
    hitPoints: { min: 20, max: 40 },
    armorClass: { min: 12, max: 18 },
    attackBonus: { min: 3, max: 6 },
    description: 'Human-sized creatures like humans, elves, dwarves, or orcs',
  },
  large: {
    category: 'Large',
    hitPoints: { min: 50, max: 100 },
    armorClass: { min: 13, max: 17 },
    attackBonus: { min: 4, max: 8 },
    description: 'Large creatures like ogres, trolls, bears, lions, or horses',
  },
  huge: {
    category: 'Huge',
    hitPoints: { min: 100, max: 200 },
    armorClass: { min: 14, max: 19 },
    attackBonus: { min: 6, max: 10 },
    description: 'Huge creatures like giants, young dragons, elephants, or whales',
  },
  gargantuan: {
    category: 'Gargantuan',
    hitPoints: { min: 200, max: 400 },
    armorClass: { min: 16, max: 22 },
    attackBonus: { min: 8, max: 12 },
    description: 'Massive creatures like ancient dragons, krakens, titans, or colossal beings',
  },
  vehicle: {
    category: 'Vehicle/Construct',
    hitPoints: { min: 150, max: 500 },
    armorClass: { min: 16, max: 24 },
    attackBonus: { min: 5, max: 10 },
    description: 'Vehicles, constructs, or machines like spaceships, war machines, mechs, or golems',
  },
  swarm: {
    category: 'Swarm',
    hitPoints: { min: 30, max: 60 },
    armorClass: { min: 10, max: 14 },
    attackBonus: { min: 3, max: 6 },
    description: 'Swarms or hordes of small creatures acting as one entity',
  },
  ethereal: {
    category: 'Ethereal/Spirit',
    hitPoints: { min: 20, max: 50 },
    armorClass: { min: 10, max: 16 },
    attackBonus: { min: 3, max: 7 },
    description: 'Incorporeal or spiritual entities like ghosts, wraiths, shadows, or phantoms',
  },
};

/**
 * Keywords for detecting entity scale from description
 */
const SCALE_KEYWORDS: Record<string, string[]> = {
  tiny: ['tiny', 'pixie', 'fairy', 'sprite', 'insect', 'mouse', 'rat', 'butterfly', 'bee', 'miniature', 'diminutive'],
  small: ['small', 'goblin', 'kobold', 'halfling', 'gnome', 'child', 'imp', 'cat', 'dog'],
  large: ['large', 'ogre', 'troll', 'bear', 'lion', 'horse', 'minotaur', 'centaur', 'wyvern'],
  huge: ['huge', 'giant', 'dragon', 'elephant', 'whale', 'hydra', 'behemoth', 'massive', 'enormous'],
  gargantuan: ['gargantuan', 'ancient dragon', 'kraken', 'titan', 'colossal', 'tarrasque', 'leviathan', 'elder'],
  vehicle: ['spaceship', 'ship', 'vehicle', 'tank', 'mech', 'war machine', 'construct', 'golem', 'automaton', 'robot', 'airship', 'battleship'],
  swarm: ['swarm', 'horde', 'colony', 'pack', 'flock', 'school'],
  ethereal: ['ghost', 'wraith', 'spirit', 'phantom', 'ethereal', 'shadow', 'specter', 'apparition', 'incorporeal'],
};

/**
 * Analyze description to determine entity scale category
 * Returns the most specific/powerful scale detected, or default based on character type
 */
export function analyzeEntityScale(description: string, characterType: 'hero' | 'monster'): EntityScale {
  const descLower = description.toLowerCase();
  
  // Priority order: more specific/powerful categories first
  const priorityOrder = ['gargantuan', 'vehicle', 'huge', 'large', 'ethereal', 'swarm', 'small', 'tiny'];
  
  for (const scaleKey of priorityOrder) {
    const keywords = SCALE_KEYWORDS[scaleKey];
    for (const keyword of keywords) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(descLower)) {
        console.log(`Detected entity scale: ${scaleKey} (keyword: "${keyword}")`);
        return ENTITY_SCALES[scaleKey];
      }
    }
  }
  
  // Default fallback based on character type
  const defaultScale = characterType === 'hero' ? 'medium' : 'large';
  console.log(`No scale keywords detected, using default: ${defaultScale}`);
  return ENTITY_SCALES[defaultScale];
}

/**
 * Extract race from description text by matching against known races
 */
export function extractRaceFromDescription(description: string): string | undefined {
  const descLower = description.toLowerCase();
  
  // Sort races by length (longest first) to match "Dark Elf (Drow)" before "Elf"
  const sortedRaces = [...PLAYER_RACES].sort((a, b) => b.name.length - a.name.length);
  
  // Check against all known races (case-insensitive)
  for (const race of sortedRaces) {
    const raceNameLower = race.name.toLowerCase();
    // Escape special regex characters
    const escapedName = raceNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // For multi-word races, we need to allow spaces between words
    // Use word boundary at start and end, but allow spaces in the middle
    const regex = new RegExp(`(^|\\s)${escapedName}(\\s|$)`, 'i');
    if (regex.test(descLower)) {
      return race.name;
    }
  }
  
  return undefined;
}

/**
 * Extract sex/gender from description text
 */
export function extractSexFromDescription(description: string): string | undefined {
  const descLower = description.toLowerCase();
  
  // Common sex/gender terms
  const sexPatterns = [
    { pattern: /\b(male|man|men|boy|boys|he|him|his)\b/i, value: 'male' },
    { pattern: /\b(female|woman|women|girl|girls|she|her|hers)\b/i, value: 'female' },
    { pattern: /\b(non-binary|nonbinary|enby|they|them|their)\b/i, value: 'other' },
  ];
  
  for (const { pattern, value } of sexPatterns) {
    if (pattern.test(descLower)) {
      return value;
    }
  }
  
  return undefined;
}

/**
 * Extract character name from description text
 * Looks for patterns like "Name the", "Name is", "Name,", "Name:", etc.
 */
export function extractNameFromDescription(description: string): string | undefined {
  // Common patterns for names in descriptions:
  // - "Name the Class" or "Name, a Class"
  // - "Name is a..."
  // - "Name: description"
  // - "The character Name..."
  
  const patterns = [
    // Pattern: "Name: description" (check this first to capture full name before colon)
    // Allow lowercase words like "the", "of", "de", etc. in the middle
    /^([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[a-z]+))*):/,
    // Pattern: "Name the Class" or "Name is a..." or "Name was a..."
    /^([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[a-z]+))*)\s+(?:the|is|was)/i,
    // Pattern: "Name, a Class" or "Name, the Class"
    /^([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[a-z]+))*),\s*(?:a|an|the)/i,
    // Pattern: "The character Name..." or "A warrior Name..."
    /(?:character|hero|warrior|wizard|rogue|cleric|ranger|monk|bard|paladin|barbarian|druid|warlock|monster|creature)\s+([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[a-z]+))*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const potentialName = match[1].trim();
      // Don't return if it's a common class/race word or common words like "with", "a", "the"
      // But allow multi-word names that contain these words (e.g., "Gandalf the Grey")
      const commonWords = ['human', 'elf', 'dwarf', 'halfling', 'dragonborn', 'gnome', 'tiefling', 'orc', 'goblin', 'kobold', 'with', 'a', 'an', 'the', 'warrior'];
      const nameLower = potentialName.toLowerCase();
      const nameParts = potentialName.split(/\s+/);
      
      // Filter out if:
      // 1. The entire name is a common word
      // 2. The name starts with a common word and has no capital letters after (e.g., "with a sword")
      // 3. All words are common words
      const allCommonWords = nameParts.every(part => commonWords.includes(part.toLowerCase()));
      const startsWithCommon = commonWords.includes(nameParts[0].toLowerCase());
      const hasNoCapitals = !nameParts.slice(1).some(part => /^[A-Z]/.test(part));
      
      if (allCommonWords || (startsWithCommon && hasNoCapitals)) {
        return undefined;
      }
      
      // Allow if it's a multi-word name that doesn't match the above filters
      return potentialName;
    }
  }
  
  return undefined;
}

/**
 * Generate character stats and abilities from a description using the agent
 */
export async function generateCharacterStats(
  name: string,
  description: string,
  characterType: 'hero' | 'monster'
): Promise<GenerationResult> {
  try {
    const typeLabel = characterType === 'hero' ? 'hero' : 'monster';
    
    // Extract race, sex, and name from the description if mentioned
    const extractedRace = extractRaceFromDescription(description);
    const extractedSex = extractSexFromDescription(description);
    const extractedName = extractNameFromDescription(description);
    
    // Use extracted name if found, otherwise use provided name
    const nameToUse = extractedName || (name && name.trim() ? name : '');
    
    // Analyze entity scale from description
    const entityScale = analyzeEntityScale(description, characterType);
    
    // Generate name and stats
    // If no name provided or name is empty, always generate one
    const shouldGenerateName = !nameToUse || !nameToUse.trim();
    const statsQuery = `Create a Battle Arena ${typeLabel} character based on this description: "${description}"

${shouldGenerateName ? 'Generate an appropriate name for this character.' : `Character name: ${nameToUse}`}

IMPORTANT: This character appears to be in the "${entityScale.category}" category (${entityScale.description}).

Provide the following information in JSON format:
{
  "name": string (${shouldGenerateName ? 'generate an appropriate fantasy name fitting the description' : 'use the provided name'}),
  "hitPoints": number (suggested range: ${entityScale.hitPoints.min}-${entityScale.hitPoints.max}, but adjust based on special abilities, armor, or circumstances mentioned in the description),
  "armorClass": number (suggested range: ${entityScale.armorClass.min}-${entityScale.armorClass.max}, but adjust for magical protection, shields, or special defenses mentioned),
  "attackBonus": number (suggested range: ${entityScale.attackBonus.min}-${entityScale.attackBonus.max}, but adjust for weapon mastery, magical enhancement, or special combat abilities),
  "damageDie": string (typical weapon damage die like "d6", "d8", "d10", or "d12" - scale appropriately for entity size),
  "race": string (extract race from description if mentioned, e.g., "Human", "Elf", "Dwarf", or "n/a" if not applicable),
  "sex": string (extract sex/gender from description if mentioned, e.g., "male", "female", "other", or "n/a" if not applicable)
}

GUIDELINES (not strict limits):
- The suggested ranges are guidelines based on the entity's apparent scale
- Feel free to exceed these ranges if the description mentions special abilities, magical enhancements, or unique circumstances
- For example: a tiny fairy with a "protection sphere" could have much higher AC than typical for tiny creatures
- A spaceship should have significantly more HP and AC than a humanoid
- Consider the full context of the description when determining appropriate stats

Return ONLY valid JSON, no other text.`;

    const statsResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: statsQuery,
        previousResponseId: null,
      }),
    });

    if (!statsResponse.ok) {
      throw new Error(`HTTP error! status: ${statsResponse.status}`);
    }

    const statsReader = statsResponse.body?.getReader();
    if (!statsReader) {
      throw new Error('No response body');
    }

    const { content: statsContent } = await parseSSEResponse(statsReader);

    // Extract stats JSON
    const statsJsonString = extractJsonFromResponse(
      statsContent,
      ['name', 'hitPoints', 'armorClass', 'attackBonus', 'damageDie', 'race', 'sex'],
      ['search_query']
    );

    let generatedName: string | undefined = undefined;
    let stats: GeneratedStats | null = null;
    if (statsJsonString) {
      try {
        const parsed = JSON.parse(statsJsonString);
        // Extract name - use generated name if no name was provided
        if (parsed.name) {
          if (!nameToUse || !nameToUse.trim()) {
            // Use generated name if no name was provided or name is empty
            generatedName = parsed.name;
          }
          // If name was provided, keep generatedName as undefined (we'll use the provided name)
        }
        // Normalize damageDie format
        let damageDie = parsed.damageDie || 'd8';
        if (damageDie.match(/^\d+d\d+$/)) {
          damageDie = 'd' + damageDie.split('d')[1];
        }

        // Use midpoint of entity scale range as fallback
        const fallbackHP = Math.floor((entityScale.hitPoints.min + entityScale.hitPoints.max) / 2);
        const fallbackAC = Math.floor((entityScale.armorClass.min + entityScale.armorClass.max) / 2);
        const fallbackAttack = Math.floor((entityScale.attackBonus.min + entityScale.attackBonus.max) / 2);
        
        const hitPoints = parsed.hitPoints || fallbackHP;
        // Use race/sex from parsed JSON if available, otherwise use extracted from description
        // Filter out "n/a" values - treat them as undefined
        let race = parsed.race && parsed.race !== 'n/a' ? parsed.race : extractedRace;
        let sex = parsed.sex && parsed.sex !== 'n/a' ? parsed.sex : extractedSex;
        
        stats = {
          hitPoints,
          maxHitPoints: hitPoints,
          armorClass: parsed.armorClass || fallbackAC,
          attackBonus: parsed.attackBonus || fallbackAttack,
          damageDie,
          race,
          sex,
        };
      } catch (parseError) {
        console.warn('Error parsing stats JSON:', parseError);
        // Try to extract partial data
        const nameMatch = statsJsonString.match(/"name"\s*:\s*"([^"]*)"/);
        const hitPointsMatch = statsJsonString.match(/"hitPoints"\s*:\s*(\d+)/);
        const armorClassMatch = statsJsonString.match(/"armorClass"\s*:\s*(\d+)/);
        const attackBonusMatch = statsJsonString.match(/"attackBonus"\s*:\s*(\d+)/);
        const damageDieMatch = statsJsonString.match(/"damageDie"\s*:\s*"([^"]+)"/);

        if (nameMatch) {
          if (!name || !name.trim()) {
            // Use generated name if no name was provided or name is empty
            generatedName = nameMatch[1];
          }
        }

        if (hitPointsMatch || armorClassMatch) {
          let damageDie = damageDieMatch ? damageDieMatch[1] : 'd8';
          if (damageDie.match(/^\d+d\d+$/)) {
            damageDie = 'd' + damageDie.split('d')[1];
          }

          // Use midpoint of entity scale range as fallback
          const fallbackHP = Math.floor((entityScale.hitPoints.min + entityScale.hitPoints.max) / 2);
          const fallbackAC = Math.floor((entityScale.armorClass.min + entityScale.armorClass.max) / 2);
          const fallbackAttack = Math.floor((entityScale.attackBonus.min + entityScale.attackBonus.max) / 2);
          
          const hitPoints = hitPointsMatch ? parseInt(hitPointsMatch[1]) : fallbackHP;
          stats = {
            hitPoints,
            maxHitPoints: hitPoints,
            armorClass: armorClassMatch ? parseInt(armorClassMatch[1]) : fallbackAC,
            attackBonus: attackBonusMatch ? parseInt(attackBonusMatch[1]) : fallbackAttack,
            damageDie,
          };
        }
      }
    }

    // Generate abilities
    // Use generated name if available, otherwise use provided name
    const characterName = generatedName || name || '';
    const abilitiesQuery = `Create Battle Arena abilities for a ${typeLabel} character based on this description: "${description}"

${characterName ? `Character name: ${characterName}` : ''}

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
- Use standard Battle Arena dice notation (e.g., "1d10", "3d6", "2d8+4")
- Return ONLY valid JSON, no other text before or after
- Generate 2-5 abilities appropriate for this character
- Include a mix of attack and healing abilities if appropriate for the character type
- Make abilities creative and fitting for the character description`;

    const abilitiesResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: abilitiesQuery,
        previousResponseId: null,
      }),
    });

    if (!abilitiesResponse.ok) {
      throw new Error(`HTTP error! status: ${abilitiesResponse.status}`);
    }

    const abilitiesReader = abilitiesResponse.body?.getReader();
    if (!abilitiesReader) {
      throw new Error('No response body');
    }

    const { content: abilitiesContent } = await parseSSEResponse(abilitiesReader);

    // Extract abilities JSON first (before checking for early returns)
    let abilitiesJsonString = extractJsonFromResponse(
      abilitiesContent,
      ['abilities']
    );

    // Check if response indicates no data found
    if (abilitiesContent.toLowerCase().includes('no relevant supporting sources') ||
        abilitiesContent.toLowerCase().includes('no sources found') ||
        abilitiesContent.toLowerCase().includes('no relevant information') ||
        abilitiesContent.trim().length === 0 ||
        !abilitiesJsonString) {
      console.warn('No abilities data found in response');
      // Still need to assign race and sex before returning
      // Extract race and sex from stats if available, otherwise from description
      let finalRace = stats?.race && stats.race !== 'n/a' ? stats.race : undefined;
      if (!finalRace) {
        finalRace = extractedRace;
      }
      
      let finalSex = stats?.sex && stats.sex !== 'n/a' ? stats.sex : undefined;
      if (!finalSex) {
        finalSex = extractedSex;
      }
      
      // For heroes only: If race not found, randomly select from available hero races
      if (!finalRace && characterType === 'hero') {
        const randomRace = PLAYER_RACES[Math.floor(Math.random() * PLAYER_RACES.length)];
        finalRace = randomRace.name;
      }
      
      // If sex not found, randomly select from common options (applies to both heroes and monsters)
      if (!finalSex) {
        const sexOptions = ['male', 'female', 'other'];
        finalSex = sexOptions[Math.floor(Math.random() * sexOptions.length)];
      }
      
      const finalName = generatedName || (nameToUse && nameToUse.trim() ? nameToUse : undefined);
      
      return { 
        name: finalName, 
        stats: stats ? { ...stats, race: finalRace, sex: finalSex } : null, 
        abilities: [],
        race: finalRace,
        sex: finalSex,
      };
    }

    // Fix common JSON malformation
    abilitiesJsonString = abilitiesJsonString.replace(/,\s*"(\{[^"]*"[^"]*"[^}]*\})"\s*/g, ',$1');
    abilitiesJsonString = abilitiesJsonString.replace(/\[\s*"(\{[^"]*"[^"]*"[^}]*\})"\s*/g, '[$1');
    abilitiesJsonString = abilitiesJsonString.replace(/"(\{[^"]*"[^"]*"[^}]*\})"/g, '$1');
    abilitiesJsonString = abilitiesJsonString.replace(/,(\s*[}\]])/g, '$1');

    let abilities: Ability[] = [];
    try {
      const parsed = JSON.parse(abilitiesJsonString);
      if (parsed.abilities && Array.isArray(parsed.abilities)) {
        // Validate and normalize abilities
        for (const ability of parsed.abilities) {
          if (ability.type === 'attack' && ability.name && ability.damageDice) {
            abilities.push({
              name: ability.name,
              type: 'attack',
              damageDice: ability.damageDice,
              attackRoll: ability.attackRoll !== undefined ? ability.attackRoll : true,
              attacks: ability.attacks || 1,
              bonusDamageDice: ability.bonusDamageDice,
              description: ability.description || '',
            } as Ability);
          } else if (ability.type === 'healing' && ability.name && ability.healingDice) {
            abilities.push({
              name: ability.name,
              type: 'healing',
              healingDice: ability.healingDice,
              description: ability.description || '',
            } as Ability);
          } else {
            console.warn('Skipping invalid ability:', ability);
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing abilities JSON:', parseError);
      console.error('Extracted JSON string was:', abilitiesJsonString);
    }

    // Extract race and sex from stats if available, otherwise from description
    // Filter out "n/a" values - treat them as undefined
    let finalRace = stats?.race && stats.race !== 'n/a' ? stats.race : undefined;
    if (!finalRace) {
      finalRace = extractedRace;
    }
    
    let finalSex = stats?.sex && stats.sex !== 'n/a' ? stats.sex : undefined;
    if (!finalSex) {
      finalSex = extractedSex;
    }
    
    // For heroes only: If race not found, randomly select from available hero races
    if (!finalRace && characterType === 'hero') {
      const randomRace = PLAYER_RACES[Math.floor(Math.random() * PLAYER_RACES.length)];
      finalRace = randomRace.name;
    }
    
    // If sex not found, randomly select from common options (applies to both heroes and monsters)
    if (!finalSex) {
      const sexOptions = ['male', 'female', 'other'];
      finalSex = sexOptions[Math.floor(Math.random() * sexOptions.length)];
    }
    
    // Determine final name: use generated name if available, otherwise use extracted or provided name
    const finalName = generatedName || (nameToUse && nameToUse.trim() ? nameToUse : undefined);
    
    return { 
      name: finalName, 
      stats: stats ? { ...stats, race: finalRace, sex: finalSex } : null, 
      abilities,
      race: finalRace,
      sex: finalSex,
    };
  } catch (error) {
    console.error('Error generating character stats:', error);
    throw error;
  }
}

