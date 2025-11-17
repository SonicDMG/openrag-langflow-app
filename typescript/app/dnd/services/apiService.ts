import { DnDClass, Ability } from '../types';
import { CLASS_COLORS, FALLBACK_ABILITIES, FALLBACK_MONSTER_ABILITIES, getPlayerClassNames, isMonster } from '../constants';
import { extractJsonFromResponse, parseSSEResponse } from '../utils/api';

/**
 * Shared helper to extract abilities from AI response
 */
async function extractAbilitiesFromResponse(
  name: string,
  accumulatedResponse: string,
  fallbackAbilities: Record<string, Ability[]>
): Promise<Ability[]> {
  // Check if response indicates no data found
  if (accumulatedResponse.toLowerCase().includes('no relevant supporting sources') || 
      accumulatedResponse.toLowerCase().includes('no sources found') ||
      accumulatedResponse.toLowerCase().includes('no relevant information') ||
      accumulatedResponse.trim().length === 0) {
    console.warn(`No data found for ${name} abilities in knowledge base`);
    return fallbackAbilities[name] || [];
  }

  // Extract JSON from response using utility function
  let abilitiesJsonString = extractJsonFromResponse(
    accumulatedResponse,
    ['abilities'] // required field
  );
  
  if (!abilitiesJsonString) {
    // Check if response only contains search_query objects (no actual data)
    if (accumulatedResponse.includes('"search_query"') && !accumulatedResponse.includes('"abilities"')) {
      console.warn(`Only search queries found for ${name}, no abilities data`);
      return fallbackAbilities[name] || [];
    }
    console.error('No JSON object with "abilities" field found. Full response:', accumulatedResponse.substring(0, 200) + '...');
    console.warn(`Using fallback abilities for ${name}`);
    return fallbackAbilities[name] || [];
  }
  
  // Fix common JSON malformation: quoted JSON objects in arrays
  // e.g., [{"name":"A"},"{"name":"B"}"] should be [{"name":"A"},{"name":"B"}]
  abilitiesJsonString = abilitiesJsonString.replace(/,\s*"(\{[^"]*"[^"]*"[^}]*\})"\s*/g, ',$1');
  abilitiesJsonString = abilitiesJsonString.replace(/\[\s*"(\{[^"]*"[^"]*"[^}]*\})"\s*/g, '[$1');
  abilitiesJsonString = abilitiesJsonString.replace(/"(\{[^"]*"[^"]*"[^}]*\})"/g, '$1');
  abilitiesJsonString = abilitiesJsonString.replace(/,(\s*[}\]])/g, '$1');

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
          } as Ability);
        } else if (ability.type === 'healing' && ability.name && ability.healingDice) {
          validAbilities.push({
            name: ability.name,
            type: 'healing',
            healingDice: ability.healingDice,
            description: ability.description || '',
          } as Ability);
        } else {
          console.warn('Skipping invalid ability:', ability);
        }
      }
      
      if (validAbilities.length > 0) {
        return validAbilities;
      }
    }
    // If we parsed successfully but got no valid abilities, use fallback
    console.warn('Parsed JSON but found no valid abilities:', parsed);
    console.warn(`Using fallback abilities for ${name}`);
    return fallbackAbilities[name] || [];
  } catch (parseError) {
    console.error('Error parsing JSON from AI response:', parseError);
    console.error('Extracted JSON string was:', abilitiesJsonString);
    console.error('Full response was:', accumulatedResponse.substring(0, 200) + '...');
    
    // Try to extract abilities manually using regex as a last resort
    try {
      const abilities: Ability[] = [];
      
      // Try to find ability objects in the malformed JSON
      const abilityPattern = /\{"name"\s*:\s*"([^"]+)",\s*"type"\s*:\s*"([^"]+)",\s*"damageDice"\s*:\s*"([^"]+)"/g;
      let match;
      while ((match = abilityPattern.exec(abilitiesJsonString)) !== null) {
        const name = match[1];
        const type = match[2];
        const damageDice = match[3];
        
        if (type === 'attack' && name && damageDice) {
          // Try to extract attackRoll and description
          const attackRollMatch = abilitiesJsonString.substring(match.index).match(/"attackRoll"\s*:\s*(true|false)/);
          const descriptionMatch = abilitiesJsonString.substring(match.index).match(/"description"\s*:\s*"([^"]*)"/);
          
          abilities.push({
            name,
            type: 'attack',
            damageDice,
            attackRoll: attackRollMatch ? attackRollMatch[1] === 'true' : true,
            attacks: 1,
            description: descriptionMatch ? descriptionMatch[1] : '',
          } as Ability);
        } else if (type === 'healing' && name) {
          // Try to extract healingDice
          const healingDiceMatch = abilitiesJsonString.substring(match.index).match(/"healingDice"\s*:\s*"([^"]+)"/);
          const descriptionMatch = abilitiesJsonString.substring(match.index).match(/"description"\s*:\s*"([^"]*)"/);
          
          if (healingDiceMatch) {
            abilities.push({
              name,
              type: 'healing',
              healingDice: healingDiceMatch[1],
              description: descriptionMatch ? descriptionMatch[1] : '',
            } as Ability);
          }
        }
      }
      
      if (abilities.length > 0) {
        console.warn(`Extracted ${abilities.length} abilities using regex fallback for ${name}`);
        return abilities;
      }
    } catch (regexError) {
      console.error('Regex extraction also failed:', regexError);
    }
    
    console.warn(`Using fallback abilities for ${name}`);
    return fallbackAbilities[name] || [];
  }
}

// Fetch all available D&D classes from OpenRAG
export async function fetchAvailableClasses(
  addLog: (type: 'system' | 'narrative', message: string) => void,
  searchContext?: string
): Promise<{ classNames: string[]; response: string }> {
  try {
    const query = searchContext 
      ? `Based on your knowledge base, what character classes are available in ${searchContext}? Return only a JSON array of class names, like ["Fighter", "Wizard", "Rogue", ...]. Do not include any other text, just the JSON array.`
      : `List all available D&D 5th edition character classes. Return only a JSON array of class names, like ["Fighter", "Wizard", "Rogue", ...]. Do not include any other text, just the JSON array.`;
    
    addLog('system', `🔍 Querying OpenRAG for available classes${searchContext ? ` (${searchContext})` : ' (D&D)'}...`);
    
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
    
    // Check if OpenRAG returned "no sources found" error
    if (content.toLowerCase().includes('no relevant supporting sources') || 
        content.toLowerCase().includes('no sources found') ||
        content.toLowerCase().includes('no relevant information')) {
      addLog('system', `⚠️ OpenRAG found no sources for "${searchContext || 'D&D'}" classes. This might mean the knowledge base doesn't contain data for this context.`);
      console.warn('OpenRAG returned no sources found:', content.substring(0, 200));
      return { classNames: [], response: content };
    }
    
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
      const commonClasses = getPlayerClassNames();
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
}

// Fetch class stats from OpenRAG
export async function fetchClassStats(
  className: string,
  addLog: (type: 'system' | 'narrative', message: string) => void,
  searchContext?: string
): Promise<{ stats: Partial<DnDClass> | null; response: string }> {
  try {
    const contextLabel = searchContext || 'D&D';
    const query = `For the ${contextLabel} ${className} class, provide the following information in JSON format:
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
}

// Extract structured abilities directly from the knowledge base
// Uses AI to return attack and healing abilities in a well-defined JSON structure
export async function extractAbilities(className: string, searchContext?: string): Promise<Ability[]> {
  try {
    // Ask the AI to return ALL available abilities for this class
    const contextLabel = searchContext || 'D&D';
    const extractionPrompt = `You are a ${contextLabel} expert. From the ${contextLabel} knowledge base, find information about the ${className} class and return ALL available attack and healing abilities.

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
- Return ALL available attack and healing abilities for this class - do not limit the number
- If the class has no abilities of either type, return an empty abilities array: {"abilities": []}
- Include all abilities that are appropriate for this class`;

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

    return await extractAbilitiesFromResponse(className, accumulatedResponse, FALLBACK_ABILITIES);
  } catch (error) {
    console.error('Error extracting abilities:', error);
    console.warn(`Using fallback abilities for ${className}`);
    return FALLBACK_ABILITIES[className] || [];
  }
}

// Fetch all available D&D monsters from OpenRAG
export async function fetchAvailableMonsters(
  addLog: (type: 'system' | 'narrative', message: string) => void,
  searchContext?: string
): Promise<{ monsterNames: string[]; response: string }> {
  try {
    const query = searchContext
      ? `Based on your knowledge base, what monsters or creatures are available in ${searchContext}? Return only a JSON array of monster names, like ["Goblin", "Orc", "Dragon", "Troll", ...]. Do not include any other text, just the JSON array.`
      : `What are the available DnD monsters? Return only a JSON array of monster names, like ["Goblin", "Orc", "Dragon", "Troll", ...]. Do not include any other text, just the JSON array.`;
    
    addLog('system', `🔍 Querying OpenRAG for available monsters${searchContext ? ` (${searchContext})` : ' (D&D)'}...`);
    
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
    addLog('narrative', `**OpenRAG Response (Monster List):**\n\n${content}`);
    
    // Check if OpenRAG returned "no sources found" error
    if (content.toLowerCase().includes('no relevant supporting sources') || 
        content.toLowerCase().includes('no sources found') ||
        content.toLowerCase().includes('no relevant information')) {
      addLog('system', `⚠️ OpenRAG found no sources for "${searchContext || 'D&D'}" monsters. This might mean the knowledge base doesn't contain data for this context.`);
      console.warn('OpenRAG returned no sources found:', content.substring(0, 200));
      return { monsterNames: [], response: content };
    }
    
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
          return { monsterNames: parsed, response: content };
        }
      } catch {
        // Continue to fallback
      }
    }
    
    // Fallback: try to parse the whole response
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return { monsterNames: parsed, response: content };
      }
    } catch {
      // If parsing fails, return empty array
    }
    
    console.warn('Could not parse monster list from response:', content.substring(0, 200));
    return { monsterNames: [], response: content };
  } catch (error) {
    console.error('Error fetching available monsters:', error);
    addLog('system', `❌ Error fetching monsters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { monsterNames: [], response: '' };
  }
}

// Fetch monster stats from OpenRAG
export async function fetchMonsterStats(
  monsterName: string,
  addLog: (type: 'system' | 'narrative', message: string) => void,
  searchContext?: string
): Promise<{ stats: Partial<DnDClass> | null; response: string }> {
  try {
    const contextLabel = searchContext || 'D&D';
    const query = `For the ${contextLabel} ${monsterName} monster, provide the following information in JSON format:
{
  "hitPoints": number (typical HP for this monster, appropriate for a challenging encounter),
  "armorClass": number (typical AC, between 10-20),
  "attackBonus": number (typical attack bonus modifier, between 2-8),
  "damageDie": string (typical weapon damage die like "d6", "d8", "d10", or "d12"),
  "description": string (brief 1-2 sentence description of the monster)
}

Return ONLY valid JSON, no other text. Use typical values for a challenging but fair encounter.`;
    
    addLog('system', `🔍 Querying OpenRAG for ${monsterName} monster stats...`);
    
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
    addLog('narrative', `**OpenRAG Response (${monsterName} Stats):**\n\n${content}`);
    
    // Extract JSON from response using utility function
    const statsJsonString = extractJsonFromResponse(
      content,
      ['hitPoints', 'armorClass', 'attackBonus', 'damageDie'], // required fields
      ['search_query'] // exclude fields
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
            hitPoints: parsed.hitPoints || 30,
            maxHitPoints: parsed.hitPoints || 30,
            armorClass: parsed.armorClass || 14,
            attackBonus: parsed.attackBonus || 4,
            damageDie: damageDie,
            description: parsed.description || `A ${monsterName} monster.`,
          },
          response: content,
        };
      } catch (parseError) {
        console.warn(`Error parsing stats JSON for ${monsterName}:`, parseError);
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
              hitPoints: hitPointsMatch ? parseInt(hitPointsMatch[1]) : 30,
              maxHitPoints: hitPointsMatch ? parseInt(hitPointsMatch[1]) : 30,
              armorClass: armorClassMatch ? parseInt(armorClassMatch[1]) : 14,
              attackBonus: attackBonusMatch ? parseInt(attackBonusMatch[1]) : 4,
              damageDie: damageDie,
              description: descriptionMatch ? descriptionMatch[1] : `A ${monsterName} monster.`,
            },
            response: content,
          };
        }
      }
    }
    
    console.warn(`Could not parse stats for ${monsterName}:`, content.substring(0, 200));
    return { stats: null, response: content };
  } catch (error) {
    console.error(`Error fetching stats for ${monsterName}:`, error);
    addLog('system', `❌ Error fetching stats for ${monsterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { stats: null, response: '' };
  }
}

// Extract structured abilities for monsters directly from the knowledge base
export async function extractMonsterAbilities(monsterName: string, searchContext?: string): Promise<Ability[]> {
  try {
    // Ask the AI to return ALL available abilities for this monster
    const contextLabel = searchContext || 'D&D';
    const extractionPrompt = `You are a ${contextLabel} expert. From the ${contextLabel} knowledge base, find information about the ${monsterName} monster and return ALL available attack and healing abilities.

Return your response as a JSON object with this exact structure:
{
  "abilities": [
    {
      "name": "Ability Name",
      "type": "attack" or "healing",
      "damageDice": "XdY" (for attacks, e.g., "1d10", "3d6", "2d8"),
      "attackRoll": true or false (for attacks: true if requires attack roll, false if automatic damage),
      "attacks": number (optional, for multi-attack abilities, default: 1),
      "bonusDamageDice": "XdY" (optional, for attacks with bonus damage),
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
- Return ALL available attack and healing abilities for this monster - do not limit the number
- If the monster has no abilities of either type, return an empty abilities array: {"abilities": []}
- Include all abilities that are appropriate for this monster`;

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

    return await extractAbilitiesFromResponse(monsterName, accumulatedResponse, FALLBACK_MONSTER_ABILITIES);
  } catch (error) {
    console.error('Error extracting monster abilities:', error);
    console.warn(`Using fallback abilities for ${monsterName}`);
    return FALLBACK_MONSTER_ABILITIES[monsterName] || [];
  }
}

// Get AI-generated battle narrative from Langflow API
// Returns both the narrative text and the response ID for conversation continuity
export async function getBattleNarrative(
  eventDescription: string,
  attackerClass: DnDClass | null,
  defenderClass: DnDClass | null,
  attackerDetails: string = '',
  defenderDetails: string = '',
  previousResponseId: string | null = null
): Promise<{ narrative: string; responseId: string | null }> {
  try {
    if (!attackerClass || !defenderClass) {
      return { narrative: eventDescription, responseId: previousResponseId };
    }

    // Determine if participants are classes or monsters (heuristic: check if name is in monster icons)
    const attackerIsMonster = isMonster(attackerClass.name);
    const defenderIsMonster = isMonster(defenderClass.name);
    const attackerType = attackerIsMonster ? 'monster' : 'class';
    const defenderType = defenderIsMonster ? 'monster' : 'class';

    const prompt = `A D&D battle is happening between a ${attackerClass.name} ${attackerType} and a ${defenderClass.name} ${defenderType}.

Current battle state:
- ${attackerClass.name}: ${attackerClass.hitPoints}/${attackerClass.maxHitPoints} HP, AC ${attackerClass.armorClass}
- ${defenderClass.name}: ${defenderClass.hitPoints}/${defenderClass.maxHitPoints} HP, AC ${defenderClass.armorClass}

${attackerDetails ? `\n${attackerClass.name} ${attackerType} information:\n${attackerDetails}` : ''}
${defenderDetails ? `\n${defenderClass.name} ${defenderType} information:\n${defenderDetails}` : ''}

Battle event: ${eventDescription}

Provide a brief, dramatic narrative description (2-3 sentences) of this battle event. Make it exciting and descriptive, incorporating the ${attackerType} and ${defenderType} abilities and combat styles.`;

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
}

// Generate a comprehensive battle summary from the entire battle log
export async function getBattleSummary(
  battleLog: Array<{ type: string; message: string }>,
  victorClass: DnDClass,
  defeatedClass: DnDClass,
  victorDetails: string = '',
  defeatedDetails: string = '',
  victorName: string,
  defeatedName: string,
  onChunk?: (content: string) => void
): Promise<string> {
  try {
    const victorIsMonster = isMonster(victorClass.name);
    const defeatedIsMonster = isMonster(defeatedClass.name);
    const victorType = victorIsMonster ? 'monster' : 'class';
    const defeatedType = defeatedIsMonster ? 'monster' : 'class';

    // Include ALL battle log entries (excluding narrative since we're generating a new one)
    const fullBattleLog = battleLog
      .filter(log => log.type !== 'narrative') // Exclude old narrative entries
      .map(log => log.message);

    // Analyze battle log to determine if it was a close/struggling battle
    const logText = fullBattleLog.join(' ');
    const healingCount = (logText.match(/healing|heals|cure wounds|sith healing/gi) || []).length;
    const missCount = (logText.match(/misses|miss!/gi) || []).length;
    const hitCount = (logText.match(/hits|hits for/gi) || []).length;
    const bothSidesHit = logText.includes(victorName) && logText.includes(defeatedName) && hitCount > 2;
    const wasCloseBattle = healingCount >= 2 || (missCount > hitCount && bothSidesHit) || victorClass.hitPoints < victorClass.maxHitPoints * 0.5;

    // Build comprehensive character information
    const victorAbilities = victorClass.abilities?.map(ability => {
      const name = ability.name;
      const description = ability.description;
      if (ability.type === 'attack') {
        return `- ${name}: ${description} (Damage: ${ability.damageDice}${ability.attacks && ability.attacks > 1 ? `, ${ability.attacks} attacks` : ''}${ability.attackRoll ? ', requires attack roll' : ', automatic damage'})`;
      } else if (ability.type === 'healing') {
        return `- ${name}: ${description} (Healing: ${ability.healingDice})`;
      }
      // Fallback for any other ability types (shouldn't happen but TypeScript needs this)
      return `- ${name}: ${description}`;
    }).join('\n') || 'None';

    const defeatedAbilities = defeatedClass.abilities?.map(ability => {
      const name = ability.name;
      const description = ability.description;
      if (ability.type === 'attack') {
        return `- ${name}: ${description} (Damage: ${ability.damageDice}${ability.attacks && ability.attacks > 1 ? `, ${ability.attacks} attacks` : ''}${ability.attackRoll ? ', requires attack roll' : ', automatic damage'})`;
      } else if (ability.type === 'healing') {
        return `- ${name}: ${description} (Healing: ${ability.healingDice})`;
      }
      // Fallback for any other ability types (shouldn't happen but TypeScript needs this)
      return `- ${name}: ${description}`;
    }).join('\n') || 'None';

    const prompt = `A D&D battle has concluded between ${victorName} (a ${victorClass.name} ${victorType}) and ${defeatedName} (a ${defeatedClass.name} ${defeatedType}).

=== ${victorName} (${victorClass.name} ${victorType}) - VICTOR ===
Class Description: ${victorClass.description || 'N/A'}
Stats:
- Hit Points: ${victorClass.hitPoints}/${victorClass.maxHitPoints} (final HP)
- Armor Class: ${victorClass.armorClass}
- Attack Bonus: ${victorClass.attackBonus}
- Damage Die: ${victorClass.damageDie}${victorClass.meleeDamageDie ? ` (Melee: ${victorClass.meleeDamageDie})` : ''}${victorClass.rangedDamageDie ? ` (Ranged: ${victorClass.rangedDamageDie})` : ''}

Abilities:
${victorAbilities}

${victorDetails ? `Additional Information:\n${victorDetails}` : ''}

=== ${defeatedName} (${defeatedClass.name} ${defeatedType}) - DEFEATED ===
Class Description: ${defeatedClass.description || 'N/A'}
Stats:
- Hit Points: 0/${defeatedClass.maxHitPoints} (defeated)
- Armor Class: ${defeatedClass.armorClass}
- Attack Bonus: ${defeatedClass.attackBonus}
- Damage Die: ${defeatedClass.damageDie}${defeatedClass.meleeDamageDie ? ` (Melee: ${defeatedClass.meleeDamageDie})` : ''}${defeatedClass.rangedDamageDie ? ` (Ranged: ${defeatedClass.rangedDamageDie})` : ''}

Abilities:
${defeatedAbilities}

${defeatedDetails ? `Additional Information:\n${defeatedDetails}` : ''}

=== COMPLETE BATTLE LOG ===
The following is the complete chronological record of the battle:

${fullBattleLog.join('\n')}

=== BATTLE ANALYSIS ===
${wasCloseBattle ? `⚠️ CLOSE BATTLE DETECTED: This was a hard-fought, evenly matched battle. Both sides used healing (${healingCount} times), there were many missed attacks, and both combatants landed hits. The victor finished with ${victorClass.hitPoints}/${victorClass.maxHitPoints} HP - ${victorClass.hitPoints < victorClass.maxHitPoints * 0.3 ? 'barely survived' : victorClass.hitPoints < victorClass.maxHitPoints * 0.5 ? 'survived but was badly wounded' : 'took significant damage'}. The narrative should reflect this struggle and close call.` : 'This battle had a clear winner with less back-and-forth.'}

=== INSTRUCTIONS ===
Write a brief, punchy, character-driven narrative summary (just 2-3 sentences) of this battle. Use the character details, abilities, and battle log above to understand what happened, but keep it very short and entertaining.

**CRITICAL LENGTH CONSTRAINT**: Your response must be NO MORE than 400 characters total (including spaces and markdown formatting). This is a hard limit to ensure the text fits properly on screen.

The narrative should:
- Be extremely concise (just 2-3 sentences total, MAX 400 characters)
- **CRITICAL**: Always use the actual character/monster names (${victorName} and ${defeatedName}) throughout the narrative. Do not refer to them generically as "the victor", "the defeated", "the warrior", "the fighter", "the combatant", etc. Use their specific names to make it personal and engaging. For example, say "${victorName} defeated ${defeatedName}" not "the victor defeated the opponent".
- Use character names and details to shape the outcome
- Include playful wordplay, rhythmic wording, or clever turns of phrase
- Feel epic but brief - like a memorable one-liner about the battle's conclusion
- Reference key abilities or moments naturally, but don't list stats or dice rolls
- Use **bold markdown** to emphasize important words like character names, key actions, or dramatic moments (e.g., **${victorName}** struck with their **ability name**)
- Avoid repetitive introductions - don't start every sentence with the same character name or phrase. Vary the sentence structure and openings.
- **CRITICAL**: Reflect the actual flow of the battle. If the defeated opponent landed good blows, had successful attacks, or there was a back-and-forth exchange, include that! Don't make it one-sided unless the battle log clearly shows it was one-sided. Show the ebb and flow, the struggle, the moments where both combatants had their successes before the final outcome.
- **IF THIS WAS A CLOSE BATTLE** (see analysis above): Emphasize the struggle! Show how both combatants fought hard, how healing was used, how it was back-and-forth, and how the victor barely made it through. Use varied, creative language to convey the narrow victory - avoid clichés and repetitive phrases. Make it clear this was NOT an easy win through vivid, character-specific descriptions.

Think of it like a memorable quote or tagline about how the battle ended. Make it punchy, characterful, and fun to read. If there was a back-and-forth, capture that tension. Remember: MAX 400 characters total. 

Examples:
- Easy win: "**Vespara Darkblade** easily ended the short life of **Gandalf the Grey**. Too bad he couldn't withstand her **force blade**."
- Back-and-forth: "**Gandalf** landed several powerful strikes, but **Vespara's** relentless **force blade** attacks eventually overwhelmed his defenses."
- Close battle: "**Vespara** and **Gandalf** traded blow for blow, both using healing to stay in the fight. **Vespara's** **force blade** found its mark just as her own defenses were about to fail, securing a narrow victory."`;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        previousResponseId: null, // Start fresh for summary
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('No response body');
    }

    const { content: accumulatedResponse } = await parseSSEResponse(
      reader,
      onChunk ? (content: string) => {
        // Stream chunks as they arrive
        onChunk(content);
      } : undefined
    );

    return accumulatedResponse || 'The battle concluded with a decisive victory.';
  } catch (error) {
    console.error('Error getting battle summary:', error);
    return 'The battle concluded with a decisive victory.';
  }
}

