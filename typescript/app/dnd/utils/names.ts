// Generate fun class-appropriate character names
export function generateCharacterName(className: string): string {
  const nameLists: Record<string, string[]> = {
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

  const names = nameLists[className] || ['Adventurer', 'Hero', 'Champion', 'Warrior'];
  return names[Math.floor(Math.random() * names.length)];
}

// Deterministic version that always returns the same name for a given className
// Uses a simple hash function to convert className to a consistent index
export function generateDeterministicCharacterName(className: string): string {
  const nameLists: Record<string, string[]> = {
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

  const names = nameLists[className] || ['Adventurer', 'Hero', 'Champion', 'Warrior'];
  
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

