import { DnDClass, Ability } from './types';

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

// Default fallback classes in case OpenRAG fetch fails
// Note: abilities are included by default and will be randomly selected on each run
export const FALLBACK_CLASSES: DnDClass[] = [
  {
    name: 'Fighter',
    hitPoints: 30,
    maxHitPoints: 30,
    armorClass: 18,
    attackBonus: 5,
    damageDie: 'd10',
    meleeDamageDie: 'd10', // Longsword, greatsword, or other melee weapon
    rangedDamageDie: 'd8', // Longbow or crossbow
    abilities: FALLBACK_ABILITIES['Fighter'] || [],
    description: 'A master of weapons and armor, the Fighter excels in combat.',
    color: 'bg-red-900',
  },
  {
    name: 'Wizard',
    hitPoints: 20,
    maxHitPoints: 20,
    armorClass: 12,
    attackBonus: 3,
    damageDie: 'd6',
    meleeDamageDie: 'd6', // Staff or dagger
    abilities: FALLBACK_ABILITIES['Wizard'] || [],
    description: 'A wielder of arcane magic, the Wizard commands powerful spells.',
    color: 'bg-blue-900',
  },
  {
    name: 'Rogue',
    hitPoints: 24,
    maxHitPoints: 24,
    armorClass: 15,
    attackBonus: 4,
    damageDie: 'd8',
    meleeDamageDie: 'd8', // Rapier or shortsword
    rangedDamageDie: 'd6', // Shortbow or dagger
    abilities: FALLBACK_ABILITIES['Rogue'] || [],
    description: 'A stealthy combatant who strikes from the shadows.',
    color: 'bg-purple-900',
  },
  {
    name: 'Cleric',
    hitPoints: 26,
    maxHitPoints: 26,
    armorClass: 16,
    attackBonus: 4,
    damageDie: 'd8',
    meleeDamageDie: 'd8', // Mace or warhammer
    abilities: FALLBACK_ABILITIES['Cleric'] || [],
    description: 'A holy warrior who channels divine power.',
    color: 'bg-yellow-900',
  },
  {
    name: 'Barbarian',
    hitPoints: 35,
    maxHitPoints: 35,
    armorClass: 14,
    attackBonus: 5,
    damageDie: 'd12',
    meleeDamageDie: 'd12', // Greataxe or greatsword
    rangedDamageDie: 'd6', // Javelin or handaxe
    abilities: FALLBACK_ABILITIES['Barbarian'] || [],
    description: 'A fierce warrior who fights with primal fury.',
    color: 'bg-orange-900',
  },
  {
    name: 'Ranger',
    hitPoints: 28,
    maxHitPoints: 28,
    armorClass: 15,
    attackBonus: 4,
    damageDie: 'd10',
    meleeDamageDie: 'd8', // Longsword or scimitar
    rangedDamageDie: 'd8', // Longbow
    abilities: FALLBACK_ABILITIES['Ranger'] || [],
    description: 'A skilled tracker and archer of the wilderness.',
    color: 'bg-green-900',
  },
  {
    name: 'Paladin',
    hitPoints: 30,
    maxHitPoints: 30,
    armorClass: 18,
    attackBonus: 5,
    damageDie: 'd10',
    meleeDamageDie: 'd10', // Longsword or greatsword
    rangedDamageDie: 'd8', // Javelin or crossbow
    abilities: FALLBACK_ABILITIES['Paladin'] || [],
    description: 'A holy warrior who smites evil with divine power.',
    color: 'bg-pink-900',
  },
  {
    name: 'Bard',
    hitPoints: 24,
    maxHitPoints: 24,
    armorClass: 14,
    attackBonus: 4,
    damageDie: 'd8',
    meleeDamageDie: 'd8', // Rapier
    rangedDamageDie: 'd6', // Shortbow or crossbow
    abilities: FALLBACK_ABILITIES['Bard'] || [],
    description: 'A versatile performer who uses music and magic.',
    color: 'bg-indigo-900',
  },
  {
    name: 'Sorcerer',
    hitPoints: 20,
    maxHitPoints: 20,
    armorClass: 13,
    attackBonus: 3,
    damageDie: 'd6',
    meleeDamageDie: 'd6', // Staff or dagger
    abilities: FALLBACK_ABILITIES['Sorcerer'] || [],
    description: 'A spellcaster with innate magical power.',
    color: 'bg-cyan-900',
  },
  {
    name: 'Warlock',
    hitPoints: 22,
    maxHitPoints: 22,
    armorClass: 13,
    attackBonus: 4,
    damageDie: 'd8',
    meleeDamageDie: 'd8', // Simple weapons
    abilities: FALLBACK_ABILITIES['Warlock'] || [],
    description: 'A spellcaster who made a pact with otherworldly beings.',
    color: 'bg-violet-900',
  },
  {
    name: 'Monk',
    hitPoints: 26,
    maxHitPoints: 26,
    armorClass: 16,
    attackBonus: 4,
    damageDie: 'd8',
    meleeDamageDie: 'd8', // Unarmed strikes or quarterstaff
    rangedDamageDie: 'd6', // Dart or shortbow
    abilities: FALLBACK_ABILITIES['Monk'] || [],
    description: 'A master of martial arts and ki energy.',
    color: 'bg-amber-900',
  },
  {
    name: 'Druid',
    hitPoints: 24,
    maxHitPoints: 24,
    armorClass: 15,
    attackBonus: 4,
    damageDie: 'd8',
    meleeDamageDie: 'd8', // Scimitar or staff
    rangedDamageDie: 'd6', // Sling
    abilities: FALLBACK_ABILITIES['Druid'] || [],
    description: 'A guardian of nature who wields primal magic.',
    color: 'bg-emerald-900',
  },
  {
    name: 'Artificer',
    hitPoints: 24,
    maxHitPoints: 24,
    armorClass: 17,
    attackBonus: 4,
    damageDie: 'd8',
    meleeDamageDie: 'd8', // Simple or martial weapons
    rangedDamageDie: 'd8', // Crossbow or firearm
    abilities: FALLBACK_ABILITIES['Artificer'] || [],
    description: 'A master of magical invention and technology.',
    color: 'bg-teal-900',
  },
];

/**
 * Helper function to check if a class name is a monster
 */
export function isMonster(className: string): boolean {
  return FALLBACK_MONSTERS.some(monster => monster.name === className);
}

/**
 * Helper function to get all class names (player classes only)
 */
export function getPlayerClassNames(): string[] {
  return FALLBACK_CLASSES.map(cls => cls.name);
}

// Default fallback monsters with pre-configured stats
// Note: abilities are included by default and will be randomly selected on each run
export const FALLBACK_MONSTERS: DnDClass[] = [
  { name: 'Goblin', hitPoints: 7, maxHitPoints: 7, armorClass: 15, attackBonus: 2, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Goblin'] || [], description: 'A small, green humanoid with pointed ears.', color: 'bg-green-800' },
  { name: 'Orc', hitPoints: 15, maxHitPoints: 15, armorClass: 13, attackBonus: 3, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Orc'] || [], description: 'A brutish humanoid with gray-green skin.', color: 'bg-gray-800' },
  { name: 'Dragon', hitPoints: 200, maxHitPoints: 200, armorClass: 19, attackBonus: 8, damageDie: 'd12', abilities: FALLBACK_MONSTER_ABILITIES['Dragon'] || [], description: 'A massive, powerful reptilian creature.', color: 'bg-red-800' },
  { name: 'Troll', hitPoints: 84, maxHitPoints: 84, armorClass: 15, attackBonus: 5, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Troll'] || [], description: 'A large, regenerating humanoid with green skin.', color: 'bg-green-700' },
  { name: 'Ogre', hitPoints: 59, maxHitPoints: 59, armorClass: 11, attackBonus: 5, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Ogre'] || [], description: 'A large, brutish giant.', color: 'bg-gray-700' },
  { name: 'Kobold', hitPoints: 5, maxHitPoints: 5, armorClass: 12, attackBonus: 2, damageDie: 'd4', abilities: FALLBACK_MONSTER_ABILITIES['Kobold'] || [], description: 'A small, reptilian humanoid.', color: 'bg-yellow-800' },
  { name: 'Skeleton', hitPoints: 13, maxHitPoints: 13, armorClass: 13, attackBonus: 2, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Skeleton'] || [], description: 'An animated skeleton warrior.', color: 'bg-gray-600' },
  { name: 'Zombie', hitPoints: 22, maxHitPoints: 22, armorClass: 8, attackBonus: 1, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Zombie'] || [], description: 'A shambling undead creature.', color: 'bg-green-600' },
  { name: 'Vampire', hitPoints: 144, maxHitPoints: 144, armorClass: 16, attackBonus: 6, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Vampire'] || [], description: 'An undead creature that feeds on blood.', color: 'bg-red-900' },
  { name: 'Werewolf', hitPoints: 58, maxHitPoints: 58, armorClass: 11, attackBonus: 4, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Werewolf'] || [], description: 'A humanoid that transforms into a wolf.', color: 'bg-gray-800' },
  { name: 'Demon', hitPoints: 200, maxHitPoints: 200, armorClass: 19, attackBonus: 8, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Demon'] || [], description: 'A powerful fiend from the Abyss.', color: 'bg-purple-900' },
  { name: 'Devil', hitPoints: 200, maxHitPoints: 200, armorClass: 19, attackBonus: 8, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Devil'] || [], description: 'A powerful fiend from the Nine Hells.', color: 'bg-red-900' },
  { name: 'Beholder', hitPoints: 180, maxHitPoints: 180, armorClass: 18, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Beholder'] || [], description: 'A floating eye with many magical abilities.', color: 'bg-purple-800' },
  { name: 'Mind Flayer', hitPoints: 71, maxHitPoints: 71, armorClass: 15, attackBonus: 5, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Mind Flayer'] || [], description: 'A psionic humanoid with tentacles on its face.', color: 'bg-indigo-900' },
  { name: 'Lich', hitPoints: 135, maxHitPoints: 135, armorClass: 17, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Lich'] || [], description: 'An undead spellcaster of great power.', color: 'bg-gray-800' },
  { name: 'Giant', hitPoints: 126, maxHitPoints: 126, armorClass: 13, attackBonus: 6, damageDie: 'd12', abilities: FALLBACK_MONSTER_ABILITIES['Giant'] || [], description: 'A massive humanoid creature.', color: 'bg-orange-800' },
  { name: 'Elemental', hitPoints: 90, maxHitPoints: 90, armorClass: 14, attackBonus: 5, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Elemental'] || [], description: 'A creature of pure elemental energy.', color: 'bg-blue-800' },
  { name: 'Undead', hitPoints: 45, maxHitPoints: 45, armorClass: 12, attackBonus: 3, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Undead'] || [], description: 'A generic undead creature.', color: 'bg-gray-700' },
  { name: 'Beast', hitPoints: 34, maxHitPoints: 34, armorClass: 13, attackBonus: 4, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Beast'] || [], description: 'A wild animal or magical beast.', color: 'bg-amber-800' },
  { name: 'Aberration', hitPoints: 68, maxHitPoints: 68, armorClass: 15, attackBonus: 5, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Aberration'] || [], description: 'An alien creature from beyond reality.', color: 'bg-violet-900' },
  { name: 'Allosaurus', hitPoints: 51, maxHitPoints: 51, armorClass: 13, attackBonus: 5, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Allosaurus'] || [], description: 'A large carnivorous dinosaur.', color: 'bg-green-700' },
  { name: 'Anklyosaurus', hitPoints: 68, maxHitPoints: 68, armorClass: 15, attackBonus: 4, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Anklyosaurus'] || [], description: 'An armored herbivorous dinosaur.', color: 'bg-amber-700' },
  { name: 'Bugbear Stalker', hitPoints: 27, maxHitPoints: 27, armorClass: 14, attackBonus: 3, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Bugbear Stalker'] || [], description: 'A large, stealthy goblinoid.', color: 'bg-gray-800' },
  { name: 'Goblin Boss', hitPoints: 21, maxHitPoints: 21, armorClass: 17, attackBonus: 3, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Goblin Boss'] || [], description: 'A goblin leader with better equipment.', color: 'bg-green-900' },
  { name: 'Goblin Minion', hitPoints: 7, maxHitPoints: 7, armorClass: 15, attackBonus: 2, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Goblin Minion'] || [], description: 'A weak goblin follower.', color: 'bg-green-800' },
  { name: 'Hobgoblin Captain', hitPoints: 39, maxHitPoints: 39, armorClass: 17, attackBonus: 4, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Hobgoblin Captain'] || [], description: 'A disciplined goblinoid military leader.', color: 'bg-orange-800' },
  { name: 'Pirate', hitPoints: 11, maxHitPoints: 11, armorClass: 12, attackBonus: 2, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Pirate'] || [], description: 'A seafaring bandit.', color: 'bg-amber-800' },
  { name: 'Pirate Captain', hitPoints: 52, maxHitPoints: 52, armorClass: 15, attackBonus: 5, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Pirate Captain'] || [], description: 'A skilled pirate leader.', color: 'bg-amber-900' },
  { name: 'Pteradon', hitPoints: 13, maxHitPoints: 13, armorClass: 13, attackBonus: 3, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Pteradon'] || [], description: 'A flying reptile with wings.', color: 'bg-gray-600' },
  { name: 'Sphinx of Wonder', hitPoints: 136, maxHitPoints: 136, armorClass: 17, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Sphinx of Wonder'] || [], description: 'A magical creature with a lion body and human head.', color: 'bg-yellow-800' },
  { name: 'Swarm of Crawling Claws', hitPoints: 36, maxHitPoints: 36, armorClass: 12, attackBonus: 3, damageDie: 'd4', abilities: FALLBACK_MONSTER_ABILITIES['Swarm of Crawling Claws'] || [], description: 'A swarm of animated severed hands.', color: 'bg-gray-700' },
  { name: 'Tough Boss', hitPoints: 100, maxHitPoints: 100, armorClass: 18, attackBonus: 7, damageDie: 'd12', abilities: FALLBACK_MONSTER_ABILITIES['Tough Boss'] || [], description: 'A powerful boss monster.', color: 'bg-red-900' },
  { name: 'Troll Limb', hitPoints: 21, maxHitPoints: 21, armorClass: 13, attackBonus: 3, damageDie: 'd6', abilities: FALLBACK_MONSTER_ABILITIES['Troll Limb'] || [], description: 'A regenerating troll body part.', color: 'bg-green-700' },
  { name: 'Vampire Familiar', hitPoints: 10, maxHitPoints: 10, armorClass: 12, attackBonus: 2, damageDie: 'd4', abilities: FALLBACK_MONSTER_ABILITIES['Vampire Familiar'] || [], description: 'A small creature serving a vampire.', color: 'bg-gray-900' },
  { name: 'Hezrou', hitPoints: 136, maxHitPoints: 136, armorClass: 16, attackBonus: 6, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Hezrou'] || [], description: 'A large, toad-like demon.', color: 'bg-purple-900' },
  { name: 'Manes', hitPoints: 9, maxHitPoints: 9, armorClass: 9, attackBonus: 1, damageDie: 'd4', abilities: FALLBACK_MONSTER_ABILITIES['Manes'] || [], description: 'A weak, mindless demon.', color: 'bg-gray-700' },
  { name: 'Marilith', hitPoints: 189, maxHitPoints: 189, armorClass: 18, attackBonus: 8, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Marilith'] || [], description: 'A six-armed snake-bodied demon.', color: 'bg-purple-800' },
  { name: 'Nalfeshnee', hitPoints: 184, maxHitPoints: 184, armorClass: 18, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Nalfeshnee'] || [], description: 'A large, boar-like demon.', color: 'bg-purple-900' },
  { name: 'Quasit', hitPoints: 7, maxHitPoints: 7, armorClass: 13, attackBonus: 2, damageDie: 'd4', abilities: FALLBACK_MONSTER_ABILITIES['Quasit'] || [], description: 'A small, mischievous demon.', color: 'bg-indigo-900' },
  { name: 'Shadow Demon', hitPoints: 66, maxHitPoints: 66, armorClass: 13, attackBonus: 5, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Shadow Demon'] || [], description: 'A demon made of shadow.', color: 'bg-gray-900' },
  { name: 'Vrock', hitPoints: 104, maxHitPoints: 104, armorClass: 15, attackBonus: 6, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Vrock'] || [], description: 'A vulture-like demon with wings.', color: 'bg-purple-800' },
  { name: 'Yochlol', hitPoints: 136, maxHitPoints: 136, armorClass: 15, attackBonus: 6, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Yochlol'] || [], description: 'A spider-like demon servant.', color: 'bg-violet-900' },
  { name: 'Barbed Devil', hitPoints: 110, maxHitPoints: 110, armorClass: 15, attackBonus: 6, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Barbed Devil'] || [], description: 'A devil covered in sharp barbs.', color: 'bg-red-900' },
  { name: 'Bearded Devil', hitPoints: 52, maxHitPoints: 52, armorClass: 13, attackBonus: 4, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Bearded Devil'] || [], description: 'A devil with a long beard of tentacles.', color: 'bg-red-800' },
  { name: 'Bone Devil', hitPoints: 142, maxHitPoints: 142, armorClass: 19, attackBonus: 6, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Bone Devil'] || [], description: 'A skeletal devil with sharp claws.', color: 'bg-gray-700' },
  { name: 'Chain Devil', hitPoints: 85, maxHitPoints: 85, armorClass: 16, attackBonus: 5, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Chain Devil'] || [], description: 'A devil wrapped in chains.', color: 'bg-gray-800' },
  { name: 'Erinyes', hitPoints: 153, maxHitPoints: 153, armorClass: 18, attackBonus: 7, damageDie: 'd8', abilities: FALLBACK_MONSTER_ABILITIES['Erinyes'] || [], description: 'A winged female devil with a bow.', color: 'bg-red-900' },
  { name: 'Dao', hitPoints: 187, maxHitPoints: 187, armorClass: 18, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Dao'] || [], description: 'An earth genie with rocky skin.', color: 'bg-orange-900' },
  { name: 'Horned Devil', hitPoints: 178, maxHitPoints: 178, armorClass: 18, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Horned Devil'] || [], description: 'A powerful devil with large horns.', color: 'bg-red-900' },
  { name: 'Ice Devil', hitPoints: 180, maxHitPoints: 180, armorClass: 18, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Ice Devil'] || [], description: 'A blue-white devil of ice and cold.', color: 'bg-blue-700' },
  { name: 'Efreeti', hitPoints: 200, maxHitPoints: 200, armorClass: 17, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Efreeti'] || [], description: 'A fire genie from the Elemental Plane of Fire.', color: 'bg-orange-800' },
  { name: 'Imp', hitPoints: 10, maxHitPoints: 10, armorClass: 13, attackBonus: 2, damageDie: 'd4', abilities: FALLBACK_MONSTER_ABILITIES['Imp'] || [], description: 'A small, weak devil.', color: 'bg-red-800' },
  { name: 'Marid', hitPoints: 229, maxHitPoints: 229, armorClass: 17, attackBonus: 7, damageDie: 'd10', abilities: FALLBACK_MONSTER_ABILITIES['Marid'] || [], description: 'A water genie from the Elemental Plane of Water.', color: 'bg-blue-800' },
  { name: 'Lemure', hitPoints: 13, maxHitPoints: 13, armorClass: 7, attackBonus: 1, damageDie: 'd4', abilities: FALLBACK_MONSTER_ABILITIES['Lemure'] || [], description: 'A mindless, blob-like devil.', color: 'bg-gray-700' },
  { name: 'Swarm of Lemures', hitPoints: 45, maxHitPoints: 45, armorClass: 9, attackBonus: 2, damageDie: 'd4', abilities: FALLBACK_MONSTER_ABILITIES['Swarm of Lemures'] || [], description: 'A swarm of mindless devils.', color: 'bg-gray-700' },
  { name: 'Pit Fiend', hitPoints: 300, maxHitPoints: 300, armorClass: 19, attackBonus: 9, damageDie: 'd12', abilities: FALLBACK_MONSTER_ABILITIES['Pit Fiend'] || [], description: 'The most powerful type of devil.', color: 'bg-red-900' },
  { name: 'White Dragon', hitPoints: 200, maxHitPoints: 200, armorClass: 18, attackBonus: 8, damageDie: 'd12', abilities: FALLBACK_MONSTER_ABILITIES['White Dragon'] || [], description: 'A powerful ice dragon.', color: 'bg-blue-200' },
  { name: 'Blob of Annihilation', hitPoints: 400, maxHitPoints: 400, armorClass: 20, attackBonus: 10, damageDie: 'd12', abilities: FALLBACK_MONSTER_ABILITIES['Blob of Annihilation'] || [], description: 'A formless entity of pure destruction.', color: 'bg-gray-900' },
];

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