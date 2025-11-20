import { DnDClass, Ability } from '../types';
import { extractJsonFromResponse, parseSSEResponse } from '../utils/api';
import { DND_PLAYER_RACES } from '../constants';

interface GeneratedStats {
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  description: string;
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
 * Extract race from description text by matching against known races
 */
export function extractRaceFromDescription(description: string): string | undefined {
  const descLower = description.toLowerCase();
  
  // Sort races by length (longest first) to match "Dark Elf (Drow)" before "Elf"
  const sortedRaces = [...DND_PLAYER_RACES].sort((a, b) => b.name.length - a.name.length);
  
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
    
    // Generate name and stats
    // If no name provided or name is empty, always generate one
    const shouldGenerateName = !nameToUse || !nameToUse.trim();
    const statsQuery = `Create a D&D ${typeLabel} character based on this description: "${description}"

${shouldGenerateName ? 'Generate an appropriate name for this character.' : `Character name: ${nameToUse}`}

Provide the following information in JSON format:
{
  "name": string (${shouldGenerateName ? 'generate an appropriate fantasy name fitting the description' : 'use the provided name'}),
  "hitPoints": number (typical HP for a ${characterType === 'hero' ? 'level 1-3 character, around 20-35' : 'challenging encounter, 25-50'}),
  "armorClass": number (typical AC, between ${characterType === 'hero' ? '12-18' : '10-20'}),
  "attackBonus": number (typical attack bonus modifier, between ${characterType === 'hero' ? '3-5' : '2-8'}),
  "damageDie": string (typical weapon damage die like "d6", "d8", "d10", or "d12"),
  "description": string (a single concise sentence that combines the character's role/descriptor with key visual details: appearance (height, build, hair, eyes), clothing/armor, and visible equipment. Be descriptive but concise - prioritize the most distinctive visual features that would help generate an accurate image. Keep it brief and focused.),
  "race": string (extract race from description if mentioned, e.g., "Human", "Elf", "Dwarf", or "n/a" if not applicable),
  "sex": string (extract sex/gender from description if mentioned, e.g., "male", "female", "other", or "n/a" if not applicable)
}

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

        const hitPoints = parsed.hitPoints || (characterType === 'hero' ? 25 : 30);
        // Use race/sex from parsed JSON if available, otherwise use extracted from description
        // Filter out "n/a" values - treat them as undefined
        let race = parsed.race && parsed.race !== 'n/a' ? parsed.race : extractedRace;
        let sex = parsed.sex && parsed.sex !== 'n/a' ? parsed.sex : extractedSex;
        
        stats = {
          hitPoints,
          maxHitPoints: hitPoints,
          armorClass: parsed.armorClass || (characterType === 'hero' ? 14 : 14),
          attackBonus: parsed.attackBonus || (characterType === 'hero' ? 4 : 4),
          damageDie,
          description: parsed.description || description,
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
        const descriptionMatch = statsJsonString.match(/"description"\s*:\s*"([^"]*)"/);

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

          const hitPoints = hitPointsMatch ? parseInt(hitPointsMatch[1]) : (characterType === 'hero' ? 25 : 30);
          stats = {
            hitPoints,
            maxHitPoints: hitPoints,
            armorClass: armorClassMatch ? parseInt(armorClassMatch[1]) : 14,
            attackBonus: attackBonusMatch ? parseInt(attackBonusMatch[1]) : 4,
            damageDie,
            description: descriptionMatch ? descriptionMatch[1] : description,
          };
        }
      }
    }

    // Generate abilities
    // Use generated name if available, otherwise use provided name
    const characterName = generatedName || name || '';
    const abilitiesQuery = `Create D&D abilities for a ${typeLabel} character based on this description: "${description}"

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
- Use standard D&D dice notation (e.g., "1d10", "3d6", "2d8+4")
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
        const randomRace = DND_PLAYER_RACES[Math.floor(Math.random() * DND_PLAYER_RACES.length)];
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
      const randomRace = DND_PLAYER_RACES[Math.floor(Math.random() * DND_PLAYER_RACES.length)];
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

