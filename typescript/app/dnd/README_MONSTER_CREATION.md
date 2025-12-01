# Dynamic Monster Creation System

This system allows you to dynamically create new monster types at runtime by generating reference images, pixelizing them, and storing them as static images with optional cutout versions for layered display.

## Architecture Overview

1. **Image Generation**: Uses EverArt MCP tool to generate reference images
2. **Pixelization**: Reduces image to pixel art with palette quantization
3. **Background Removal**: Creates cutout versions of monsters for layered display
4. **Storage**: Saves monster bundles to `/public/cdn/monsters/{monsterId}/`
5. **Runtime Display**: Uses static PNG images with CSS animations for visual effects

## Usage

### Creating a Monster via API

```typescript
POST /api/monsters
{
  "klass": "Wizard",
  "prompt": "A blue wizard with a long beard and pointy hat",
  "seed": 12345,
  "imageUrl": "https://...", // Optional: if not provided, will try to generate
  "stats": {
    "hitPoints": 30,
    "maxHitPoints": 30,
    "armorClass": 14,
    "attackBonus": 4,
    "damageDie": "d8"
  }
}
```

### Using EverArt MCP Tool

Since MCP tools are available to the AI assistant, you can generate images like this:

1. Ask the AI to generate an image using EverArt with your prompt
2. The AI will use the `mcp_everart_generate_image` tool
3. Copy the returned image URL
4. Pass it to the `/api/monsters` endpoint in the `imageUrl` field

Example workflow:
```
User: "Generate an image of a blue wizard with a long beard using EverArt"
AI: [Uses MCP tool, returns image URL]
User: [Uses the URL in the monster creation API]
```

### Using the UI

Navigate to `/dnd/monster-creator` to use the visual interface for creating monsters.

## Components

### MonsterCreator

UI component for creating new monsters with form inputs. Creates static images that are displayed using the CharacterCard component with CSS-based visual effects (shake, sparkle, cast, flash, etc.).

## File Structure

```
app/dnd/
├── server/
│   ├── storage.ts          # Monster bundle persistence
│   ├── pixelize.ts         # Image pixelization & palette reduction
│   ├── backgroundRemoval.ts # Background removal for cutout images
│   └── imageGeneration.ts  # Image generation helpers
├── components/
│   └── MonsterCreator.tsx  # Monster creation UI
└── utils/
    └── monsterTypes.ts     # Type definitions
```

## Storage Format

Each monster is stored in `/public/cdn/monsters/{monsterId}/`:

- `rig.json` - Metadata about the monster (image dimensions, class, seed, etc.)
- `128.png`, `200.png`, `256.png`, `280x200.png`, `512.png` - Pixelized images at different sizes
- `128-cutout.png`, `200-cutout.png`, etc. - Cutout versions for layered display (optional)
- `128-background.png`, `200-background.png`, etc. - Background-only versions (optional)
- `metadata.json` - Monster metadata (class, seed, prompt, stats, palette)

## Visual Effects

Monsters use CSS-based visual effects for battle animations:

- **Shake**: Card shake animation for damage
- **Sparkle**: Sparkle particles for healing/buffs
- **Cast**: Cast effect animations for spell casting
- **Flash**: Flash effects with projectile types (fire, ice, magic, etc.)
- **Miss**: Miss animation for failed attacks
- **Hit**: Hit animation for successful attacks

These effects are applied via the CharacterCard component using CSS animations and particle effects.

## Future Enhancements

- [ ] Improved background removal algorithms
- [ ] Support for animated GIF exports
- [ ] Class-specific palette presets
- [ ] Batch monster generation
- [ ] Enhanced cutout quality

