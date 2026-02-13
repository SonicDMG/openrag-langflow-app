import { Character, Ability, CardSetting } from '../../lib/types';
import { CLASS_COLORS, FALLBACK_ABILITIES, FALLBACK_MONSTER_ABILITIES, getPlayerClassNames, isMonster, CARD_SETTINGS, DEFAULT_SETTING } from '../../lib/constants';
import { extractJsonFromResponse, parseSSEResponse } from '../../utils/data/api';
import { extractRaceFromDescription, extractSexFromDescription, extractNameFromDescription } from '../shared/characterGeneration';

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

// Fetch all available Battle Arena classes from OpenRAG
export async function fetchAvailableClasses(
  addLog: (type: 'system' | 'narrative', message: string) => void,
  searchContext?: string,
  filterId?: string,
  limit?: number
): Promise<{ classNames: string[]; response: string }> {
  try {
    const contextValue = searchContext || 'Battle Arena';
    const query = `${contextValue}. Return only a JSON array of class or hero names, like ["Warrior", "Mage", "Rogue", "Cleric", ...]. Do not include any other text, just the JSON array.`;
    
    addLog('system', `🔍 Querying OpenRAG for available classes${searchContext ? ` (${searchContext})` : ' (Battle Arena)'}...`);
    
    // Create abort controller with 60 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    let response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          previousResponseId: null,
          filterId: filterId || undefined,
          limit: limit || 100,
          scoreThreshold: 0,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out after 60 seconds');
      }
      throw error;
    }

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
      addLog('system', `⚠️ OpenRAG found no sources for "${searchContext || 'Battle Arena'}" classes. This might mean the knowledge base doesn't contain data for this context.`);
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

// Helper function to process a single character (creates its own thread)
// Exported for single hero/class/monster lookup
export async function processSingleCharacter(
  characterName: string,
  addLog: (type: 'system' | 'narrative', message: string) => void
): Promise<{ stats: Partial<Character> | null; abilities: Ability[]; response: string; characterName: string; alreadyExists?: boolean }> {
  try {
    // First call: Search for character information (new thread for each character)
    const searchQuery = `using your tools, find character sheet, details, description, name, and abilities for ${characterName}. Be sure to list the name as "Name: nameHere". If no sources are found in the knowledge base, use web search and URL ingestion tools to find the character information online, then search again.`;
    
    // Log the prompt for debugging
    console.log(`[processSingleCharacter] First call - Search prompt for ${characterName}:`, searchQuery);
    
    addLog('system', `🔍 Searching OpenRAG for ${characterName}...`);
    
    let searchResponse;
    try {
      searchResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: searchQuery,
          previousResponseId: null, // New thread for each character
        }),
      });

      if (!searchResponse.ok) {
        throw new Error(`API request failed with status ${searchResponse.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog('system', `❌ Error during character search: ${errorMessage}`);
      throw new Error(`Failed to fetch character data: ${errorMessage}`);
    }

    const searchReader = searchResponse.body?.getReader();
    if (!searchReader) {
      throw new Error('No response body available from search request');
    }

    let searchContent: string;
    let responseId: string | null;
    try {
      const result = await parseSSEResponse(searchReader);
      searchContent = result.content;
      responseId = result.responseId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog('system', `❌ Error parsing search response: ${errorMessage}`);
      throw new Error(`Failed to parse character search response: ${errorMessage}`);
    }
    
    // Log the agent response
    addLog('narrative', `**OpenRAG Search Response (${characterName}):**\n\n${searchContent}`);
    
    // Check if OpenRAG returned "no sources found" error
    if (searchContent.toLowerCase().includes('no relevant supporting sources') || 
        searchContent.toLowerCase().includes('no sources found') ||
        searchContent.toLowerCase().includes('no relevant information')) {
      addLog('system', `⚠️ OpenRAG found no sources for "${characterName}".`);
      return { stats: null, abilities: [], response: searchContent, characterName, alreadyExists: false };
    }
    
    // Extract character name from search response to check for duplicates
    // The search query asks for "Name: nameHere" format, so look for that first
    let extractedName: string | undefined = undefined;
    
    // First, try to extract from "Name: nameHere" format (most reliable)
    // Handle markdown formatting like **bold** and other formatting
    const nameFieldPattern = /Name:\s*([^\n\r]+)/i;
    const nameFieldMatch = searchContent.match(nameFieldPattern);
    if (nameFieldMatch && nameFieldMatch[1]) {
      extractedName = nameFieldMatch[1].trim();
      
      // Remove markdown formatting (**bold**, *italic*, etc.)
      extractedName = extractedName.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      
      // Remove any trailing punctuation, colons, or other formatting that might have been captured
      extractedName = extractedName.replace(/[.,:;]+$/, '').trim();
      
      // If there's additional text after the name (like "Character Details:"), extract just the name part
      // Look for patterns where the name ends before common section headers
      const sectionHeaders = ['Character Details', 'Description', 'Stats', 'Abilities', 'Class', 'Race'];
      for (const header of sectionHeaders) {
        const headerIndex = extractedName.indexOf(header);
        if (headerIndex > 0) {
          extractedName = extractedName.substring(0, headerIndex).trim();
          break;
        }
      }
      
      // Clean up any remaining trailing punctuation
      extractedName = extractedName.replace(/[.,:;]+$/, '').trim();
      
      console.log(`[processSingleCharacter] Extracted name from "Name:" field: "${extractedName}"`);
    }
    
    // Fallback to other patterns if "Name:" field not found
    if (!extractedName) {
      // Look for patterns like "Here are the details for [Full Name]"
      const nameExtractionPatterns = [
        // Pattern: "Here are the details for Sylvan the Hunter" - capture everything after "for" until punctuation
        /(?:here are the details for|information about|details for|found details about|found information about|character named|character)\s+([A-Z][a-z]+(?:\s+(?:the|of|de|van|von)\s+[A-Z][a-z]+|[A-Z][a-z]+)*?)(?:\s*[.,:;]|\s+(?:is|was|a|an|the|has|with)|$)/i,
        // Pattern: "Sylvan the Hunter: description" - capture full name before colon
        /^([A-Z][a-z]+(?:\s+(?:the|of|de|van|von)\s+[A-Z][a-z]+|[A-Z][a-z]+)*?)(?:\s*[:,]|\s+(?:is|was|a|an|the))/,
      ];
      
      for (const pattern of nameExtractionPatterns) {
        const match = searchContent.match(pattern);
        if (match && match[1]) {
          const potentialName = match[1].trim();
          const commonSingleWords = ['here', 'information', 'details', 'character', 'found', 'about'];
          const hasTitlePattern = /\s+(?:the|of|de|van|von)\s+[A-Z][a-z]+/i.test(potentialName);
          
          if (potentialName.length > 2 && 
              potentialName.length < 50 && 
              /^[A-Z]/.test(potentialName) &&
              !commonSingleWords.includes(potentialName.toLowerCase()) &&
              (hasTitlePattern || potentialName.split(/\s+/).length >= 2)) {
            extractedName = potentialName;
            console.log(`[processSingleCharacter] Extracted name using pattern: "${extractedName}"`);
            break;
          }
        }
      }
      
      // Final fallback to the original extractNameFromDescription
      if (!extractedName) {
        extractedName = extractNameFromDescription(searchContent);
        if (extractedName) {
          console.log(`[processSingleCharacter] Extracted name using fallback: "${extractedName}"`);
        }
      }
    }
    
    const nameToCheck = extractedName || characterName;
    console.log(`[processSingleCharacter] Final extracted name: "${extractedName}", using "${nameToCheck}" for duplicate check`);
    
    // Check if character already exists in database (check both heroes and monsters)
    // This saves us the cost of the structuring query if the character already exists
    try {
      addLog('system', `🔍 Checking if ${nameToCheck} already exists in database...`);
      
      // Check heroes endpoint
      const heroesResponse = await fetch('/api/heroes');
      if (heroesResponse.ok) {
        const heroesData = await heroesResponse.json();
        const heroes = heroesData.heroes || [];
        console.log(`[processSingleCharacter] Checking ${heroes.length} heroes for "${nameToCheck}"`);
        const existingHero = heroes.find((h: Character) => 
          h.name.toLowerCase() === nameToCheck.toLowerCase()
        );
        if (existingHero) {
          console.log(`[processSingleCharacter] Found existing hero: ${existingHero.name}`);
          addLog('system', `ℹ️ ${nameToCheck} already exists in the database as a hero. Skipping processing.`);
          return { stats: null, abilities: [], response: searchContent, characterName: nameToCheck, alreadyExists: true };
        }
      } else {
        console.warn(`[processSingleCharacter] Heroes API returned status ${heroesResponse.status}`);
      }
      
      // Check monsters endpoint
      const monstersResponse = await fetch('/api/monsters-db');
      if (monstersResponse.ok) {
        const monstersData = await monstersResponse.json();
        const monsters = monstersData.monsters || [];
        console.log(`[processSingleCharacter] Checking ${monsters.length} monsters for "${nameToCheck}"`);
        const existingMonster = monsters.find((m: Character) => 
          m.name.toLowerCase() === nameToCheck.toLowerCase()
        );
        if (existingMonster) {
          console.log(`[processSingleCharacter] Found existing monster: ${existingMonster.name}`);
          addLog('system', `ℹ️ ${nameToCheck} already exists in the database as a monster. Skipping processing.`);
          return { stats: null, abilities: [], response: searchContent, characterName: nameToCheck, alreadyExists: true };
        }
      } else {
        console.warn(`[processSingleCharacter] Monsters API returned status ${monstersResponse.status}`);
      }
      
      console.log(`[processSingleCharacter] Character "${nameToCheck}" not found in database, proceeding with structuring query`);
    } catch (error) {
      console.error('Failed to check for existing character, continuing with processing:', error);
      addLog('system', `⚠️ Failed to check database for existing character, continuing with processing...`);
      // Continue with processing if check fails
    }
    
    // Second call: Structure the found information into complete character JSON
    const structureQuery = `Based on the information found about the SINGLE character "${characterName}", provide the complete character information in JSON format for ONLY this one character - do not include multiple characters or similar names:
{
  "name": string (the actual character name from the character sheet, e.g., "Sylvan the Hunter", "Aragorn", "Gandalf the Grey"),
  "hitPoints": number (typical starting HP at level 1-3, around 20-35),
  "armorClass": number (typical AC, between 12-18),
  "attackBonus": number (typical attack bonus modifier, between 3-5),
  "damageDie": string (typical weapon damage die like "d6", "d8", "d10", or "d12"),
  "description": string (brief 1-2 sentence description of the class),
  "race": string (character race, e.g., "Human", "Elf", "Dwarf", or "n/a" if not applicable),
  "sex": string (character sex/gender, e.g., "male", "female", "other", or "n/a" if not applicable),
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
- The "name" field should be the actual character name from the character sheet, not the search term
- For attack abilities: include "damageDice" and "attackRoll" fields
- For healing abilities: include "healingDice" field
- Use standard Battle Arena dice notation (e.g., "1d10", "3d6", "2d8+4")
- Return ALL available attack and healing abilities for this class - do not limit the number
- If the class has no abilities, return an empty abilities array: []
- Return ONLY valid JSON, no other text. Use typical values for a level 1-3 character.`;
    
    // Log the prompt for debugging
    console.log(`[processSingleCharacter] Second call - Structure prompt for ${characterName}:`, structureQuery);
    
    addLog('system', `📋 Structuring ${characterName} information into JSON format...`);
    
    let structureResponse;
    try {
      structureResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: structureQuery,
          previousResponseId: responseId,
        }),
      });

      if (!structureResponse.ok) {
        throw new Error(`API request failed with status ${structureResponse.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog('system', `❌ Error during character structuring: ${errorMessage}`);
      throw new Error(`Failed to structure character data: ${errorMessage}`);
    }

    const structureReader = structureResponse.body?.getReader();
    if (!structureReader) {
      throw new Error('No response body available from structure request');
    }

    let content: string;
    try {
      const result = await parseSSEResponse(structureReader);
      content = result.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog('system', `❌ Error parsing structure response: ${errorMessage}`);
      throw new Error(`Failed to parse character structure response: ${errorMessage}`);
    }
    
    // Log the agent response
    addLog('narrative', `**OpenRAG Response (${characterName} Stats & Abilities):**\n\n${content}`);
    
    // Extract JSON from response using utility function
    const statsJsonString = extractJsonFromResponse(
      content,
      ['hitPoints', 'armorClass'], // at least these should be present
      ['search_query'] // exclude fields (unless they also have required fields)
    );
    
    let parsed: any = null;
    let abilities: Ability[] = [];
    let extractedCharacterName: string = characterName; // Default to search term
    
    if (statsJsonString) {
      try {
        parsed = JSON.parse(statsJsonString);
        
        // Extract character name from JSON if available
        if (parsed.name && parsed.name.trim()) {
          extractedCharacterName = parsed.name.trim();
        } else {
          // Try to extract name from description or search content
          const description = parsed.description || searchContent || content;
          const extractedName = extractNameFromDescription(description);
          if (extractedName) {
            extractedCharacterName = extractedName;
          }
        }
        
        // Extract abilities from parsed JSON
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
            }
          }
        }
      } catch (parseError) {
        console.warn(`Error parsing stats JSON for ${characterName}:`, parseError);
        parsed = null;
      }
    }
    
    // If we successfully parsed, extract stats
    if (parsed) {
      // Normalize damageDie format (convert "1d6" to "d6" for consistency)
      let damageDie = parsed.damageDie || 'd8';
      if (damageDie.match(/^\d+d\d+$/)) {
        damageDie = 'd' + damageDie.split('d')[1];
      }
      
      // Extract race and sex from JSON, filtering out "n/a" values
      let race = parsed.race && parsed.race !== 'n/a' ? parsed.race : undefined;
      let sex = parsed.sex && parsed.sex !== 'n/a' ? parsed.sex : undefined;
      
      // If not found in JSON, try to extract from description
      const description = parsed.description || content;
      if (!race) {
        race = extractRaceFromDescription(description);
      }
      if (!sex) {
        sex = extractSexFromDescription(description);
      }
      
      return {
        stats: {
          hitPoints: parsed.hitPoints || 25,
          maxHitPoints: parsed.hitPoints || 25,
          armorClass: parsed.armorClass || 14,
          attackBonus: parsed.attackBonus || 4,
          damageDie: damageDie,
          description: parsed.description || `A ${extractedCharacterName} character.`,
          race: race,
          sex: sex,
        },
        abilities: abilities,
        response: content,
        characterName: extractedCharacterName,
        alreadyExists: false,
      };
    }
    
    // Fallback: try to extract partial data even if JSON is incomplete
    const hitPointsMatch = content.match(/(?:hitPoints|hit points|hp)[\s:]*(\d+)/i);
    const armorClassMatch = content.match(/(?:armorClass|armor class|ac)[\s:]*(\d+)/i);
    const attackBonusMatch = content.match(/(?:attackBonus|attack bonus|attack modifier)[\s:]*[+\-]?(\d+)/i);
    const damageDieMatch = content.match(/(?:damageDie|damage die|damage dice)[\s:]*"([^"]+)"|([d\d+]+)/i);
    const descriptionMatch = content.match(/(?:description)[\s:]*"([^"]*)"/);
    
    if (hitPointsMatch || armorClassMatch) {
      let damageDie = damageDieMatch ? (damageDieMatch[1] || damageDieMatch[2]) : 'd8';
      // Normalize damageDie format
      if (damageDie.match(/^\d+d\d+$/)) {
        damageDie = 'd' + damageDie.split('d')[1];
      }
      
      // Try to extract character name from description or search content
      const description = descriptionMatch ? descriptionMatch[1] : content;
      const extractedName = extractNameFromDescription(description) || extractNameFromDescription(searchContent);
      const finalCharacterName = extractedName || characterName;
      
      // Try to extract abilities from the response using the existing helper
      try {
        abilities = await extractAbilitiesFromResponse(characterName, content, FALLBACK_ABILITIES);
      } catch (error) {
        console.warn(`Failed to extract abilities from response for ${characterName}:`, error);
        abilities = FALLBACK_ABILITIES[characterName] || [];
      }
      
      // Extract race and sex from description using existing functions
      const extractedRace = extractRaceFromDescription(description);
      const extractedSex = extractSexFromDescription(description);
      
      return {
        stats: {
          hitPoints: hitPointsMatch ? parseInt(hitPointsMatch[1]) : 25,
          maxHitPoints: hitPointsMatch ? parseInt(hitPointsMatch[1]) : 25,
          armorClass: armorClassMatch ? parseInt(armorClassMatch[1]) : 14,
          attackBonus: attackBonusMatch ? parseInt(attackBonusMatch[1]) : 4,
          damageDie: damageDie,
          description: descriptionMatch ? descriptionMatch[1] : `A ${finalCharacterName} character.`,
          race: extractedRace,
          sex: extractedSex,
        },
        abilities: abilities,
        response: content,
        characterName: finalCharacterName,
        alreadyExists: false,
      };
    }
    
    console.warn(`Could not parse stats for ${characterName}:`, content.substring(0, 200));
    return { stats: null, abilities: [], response: content, characterName, alreadyExists: false };
  } catch (error) {
    console.error(`Error fetching stats for ${characterName}:`, error);
    addLog('system', `❌ Error fetching stats for ${characterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { stats: null, abilities: [], response: '', characterName, alreadyExists: false };
  }
}

// Fetch class stats and abilities from OpenRAG using two calls
// Handles both single character and multiple characters
export async function fetchClassStats(
  className: string,
  addLog: (type: 'system' | 'narrative', message: string) => void,
  searchContext?: string
): Promise<Array<{ stats: Partial<Character> | null; abilities: Ability[]; response: string; characterName: string }>> {
  try {
    // Process the character directly - processSingleCharacter will handle the search and follow-up
    // This avoids duplicate search queries
    const result = await processSingleCharacter(className, addLog);
    return [result];
  } catch (error) {
    console.error(`Error fetching stats for ${className}:`, error);
    addLog('system', `❌ Error fetching stats for ${className}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [{ stats: null, abilities: [], response: '', characterName: className }];
  }
}

// Extract structured abilities directly from the knowledge base
// Uses AI to return attack and healing abilities in a well-defined JSON structure
export async function extractAbilities(className: string, searchContext?: string): Promise<Ability[]> {
  try {
    // Ask the AI to return ALL available abilities for this class
    const extractionPrompt = `using your tools, find character sheet, details, description for ${className}. From the information found, return ALL available attack and healing abilities.

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
- Return ALL available attack and healing abilities for this class - do not limit the number
- If the class has no abilities of either type, return an empty abilities array: {"abilities": []}
- Include all abilities that are appropriate for this class`;

    // Log the prompt for debugging
    console.log('[extractAbilities] Prompt:', extractionPrompt);

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

// Fetch all available Battle Arena monsters from OpenRAG
export async function fetchAvailableMonsters(
  addLog: (type: 'system' | 'narrative', message: string) => void,
  searchContext?: string,
  filterId?: string,
  limit?: number
): Promise<{ monsterNames: string[]; response: string }> {
  try {
    const contextValue = searchContext || 'Battle Arena';
    const query = `${contextValue}. Return only a JSON array of monster names, like ["Goblin", "Orc", "Dragon", "Troll", ...]. Do not include any other text, just the JSON array.`;
    
    addLog('system', `🔍 Querying OpenRAG for available monsters${searchContext ? ` (${searchContext})` : ' (Battle Arena)'}...`);
    
    // Create abort controller with 60 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    let response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          previousResponseId: null,
          filterId: filterId || undefined,
          limit: limit || 100,
          scoreThreshold: 0,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out after 60 seconds');
      }
      throw error;
    }

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
      addLog('system', `⚠️ OpenRAG found no sources for "${searchContext || 'Battle Arena'}" monsters. This might mean the knowledge base doesn't contain data for this context.`);
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
): Promise<{ stats: Partial<Character> | null; response: string }> {
  try {
    const contextLabel = searchContext || 'Battle Arena';
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
    const contextLabel = searchContext || 'Battle Arena';
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
- Use standard Battle Arena dice notation (e.g., "1d10", "3d6", "2d8+4")
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
  attackerClass: Character | null,
  defenderClass: Character | null,
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

    const prompt = `A Battle Arena battle is happening between a ${attackerClass.name} ${attackerType} and a ${defenderClass.name} ${defenderType}.

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
  victorClass: Character,
  defeatedClass: Character,
  victorDetails: string = '',
  defeatedDetails: string = '',
  victorName: string,
  defeatedName: string,
  onChunk?: (content: string) => void,
  supportHeroes?: Array<{ class: Character; name: string; monsterId: string | null }>,
  supportHeroDetails?: Record<string, string>
): Promise<string> {
  try {
    const victorIsMonster = isMonster(victorClass.name);
    const defeatedIsMonster = isMonster(defeatedClass.name);
    const victorType = victorIsMonster ? 'monster' : 'class';
    const defeatedType = defeatedIsMonster ? 'monster' : 'class';

    // Filter battle log to only include highlights (attack/ability/system messages)
    // Exclude detailed dice rolls ('roll' type) and old narratives
    const fullBattleLog = battleLog
      .filter(log => log.type !== 'narrative' && log.type !== 'roll') // Exclude narratives and detailed dice rolls
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

    // Build simplified character information (name, description, race, sex, class only)
    const victorInfo = `${victorClass.description || 'N/A'}${victorClass.race && victorClass.race !== 'n/a' ? ` (${victorClass.race})` : ''}${victorClass.sex && victorClass.sex !== 'n/a' ? ` - ${victorClass.sex}` : ''}${victorClass.class ? ` - ${victorClass.class} class` : ''}`;
    
    const defeatedInfo = `${defeatedClass.description || 'N/A'}${defeatedClass.race && defeatedClass.race !== 'n/a' ? ` (${defeatedClass.race})` : ''}${defeatedClass.sex && defeatedClass.sex !== 'n/a' ? ` - ${defeatedClass.sex}` : ''}${defeatedClass.class ? ` - ${defeatedClass.class} class` : ''}`;

    // Build support heroes information if they exist (simplified)
    let supportHeroesSection = '';
    if (supportHeroes && supportHeroes.length > 0) {
      const supportHeroesInfo = supportHeroes.map((supportHero) => {
        const supportInfo = `${supportHero.class.description || 'N/A'}${supportHero.class.race && supportHero.class.race !== 'n/a' ? ` (${supportHero.class.race})` : ''}${supportHero.class.sex && supportHero.class.sex !== 'n/a' ? ` - ${supportHero.class.sex}` : ''}${supportHero.class.class ? ` - ${supportHero.class.class} class` : ''}`;
        return `- **${supportHero.name}** (${supportHero.class.name}): ${supportInfo}`;
      }).join('\n');

      supportHeroesSection = `\n\n=== SUPPORT HEROES ===
${supportHeroesInfo}`;
    }

    // Determine battle type and create appropriate instructions
    let battleTypeInstructions = '';
    let exampleNarrative = '';
    
    if (isOneSidedVictory) {
      battleTypeInstructions = `This was a ONE-SIDED VICTORY - **${victorName}** dominated **${defeatedName}** decisively${supportHeroes && supportHeroes.length > 0 ? ` with help from ${supportHeroes.map(sh => `**${sh.name}**`).join(' and ')}` : ''}. Show overwhelming power and dominance. Use descriptive language like "barely scratched", "completely unscathed", or "untouched" to convey ${victorName} took minimal damage.`;
      exampleNarrative = `Example: "**Barbed Devil** completely overwhelmed **Vespera Darkblade**, barely taking a scratch while her lightsabers fell silent. The Devil's brutal attacks left no room for recovery."`;
    } else if (wasCloseBattle) {
      battleTypeInstructions = `This was a CLOSE BATTLE - both **${victorName}** and **${defeatedName}** struggled, traded blows, and used healing. Show the narrow, desperate victory. Use descriptive language like "barely standing", "on death's door", or "badly wounded" to convey ${victorName} barely survived.`;
      exampleNarrative = `Example: "**Vespara** and **Gandalf** traded blow for blow, both using healing to stay in the fight. **Vespara's** **force blade** found its mark just as her own defenses were about to fail, securing a narrow victory."`;
    } else {
      battleTypeInstructions = `This was a MODERATE BATTLE - **${victorName}** won but took significant damage from **${defeatedName}**. Show a clear but not overwhelming victory. Use descriptive language like "took significant damage" or "wounded but victorious".`;
      exampleNarrative = `Example: "**Gandalf** landed several powerful strikes, but **Vespara's** relentless **force blade** attacks eventually overwhelmed his defenses."`;
    }

    const prompt = `A Battle Arena battle has concluded between ${victorName} (a ${victorClass.name} ${victorType})${supportHeroes && supportHeroes.length > 0 ? ` along with ${supportHeroes.map(sh => sh.name).join(' and ')}` : ''} and ${defeatedName} (a ${defeatedClass.name} ${defeatedType}).

=== ${victorName} (${victorClass.name} ${victorType}) - VICTOR ===
${victorInfo}

=== ${defeatedName} (${defeatedClass.name} ${defeatedType}) - DEFEATED ===
${defeatedInfo}
${supportHeroesSection}

=== BATTLE LOG (Key Moments) ===
${fullBattleLog.join('\n')}

=== INSTRUCTIONS ===
Write a 2-3 sentence battle summary (MAX 400 characters including spaces and markdown).

${battleTypeInstructions}

Requirements:
- Always use actual character names (${victorName}${supportHeroes && supportHeroes.length > 0 ? `, ${supportHeroes.map(sh => sh.name).join(', ')}` : ''}, ${defeatedName}) - never generic terms like "the victor" or "the defeated"
- NO stats, HP numbers, percentages, or game mechanics - only descriptive language
- Use **bold markdown** for character names and key abilities
- Be punchy and entertaining with wordplay or clever phrasing
- Reference abilities and battle moments naturally

${exampleNarrative}`;

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
  victorClass: Character,
  defeatedClass: Character,
  victorName: string,
  defeatedName: string,
  battleSummary: string,
  victorDetails: string = '',
  defeatedDetails: string = '',
  supportHeroes?: Array<{ class: Character; name: string; monsterId: string | null }>,
  supportHeroDetails?: Record<string, string>
): Promise<string | null> {
  try {
    const victorIsMonster = isMonster(victorClass.name);
    const defeatedIsMonster = isMonster(defeatedClass.name);
    const victorType = victorIsMonster ? 'monster' : 'class';
    const defeatedType = defeatedIsMonster ? 'monster' : 'class';

    // Build character descriptions - PREFER visualDescription over description
    // visualDescription contains actual visual details from Langflow vision analysis
    // description contains conceptual/gameplay description
    const victorDescription = victorClass.visualDescription || victorClass.description || '';
    const defeatedDescription = defeatedClass.visualDescription || defeatedClass.description || '';

    // Detect setting from victor's description (use victor's style for the scene)
    const victorSetting = detectSettingFromDescription(victorDescription + ' ' + victorDetails);
    const settingConfig = CARD_SETTINGS[victorSetting] || CARD_SETTINGS[DEFAULT_SETTING];

    // Debug logging to check name/class values
    console.log('=== BATTLE ENDING IMAGE DEBUG ===');
    console.log('Victor Name:', victorName);
    console.log('Victor Class Name:', victorClass.name);
    console.log('Victor Type:', victorType);
    console.log('Victor Setting:', victorSetting);
    console.log('Victor has visualDescription:', !!victorClass.visualDescription);
    console.log('Defeated Name:', defeatedName);
    console.log('Defeated Class Name:', defeatedClass.name);
    console.log('Defeated Type:', defeatedType);
    console.log('Defeated has visualDescription:', !!defeatedClass.visualDescription);
    console.log('=== END DEBUG ===');

    // Build support heroes descriptions if they exist
    let supportHeroesDescription = '';
    if (supportHeroes && supportHeroes.length > 0) {
      const supportDescriptions = supportHeroes.map((supportHero, index) => {
        const supportIsMonster = isMonster(supportHero.class.name);
        const supportType = supportIsMonster ? 'monster' : 'class';
        // PREFER visualDescription over description
        const supportDescription = supportHero.class.visualDescription || supportHero.class.description || '';
        const supportDetail = supportHeroDetails?.[supportHero.class.name] || '';
        return `${supportHero.name}, a ${supportHero.class.name} ${supportType} - SUPPORT HERO ${index + 1}:
${supportHero.class.race && supportHero.class.race !== 'n/a' ? `Race: ${supportHero.class.race}` : ''}
${supportHero.class.sex && supportHero.class.sex !== 'n/a' ? `Sex: ${supportHero.class.sex}` : ''}
Visual Appearance: ${supportDescription || `A ${supportHero.class.name} ${supportType}`}
${supportDetail ? `Additional details: ${supportDetail}` : ''}`;
      }).join('\n\n');
      supportHeroesDescription = `\n\n${supportDescriptions}`;
    }

    // Build a comprehensive prompt that includes character descriptions and image requirements
    const prompt = `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro ${settingConfig.settingPhrase} aesthetic.

CHARACTER DESCRIPTIONS:

${victorName}, a ${victorClass.name} ${victorType} - THE VICTOR:
${victorClass.race && victorClass.race !== 'n/a' ? `Race: ${victorClass.race}` : ''}
${victorClass.sex && victorClass.sex !== 'n/a' ? `Sex: ${victorClass.sex}` : ''}
Visual Appearance: ${victorDescription || `A ${victorClass.name} ${victorType}`}
${victorDetails ? `Additional details: ${victorDetails}` : ''}

${defeatedName}, a ${defeatedClass.name} ${defeatedType} - THE DEFEATED:
${defeatedClass.race && defeatedClass.race !== 'n/a' ? `Race: ${defeatedClass.race}` : ''}
${defeatedClass.sex && defeatedClass.sex !== 'n/a' ? `Sex: ${defeatedClass.sex}` : ''}
Visual Appearance: ${defeatedDescription || `A ${defeatedClass.name} ${defeatedType}`}
${defeatedDetails ? `Additional details: ${defeatedDetails}` : ''}${supportHeroesDescription}

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

