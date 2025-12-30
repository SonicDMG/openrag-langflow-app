import { Character } from '../../lib/types';
import { isMonster } from '../../lib/constants';

/**
 * Single source of truth for character name lists by class.
 * Used by both random and deterministic name generation functions.
 */
export const CLASS_NAME_LISTS: Record<string, string[]> = {
  Fighter: ['Thorin Ironfist', 'Gareth the Bold', 'Ragnar Steelheart', 'Sir Aldric', 'Bjorn the Mighty', 'Kaelen Bladeborn', 'Darius Warhammer', 'Conan the Conqueror'],
  Wizard: ['Merlin Shadowweaver', 'Gandalf the Grey', 'Zephyr Starfire', 'Archmage Elara', 'Thaddeus Spellwright', 'Lyra Moonwhisper', 'Alistair the Wise', 'Morgana Arcane'],
  Rogue: ['Shadow the Silent', 'Raven Blackdagger', 'Whisper Nightshade', 'Vex the Swift', 'Sly Cooper', 'Nyx Shadowstep', 'Jade the Thief', 'Crimson Blade'],
  Cleric: ['Brother Marcus', 'Sister Seraphina', 'Father Lightbringer', 'High Priestess Celeste', 'Brother Gabriel', 'Sister Mercy', 'Father Devout', 'Cleric Aria'],
  Barbarian: ['Grok the Furious', 'Thokk Bloodaxe', 'Berserker Korg', 'Rage the Unstoppable', 'Grimjaw the Wild', 'Thunder Fist', 'Bloodfang', 'Ragnarok'],
  Ranger: ['Aragorn the Wanderer', 'Legolas Greenleaf', 'Hawkeye the Tracker', 'Sylvan the Hunter', 'Ranger Kael', 'Forest Walker', 'Arrow the Swift', 'Wildheart'],
  Paladin: ['Sir Galahad', 'Lady Justice', 'Knight Valor', 'Sir Percival', 'Paladin Dawn', 'Holy Champion', 'Sir Lancelot', 'Divine Shield'],
  Bard: ['Lorelei the Songstress', 'Merry the Minstrel', 'Bardic Thunder', 'Lyric the Storyteller', 'Melody Bright', 'Harmony the Voice', 'Verse the Charmer', 'Rhyme the Witty'],
  Sorcerer: ['Zara Stormcaller', 'Draco the Wild', 'Nova the Radiant', 'Chaos the Untamed', 'Aurora Spellborn', 'Tempest the Furious', 'Ember the Bright', 'Starfire'],
  Warlock: ['Malachi Darkpact', 'Lilith the Cursed', 'Necro the Bound', 'Shadow the Summoner', 'Vex the Hexed', 'Raven the Cursed', 'Void the Dark', 'Pactkeeper'],
  Monk: ['Master Chen', 'Sifu Li', 'Zen the Peaceful', 'Iron Fist', 'Master Po', 'Dragon the Wise', 'Tiger the Fierce', 'Crane the Graceful'],
  Druid: ['Oakheart the Ancient', 'Luna Moonwhisper', 'Thorn the Wild', 'Nature the Keeper', 'Grove the Guardian', 'Ivy the Green', 'Root the Deep', 'Bloom the Bright'],
  Artificer: ['Tinker the Inventor', 'Gear the Builder', 'Cog the Mechanic', 'Spark the Creator', 'Forge the Smith', 'Wrench the Fixer', 'Blueprint the Designer', 'Steam the Engineer'],
};

/**
 * Generate a random class-appropriate character name.
 * Uses the shared CLASS_NAME_LISTS constant.
 */
export function generateCharacterName(className: string): string {
  const names = CLASS_NAME_LISTS[className] || ['Adventurer', 'Hero', 'Champion', 'Warrior'];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Generate a deterministic character name (same input always returns same output).
 * Uses a simple hash function to convert className to a consistent index.
 * Uses the shared CLASS_NAME_LISTS constant.
 */
export function generateDeterministicCharacterName(className: string): string {
  const names = CLASS_NAME_LISTS[className] || ['Adventurer', 'Hero', 'Champion', 'Warrior'];
  
  // Simple hash function to convert className to a consistent index
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    const char = className.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get a consistent index
  const index = Math.abs(hash) % names.length;
  return names[index];
}

/**
 * Get the character name using consistent logic across the app.
 * This is the single source of truth for character name determination.
 *
 * Simplified logic (no longer checks FALLBACK_* for type detection):
 * - If playerName is provided and differs from class name, use it (custom character name)
 * - If playerName equals class name or is empty, generate a deterministic name for heroes
 * - For monsters, always use the monster name directly
 *
 * @param playerName - The player's name (may be empty string if not set)
 * @param character - The character/monster object
 * @returns The character name to display
 */
export function getCharacterName(playerName: string, character: Character | null): string {
  if (!character) {
    return playerName || 'Unknown';
  }
  
  // Check if it's a created monster (has klass and monsterId)
  const isCreatedMonster = !!(character as any).klass && !!(character as any).monsterId;
  
  // For created monsters, use the character name
  if (isCreatedMonster) {
    return playerName || character.name;
  }
  
  // Check if it's a monster using the _type marker or isMonster function
  const isMonsterType = (character as any)._type === 'monster' || isMonster(character.name);
  
  // For monsters, use the monster name directly
  if (isMonsterType) {
    return playerName || character.name;
  }
  
  // For heroes: check if character.name is a standard class name
  const isStandardClass = CLASS_NAME_LISTS[character.name] !== undefined;
  
  if (isStandardClass) {
    // Standard class: if playerName equals className or is empty, generate deterministic name
    if (!playerName || playerName === character.name) {
      return generateDeterministicCharacterName(character.name);
    }
    // Otherwise use the provided playerName (custom name for standard class)
    return playerName;
  }
  
  // Custom hero: use playerName if provided, otherwise use character.name
  return playerName || character.name;
}

