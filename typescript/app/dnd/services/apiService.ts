import { DnDClass, Ability, CardSetting } from '../types';
import { CLASS_COLORS, FALLBACK_ABILITIES, FALLBACK_MONSTER_ABILITIES, getPlayerClassNames, isMonster, CARD_SETTINGS, DEFAULT_SETTING } from '../constants';
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
  
  // Remove trailing commas before closing brackets/braces
  abilitiesJsonString = abilitiesJsonString.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing commas between array elements (look for } followed by { without comma)
  abilitiesJsonString = abilitiesJsonString.replace(/\}\s*\{/g, '},{');
  
  // Fix quoted JSON objects in arrays more robustly
  // Match patterns like "{"key":"value"}" and unquote them
  abilitiesJsonString = abilitiesJsonString.replace(/"(\{[^{}]*\})"/g, (match, jsonObj) => {
    // Only unquote if it looks like valid JSON (has balanced braces)
    let braceCount = 0;
    for (let i = 0; i < jsonObj.length; i++) {
      if (jsonObj[i] === '{') braceCount++;
      if (jsonObj[i] === '}') braceCount--;
    }
    if (braceCount === 0) {
      return jsonObj;
    }
    return match;
  });
  
  // Remove any remaining trailing commas in arrays/objects
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
    console.error('Extracted JSON string (first 500 chars):', abilitiesJsonString.substring(0, 500));
    
    // Try to extract position from error message (e.g., "at position 265")
    if (parseError instanceof SyntaxError) {
      const positionMatch = parseError.message.match(/position (\d+)/);
      if (positionMatch) {
        const position = parseInt(positionMatch[1], 10);
        console.error('Extracted JSON string (around error position):', 
          abilitiesJsonString.substring(Math.max(0, position - 100), Math.min(abilitiesJsonString.length, position + 100)));
      }
    }
    
    console.error('Full response (first 500 chars):', accumulatedResponse.substring(0, 500));
    
    // Try one more aggressive fix: attempt to extract just the abilities array
    try {
      // Look for the abilities array specifically
      const abilitiesArrayMatch = abilitiesJsonString.match(/"abilities"\s*:\s*\[([\s\S]*?)\]/);
      if (abilitiesArrayMatch) {
        let arrayContent = abilitiesArrayMatch[1];
        // Try to fix common issues in the array
        arrayContent = arrayContent.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        arrayContent = arrayContent.replace(/\}\s*\{/g, '},{'); // Add missing commas
        // Try to parse as a complete JSON object with the fixed array
        const fixedJson = `{"abilities":[${arrayContent}]}`;
        const fixedParsed = JSON.parse(fixedJson);
        if (fixedParsed.abilities && Array.isArray(fixedParsed.abilities)) {
          const validAbilities: Ability[] = [];
          for (const ability of fixedParsed.abilities) {
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
            }
          }
          if (validAbilities.length > 0) {
            console.warn(`Successfully parsed abilities using aggressive fix for ${name}`);
            return validAbilities;
          }
        }
      }
    } catch (aggressiveFixError) {
      console.error('Aggressive JSON fix also failed:', aggressiveFixError);
    }
    
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
  onChunk?: (content: string) => void,
  supportHeroes?: Array<{ class: DnDClass; name: string; monsterId: string | null }>,
  supportHeroDetails?: Record<string, string>
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
    
    // Calculate HP percentages
    const victorHPRatio = victorClass.hitPoints / victorClass.maxHitPoints;
    const defeatedHPRatio = 0; // Defeated always has 0 HP
    
    // A battle is only "close" if:
    // 1. The victor took significant damage (less than 50% HP remaining), AND
    // 2. There was actual back-and-forth (healing used, both sides hit, etc.)
    // If victor has >80% HP remaining, it's clearly one-sided regardless of healing/misses
    const isOneSidedVictory = victorHPRatio > 0.8;
    const victorTookSignificantDamage = victorHPRatio < 0.5;
    const hasBackAndForth = healingCount >= 2 || (missCount > hitCount && bothSidesHit);
    
    const wasCloseBattle = victorTookSignificantDamage && hasBackAndForth && !isOneSidedVictory;

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

    // Build support heroes information if they exist
    let supportHeroesSection = '';
    if (supportHeroes && supportHeroes.length > 0) {
      const supportHeroesInfo = supportHeroes.map((supportHero, index) => {
        const supportIsMonster = isMonster(supportHero.class.name);
        const supportType = supportIsMonster ? 'monster' : 'class';
        const supportAbilities = supportHero.class.abilities?.map(ability => {
          const name = ability.name;
          const description = ability.description;
          if (ability.type === 'attack') {
            return `- ${name}: ${description} (Damage: ${ability.damageDice}${ability.attacks && ability.attacks > 1 ? `, ${ability.attacks} attacks` : ''}${ability.attackRoll ? ', requires attack roll' : ', automatic damage'})`;
          } else if (ability.type === 'healing') {
            return `- ${name}: ${description} (Healing: ${ability.healingDice})`;
          }
          return `- ${name}: ${description}`;
        }).join('\n') || 'None';

        const supportHeroDetail = supportHeroDetails?.[supportHero.class.name] || '';

        return `=== ${supportHero.name} (${supportHero.class.name} ${supportType}) - SUPPORT HERO ${index + 1} ===
Class Description: ${supportHero.class.description || 'N/A'}
Stats:
- Hit Points: ${supportHero.class.hitPoints}/${supportHero.class.maxHitPoints} (final HP)
- Armor Class: ${supportHero.class.armorClass}
- Attack Bonus: ${supportHero.class.attackBonus}
- Damage Die: ${supportHero.class.damageDie}${supportHero.class.meleeDamageDie ? ` (Melee: ${supportHero.class.meleeDamageDie})` : ''}${supportHero.class.rangedDamageDie ? ` (Ranged: ${supportHero.class.rangedDamageDie})` : ''}

Abilities:
${supportAbilities}
${supportHeroDetail ? `\nVisual/Appearance Details (used for card image generation):\n${supportHeroDetail}` : ''}`;
      }).join('\n\n');

      supportHeroesSection = `\n\n=== SUPPORT HEROES (Fighting alongside ${victorName}) ===
${supportHeroesInfo}`;
    }

    const prompt = `A D&D battle has concluded between ${victorName} (a ${victorClass.name} ${victorType})${supportHeroes && supportHeroes.length > 0 ? ` along with ${supportHeroes.map(sh => sh.name).join(' and ')}` : ''} and ${defeatedName} (a ${defeatedClass.name} ${defeatedType}).

=== ${victorName} (${victorClass.name} ${victorType}) - VICTOR ===
Class Description: ${victorClass.description || 'N/A'}
Stats:
- Hit Points: ${victorClass.hitPoints}/${victorClass.maxHitPoints} (final HP)
- Armor Class: ${victorClass.armorClass}
- Attack Bonus: ${victorClass.attackBonus}
- Damage Die: ${victorClass.damageDie}${victorClass.meleeDamageDie ? ` (Melee: ${victorClass.meleeDamageDie})` : ''}${victorClass.rangedDamageDie ? ` (Ranged: ${victorClass.rangedDamageDie})` : ''}

Abilities:
${victorAbilities}

${victorDetails ? `Visual/Appearance Details (used for card image generation):\n${victorDetails}` : ''}

=== ${defeatedName} (${defeatedClass.name} ${defeatedType}) - DEFEATED ===
Class Description: ${defeatedClass.description || 'N/A'}
Stats:
- Hit Points: 0/${defeatedClass.maxHitPoints} (defeated)
- Armor Class: ${defeatedClass.armorClass}
- Attack Bonus: ${defeatedClass.attackBonus}
- Damage Die: ${defeatedClass.damageDie}${defeatedClass.meleeDamageDie ? ` (Melee: ${defeatedClass.meleeDamageDie})` : ''}${defeatedClass.rangedDamageDie ? ` (Ranged: ${defeatedClass.rangedDamageDie})` : ''}

Abilities:
${defeatedAbilities}

${defeatedDetails ? `Visual/Appearance Details (used for card image generation):\n${defeatedDetails}` : ''}
${supportHeroesSection}

=== COMPLETE BATTLE LOG ===
The following is the complete chronological record of the battle:

${fullBattleLog.join('\n')}

=== BATTLE ANALYSIS ===
${isOneSidedVictory ? `⚠️ ONE-SIDED VICTORY: ${victorName} dominated this battle, finishing with ${victorClass.hitPoints}/${victorClass.maxHitPoints} HP (${Math.round(victorHPRatio * 100)}% remaining) while ${defeatedName} was completely defeated (0 HP). Despite any healing or missed attacks in the log, the final outcome shows ${victorName} barely took any damage. The narrative should reflect this decisive, one-sided victory - ${victorName} overwhelmed ${defeatedName}, not a close struggle. Use descriptive language like "barely scratched" or "completely unscathed" - DO NOT mention HP numbers or percentages in the narrative.` : wasCloseBattle ? `⚠️ CLOSE BATTLE DETECTED: This was a hard-fought, evenly matched battle. Both sides used healing (${healingCount} times), there were many missed attacks, and both combatants landed hits. The victor finished with ${victorClass.hitPoints}/${victorClass.maxHitPoints} HP (${Math.round(victorHPRatio * 100)}% remaining) - ${victorClass.hitPoints < victorClass.maxHitPoints * 0.3 ? 'barely survived' : victorClass.hitPoints < victorClass.maxHitPoints * 0.5 ? 'survived but was badly wounded' : 'took significant damage'}. The narrative should reflect this struggle and close call. Use descriptive language like "badly wounded" or "on death's door" - DO NOT mention HP numbers or percentages in the narrative.` : `This battle had a clear winner. ${victorName} finished with ${victorClass.hitPoints}/${victorClass.maxHitPoints} HP (${Math.round(victorHPRatio * 100)}% remaining) while ${defeatedName} was defeated. The narrative should reflect the actual outcome based on the final HP states. Use descriptive language - DO NOT mention HP numbers or percentages in the narrative.`}

=== INSTRUCTIONS ===
Write a brief, punchy, character-driven narrative summary (just 2-3 sentences) of this battle. Use the character details, abilities, and battle log above to understand what happened, but keep it very short and entertaining.

**CRITICAL LENGTH CONSTRAINT**: Your response must be NO MORE than 400 characters total (including spaces and markdown formatting). This is a hard limit to ensure the text fits properly on screen.

The narrative should:
- Be extremely concise (just 2-3 sentences total, MAX 400 characters)
- **CRITICAL**: Always use the actual character/monster names (${victorName}${supportHeroes && supportHeroes.length > 0 ? `, ${supportHeroes.map(sh => sh.name).join(', ')}` : ''} and ${defeatedName}) throughout the narrative. Do not refer to them generically as "the victor", "the defeated", "the warrior", "the fighter", "the combatant", etc. Use their specific names to make it personal and engaging.${supportHeroes && supportHeroes.length > 0 ? ` If support heroes participated, mention them by name when relevant (e.g., "${supportHeroes[0].name} and ${supportHeroes.length > 1 ? supportHeroes[1].name : ''} joined ${victorName} in defeating ${defeatedName}").` : ''} For example, say "${victorName}${supportHeroes && supportHeroes.length > 0 ? ` and ${supportHeroes.map(sh => sh.name).join(' and ')}` : ''} defeated ${defeatedName}" not "the victor defeated the opponent".
- **CRITICAL - NO STATS**: Do NOT mention any stats, hit points, HP percentages, health percentages, numerical values, or game mechanics in the narrative. Use descriptive language instead (e.g., "barely scratched", "badly wounded", "on death's door", "barely breathing", "completely unscathed"). Never say things like "100/110 HP", "86% health", "hit points were", etc.
- Use character names and details to shape the outcome
- Include playful wordplay, rhythmic wording, or clever turns of phrase
- Feel epic but brief - like a memorable one-liner about the battle's conclusion
- Reference key abilities or moments naturally, but don't list stats or dice rolls
- Use **bold markdown** to emphasize important words like character names, key actions, or dramatic moments (e.g., **${victorName}** struck with their **ability name**)
- Avoid repetitive introductions - don't start every sentence with the same character name or phrase. Vary the sentence structure and openings.
- **CRITICAL**: Always check the FINAL HP STATES in the character stats above (for your understanding only - do NOT mention these numbers in the narrative). The final HP ratio is the most important indicator of how the battle actually went:
  * If ${victorName} finished with >80% HP (${victorClass.hitPoints}/${victorClass.maxHitPoints} = ${Math.round(victorHPRatio * 100)}%) and ${defeatedName} has 0 HP, this was a ONE-SIDED VICTORY. ${victorName} dominated and barely took damage. Don't describe it as close or struggling - describe ${victorName} overwhelming ${defeatedName}. Use descriptive language like "barely scratched", "completely unscathed", "untouched" to convey this.
  * If ${victorName} finished with <50% HP and there was back-and-forth, this was a CLOSE BATTLE. Show the struggle, the healing, the narrow victory. Use descriptive language like "badly wounded", "on death's door", "barely standing" to convey this.
  * If ${victorName} finished with 50-80% HP, it was a moderate battle - not one-sided, but not extremely close either. Use descriptive language like "took significant damage", "wounded but victorious" to convey this.
- **IF THIS WAS A ONE-SIDED VICTORY** (see analysis above): Emphasize ${victorName}'s dominance! Show how ${victorName} overwhelmed ${defeatedName} with minimal damage taken. Even if the battle log shows some hits or healing attempts by ${defeatedName}, the final outcome shows it was decisive. Don't describe it as close or struggling. Use descriptive language, NOT numbers or percentages.
- **IF THIS WAS A CLOSE BATTLE** (see analysis above): Emphasize the struggle! Show how both combatants fought hard, how healing was used, how it was back-and-forth, and how the victor barely made it through. Use varied, creative language to convey the narrow victory - avoid clichés and repetitive phrases. Make it clear this was NOT an easy win through vivid, character-specific descriptions.

Think of it like a memorable quote or tagline about how the battle ended. Make it punchy, characterful, and fun to read. If there was a back-and-forth, capture that tension. Remember: MAX 400 characters total. 

Examples:
- One-sided victory (victor >80% HP): "**Barbed Devil** completely overwhelmed **Vespera Darkblade**, barely taking a scratch while her lightsabers fell silent. The Devil's brutal attacks left no room for recovery."
- Moderate battle (victor 50-80% HP): "**Gandalf** landed several powerful strikes, but **Vespara's** relentless **force blade** attacks eventually overwhelmed his defenses."
- Close battle (victor <50% HP, back-and-forth): "**Vespara** and **Gandalf** traded blow for blow, both using healing to stay in the fight. **Vespara's** **force blade** found its mark just as her own defenses were about to fail, securing a narrow victory."`;

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

// Helper function to detect setting from character description
function detectSettingFromDescription(description: string): CardSetting {
  const descLower = description.toLowerCase();
  
  // Check for cyberpunk keywords
  if (descLower.includes('cyberpunk') || descLower.includes('neon') || descLower.includes('cybernetics') || 
      descLower.includes('holographic') || descLower.includes('neural interface') || descLower.includes('megacorporation')) {
    return 'cyberpunk';
  }
  
  // Check for futuristic/sci-fi keywords
  if (descLower.includes('futuristic') || descLower.includes('starship') || descLower.includes('space station') ||
      descLower.includes('alien') || descLower.includes('laser') || descLower.includes('plasma') ||
      descLower.includes('energy weapon') || descLower.includes('sci-fi')) {
    return 'futuristic';
  }
  
  // Check for steampunk keywords
  if (descLower.includes('steampunk') || descLower.includes('steam-powered') || descLower.includes('brass') ||
      descLower.includes('airship') || descLower.includes('clockwork') || descLower.includes('victorian')) {
    return 'steampunk';
  }
  
  // Check for post-apocalyptic keywords
  if (descLower.includes('post-apocalyptic') || descLower.includes('wasteland') || descLower.includes('ruins') ||
      descLower.includes('scavenged') || descLower.includes('desolate')) {
    return 'post-apocalyptic';
  }
  
  // Check for modern keywords
  if (descLower.includes('modern') || descLower.includes('contemporary') || descLower.includes('urban') ||
      descLower.includes('cityscape') || descLower.includes('smartphone') || descLower.includes('vehicle')) {
    return 'modern';
  }
  
  // Check for fantasy keywords (but not medieval-specific)
  if (descLower.includes('magical') || descLower.includes('enchanted') || descLower.includes('mystical')) {
    return 'fantasy';
  }
  
  // Default to medieval for classic fantasy
  return 'medieval';
}

// Generate a battle ending image depicting the conclusion of the battle
export async function generateBattleEndingImage(
  victorClass: DnDClass,
  defeatedClass: DnDClass,
  victorName: string,
  defeatedName: string,
  battleSummary: string,
  victorDetails: string = '',
  defeatedDetails: string = '',
  supportHeroes?: Array<{ class: DnDClass; name: string; monsterId: string | null }>,
  supportHeroDetails?: Record<string, string>
): Promise<string | null> {
  try {
    const victorIsMonster = isMonster(victorClass.name);
    const defeatedIsMonster = isMonster(defeatedClass.name);
    const victorType = victorIsMonster ? 'monster' : 'class';
    const defeatedType = defeatedIsMonster ? 'monster' : 'class';

    // Build character descriptions
    const victorDescription = victorClass.description || '';
    const defeatedDescription = defeatedClass.description || '';

    // Detect setting from victor's description (use victor's style for the scene)
    const victorSetting = detectSettingFromDescription(victorDescription + ' ' + victorDetails);
    const settingConfig = CARD_SETTINGS[victorSetting] || CARD_SETTINGS[DEFAULT_SETTING];

    // Debug logging to check name/class values
    console.log('=== BATTLE ENDING IMAGE DEBUG ===');
    console.log('Victor Name:', victorName);
    console.log('Victor Class Name:', victorClass.name);
    console.log('Victor Type:', victorType);
    console.log('Victor Setting:', victorSetting);
    console.log('Defeated Name:', defeatedName);
    console.log('Defeated Class Name:', defeatedClass.name);
    console.log('Defeated Type:', defeatedType);
    console.log('=== END DEBUG ===');

    // Build support heroes descriptions if they exist
    let supportHeroesDescription = '';
    if (supportHeroes && supportHeroes.length > 0) {
      const supportDescriptions = supportHeroes.map((supportHero, index) => {
        const supportIsMonster = isMonster(supportHero.class.name);
        const supportType = supportIsMonster ? 'monster' : 'class';
        const supportDescription = supportHero.class.description || '';
        const supportDetail = supportHeroDetails?.[supportHero.class.name] || '';
        return `${supportHero.name}, a ${supportHero.class.name} ${supportType} - SUPPORT HERO ${index + 1}:
${supportHero.class.race && supportHero.class.race !== 'n/a' ? `Race: ${supportHero.class.race}` : ''}
${supportHero.class.sex && supportHero.class.sex !== 'n/a' ? `Sex: ${supportHero.class.sex}` : ''}
${supportDescription ? `Description: ${supportDescription}` : `A ${supportHero.class.name} ${supportType}`}
${supportDetail ? `Visual/Appearance details: ${supportDetail}` : ''}`;
      }).join('\n\n');
      supportHeroesDescription = `\n\n${supportDescriptions}`;
    }

    // Build a comprehensive prompt that includes character descriptions and image requirements
    const prompt = `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic. 

CHARACTER DESCRIPTIONS:

${victorName}, a ${victorClass.name} ${victorType} - THE VICTOR:
${victorClass.race && victorClass.race !== 'n/a' ? `Race: ${victorClass.race}` : ''}
${victorClass.sex && victorClass.sex !== 'n/a' ? `Sex: ${victorClass.sex}` : ''}
${victorDescription ? `Description: ${victorDescription}` : `A ${victorClass.name} ${victorType}`}
${victorDetails ? `Visual/Appearance details: ${victorDetails}` : ''}

${defeatedName}, a ${defeatedClass.name} ${defeatedType} - THE DEFEATED:
${defeatedClass.race && defeatedClass.race !== 'n/a' ? `Race: ${defeatedClass.race}` : ''}
${defeatedClass.sex && defeatedClass.sex !== 'n/a' ? `Sex: ${defeatedClass.sex}` : ''}
${defeatedDescription ? `Description: ${defeatedDescription}` : `A ${defeatedClass.name} ${defeatedType}`}
${defeatedDetails ? `Visual/Appearance details: ${defeatedDetails}` : ''}${supportHeroesDescription}

IMAGE REQUIREMENTS:
Dramatic battle conclusion scene showing ${victorName}${supportHeroes && supportHeroes.length > 0 ? ` and ${supportHeroes.map(sh => sh.name).join(' and ')}` : ''} victorious over defeated ${defeatedName}. ${victorName} in triumphant pose, ${defeatedName} fallen. ${settingConfig.backgroundPhrase} setting with dramatic lighting. Warm earth tones with vibrant accents. Retro SNES/Genesis style, ${settingConfig.technologyLevel}, 16:9 aspect ratio.`;

    // Log the prompt for debugging
    console.log('=== BATTLE ENDING IMAGE GENERATION PROMPT ===');
    console.log(prompt);
    console.log('=== END PROMPT ===');

    // Generate image and pixelize it
    // Note: If pixelization is causing black images, set skipPixelize: true to test
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: '5000',
        image_count: 1,
        transparentBackground: false, // We want a background scene for the ending
        aspectRatio: '16:9',
        pixelize: true, // Pixelize to match app style
        skipPixelize: false, // Set to true to skip pixelization for debugging
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('Error generating battle ending image:', data.error);
      return null;
    }

    return data.imageUrl || null;
  } catch (error) {
    console.error('Error generating battle ending image:', error);
    return null;
  }
}

