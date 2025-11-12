# Dynamic Monster Creation System

This system allows you to dynamically create new monster types at runtime by generating reference images, pixelizing them, auto-rigging, and rendering them with procedural animations.

## Architecture Overview

1. **Image Generation**: Uses EverArt MCP tool to generate reference images
2. **Pixelization**: Reduces image to pixel art with palette quantization
3. **Auto-Rigging**: Automatically detects parts and creates rig structure
4. **Storage**: Saves monster bundles to `/public/cdn/monsters/{monsterId}/`
5. **Runtime Rendering**: Uses PixiJS to render rigs with procedural animations

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

### RigPlayer

Renders a rigged character with procedural animations:

```tsx
<RigPlayer
  bundleUrl={`/cdn/monsters/${monsterId}`}
  expression="neutral" // or "happy", "angry"
  wind={0.6} // 0-1, controls wind animation strength
  cast={false} // enables spell casting particle effects
/>
```

### MonsterCreator

UI component for creating new monsters with form inputs.

## File Structure

```
app/dnd/
├── server/
│   ├── storage.ts          # Monster bundle persistence
│   ├── pixelize.ts         # Image pixelization & palette reduction
│   ├── autoRig.ts          # Automatic rigging heuristics
│   └── imageGeneration.ts  # Image generation helpers
├── components/
│   ├── RigPlayer.tsx       # Runtime rig renderer
│   └── MonsterCreator.tsx # Monster creation UI
└── utils/
    └── rigTypes.ts         # Type definitions
```

## Storage Format

Each monster is stored in `/public/cdn/monsters/{monsterId}/`:

- `rig.json` - Rig definition (bones, slots, expressions)
- `128.png`, `256.png`, `512.png` - Pixelized images at different sizes
- `{partName}.png` - Individual part textures (head.png, torso.png, etc.)
- `metadata.json` - Monster metadata (class, seed, prompt, stats, palette)

## Procedural Animations

The RigPlayer supports several procedural animations:

- **Idle**: Head bobbing
- **Wind**: Beard, robe, and hat swaying (controlled by `wind` prop)
- **Blink**: Automatic eye blinking
- **Spell Casting**: Particle effects from staff tip (when `cast={true}`)

## Customization

### Adding New Expressions

Edit the rig's `expressions` field to add new emotion states:

```json
{
  "expressions": {
    "neutral": {},
    "happy": { "mouth": "mouth_smile.png" },
    "angry": { "mouth": "mouth_grit.png" },
    "surprised": { "eyeL": "eye_wide.png", "eyeR": "eye_wide.png" }
  }
}
```

### Adding Wind-Affected Parts

Edit the `windParts` array in `RigPlayer.tsx`:

```typescript
const windParts = ['beard', 'robeL', 'robeR', 'hatTip', 'cape'];
```

### Custom Auto-Rigging

Modify `autoRig.ts` to improve part detection. For production, consider:
- Using OpenCV WASM for contour detection
- Implementing more sophisticated heuristics
- Adding a manual confirmation UI for rig adjustments

## Future Enhancements

- [ ] OpenCV-based part detection for better auto-rigging
- [ ] Manual rig editor integration for fine-tuning
- [ ] Support for multiple animation states
- [ ] Export to Spine/DragonBones format
- [ ] Class-specific palette presets
- [ ] Batch monster generation

