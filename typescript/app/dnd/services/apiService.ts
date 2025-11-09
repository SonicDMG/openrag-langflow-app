import { DnDClass, Ability } from '../types';
import { CLASS_COLORS, CLASS_ICONS } from '../constants';
import { extractJsonFromResponse, parseSSEResponse } from '../utils/api';

// Fetch all available D&D classes from OpenRAG
export async function fetchAvailableClasses(
  addLog: (type: 'system' | 'narrative', message: string) => void
): Promise<{ classNames: string[]; response: string }> {
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
}

// Fetch class stats from OpenRAG
export async function fetchClassStats(
  className: string,
  addLog: (type: 'system' | 'narrative', message: string) => void
): Promise<{ stats: Partial<DnDClass> | null; response: string }> {
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
}

// Extract structured abilities directly from the knowledge base
// Uses AI to return attack and healing abilities in a well-defined JSON structure
export async function extractAbilities(className: string): Promise<Ability[]> {
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
}

