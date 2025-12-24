import { DnDClass, Ability, SettingConfig } from './types';

/**
 * Randomly selects up to 5 abilities from available abilities, ensuring a mix of attack and healing abilities.
 * Prioritizes having at least 1 attack and 1 healing (if healing is available), then fills remaining slots randomly.
 * Guarantees at least one healing ability if healing abilities exist in the available pool.
 */
export function selectRandomAbilities(availableAbilities: Ability[]): Ability[] {
  if (availableAbilities.length === 0) {
    return [];
  }

  // Separate abilities by type
  const attackAbilities = availableAbilities.filter(a => a.type === 'attack');
  const healingAbilities = availableAbilities.filter(a => a.type === 'healing');

  const selected: Ability[] = [];
  
  // Ensure we have at least 1 attack if available
  if (attackAbilities.length > 0 && selected.length < 5) {
    const randomAttack = attackAbilities[Math.floor(Math.random() * attackAbilities.length)];
    selected.push(randomAttack);
  }
  
  // Ensure we have at least 1 healing if healing abilities are available (for classes that support it)
  // This is guaranteed - if healing abilities exist, we will include at least one
  if (healingAbilities.length > 0) {
    // Check if we already have a healing ability
    const hasHealing = selected.some(a => a.type === 'healing');
    
    if (!hasHealing) {
      // If we don't have a healing ability yet, add one
      if (selected.length < 5) {
        // If we have room, just add it
        const randomHealing = healingAbilities[Math.floor(Math.random() * healingAbilities.length)];
        selected.push(randomHealing);
      } else {
        // If we're at capacity, replace a random non-attack ability with a healing ability
        // First, try to find a non-essential ability to replace
        const nonEssentialIndices = selected
          .map((a, idx) => ({ ability: a, index: idx }))
          .filter(({ ability }) => ability.type !== 'attack')
          .map(({ index }) => index);
        
        if (nonEssentialIndices.length > 0) {
          // Replace a random non-attack ability
          const replaceIndex = nonEssentialIndices[Math.floor(Math.random() * nonEssentialIndices.length)];
          const randomHealing = healingAbilities[Math.floor(Math.random() * healingAbilities.length)];
          selected[replaceIndex] = randomHealing;
        } else {
          // If all are attacks, replace the last one (we already have at least one attack)
          const randomHealing = healingAbilities[Math.floor(Math.random() * healingAbilities.length)];
          selected[selected.length - 1] = randomHealing;
        }
      }
    }
  }

  // Fill remaining slots randomly from all available abilities (up to 5 total)
  const remaining = availableAbilities.filter(a => !selected.includes(a));
  while (selected.length < 5 && remaining.length > 0) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(randomIndex, 1)[0]);
  }

  // Final guarantee: if healing abilities exist in the pool, ensure at least one is in the final selection
  if (healingAbilities.length > 0) {
    const hasHealing = selected.some(a => a.type === 'healing');
    if (!hasHealing) {
      // Replace a random non-attack ability with a healing ability
      const nonEssentialIndices = selected
        .map((a, idx) => ({ ability: a, index: idx }))
        .filter(({ ability }) => ability.type !== 'attack')
        .map(({ index }) => index);
      
      if (nonEssentialIndices.length > 0) {
        const replaceIndex = nonEssentialIndices[Math.floor(Math.random() * nonEssentialIndices.length)];
        const randomHealing = healingAbilities[Math.floor(Math.random() * healingAbilities.length)];
        selected[replaceIndex] = randomHealing;
      } else if (selected.length > 1) {
        // If all are attacks and we have more than 1, replace the last one
        const randomHealing = healingAbilities[Math.floor(Math.random() * healingAbilities.length)];
        selected[selected.length - 1] = randomHealing;
      }
    }
  }

  return selected;
}

// Default fallback abilities for each class when agent response fails
export const FALLBACK_ABILITIES: Record<string, Ability[]> = {
  'Fighter': [
    {
      name: 'Action Surge',
      type: 'attack',
      damageDice: '2d8',
      attackRoll: true,
      attacks: 2,
      description: 'Take an additional action to make two powerful attacks.',
    },
    {
      name: 'Second Wind',
      type: 'healing',
      healingDice: '1d10+3',
      description: 'Regain hit points through sheer determination.',
    },
  ],
  'Wizard': [
    {
      name: 'Magic Missile',
      type: 'attack',
      damageDice: '1d4+1',
      attackRoll: false,
      attacks: 3,
      description: 'Three unerring bolts of magical force strike the target.',
    },
    {
      name: 'Fireball',
      type: 'attack',
      damageDice: '3d6',
      attackRoll: false,
      description: 'A bright streak flashes from your pointing finger and explodes.',
    },
    {
      name: 'Arcane Recovery',
      type: 'healing',
      healingDice: '1d8+2',
      description: 'Channel arcane energy to restore your vitality and recover hit points.',
    },
  ],
  'Rogue': [
    {
      name: 'Sneak Attack',
      type: 'attack',
      damageDice: '1d8',
      attackRoll: true,
      bonusDamageDice: '2d6',
      description: 'Strike with precision when your enemy is distracted.',
    },
    {
      name: 'Cunning Action',
      type: 'attack',
      damageDice: '1d6',
      attackRoll: true,
      description: 'Use your quick reflexes to strike and reposition.',
    },
    {
      name: 'Quick Recovery',
      type: 'healing',
      healingDice: '1d6+2',
      description: 'Use your quick wits and agility to patch up wounds and recover.',
    },
  ],
  'Cleric': [
    {
      name: 'Guided Strike',
      type: 'attack',
      damageDice: '1d8',
      attackRoll: true,
      description: 'Channel divine power to guide your weapon to its target.',
    },
    {
      name: 'Cure Wounds',
      type: 'healing',
      healingDice: '1d8+3',
      description: 'A creature you touch regains hit points through divine magic.',
    },
    {
      name: 'Healing Word',
      type: 'healing',
      healingDice: '1d4+3',
      description: 'A creature of your choice regains hit points with a word.',
    },
  ],
  'Barbarian': [
    {
      name: 'Reckless Attack',
      type: 'attack',
      damageDice: '1d12',
      attackRoll: true,
      description: 'Throw caution to the wind and attack with savage fury.',
    },
    {
      name: 'Rage Strike',
      type: 'attack',
      damageDice: '2d6',
      attackRoll: true,
      description: 'Channel your rage into a devastating blow.',
    },
    {
      name: 'Primal Resilience',
      type: 'healing',
      healingDice: '1d10+2',
      description: 'Tap into your primal strength to recover from wounds through sheer toughness.',
    },
  ],
  'Ranger': [
    {
      name: 'Hunter\'s Mark',
      type: 'attack',
      damageDice: '1d8',
      attackRoll: true,
      bonusDamageDice: '1d6',
      description: 'Mark your prey and deal extra damage with your attacks.',
    },
    {
      name: 'Cure Wounds',
      type: 'healing',
      healingDice: '1d8+2',
      description: 'A creature you touch regains hit points through natural magic.',
    },
  ],
  'Paladin': [
    {
      name: 'Divine Smite',
      type: 'attack',
      damageDice: '1d8',
      attackRoll: true,
      bonusDamageDice: '2d8',
      description: 'Channel divine energy to smite your enemies.',
    },
    {
      name: 'Lay on Hands',
      type: 'healing',
      healingDice: '1d10+5',
      description: 'Touch a creature to restore its hit points through divine power.',
    },
  ],
  'Bard': [
    {
      name: 'Vicious Mockery',
      type: 'attack',
      damageDice: '1d4',
      attackRoll: false,
      description: 'Insult a creature with magical words that deal psychic damage.',
    },
    {
      name: 'Healing Word',
      type: 'healing',
      healingDice: '1d4+3',
      description: 'A creature of your choice regains hit points through your inspiring words.',
    },
  ],
  'Sorcerer': [
    {
      name: 'Chaos Bolt',
      type: 'attack',
      damageDice: '2d8',
      attackRoll: false,
      description: 'Hurl a bolt of chaotic energy at your target.',
    },
    {
      name: 'Fire Bolt',
      type: 'attack',
      damageDice: '1d10',
      attackRoll: true,
      description: 'Hurl a mote of fire at a creature or object.',
    },
    {
      name: 'Vampiric Touch',
      type: 'healing',
      healingDice: '1d8+2',
      description: 'Channel life force to heal yourself through magical means.',
    },
  ],
  'Warlock': [
    {
      name: 'Eldritch Blast',
      type: 'attack',
      damageDice: '1d10',
      attackRoll: true,
      attacks: 2,
      description: 'A beam of crackling energy streaks toward a creature.',
    },
    {
      name: 'Hex',
      type: 'attack',
      damageDice: '1d6',
      attackRoll: true,
      bonusDamageDice: '1d6',
      description: 'Place a curse on a creature that deals extra damage.',
    },
    {
      name: 'Dark Pact Recovery',
      type: 'healing',
      healingDice: '1d8+2',
      description: 'Draw upon your patron\'s power to restore your vitality.',
    },
  ],
  'Monk': [
    {
      name: 'Flurry of Blows',
      type: 'attack',
      damageDice: '1d4',
      attackRoll: true,
      attacks: 2,
      description: 'Make two unarmed strikes in rapid succession.',
    },
    {
      name: 'Stunning Strike',
      type: 'attack',
      damageDice: '1d6',
      attackRoll: true,
      description: 'Strike with focused ki to stun your opponent.',
    },
    {
      name: 'Ki Restoration',
      type: 'healing',
      healingDice: '1d8+2',
      description: 'Channel your ki energy to restore your body and recover hit points.',
    },
  ],
  'Druid': [
    {
      name: 'Thorn Whip',
      type: 'attack',
      damageDice: '1d6',
      attackRoll: true,
      description: 'Create a long, vine-like whip covered in thorns.',
    },
    {
      name: 'Cure Wounds',
      type: 'healing',
      healingDice: '1d8+3',
      description: 'A creature you touch regains hit points through natural magic.',
    },
    {
      name: 'Goodberry',
      type: 'healing',
      healingDice: '1d4+1',
      description: 'Create berries that restore hit points when consumed.',
    },
  ],
  'Artificer': [
    {
      name: 'Arcane Weapon',
      type: 'attack',
      damageDice: '1d8',
      attackRoll: true,
      bonusDamageDice: '1d6',
      description: 'Infuse a weapon with magical energy to deal extra damage.',
    },
    {
      name: 'Cure Wounds',
      type: 'healing',
      healingDice: '1d8+2',
      description: 'A creature you touch regains hit points through magical tinkering.',
    },
  ],
};

// Default fallback abilities for each monster when agent response fails
export const FALLBACK_MONSTER_ABILITIES: Record<string, Ability[]> = {
  'Goblin': [
    {
      name: 'Scimitar',
      type: 'attack',
      damageDice: '1d6',
      attackRoll: true,
      description: 'A quick slash with a curved blade.',
    },
    {
      name: 'Shortbow',
      type: 'attack',
      damageDice: '1d6',
      attackRoll: true,
      description: 'A ranged attack with a small bow.',
    },
  ],
  'Orc': [
    {
      name: 'Greataxe',
      type: 'attack',
      damageDice: '1d12+3',
      attackRoll: true,
      description: 'A powerful axe attack.',
    },
    {
      name: 'Javelin',
      type: 'attack',
      damageDice: '1d6+3',
      attackRoll: true,
      description: 'A thrown javelin attack.',
    },
  ],
  'Ogre': [
    {
      name: 'Greatclub',
      type: 'attack',
      damageDice: '2d8+4',
      attackRoll: true,
      description: 'A massive club attack.',
    },
    {
      name: 'Javelin',
      type: 'attack',
      damageDice: '2d6+4',
      attackRoll: true,
      description: 'A thrown javelin attack.',
    },
  ],
  'Kobold': [
    {
      name: 'Dagger',
      type: 'attack',
      damageDice: '1d4+2',
      attackRoll: true,
      description: 'A quick dagger attack.',
    },
    {
      name: 'Sling',
      type: 'attack',
      damageDice: '1d4+2',
      attackRoll: true,
      description: 'A sling attack.',
    },
  ],
  'Skeleton': [
    {
      name: 'Shortsword',
      type: 'attack',
      damageDice: '1d6+2',
      attackRoll: true,
      description: 'A sword attack.',
    },
    {
      name: 'Shortbow',
      type: 'attack',
      damageDice: '1d6+2',
      attackRoll: true,
      description: 'A ranged bow attack.',
    },
  ],
  'Zombie': [
    {
      name: 'Slam',
      type: 'attack',
      damageDice: '1d6+1',
      attackRoll: true,
      description: 'A slow slam attack.',
    },
  ],
  'Dragon': [
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '2d10',
      attackRoll: true,
      description: 'A powerful bite attack.',
    },
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d6',
      attackRoll: true,
      attacks: 2,
      description: 'Two devastating claw attacks.',
    },
    {
      name: 'Breath Weapon',
      type: 'attack',
      damageDice: '6d6',
      attackRoll: false,
      description: 'A devastating breath attack.',
    },
  ],
  'Troll': [
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '1d6',
      attackRoll: true,
      description: 'A savage bite.',
    },
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d4',
      attackRoll: true,
      attacks: 2,
      description: 'Two claw attacks.',
    },
    {
      name: 'Regeneration',
      type: 'healing',
      healingDice: '1d10+3',
      description: 'The troll regenerates lost hit points.',
    },
  ],
  'Vampire': [
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '1d6+3',
      attackRoll: true,
      description: 'A draining bite attack.',
    },
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '1d8+3',
      attackRoll: true,
      attacks: 2,
      description: 'Two claw attacks.',
    },
    {
      name: 'Regeneration',
      type: 'healing',
      healingDice: '2d10',
      description: 'The vampire regenerates lost hit points.',
    },
  ],
  'Demon': [
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d6',
      attackRoll: true,
      attacks: 2,
      description: 'Two demonic claw attacks.',
    },
    {
      name: 'Tail Sting',
      type: 'attack',
      damageDice: '1d8+4',
      attackRoll: true,
      description: 'A poisonous tail attack.',
    },
  ],
  'Beholder': [
    {
      name: 'Eye Ray',
      type: 'attack',
      damageDice: '3d6',
      attackRoll: false,
      description: 'A magical eye ray attack.',
    },
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '2d8',
      attackRoll: true,
      description: 'A powerful bite with its central eye.',
    },
  ],
  'Lich': [
    {
      name: 'Paralyzing Touch',
      type: 'attack',
      damageDice: '3d6',
      attackRoll: true,
      description: 'A touch that paralyzes the target.',
    },
    {
      name: 'Disrupt Life',
      type: 'attack',
      damageDice: '4d8',
      attackRoll: false,
      description: 'Drains life force from nearby creatures.',
    },
  ],
  'Werewolf': [
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '2d8+3',
      attackRoll: true,
      description: 'Melee bite attack in wolf or hybrid form.',
    },
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d6+3',
      attackRoll: true,
      description: 'Melee claw attack.',
    },
  ],
  'Devil': [
    {
      name: 'Searing Fork',
      type: 'attack',
      damageDice: '2d8+4',
      attackRoll: true,
      description: 'Melee weapon attack dealing fire damage.',
    },
    {
      name: 'Hurl Flame',
      type: 'attack',
      damageDice: '2d8+4',
      attackRoll: true,
      description: 'Ranged spell attack dealing fire damage.',
    },
  ],
  'Mind Flayer': [
    {
      name: 'Mind Blast',
      type: 'attack',
      damageDice: '6d8',
      attackRoll: false,
      description: 'Psychic damage in a cone, stuns targets.',
    },
    {
      name: 'Tentacles',
      type: 'attack',
      damageDice: '4d10',
      attackRoll: true,
      attacks: 3,
      description: 'Three tentacle attacks dealing psychic damage.',
    },
  ],
  'Giant': [
    {
      name: 'Slam',
      type: 'attack',
      damageDice: '2d10+5',
      attackRoll: true,
      description: 'Melee slam attack dealing bludgeoning damage.',
    },
    {
      name: 'Rock',
      type: 'attack',
      damageDice: '3d10+5',
      attackRoll: true,
      description: 'Ranged rock attack.',
    },
  ],
  'Elemental': [
    {
      name: 'Slam',
      type: 'attack',
      damageDice: '2d8+4',
      attackRoll: true,
      description: 'Melee slam attack.',
    },
  ],
  'Undead': [
    {
      name: 'Slam',
      type: 'attack',
      damageDice: '1d8+2',
      attackRoll: true,
      description: 'Melee slam attack.',
    },
  ],
  'Beast': [
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '1d8+2',
      attackRoll: true,
      description: 'Melee bite attack.',
    },
  ],
  'Aberration': [
    {
      name: 'Tentacles',
      type: 'attack',
      damageDice: '2d6+3',
      attackRoll: true,
      description: 'Tentacle attack.',
    },
  ],
  'Pit Fiend': [
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '3d6+8',
      attackRoll: true,
      description: 'Melee bite attack.',
    },
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '4d8+8',
      attackRoll: true,
      description: 'Melee claw attack.',
    },
    {
      name: 'Mace',
      type: 'attack',
      damageDice: '4d6+8',
      attackRoll: true,
      bonusDamageDice: '6d6',
      description: 'Melee mace attack with fire damage.',
    },
  ],
  'White Dragon': [
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '2d10+6',
      attackRoll: true,
      description: 'Melee bite attack.',
    },
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d6+6',
      attackRoll: true,
      attacks: 2,
      description: 'Two claw attacks.',
    },
    {
      name: 'Cold Breath',
      type: 'attack',
      damageDice: '9d8',
      attackRoll: false,
      description: 'Cone of cold damage.',
    },
  ],
  'Marilith': [
    {
      name: 'Longsword',
      type: 'attack',
      damageDice: '1d10+5',
      attackRoll: true,
      attacks: 6,
      description: 'Six longsword attacks.',
    },
    {
      name: 'Tail',
      type: 'attack',
      damageDice: '2d10+4',
      attackRoll: true,
      description: 'Tail attack that grapples.',
    },
  ],
  'Hezrou': [
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '2d8+6',
      attackRoll: true,
      description: 'Melee bite attack.',
    },
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d6+6',
      attackRoll: true,
      attacks: 2,
      description: 'Two claw attacks.',
    },
  ],
  'Barbed Devil': [
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d6+3',
      attackRoll: true,
      attacks: 2,
      description: 'Two claw attacks.',
    },
    {
      name: 'Hurl Flame',
      type: 'attack',
      damageDice: '3d6',
      attackRoll: true,
      description: 'Ranged fire attack.',
    },
  ],
  'Horned Devil': [
    {
      name: 'Horns',
      type: 'attack',
      damageDice: '2d6+4',
      attackRoll: true,
      description: 'Melee horn attack.',
    },
    {
      name: 'Tail',
      type: 'attack',
      damageDice: '2d8+4',
      attackRoll: true,
      description: 'Tail attack.',
    },
  ],
  'Ice Devil': [
    {
      name: 'Spear',
      type: 'attack',
      damageDice: '2d8+5',
      attackRoll: true,
      bonusDamageDice: '3d6',
      description: 'Ice spear attack with cold damage.',
    },
    {
      name: 'Tail',
      type: 'attack',
      damageDice: '2d6+5',
      attackRoll: true,
      description: 'Tail attack.',
    },
  ],
  'Erinyes': [
    {
      name: 'Longsword',
      type: 'attack',
      damageDice: '2d8+4',
      attackRoll: true,
      bonusDamageDice: '2d10',
      description: 'Longsword attack with necrotic damage.',
    },
    {
      name: 'Longbow',
      type: 'attack',
      damageDice: '1d8+4',
      attackRoll: true,
      description: 'Ranged bow attack.',
    },
  ],
  'Bone Devil': [
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d8+4',
      attackRoll: true,
      attacks: 2,
      description: 'Two claw attacks.',
    },
    {
      name: 'Sting',
      type: 'attack',
      damageDice: '2d10+4',
      attackRoll: true,
      bonusDamageDice: '4d8',
      description: 'Sting attack with poison damage.',
    },
  ],
  'Chain Devil': [
    {
      name: 'Chain',
      type: 'attack',
      damageDice: '2d6+4',
      attackRoll: true,
      attacks: 2,
      description: 'Two chain attacks.',
    },
  ],
  'Bearded Devil': [
    {
      name: 'Glaive',
      type: 'attack',
      damageDice: '1d10+3',
      attackRoll: true,
      description: 'Melee glaive attack.',
    },
    {
      name: 'Beard',
      type: 'attack',
      damageDice: '1d8+3',
      attackRoll: true,
      description: 'Beard tentacle attack.',
    },
  ],
  'Imp': [
    {
      name: 'Sting',
      type: 'attack',
      damageDice: '1d6+3',
      attackRoll: true,
      bonusDamageDice: '2d6',
      description: 'Sting attack with poison damage.',
    },
  ],
  'Quasit': [
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '1d4+3',
      attackRoll: true,
      description: 'Melee claw attack.',
    },
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '1d4+3',
      attackRoll: true,
      description: 'Melee bite attack.',
    },
  ],
  'Shadow Demon': [
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '2d6+3',
      attackRoll: true,
      description: 'Melee claw attack.',
    },
  ],
  'Vrock': [
    {
      name: 'Beak',
      type: 'attack',
      damageDice: '2d6+4',
      attackRoll: true,
      description: 'Melee beak attack.',
    },
    {
      name: 'Talons',
      type: 'attack',
      damageDice: '2d6+4',
      attackRoll: true,
      attacks: 2,
      description: 'Two talon attacks.',
    },
  ],
  'Yochlol': [
    {
      name: 'Pseudopod',
      type: 'attack',
      damageDice: '2d6+4',
      attackRoll: true,
      description: 'Melee pseudopod attack.',
    },
    {
      name: 'Bite',
      type: 'attack',
      damageDice: '2d8+4',
      attackRoll: true,
      description: 'Melee bite attack.',
    },
  ],
  'Manes': [
    {
      name: 'Claw',
      type: 'attack',
      damageDice: '1d4+1',
      attackRoll: true,
      description: 'Melee claw attack.',
    },
  ],
  'Lemure': [
    {
      name: 'Fist',
      type: 'attack',
      damageDice: '1d4+1',
      attackRoll: true,
      description: 'Melee fist attack.',
    },
  ],
  'Dao': [
    {
      name: 'Slam',
      type: 'attack',
      damageDice: '2d8+7',
      attackRoll: true,
      description: 'Melee slam attack.',
    },
    {
      name: 'Earth Glide',
      type: 'attack',
      damageDice: '2d10+7',
      attackRoll: true,
      description: 'Attack while moving through earth.',
    },
  ],
  'Efreeti': [
    {
      name: 'Scimitar',
      type: 'attack',
      damageDice: '2d6+5',
      attackRoll: true,
      description: 'Melee scimitar attack.',
    },
    {
      name: 'Hurl Flame',
      type: 'attack',
      damageDice: '2d6+5',
      attackRoll: true,
      description: 'Ranged fire attack.',
    },
  ],
  'Marid': [
    {
      name: 'Trident',
      type: 'attack',
      damageDice: '2d6+5',
      attackRoll: true,
      description: 'Melee trident attack.',
    },
    {
      name: 'Water Blast',
      type: 'attack',
      damageDice: '3d6',
      attackRoll: false,
      description: 'Ranged water attack.',
    },
  ],
  // Generic monsters with no special abilities - use empty arrays
  'Allosaurus': [],
  'Anklyosaurus': [],
  'Bugbear Stalker': [],
  'Goblin Boss': [],
  'Goblin Minion': [],
  'Hobgoblin Captain': [],
  'Pirate': [],
  'Pirate Captain': [],
  'Pteradon': [],
  'Sphinx of Wonder': [],
  'Swarm of Crawling Claws': [],
  'Tough Boss': [],
  'Troll Limb': [],
  'Vampire Familiar': [],
  'Nalfeshnee': [],
  'Swarm of Lemures': [],
  'Blob of Annihilation': [],
};

// Load default heroes from JSON file
// This is loaded at build time and works in both client and server contexts
let FALLBACK_CLASSES_DATA: DnDClass[] = [];
try {
  // Use dynamic require to load JSON at build time
  const heroesJson = require('../../../characters/default_heroes/heroes.json');
  FALLBACK_CLASSES_DATA = heroesJson.heroes || [];
} catch (error) {
  console.error('Failed to load heroes from JSON, using empty array:', error);
  FALLBACK_CLASSES_DATA = [];
}

// Default fallback classes loaded from JSON
// Note: abilities are included by default and will be randomly selected on each run
export const FALLBACK_CLASSES: DnDClass[] = FALLBACK_CLASSES_DATA;

/**
 * Helper function to check if a class name is a monster.
 *
 * Priority order:
 * 1. Check availableMonsters array (from database) if provided
 * 2. Fall back to FALLBACK_MONSTERS (for offline/emergency use)
 *
 * Note: This function is less reliable than checking the _type marker on a DnDClass object.
 * Prefer using (dndClass as any)._type === 'monster' when you have the full object.
 *
 * @param className - The class/monster name to check
 * @param availableMonsters - Optional array of monsters from database to check against
 */
export function isMonster(className: string, availableMonsters?: DnDClass[]): boolean {
  // Prefer database monsters if available
  if (availableMonsters && availableMonsters.length > 0) {
    return availableMonsters.some(monster => monster.name === className);
  }
  
  // Fall back to FALLBACK_MONSTERS (for offline/emergency use)
  return FALLBACK_MONSTERS.some(monster => monster.name === className);
}

/**
 * Helper function to get all class names (player classes only)
 */
export function getPlayerClassNames(): string[] {
  return FALLBACK_CLASSES.map(cls => cls.name);
}

// Load default monsters from JSON file
// This is loaded at build time and works in both client and server contexts
let FALLBACK_MONSTERS_DATA: DnDClass[] = [];
try {
  // Use dynamic require to load JSON at build time
  const monstersJson = require('../../../characters/default_monsters/monsters.json');
  FALLBACK_MONSTERS_DATA = monstersJson.monsters || [];
} catch (error) {
  console.error('Failed to load monsters from JSON, using empty array:', error);
  FALLBACK_MONSTERS_DATA = [];
}

// Default fallback monsters loaded from JSON
// Note: abilities are included by default and will be randomly selected on each run
export const FALLBACK_MONSTERS: DnDClass[] = FALLBACK_MONSTERS_DATA;

// Class color mapping - consolidated single source of truth
export const CLASS_COLORS: Record<string, string> = {
  'Fighter': 'bg-red-900',
  'Wizard': 'bg-blue-900',
  'Rogue': 'bg-purple-900',
  'Cleric': 'bg-yellow-900',
  'Barbarian': 'bg-orange-900',
  'Ranger': 'bg-green-900',
  'Paladin': 'bg-pink-900',
  'Bard': 'bg-indigo-900',
  'Sorcerer': 'bg-cyan-900',
  'Warlock': 'bg-violet-900',
  'Monk': 'bg-amber-900',
  'Druid': 'bg-emerald-900',
  'Artificer': 'bg-teal-900',
};

// Monster color mapping
export const MONSTER_COLORS: Record<string, string> = {
  'Goblin': 'bg-green-800',
  'Orc': 'bg-gray-800',
  'Dragon': 'bg-red-800',
  'Troll': 'bg-green-700',
  'Ogre': 'bg-gray-700',
  'Kobold': 'bg-yellow-800',
  'Skeleton': 'bg-gray-600',
  'Zombie': 'bg-green-600',
  'Vampire': 'bg-red-900',
  'Werewolf': 'bg-gray-800',
  'Demon': 'bg-purple-900',
  'Devil': 'bg-red-900',
  'Beholder': 'bg-purple-800',
  'Mind Flayer': 'bg-indigo-900',
  'Lich': 'bg-gray-800',
  'Giant': 'bg-orange-800',
  'Elemental': 'bg-blue-800',
  'Undead': 'bg-gray-700',
  'Beast': 'bg-amber-800',
  'Aberration': 'bg-violet-900',
  'Allosaurus': 'bg-green-700',
  'Anklyosaurus': 'bg-amber-700',
  'Bugbear Stalker': 'bg-gray-800',
  'Goblin Boss': 'bg-green-900',
  'Goblin Minion': 'bg-green-800',
  'Hobgoblin Captain': 'bg-orange-800',
  'Pirate': 'bg-amber-800',
  'Pirate Captain': 'bg-amber-900',
  'Pteradon': 'bg-gray-600',
  'Sphinx of Wonder': 'bg-yellow-800',
  'Swarm of Crawling Claws': 'bg-gray-700',
  'Tough Boss': 'bg-red-900',
  'Troll Limb': 'bg-green-700',
  'Vampire Familiar': 'bg-gray-900',
  'Hezrou': 'bg-purple-900',
  'Manes': 'bg-gray-700',
  'Marilith': 'bg-purple-800',
  'Nalfeshnee': 'bg-purple-900',
  'Quasit': 'bg-indigo-900',
  'Shadow Demon': 'bg-gray-900',
  'Vrock': 'bg-purple-800',
  'Yochlol': 'bg-violet-900',
  'Barbed Devil': 'bg-red-900',
  'Bearded Devil': 'bg-red-800',
  'Bone Devil': 'bg-gray-700',
  'Chain Devil': 'bg-gray-800',
  'Erinyes': 'bg-red-900',
  'Dao': 'bg-orange-900',
  'Horned Devil': 'bg-red-900',
  'Ice Devil': 'bg-blue-700',
  'Efreeti': 'bg-orange-800',
  'Imp': 'bg-red-800',
  'Marid': 'bg-blue-800',
  'Lemure': 'bg-gray-700',
  'Swarm of Lemures': 'bg-gray-700',
  'Pit Fiend': 'bg-red-900',
  'White Dragon': 'bg-blue-200',
  'Blob of Annihilation': 'bg-gray-900',
};

// D&D Player Character Races (heroes/adventurers)
// These are races that can be player characters and heroes in D&D
// Includes standard hero races (Human, Elf, Dwarf, etc.) and "sometimes heroes" 
// (Half-Orc, Tiefling, Drow, Yuan-ti) that can be heroes depending on campaign/setting
export const DND_PLAYER_RACES: Array<{ name: string; description: string }> = [
  { name: 'Human', description: 'A versatile and adaptable race, humans are the most common people in the world.' },
  { name: 'Elf', description: 'A graceful and long-lived race with pointed ears, known for their connection to magic and nature.' },
  { name: 'High Elf', description: 'A sophisticated elf with a natural talent for magic and keen intellect.' },
  { name: 'Wood Elf', description: 'A reclusive elf who lives in forests, known for stealth and survival skills.' },
  { name: 'Dark Elf (Drow)', description: 'A dark-skinned elf from the Underdark, often associated with magic and darkness.' },
  { name: 'Dwarf', description: 'A stout and hardy race known for their craftsmanship and love of stone and metal.' },
  { name: 'Mountain Dwarf', description: 'A tough dwarf from the mountains, known for strength and resilience.' },
  { name: 'Hill Dwarf', description: 'A wise dwarf from the hills, known for their toughness and connection to the earth.' },
  { name: 'Halfling', description: 'A small and cheerful race known for their luck and love of comfort.' },
  { name: 'Lightfoot Halfling', description: 'A nimble halfling known for stealth and the ability to hide easily.' },
  { name: 'Stout Halfling', description: 'A hardy halfling with resistance to poison and a strong constitution.' },
  { name: 'Dragonborn', description: 'A draconic race with scales and a breath weapon, descended from dragons.' },
  { name: 'Gnome', description: 'A small and curious race known for their inventiveness and magical nature.' },
  { name: 'Forest Gnome', description: 'A gnome with a natural ability to communicate with small animals and cast minor illusions.' },
  { name: 'Rock Gnome', description: 'A gnome with a talent for tinkering and creating mechanical devices.' },
  { name: 'Half-Elf', description: 'A person with both human and elven heritage, combining the best of both races.' },
  { name: 'Half-Orc', description: 'A person with both human and orc heritage, known for strength and ferocity.' },
  { name: 'Tiefling', description: 'A person with infernal heritage, often with horns, a tail, and resistance to fire.' },
  { name: 'Aasimar', description: 'A person with celestial heritage, touched by divine power and often with a radiant appearance.' },
  { name: 'Genasi', description: 'A person with elemental heritage, manifesting traits of air, earth, fire, or water.' },
  { name: 'Air Genasi', description: 'A genasi with air elemental heritage, able to levitate and control winds.' },
  { name: 'Earth Genasi', description: 'A genasi with earth elemental heritage, able to move through earth and stone.' },
  { name: 'Fire Genasi', description: 'A genasi with fire elemental heritage, resistant to fire and able to create flames.' },
  { name: 'Water Genasi', description: 'A genasi with water elemental heritage, able to breathe underwater and control water.' },
  { name: 'Goliath', description: 'A large and powerful race of mountain-dwelling people, known for their strength and endurance.' },
  { name: 'Firbolg', description: 'A gentle giant race with a deep connection to nature and the ability to become invisible.' },
  { name: 'Kenku', description: 'A bird-like race that can perfectly mimic sounds and voices they have heard.' },
  { name: 'Lizardfolk', description: 'A reptilian race with natural armor and the ability to hold their breath for long periods.' },
  { name: 'Tabaxi', description: 'A cat-like race known for their curiosity, agility, and climbing abilities.' },
  { name: 'Triton', description: 'An aquatic race from the depths of the ocean, able to breathe underwater and communicate with sea creatures.' },
  { name: 'Yuan-ti', description: 'A serpentine race with resistance to magic and the ability to cast spells.' },
  { name: 'Aarakocra', description: 'A bird-like race with wings, able to fly and known for their connection to the element of air.' },
  { name: 'Tortle', description: 'A turtle-like race with a natural shell for protection and a connection to water.' },
  { name: 'Changeling', description: 'A shapeshifting race able to alter their appearance at will.' },
  { name: 'Kalashtar', description: 'A race with a connection to the plane of dreams, able to communicate telepathically.' },
  { name: 'Shifter', description: 'A race with lycanthropic heritage, able to partially transform into a beast.' },
  { name: 'Warforged', description: 'A constructed race of living machines, created for war but now seeking their own purpose.' },
  { name: 'Githyanki', description: 'A psionic race from the Astral Plane, known for their martial prowess and red dragon mounts.' },
  { name: 'Githzerai', description: 'A psionic race from Limbo, known for their mental discipline and monastic traditions.' },
];

// Note: Goblins, Orcs, Kobolds, Bugbears, and Hobgoblins are typically monster races
// and are already included in FALLBACK_MONSTERS. They are not included here as player races.

/**
 * Randomly selects a D&D player character race (for heroes/adventurers)
 */
export function getRandomRace(): { name: string; description: string } {
  return DND_PLAYER_RACES[Math.floor(Math.random() * DND_PLAYER_RACES.length)];
}

// Card setting configurations for different genres
export const CARD_SETTINGS: Record<string, SettingConfig> = {
  medieval: {
    name: 'Medieval Fantasy',
    description: 'Classic medieval high-fantasy setting with castles, magic, and ancient ruins',
    settingPhrase: 'medieval high-fantasy',
    backgroundPhrase: 'medieval high-fantasy setting with atmospheric background, ancient ruins, mystical lighting',
    technologyLevel: 'no modern objects or technology',
  },
  futuristic: {
    name: 'Futuristic Sci-Fi',
    description: 'Advanced futuristic setting with starships, advanced technology, and space stations',
    settingPhrase: 'futuristic sci-fi',
    backgroundPhrase: 'futuristic sci-fi setting with advanced technology, starships, space stations, and alien landscapes',
    technologyLevel: 'advanced technology, holographic displays, energy weapons',
  },
  modern: {
    name: 'Modern Day',
    description: 'Contemporary setting with modern cities, technology, and everyday life',
    settingPhrase: 'modern contemporary',
    backgroundPhrase: 'modern contemporary setting with urban environments, modern architecture, and cityscapes',
    technologyLevel: 'modern technology, smartphones, vehicles, contemporary objects',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    description: 'High-tech, low-life setting with neon cities, cybernetics, and corporate dystopia',
    settingPhrase: 'cyberpunk',
    backgroundPhrase: 'cyberpunk setting with neon-lit cities, towering megacorporations, and dark urban landscapes',
    technologyLevel: 'advanced cybernetics, neural interfaces, holographic technology',
  },
  steampunk: {
    name: 'Steampunk',
    description: 'Victorian-era setting with steam-powered technology, brass gears, and airships',
    settingPhrase: 'steampunk',
    backgroundPhrase: 'steampunk setting with Victorian architecture, steam-powered machinery, and brass gears',
    technologyLevel: 'steam-powered technology, mechanical devices, clockwork mechanisms',
  },
  'post-apocalyptic': {
    name: 'Post-Apocalyptic',
    description: 'Wasteland setting after a major disaster, with ruins, scavenging, and survival',
    settingPhrase: 'post-apocalyptic wasteland',
    backgroundPhrase: 'post-apocalyptic wasteland setting with ruins, desolate landscapes, and remnants of civilization',
    technologyLevel: 'scavenged technology, makeshift weapons, broken machinery',
  },
  fantasy: {
    name: 'High Fantasy',
    description: 'General fantasy setting with magic, mythical creatures, and enchanted realms',
    settingPhrase: 'high-fantasy',
    backgroundPhrase: 'high-fantasy setting with magical landscapes, enchanted forests, and mystical realms',
    technologyLevel: 'magical technology, enchanted objects, no modern technology',
  },
  'sci-fi': {
    name: 'Science Fiction',
    description: 'General sci-fi setting with space exploration, alien worlds, and advanced science',
    settingPhrase: 'sci-fi',
    backgroundPhrase: 'sci-fi setting with alien planets, space stations, and advanced technological environments',
    technologyLevel: 'advanced science, space technology, alien artifacts',
  },
};

export const DEFAULT_SETTING: string = 'medieval';