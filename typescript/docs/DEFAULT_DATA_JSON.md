# Default Heroes and Monsters JSON Configuration

## Overview

Default heroes and monsters data has been moved from hardcoded TypeScript constants to JSON files for easier maintenance and per-deployment customization.

## File Locations

- **Heroes**: `characters/default_heroes/heroes.json`
- **Monsters**: `characters/default_monsters/monsters.json`

## JSON Structure

### Heroes JSON Format

```json
{
  "version": "1.0.0",
  "description": "Default D&D hero classes with abilities",
  "heroes": [
    {
      "name": "Fighter",
      "hitPoints": 30,
      "maxHitPoints": 30,
      "armorClass": 18,
      "attackBonus": 5,
      "damageDie": "d10",
      "meleeDamageDie": "d10",
      "rangedDamageDie": "d8",
      "abilities": [
        {
          "name": "Action Surge",
          "type": "attack",
          "damageDice": "2d8",
          "attackRoll": true,
          "attacks": 2,
          "description": "Take an additional action to make two powerful attacks."
        }
      ],
      "description": "A master of weapons and armor, the Fighter excels in combat.",
      "color": "bg-red-900"
    }
  ]
}
```

### Monsters JSON Format

```json
{
  "version": "1.0.0",
  "description": "Default D&D monsters with abilities",
  "monsters": [
    {
      "name": "Goblin",
      "hitPoints": 7,
      "maxHitPoints": 7,
      "armorClass": 15,
      "attackBonus": 2,
      "damageDie": "d6",
      "abilities": [
        {
          "name": "Scimitar",
          "type": "attack",
          "damageDice": "1d6",
          "attackRoll": true,
          "description": "A quick slash with a curved blade."
        }
      ],
      "description": "A small, green humanoid with pointed ears.",
      "color": "bg-green-800"
    }
  ]
}
```

## How It Works

### Build-Time Loading

The JSON files are loaded at build time using Node.js `require()` in `typescript/app/dnd/constants.ts`:

```typescript
// Load default heroes from JSON file
let FALLBACK_CLASSES_DATA: DnDClass[] = [];
try {
  const heroesJson = require('../../../characters/default_heroes/heroes.json');
  FALLBACK_CLASSES_DATA = heroesJson.heroes || [];
} catch (error) {
  console.error('Failed to load heroes from JSON, using empty array:', error);
  FALLBACK_CLASSES_DATA = [];
}

export const FALLBACK_CLASSES: DnDClass[] = FALLBACK_CLASSES_DATA;
```

### Runtime Loading (API Routes)

For API routes that need to load defaults dynamically, use the utility functions in `typescript/app/dnd/utils/loadDefaults.ts`:

```typescript
import { loadDefaultHeroes, loadDefaultMonsters } from '@/app/dnd/utils/loadDefaults';

// Async loading
const heroes = await loadDefaultHeroes();
const monsters = await loadDefaultMonsters();
```

## Benefits

1. **Easy Customization**: Edit JSON files without touching TypeScript code
2. **Version Control**: Track changes to default data separately
3. **Per-Deployment Configuration**: Different deployments can have different default data
4. **Maintainability**: Cleaner separation of data and code
5. **No Code Changes Required**: Existing code continues to work with `FALLBACK_CLASSES` and `FALLBACK_MONSTERS`

## Customization Guide

### Adding a New Hero

1. Open `characters/default_heroes/heroes.json`
2. Add a new hero object to the `heroes` array:

```json
{
  "name": "Blood Hunter",
  "hitPoints": 28,
  "maxHitPoints": 28,
  "armorClass": 16,
  "attackBonus": 4,
  "damageDie": "d10",
  "meleeDamageDie": "d10",
  "abilities": [
    {
      "name": "Crimson Rite",
      "type": "attack",
      "damageDice": "1d6",
      "attackRoll": true,
      "bonusDamageDice": "1d4",
      "description": "Imbue your weapon with hemocraft energy."
    }
  ],
  "description": "A warrior who uses blood magic to hunt creatures of darkness.",
  "color": "bg-red-800"
}
```

3. Rebuild the application: `npm run build`

### Adding a New Monster

1. Open `characters/default_monsters/monsters.json`
2. Add a new monster object to the `monsters` array
3. Rebuild the application

### Modifying Existing Data

1. Edit the JSON file directly
2. Ensure the structure matches the TypeScript `DnDClass` interface
3. Rebuild the application

## Field Reference

### Required Fields

- `name`: Character/monster name (string)
- `hitPoints`: Current hit points (number)
- `maxHitPoints`: Maximum hit points (number)
- `armorClass`: Armor class value (number)
- `attackBonus`: Attack bonus modifier (number)
- `damageDie`: Default damage die (string, e.g., "d8")
- `abilities`: Array of abilities (can be empty)
- `description`: Character description (string)
- `color`: Tailwind CSS background color class (string)

### Optional Fields

- `meleeDamageDie`: Melee weapon damage die (string)
- `rangedDamageDie`: Ranged weapon damage die (string)
- `class`: Character class (string, for created monsters)
- `race`: Character race (string)
- `sex`: Character sex (string)
- `isDefault`: Flag indicating default hero (boolean)

### Ability Fields

#### Attack Ability
- `name`: Ability name (string)
- `type`: "attack"
- `damageDice`: Damage dice notation (string, e.g., "2d6")
- `attackRoll`: Whether requires attack roll (boolean)
- `attacks`: Number of attacks (number, optional, default: 1)
- `bonusDamageDice`: Bonus damage dice (string, optional)
- `description`: Ability description (string)

#### Healing Ability
- `name`: Ability name (string)
- `type`: "healing"
- `healingDice`: Healing dice notation (string, e.g., "1d8+3")
- `description`: Ability description (string)

## Migration Notes

### What Changed

- **Before**: Heroes and monsters were hardcoded in `typescript/app/dnd/constants.ts`
- **After**: Data is loaded from JSON files at build time

### Backward Compatibility

- All existing code continues to work
- `FALLBACK_CLASSES` and `FALLBACK_MONSTERS` exports remain unchanged
- No changes required to consuming code

### Error Handling

If JSON files fail to load:
- Empty arrays are used as fallback
- Error is logged to console
- Application continues to function (with no default data)

## Exporting Changes Back to JSON

### Overview

You can now export database changes back to JSON files, creating a complete round-trip workflow:

```
JSON Files → Load to Database → Edit in App → Export to JSON → Rebuild
```

### Export API Endpoints

**Export Heroes:**
```bash
POST /api/heroes/export-defaults
```

**Export Monsters:**
```bash
POST /api/monsters/export-defaults
```

### How to Export

#### Using the UI (Recommended)

1. Navigate to the **Load Data** page (`/dnd/load-data`)
2. Scroll to the **Export Defaults to JSON** section
3. Click the **Export Heroes to JSON** or **Export Monsters to JSON** button
4. Wait for the success confirmation alert
5. Rebuild the application: `npm run build`

The UI buttons provide:
- Visual feedback with loading states
- Success/error indicators with color-coded status (green for success, red for error, purple for idle)
- Automatic alerts with export details (count and file path)
- User-friendly interface with hover effects

#### Using API Endpoints

Alternatively, you can export via direct API calls:

```bash
# Export heroes
curl -X POST http://localhost:3000/api/heroes/export-defaults

# Export monsters
curl -X POST http://localhost:3000/api/monsters/export-defaults
```

**Response format:**
```json
{
  "success": true,
  "count": 13,
  "path": "characters/default_heroes/heroes.json"
}
```

#### Complete Workflow

1. **Make changes** to default heroes/monsters in the application
2. **Export to JSON** (via UI button or API call)
3. **Rebuild the application** to use the updated JSON files: `npm run build`

### What Gets Exported

- Only heroes/monsters with `isDefault: true` flag are exported
- Database metadata (_id, createdAt, updatedAt, searchContext) is removed
- Clean JSON structure matching the original format
- Includes an `exportedAt` timestamp

### Example Export Response

```json
{
  "success": true,
  "message": "Successfully exported 13 default heroes to JSON",
  "count": 13,
  "path": "characters/default_heroes/heroes.json"
}
```

### Workflow Example

1. Load default heroes: Click "Load Default Heroes" button
2. Edit a hero: Change Fighter's HP from 30 to 35
3. Export changes: Call `/api/heroes/export-defaults`
4. Rebuild: Run `npm run build`
5. Result: Fighter now has 35 HP in all new deployments

## Testing

After making changes to JSON files:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Test hero loading**:
   - Navigate to `/dnd/load-data`
   - Click "Load Default Heroes"
   - Verify all heroes load correctly

3. **Test hero export**:
   - Make changes to a default hero in the database
   - Call `POST /api/heroes/export-defaults`
   - Check `characters/default_heroes/heroes.json` for changes
   - Rebuild and verify changes persist

4. **Test monster loading and export**:
   - Navigate to `/dnd/test`
   - Verify monsters appear in selection
   - Make changes to default monsters
   - Call `POST /api/monsters/export-defaults`
   - Verify changes in JSON file

5. **Verify constants**:
   - Check browser console for any JSON loading errors
   - Verify `FALLBACK_CLASSES.length` and `FALLBACK_MONSTERS.length` are correct

## Troubleshooting

### JSON Parse Errors

If you see "Failed to load heroes/monsters from JSON":
1. Validate JSON syntax using a JSON validator
2. Check file paths are correct
3. Ensure JSON structure matches expected format

### Missing Data

If heroes/monsters don't appear:
1. Check JSON file exists in correct location
2. Verify `heroes` or `monsters` array exists in JSON
3. Rebuild the application
4. Check browser console for errors

### Type Errors

If TypeScript compilation fails:
1. Ensure all required fields are present
2. Check field types match `DnDClass` interface
3. Verify ability structures match `Ability` type

## Future Enhancements

Potential improvements for this system:

1. **JSON Schema Validation**: Add schema validation at build time
2. **Hot Reloading**: Support JSON changes without rebuild (dev mode)
3. **Admin UI**: Web interface for editing default data
4. **Multiple Sets**: Support multiple default data sets (e.g., by campaign)
5. **Import/Export**: Tools for importing/exporting custom defaults

## Related Files

- `typescript/app/dnd/constants.ts` - Loads JSON at build time
- `typescript/app/dnd/utils/loadDefaults.ts` - Runtime loading utilities
- `typescript/app/api/heroes/load-defaults/route.ts` - API endpoint for loading heroes
- `typescript/app/dnd/types.ts` - TypeScript interfaces for data structures

---

**Made with Bob** 🤖