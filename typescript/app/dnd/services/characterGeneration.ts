import { DnDClass, Ability } from '../types';
import { extractJsonFromResponse, parseSSEResponse } from '../utils/api';

interface GeneratedStats {
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  description: string;
}

interface GenerationResult {
  stats: GeneratedStats | null;
  abilities: Ability[];
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
    
    // Generate stats
    const statsQuery = `Create a D&D ${typeLabel} character based on this description: "${description}"

${name ? `Character name: ${name}` : ''}

Provide the following information in JSON format:
{
  "hitPoints": number (typical HP for a ${characterType === 'hero' ? 'level 1-3 character, around 20-35' : 'challenging encounter, 25-50'}),
  "armorClass": number (typical AC, between ${characterType === 'hero' ? '12-18' : '10-20'}),
  "attackBonus": number (typical attack bonus modifier, between ${characterType === 'hero' ? '3-5' : '2-8'}),
  "damageDie": string (typical weapon damage die like "d6", "d8", "d10", or "d12"),
  "description": string (brief 1-2 sentence description based on the provided description)
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
      ['hitPoints', 'armorClass', 'attackBonus', 'damageDie'],
      ['search_query']
    );

    let stats: GeneratedStats | null = null;
    if (statsJsonString) {
      try {
        const parsed = JSON.parse(statsJsonString);
        // Normalize damageDie format
        let damageDie = parsed.damageDie || 'd8';
        if (damageDie.match(/^\d+d\d+$/)) {
          damageDie = 'd' + damageDie.split('d')[1];
        }

        const hitPoints = parsed.hitPoints || (characterType === 'hero' ? 25 : 30);
        stats = {
          hitPoints,
          maxHitPoints: hitPoints,
          armorClass: parsed.armorClass || (characterType === 'hero' ? 14 : 14),
          attackBonus: parsed.attackBonus || (characterType === 'hero' ? 4 : 4),
          damageDie,
          description: parsed.description || description,
        };
      } catch (parseError) {
        console.warn('Error parsing stats JSON:', parseError);
        // Try to extract partial data
        const hitPointsMatch = statsJsonString.match(/"hitPoints"\s*:\s*(\d+)/);
        const armorClassMatch = statsJsonString.match(/"armorClass"\s*:\s*(\d+)/);
        const attackBonusMatch = statsJsonString.match(/"attackBonus"\s*:\s*(\d+)/);
        const damageDieMatch = statsJsonString.match(/"damageDie"\s*:\s*"([^"]+)"/);
        const descriptionMatch = statsJsonString.match(/"description"\s*:\s*"([^"]*)"/);

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
    const abilitiesQuery = `Create D&D abilities for a ${typeLabel} character based on this description: "${description}"

${name ? `Character name: ${name}` : ''}

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

    // Check if response indicates no data found
    if (abilitiesContent.toLowerCase().includes('no relevant supporting sources') ||
        abilitiesContent.toLowerCase().includes('no sources found') ||
        abilitiesContent.toLowerCase().includes('no relevant information') ||
        abilitiesContent.trim().length === 0) {
      console.warn('No abilities data found in response');
      return { stats, abilities: [] };
    }

    // Extract abilities JSON
    let abilitiesJsonString = extractJsonFromResponse(
      abilitiesContent,
      ['abilities']
    );

    if (!abilitiesJsonString) {
      console.warn('No JSON object with "abilities" field found');
      return { stats, abilities: [] };
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

    return { stats, abilities };
  } catch (error) {
    console.error('Error generating character stats:', error);
    throw error;
  }
}

