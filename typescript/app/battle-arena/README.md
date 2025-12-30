# ⚔️ Battle Arena - AI-Powered RPG Battles

> **An innovative RPG battle simulator powered by OpenRAG for character generation and AI opponents**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![OpenRAG SDK](https://img.shields.io/badge/OpenRAG-SDK-purple?style=flat-square)](https://github.com/langflow-ai/openrag)
[![Status](https://img.shields.io/badge/Status-Beta-yellow?style=flat-square)](https://github.com/langflow-ai/openrag)

A fully-featured RPG battle system where OpenRAG powers character creation from PDFs, generates dynamic stats from text descriptions, controls AI opponents, and narrates epic battles. Watch heroes and monsters clash in turn-based combat with stunning visual effects!

---

## ✨ Features

### 🎭 Character Creation
- **📄 PDF Character Sheets** - Upload character sheets for automatic stat extraction
- **🤖 AI-Generated Characters** - Create heroes and monsters from simple text descriptions
- **🎨 Image Generation** - Integrated EverArt API for character artwork with background removal
- **📊 Dynamic Stat Scaling** - Context-aware stat generation (tiny fairy vs. massive dragon)
- **💾 Character Database** - Save and manage custom characters with DataStax Astra DB

### ⚔️ Battle System
- **🎲 RPG Mechanics** - Authentic dice rolling, attack rolls, and damage calculations
- **🤖 AI Opponents** - OpenRAG-powered intelligent battle decisions
- **👥 Team Battles** - Support for multiple heroes vs. monsters
- **✨ Visual Effects** - Projectiles, damage numbers, spell effects, and animations
- **📜 Battle Narration** - AI-generated battle descriptions and summaries
- **🏆 Victory Conditions** - Team-based defeat detection and battle outcomes

### 🧠 OpenRAG Integration
- **Document Ingestion** - Character sheets stored as RAG documents
- **Semantic Search** - Find characters by abilities, traits, or descriptions
- **AI Battle Strategy** - RAG-powered opponent decision making
- **Character Generation** - LLM-based stat and ability creation
- **Battle Summaries** - AI-generated narrative recaps

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- OpenRAG server running (default: `http://localhost:3000`)
- OpenRAG API key
- (Optional) EverArt API key for image generation
- (Optional) DataStax Astra DB for character storage

### Installation

```bash
# Navigate to the typescript directory
cd typescript

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the `typescript` directory:

```bash
# Required
OPENRAG_API_KEY=orag_your_api_key_here

# Optional - For image generation
EVERART_API_KEY=your_everart_key

# Optional - For character storage
ASTRA_DB_APPLICATION_TOKEN=your_token
ASTRA_DB_API_ENDPOINT=your_endpoint
```

### Run the Application

```bash
npm run dev
```

Navigate to [http://localhost:3000/battle-arena](http://localhost:3000/battle-arena) to start battling! ⚔️

---

## 🎮 How to Play

### 1. Create Characters

**Option A: Upload PDF Character Sheets**
1. Click "Add Hero" or "Add Monster"
2. Upload an RPG-style character sheet PDF
3. OpenRAG extracts stats and abilities automatically
4. Optionally generate an image with EverArt

**Option B: AI-Generated Characters**
1. Click "Add Hero" or "Add Monster"
2. Enter a text description (e.g., "A stealthy rogue with dual daggers")
3. OpenRAG generates appropriate stats and abilities
4. Character image is generated automatically

**Option C: Load Defaults**
1. Click "Load Default Heroes" or "Load Default Monsters"
2. Pre-made characters are loaded from the `characters/` directory
3. Ready to battle immediately!

### 2. Setup Battle

1. **Select Heroes** - Choose one or more heroes for your team
2. **Choose Opponent Type**:
   - **AI Opponent** - OpenRAG controls the monsters
   - **Player 2** - Manual control for multiplayer
3. **Select Monsters** - Choose one or more monsters to fight

### 3. Battle!

1. **Hero Turn** - Click abilities to attack
2. **Monster Turn** - AI makes strategic decisions or Player 2 controls
3. **Watch Effects** - Projectiles, damage numbers, and animations
4. **Read Narration** - AI-generated battle descriptions
5. **Victory!** - Battle ends when one team is defeated

---

## 📦 OpenRAG Integration

The Battle Arena showcases advanced OpenRAG SDK usage through the `lib/openrag-utils` library.

### Character Generation

```typescript
import { chatSimple } from '@/lib/openrag-utils';

// Generate character stats from description
const prompt = `Create an RPG character with these details:
Name: Shadowstrike
Description: A stealthy rogue with dual daggers
Type: Hero

Return JSON with: name, class, level, hp, ac, abilities[]`;

const response = await chatSimple(prompt);
const character = JSON.parse(response);
```

### AI Opponent Decision Making

```typescript
import { chatSimple } from '@/lib/openrag-utils';

// AI chooses best action
const prompt = `You are ${monster.name} in battle.
Current HP: ${monster.currentHp}/${monster.maxHp}
Available abilities: ${JSON.stringify(monster.abilities)}
Enemies: ${JSON.stringify(heroes)}

Choose the best ability to use and target. Return JSON.`;

const decision = await chatSimple(prompt);
```

### Document Ingestion

```typescript
import { ingestDocument } from '@/lib/openrag-utils';

// Store character sheet in RAG
await ingestDocument({
  file: characterSheetPDF,
  metadata: {
    type: 'character',
    name: character.name,
    class: character.class,
    level: character.level
  }
});
```

### Semantic Search

```typescript
import { searchQuery } from '@/lib/openrag-utils';

// Find characters by description
const results = await searchQuery(
  'stealthy characters with high dexterity',
  5
);
```

---

## 🏗️ Architecture

### Component Structure

```
battle-arena/
├── page.tsx                     # Main battle arena page
├── BattleArena.tsx              # Core battle logic
│
├── components/
│   ├── character-cards/         # Character display cards
│   ├── action-cards/            # Action buttons and controls
│   ├── battle/                  # Battle UI components
│   ├── effects/                 # Visual effects (projectiles, etc.)
│   └── ui/                      # Reusable UI components
│
├── hooks/
│   ├── battle/                  # Battle logic hooks
│   │   ├── useBattleState.ts    # State management
│   │   ├── useBattleActions.ts  # Action handlers
│   │   ├── useAIOpponent.ts     # AI decision making
│   │   └── useBattleNarrative.ts # AI narration
│   └── ui/                      # UI-specific hooks
│
├── services/
│   ├── client/                  # Client-side services
│   │   └── apiService.ts        # API calls
│   ├── server/                  # Server-side services
│   │   ├── image/               # Image generation
│   │   └── storage/             # Database operations
│   └── shared/                  # Shared utilities
│       └── characterGeneration.ts # Character stat generation
│
└── lib/
    ├── types.ts                 # TypeScript types
    └── constants.ts             # Game constants
```

### Data Flow

```
┌─────────────────────────────────────────┐
│         Battle Arena UI                 │
│  (React Components & Hooks)             │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│      Battle Logic Hooks                 │
│  • useBattleState                       │
│  • useBattleActions                     │
│  • useAIOpponent (OpenRAG)              │
│  • useBattleNarrative (OpenRAG)         │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         Services Layer                  │
│  • Character Generation (OpenRAG)       │
│  • Image Generation (EverArt)           │
│  • Database Storage (Astra DB)          │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│      lib/openrag-utils Library          │
│  (OpenRAG SDK Wrapper)                  │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         OpenRAG Backend                 │
│  (Document Storage, Embeddings, LLM)    │
└─────────────────────────────────────────┘
```

---

## 🎲 Battle Mechanics

### Combat System

The battle system implements authentic RPG mechanics:

1. **Initiative** - Turn order based on character stats
2. **Attack Rolls** - d20 + modifiers vs. target AC
3. **Damage Rolls** - Dice-based damage (e.g., 2d6+3)
4. **Critical Hits** - Natural 20s deal double damage
5. **Multi-Attack** - Some abilities hit multiple times
6. **Status Effects** - Buffs, debuffs, and ongoing effects

### AI Opponent Strategy

The AI uses OpenRAG to make intelligent decisions:

- **Threat Assessment** - Identifies most dangerous targets
- **Ability Selection** - Chooses optimal abilities for the situation
- **Resource Management** - Conserves powerful abilities
- **Team Coordination** - Considers team composition
- **Adaptive Strategy** - Learns from battle context

### Dynamic Stat Scaling

Character stats scale based on context:

```typescript
// Tiny fairy
{ size: 'tiny', hp: 10, ac: 15 }

// Human warrior
{ size: 'medium', hp: 50, ac: 16 }

// Ancient dragon
{ size: 'gargantuan', hp: 500, ac: 22 }
```

---

## 🎨 Visual Effects

The Battle Arena includes rich visual feedback:

- **⚡ Projectile Effects** - Arrows, spells, and attacks fly across the screen
- **💥 Damage Numbers** - Floating numbers show damage dealt
- **✨ Spell Effects** - Magical animations for special abilities
- **🎆 Victory Confetti** - Celebration effects for winners
- **💀 Defeat Animations** - Characters fade when defeated
- **🌟 Critical Hit Flash** - Special effects for critical hits

---

## 🔧 Development

### Running Tests

```bash
# Run all tests
npm test

# Run Battle Arena tests specifically
npm test -- battle-arena

# Run with coverage
npm run test:coverage
```

### Project Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
```

### Adding New Characters

1. Create a character sheet PDF in `characters/custom_heroes/`
2. Add metadata to `characters/default_heroes/heroes.json`
3. Use "Load Default Heroes" in the app

Or use the AI generation feature to create characters on the fly!

---

## 📚 Advanced Features

### Character Database

Characters are stored in DataStax Astra DB:

```typescript
// Save character
await saveCharacter({
  name: 'Shadowstrike',
  type: 'hero',
  stats: { hp: 50, ac: 16 },
  abilities: [...]
});

// Load characters
const heroes = await loadCharacters('hero');
```

### Image Generation

Character images are generated with EverArt:

```typescript
// Generate character image
const imageUrl = await generateCharacterImage({
  prompt: 'A stealthy rogue with dual daggers',
  style: 'fantasy-art'
});
```

### Battle Narration

AI generates engaging battle descriptions:

```typescript
// Generate battle summary
const summary = await generateBattleSummary({
  winner: 'heroes',
  battleLog: [...],
  participants: [...]
});
```

---

## 💡 Usage Tips

### Character Creation Tips

- **Be Specific** - Detailed descriptions generate better stats
- **Include Class** - Mention class/role for appropriate abilities
- **Size Matters** - Specify size for proper stat scaling
- **Upload Quality** - Clear, well-formatted PDFs work best

### Battle Strategy

- **Know Your Abilities** - Hover over abilities to see details
- **Target Wisely** - Focus fire on dangerous enemies
- **Use Positioning** - Some abilities have range limitations
- **Watch HP** - Keep track of team health
- **Read Narration** - AI descriptions provide tactical insights

### Performance Tips

- **Limit Characters** - 2-3 per side for best performance
- **Disable Effects** - Toggle effects in settings if needed
- **Clear Cache** - Refresh if images don't load

---

## 🔗 Related Documentation

- **[Main Project README](../../../README.md)** - Overview of all applications
- **[Python CLI Chat](../../../python/README.md)** - Terminal-based chat interface
- **[TypeScript Web Chat](../chat/README.md)** - Web chat interface
- **[OpenRAG Utils Library](../../lib/openrag-utils/README.md)** - SDK utilities documentation
- **[OpenRAG GitHub](https://github.com/langflow-ai/openrag)** - Official OpenRAG repository
- **[Battle Hooks Documentation](hooks/README.md)** - Detailed hook documentation

---

## 🐛 Troubleshooting

### Characters not generating

- Verify `OPENRAG_API_KEY` is set correctly
- Check OpenRAG server is running
- Ensure LLM is configured in OpenRAG backend

### Images not loading

- Verify `EVERART_API_KEY` is set (optional)
- Check network connectivity
- Images are cached in `public/cdn/`

### Database errors

- Verify Astra DB credentials (optional)
- Characters work without database (in-memory only)
- Check Astra DB endpoint is accessible

### Battle not starting

- Ensure at least one hero and one monster are selected
- Check browser console for errors
- Try refreshing the page

---

## 📄 License

This project is provided as-is for demonstration purposes.

---

<div align="center">

**Built with ❤️ using the OpenRAG SDK**

*Where AI meets epic RPG battles* ⚔️🤖

</div>