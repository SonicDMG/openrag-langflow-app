import { DnDClass } from '../types';
import { FALLBACK_CLASSES, isMonster } from '../constants';

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
 * Logic:
 * - Created monsters: playerName is already the character name, dndClass.name is the character name, dndClass.klass is the class type
 * - Custom heroes: playerName is already the character name, dndClass.name is also the character name
 * - Regular classes: playerName might be generated, dndClass.name is the class name
 * - Regular monsters: playerName is the monster type name, dndClass.name is also the monster type name
 * 
 * @param playerName - The player's name (may be empty string if not set)
 * @param dndClass - The DnD class/monster object
 * @returns The character name to display
 */
export function getCharacterName(playerName: string, dndClass: DnDClass | null): string {
  if (!dndClass) {
    return playerName || 'Unknown';
  }
  
  // Check if it's a created monster (has klass and monsterId)
  const isCreatedMonster = !!(dndClass as any).klass && !!(dndClass as any).monsterId;
  // Check if it's a custom hero (not in FALLBACK_CLASSES, not a monster, not a created monster)
  const isCustomHero = !isCreatedMonster && !isMonster(dndClass.name) && !FALLBACK_CLASSES.some((fc: DnDClass) => fc.name === dndClass.name);
  
  // For created monsters and custom heroes, playerName is already the character name
  if (isCreatedMonster || isCustomHero) {
    return playerName || dndClass.name;
  }
  
  // For regular classes, if playerName equals className, generate a name
  // Otherwise, playerName is the actual character name
  if (playerName === dndClass.name && !isMonster(dndClass.name)) {
    return generateDeterministicCharacterName(dndClass.name);
  }
  
  // Otherwise, use playerName (which should already be set correctly)
  return playerName || (isMonster(dndClass.name) ? dndClass.name : generateDeterministicCharacterName(dndClass.name));
}

