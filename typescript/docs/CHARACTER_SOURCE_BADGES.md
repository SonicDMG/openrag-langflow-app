# Character Source Badge System

## Overview

The Battle Arena application now includes a visual badge system to indicate the source/origin of characters (heroes and monsters). This helps users understand whether a character came from default data, was AI-generated, or was loaded from the OpenRAG knowledge base.

## Badge Types

### 1. OPENRAG Badge (Highest Priority)
- **Color**: Purple (`bg-purple-600`)
- **Text**: "OPENRAG"
- **Indicates**: Character was loaded from the OpenRAG knowledge base
- **Flag**: `fromOpenRAG: true`

### 2. DEFAULT Badge (Medium Priority)
- **Color**: Blue (`bg-blue-600`)
- **Text**: "DEFAULT"
- **Indicates**: Character was loaded from default JSON files
- **Flags**: `isDefault: true` OR `_id` starts with "fallback-"

### 3. GENERATED Badge (Lowest Priority)
- **Color**: Green (`bg-green-600`)
- **Text**: "GENERATED"
- **Indicates**: Character was created using the Monster Creator with AI-generated abilities
- **Flag**: Has `monsterId` property (reference to generated image)

## Priority Order

The badge system uses a priority hierarchy to determine which badge to display when multiple conditions are met:

```
OPENRAG > DEFAULT > GENERATED
```

This means:
- If a character has `fromOpenRAG: true`, it will always show the OPENRAG badge
- If a character has `isDefault: true` but not `fromOpenRAG`, it shows DEFAULT badge
- If a character has `monsterId` but neither of the above flags, it shows GENERATED badge
- If none of the conditions are met, no badge is displayed

## Implementation

### Core Files

#### 1. `typescript/app/battle-arena/utils/characterSource.ts`
Contains the badge detection logic:

```typescript
export type CharacterSource = 'openrag' | 'default' | 'generated' | null;

export function getCharacterSource(character: Character): CharacterSource {
  // Priority 1: OpenRAG (highest)
  if ((character as any).fromOpenRAG === true) {
    return 'openrag';
  }
  
  // Priority 2: Default
  if (character._id?.startsWith('fallback-') || character.isDefault === true) {
    return 'default';
  }
  
  // Priority 3: Generated (lowest)
  if ((character as any).monsterId) {
    return 'generated';
  }
  
  return null;
}
```

#### 2. `typescript/app/battle-arena/types.ts`
Updated Character interface to include:

```typescript
export interface Character {
  // ... existing fields ...
  fromOpenRAG?: boolean; // Flag for OpenRAG-sourced characters
  isDefault?: boolean;   // Flag for default characters
  monsterId?: string;    // Reference to generated image
}
```

#### 3. `typescript/app/battle-arena/components/card-parts/CardHeader.tsx`
Renders the compact badge based on character source:

```typescript
const source = getCharacterSource(character);
const badges = {
  openrag: { bg: 'bg-purple-600', text: 'OPENRAG' },
  default: { bg: 'bg-blue-600', text: 'DEFAULT' },
  generated: { bg: 'bg-green-600', text: 'GENERATED' },
};
```

### Database Persistence

The database layer (`typescript/lib/db/astra.ts`) preserves all source flags:

- **HeroRecord/MonsterRecord types**: Include `fromOpenRAG` and `isDefault` fields
- **classToHeroRecord()**: Preserves `fromOpenRAG` flag when saving
- **heroRecordToClass()**: Restores `fromOpenRAG` flag when loading
- **upsertHero()**: Maintains flags through update operations

### Character Editor

The unified character creator (`typescript/app/battle-arena/unified-character-creator/page.tsx`) preserves source flags through edits:

```typescript
// Capture source flags when loading character for edit
const [sourceFlags, setSourceFlags] = useState<{
  fromOpenRAG?: boolean;
  isDefault?: boolean;
}>({});

useEffect(() => {
  if (editingCharacter) {
    setSourceFlags({
      fromOpenRAG: (editingCharacter as any).fromOpenRAG,
      isDefault: editingCharacter.isDefault,
    });
  }
}, [editingCharacter]);

// Include source flags when saving
const savedCharacter = {
  ...characterData,
  ...sourceFlags, // Preserve original source flags
};
```

## Visual Design

### Badge Styling
- **Size**: Compact (8px font size)
- **Position**: Top-right corner of character card
- **Padding**: Minimal (px-1.5 py-0.5)
- **Border Radius**: Rounded (rounded)
- **Text**: White, uppercase, bold
- **Shadow**: Subtle drop shadow for depth

### Example
```tsx
<div className="absolute top-2 right-2 bg-purple-600 text-white text-[8px] 
                font-bold px-1.5 py-0.5 rounded shadow-md uppercase z-10">
  OPENRAG
</div>
```

## Usage Scenarios

### Scenario 1: Loading from OpenRAG
When a character is loaded from OpenRAG knowledge base:
1. Character is fetched with abilities and stats
2. `fromOpenRAG: true` flag is set
3. Character is saved to database with flag preserved
4. Badge displays "OPENRAG" in purple
5. **Even after editing**, the OPENRAG badge persists

### Scenario 2: Loading Default Characters
When default heroes/monsters are loaded:
1. Characters are loaded from JSON files
2. `isDefault: true` flag is set
3. Characters are saved to database
4. Badge displays "DEFAULT" in blue

### Scenario 3: Creating with Monster Creator
When a new character is created:
1. User generates character with AI abilities
2. Image is created and stored with `monsterId`
3. Character has `monsterId` reference
4. Badge displays "GENERATED" in green

### Scenario 4: Manual Creation
When a character is created manually without AI:
1. No special flags are set
2. No `monsterId` reference
3. No badge is displayed

## Testing

To verify the badge system:

1. **OpenRAG Badge**:
   - Load a character from OpenRAG
   - Verify purple "OPENRAG" badge appears
   - Edit the character and save
   - Verify badge remains "OPENRAG" (not "GENERATED")

2. **Default Badge**:
   - Load default heroes/monsters
   - Verify blue "DEFAULT" badge appears
   - Check that fallback characters also show DEFAULT

3. **Generated Badge**:
   - Create a new character with Monster Creator
   - Verify green "GENERATED" badge appears
   - Ensure it doesn't override OPENRAG or DEFAULT badges

4. **Priority Order**:
   - Create a character with multiple flags
   - Verify highest priority badge is displayed

## Troubleshooting

### Badge Not Showing
- Check that character has appropriate flags set
- Verify `getCharacterSource()` is being called
- Check console for any errors in CardHeader component

### Wrong Badge Displayed
- Verify flag values in character object
- Check priority order in `getCharacterSource()`
- Ensure database is preserving flags correctly

### Badge Lost After Edit
- Verify unified-character-creator preserves `sourceFlags`
- Check that `handleSave` includes source flags
- Confirm database upsert maintains flags

## Future Enhancements

Potential improvements to consider:

1. **Tooltip on Hover**: Show detailed source information
2. **Badge Customization**: Allow users to customize badge colors
3. **Multiple Badges**: Display multiple badges for hybrid sources
4. **Source History**: Track character modification history
5. **Filter by Source**: Add filtering options in character selection

## Related Files

- `typescript/app/battle-arena/utils/characterSource.ts` - Badge detection logic
- `typescript/app/battle-arena/types.ts` - Type definitions
- `typescript/app/battle-arena/components/card-parts/CardHeader.tsx` - Badge rendering
- `typescript/lib/db/astra.ts` - Database persistence
- `typescript/app/battle-arena/unified-character-creator/page.tsx` - Character editor
- `typescript/app/api/heroes/route.ts` - Hero API endpoints
- `typescript/app/api/monsters/route.ts` - Monster API endpoints

## Conclusion

The character source badge system provides clear visual indicators of character origins while maintaining data integrity through the entire character lifecycle - from creation/loading through editing and database persistence.