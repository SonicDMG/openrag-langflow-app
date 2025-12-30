# Dynamic Character Stat Generation System

## Overview

The character stat generation system now uses **dynamic, context-aware stat ranges** that adapt based on the character's description. This ensures that a tiny fairy, a regular humanoid, and a massive spaceship all receive appropriate stats for their scale and capabilities.

## Key Features

### 1. **Flexible Guidelines, Not Hard Constraints**
- Stat ranges serve as **guidelines** for the AI, not absolute limits
- AI can exceed ranges when special abilities, magical enhancements, or unique circumstances warrant it
- Example: A tiny fairy with a "protection sphere" can have much higher AC than typical tiny creatures

### 2. **Entity Scale Detection**
The system automatically detects entity scale from description keywords:

| Scale | HP Range | AC Range | Attack Bonus | Examples |
|-------|----------|----------|--------------|----------|
| **Tiny** | 5-15 | 15-20 | 2-4 | Fairies, pixies, sprites, insects, mice |
| **Small** | 10-25 | 13-17 | 2-5 | Goblins, kobolds, halflings, gnomes |
| **Medium** | 20-40 | 12-18 | 3-6 | Humans, elves, dwarves, orcs |
| **Large** | 50-100 | 13-17 | 4-8 | Ogres, trolls, bears, lions, horses |
| **Huge** | 100-200 | 14-19 | 6-10 | Giants, young dragons, elephants |
| **Gargantuan** | 200-400 | 16-22 | 8-12 | Ancient dragons, krakens, titans |
| **Vehicle/Construct** | 150-500 | 16-24 | 5-10 | Spaceships, war machines, mechs, golems |
| **Swarm** | 30-60 | 10-14 | 3-6 | Swarms of rats, bees, insects |
| **Ethereal/Spirit** | 20-50 | 10-16 | 3-7 | Ghosts, wraiths, shadows, phantoms |

### 3. **Keyword Detection**
The system scans descriptions for keywords to determine scale:

```typescript
// Example keywords by category
tiny: ['tiny', 'pixie', 'fairy', 'sprite', 'insect', 'miniature']
small: ['small', 'goblin', 'kobold', 'halfling', 'gnome', 'child']
large: ['large', 'ogre', 'troll', 'bear', 'lion', 'horse']
huge: ['huge', 'giant', 'dragon', 'elephant', 'massive']
gargantuan: ['gargantuan', 'ancient dragon', 'kraken', 'titan', 'colossal']
vehicle: ['spaceship', 'ship', 'vehicle', 'tank', 'mech', 'war machine']
swarm: ['swarm', 'horde', 'colony', 'pack', 'flock']
ethereal: ['ghost', 'wraith', 'spirit', 'phantom', 'ethereal']
```

### 4. **Priority System**
When multiple keywords are detected, the system prioritizes more specific/powerful categories:
1. Gargantuan
2. Vehicle/Construct
3. Huge
4. Large
5. Ethereal/Spirit
6. Swarm
7. Small
8. Tiny

### 5. **Intelligent Fallbacks**
- **Heroes**: Default to "Medium" scale if no keywords detected
- **Monsters**: Default to "Large" scale if no keywords detected
- Fallback stats use the midpoint of the detected scale's range

## Usage Examples

### Example 1: Regular Humanoid
**Description:** "A skilled human warrior with a sword and shield"
- **Detected Scale:** Medium
- **Suggested HP:** 20-40
- **Suggested AC:** 12-18
- **Result:** Standard humanoid stats

### Example 2: Huge Spaceship
**Description:** "A massive spaceship with advanced shields and weapons"
- **Detected Scale:** Vehicle/Construct
- **Suggested HP:** 150-500
- **Suggested AC:** 16-24
- **Result:** Appropriately scaled for a large vehicle

### Example 3: Tiny Fairy with Special Ability
**Description:** "A tiny fairy protected by a magical sphere of force"
- **Detected Scale:** Tiny
- **Suggested HP:** 5-15
- **Suggested AC:** 15-20
- **AI Flexibility:** Can exceed AC range due to "magical sphere of force"
- **Possible Result:** HP: 8, AC: 22 (higher than typical due to protection)

### Example 4: Ancient Dragon
**Description:** "An ancient red dragon with scales like armor"
- **Detected Scale:** Gargantuan (from "ancient dragon")
- **Suggested HP:** 200-400
- **Suggested AC:** 16-22
- **Result:** Appropriately powerful stats for an ancient dragon

### Example 5: Swarm of Rats
**Description:** "A swarm of diseased rats moving as one"
- **Detected Scale:** Swarm
- **Suggested HP:** 30-60
- **Suggested AC:** 10-14
- **Result:** Moderate HP (many rats), lower AC (hard to defend as a group)

## AI Prompt Integration

The system provides context to the AI:

```
IMPORTANT: This character appears to be in the "Vehicle/Construct" category 
(Vehicles, constructs, or machines like spaceships, war machines, mechs, or golems).

GUIDELINES (not strict limits):
- The suggested ranges are guidelines based on the entity's apparent scale
- Feel free to exceed these ranges if the description mentions special abilities, 
  magical enhancements, or unique circumstances
- For example: a tiny fairy with a "protection sphere" could have much higher AC 
  than typical for tiny creatures
- A spaceship should have significantly more HP and AC than a humanoid
- Consider the full context of the description when determining appropriate stats
```

## Implementation Details

### Core Function: `analyzeEntityScale()`
```typescript
export function analyzeEntityScale(
  description: string, 
  characterType: 'hero' | 'monster'
): EntityScale
```

**Process:**
1. Convert description to lowercase
2. Scan for keywords in priority order
3. Return first matching scale category
4. Fall back to default if no matches found
5. Log detection for debugging

### Integration with `generateCharacterStats()`
1. Analyze entity scale from description
2. Pass dynamic ranges to AI prompt
3. Use scale-appropriate fallbacks if parsing fails
4. Maintain backward compatibility with existing characters

## Benefits

✅ **Contextually Appropriate Stats**: Spaceships get 200-500 HP, fairies get 5-15 HP  
✅ **Flexible for Special Cases**: AI can adjust for magical enhancements, special abilities  
✅ **Backward Compatible**: Existing humanoid characters work as before  
✅ **Extensible**: Easy to add new scale categories or keywords  
✅ **Intelligent Defaults**: Sensible fallbacks when scale can't be determined  
✅ **Transparent**: Logs detection for debugging and verification  

## Future Enhancements

Potential improvements:
- Add more specialized categories (e.g., "Undead", "Elemental", "Plant")
- Support for multi-scale entities (e.g., "giant swarm")
- Machine learning-based scale detection
- User override option for manual scale selection
- Scale-specific ability generation

## Testing Recommendations

Test with diverse character types:
- ✅ Regular humanoids (human, elf, dwarf)
- ✅ Tiny creatures (fairy, pixie, sprite)
- ✅ Large creatures (ogre, troll, bear)
- ✅ Huge creatures (giant, dragon)
- ✅ Vehicles (spaceship, mech, war machine)
- ✅ Special cases (fairy with protection, armored goblin)
- ✅ Swarms (rats, bees, insects)
- ✅ Ethereal beings (ghost, wraith, spirit)

## Troubleshooting

**Issue:** Character gets wrong scale  
**Solution:** Add more specific keywords to description or add new keywords to `SCALE_KEYWORDS`

**Issue:** Stats seem too low/high  
**Solution:** Check if description mentions special abilities that should adjust stats

**Issue:** No scale detected  
**Solution:** System will use sensible defaults (Medium for heroes, Large for monsters)