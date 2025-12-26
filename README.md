<div align="center">

# 🚀 OpenRAG Application Suite

### *Harness the Power of RAG with Python & TypeScript*

<table>
<tr>
<td width="33%" align="center">
<img src="docs/images/battle-cards.png" alt="Battle Arena - Character Cards" width="100%"/>
<br/><b>⚔️ Battle Arena</b>
<br/><i>AI-Powered RPG Battles</i>
</td>
<td width="33%" align="center">
<img src="docs/images/character-selection.png" alt="Battle Arena - Character Selection" width="100%"/>
<br/><b>🎭 Character Creation</b>
<br/><i>Dynamic Hero & Monster Generation</i>
</td>
<td width="33%" align="center">
<img src="docs/images/chat-interface.png" alt="TypeScript Web Chat" width="100%"/>
<br/><b>💬 RAG Chat Interface</b>
<br/><i>Streaming Conversations</i>
</td>
</tr>
</table>

> **Three powerful applications demonstrating OpenRAG SDK capabilities:**
> 💬 Python CLI Chat • 🌐 TypeScript Web Chat • ⚔️ Battle Arena

[![OpenRAG](https://img.shields.io/badge/OpenRAG-SDK-blue?style=for-the-badge)](https://openrag.com)
[![Python](https://img.shields.io/badge/Python-3.13+-green?style=for-the-badge&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**A comprehensive monorepo showcasing OpenRAG SDK integration across multiple applications**

[Python Chat](#-python-cli-chat) • [TypeScript Chat](#-typescript-web-chat) • [Battle Arena](#%EF%B8%8F-battle-arena) • [Getting Started](#-quick-start)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Applications](#-applications)
  - [Python CLI Chat](#-python-cli-chat)
  - [TypeScript Web Chat](#-typescript-web-chat)
  - [Battle Arena](#%EF%B8%8F-battle-arena)
- [OpenRAG SDK Integration](#-openrag-sdk-integration)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 🌟 Overview

This monorepo demonstrates the versatility and power of the **OpenRAG SDK** through three distinct applications:

1. **Python CLI Chat** - A terminal-based RAG chat interface with streaming responses
2. **TypeScript Web Chat** - A modern Next.js web application for RAG conversations
3. **Battle Arena** - An innovative RPG-style battle simulator powered by RAG for character generation and AI opponents

Each application showcases different aspects of the OpenRAG SDK, from simple chat interactions to complex document ingestion and AI-powered content generation.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenRAG Backend                         │
│  (Document Storage, Embeddings, LLM Integration)            │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ OpenRAG SDK
                ┌───────────┼───────────┐
                │           │           │
        ┌───────▼─────┐ ┌──▼────────┐ ┌▼──────────────┐
        │   Python    │ │TypeScript │ │  TypeScript   │
        │  CLI Chat   │ │ Web Chat  │ │ Battle Arena  │
        │             │ │           │ │               │
        │  • Streaming│ │ • Next.js │ │ • Character   │
        │  • Rich MD  │ │ • React   │ │   Generation  │
        │  • Terminal │ │ • Modern  │ │ • AI Battles  │
        └─────────────┘ └───────────┘ └───────────────┘
```

---

## 🎯 Applications

### 💬 Python CLI Chat

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.13+-blue?style=flat-square&logo=python" alt="Python"/>
</div>

A lightweight, powerful terminal chat interface that brings RAG capabilities directly to your command line.

#### ✨ Features

- **🌊 Streaming Responses** - See tokens arrive in real-time for a responsive experience
- **📝 Rich Markdown** - Beautiful rendering with syntax highlighting, tables, and clickable links
- **💬 Conversation Continuity** - Maintains context across multiple turns
- **🔧 Modular Architecture** - Comprehensive `openrag_utils` package for all SDK endpoints
- **⚡ Fast Setup** - Get started in under 2 minutes

#### 🚀 Quick Start

```bash
cd python
uv sync  # or: pip install -e .

# Set your API key
echo "OPENRAG_API_KEY=your_key_here" > .env

# Start chatting!
uv run python main.py
```

#### 📦 OpenRAG Utils Package

The Python app includes a complete utility library for OpenRAG SDK operations:

```python
from openrag_utils import (
    chat_simple,           # Simple chat
    chat_streaming,        # Streaming chat
    search_query,          # Document search
    ingest_document,       # Document ingestion
    create_filter,         # Knowledge filters
    get_settings,          # Settings management
)

# Use in your own projects
response = await chat_simple("What is RAG?")
results = await search_query("machine learning", limit=5)
```

**Available Modules:**
- `chat.py` - Chat operations and conversation management
- `search.py` - Document search with filters
- `documents.py` - Document ingestion and management
- `settings.py` - Settings configuration
- `knowledge_filters.py` - Knowledge filter CRUD operations

[📖 Full Python Documentation](python/openrag_utils/README.md)

---

### 🌐 TypeScript Web Chat

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript" alt="TypeScript"/>
</div>

A modern, responsive web application built with Next.js 16, showcasing RAG capabilities in a beautiful UI.

#### ✨ Features

- **🎨 Modern UI** - Clean, responsive design with dark mode support
- **💬 Real-time Streaming** - Live token streaming with smooth animations
- **📝 Markdown Rendering** - Full markdown support with syntax highlighting
- **🔍 Search Highlighting** - Automatic highlighting of search queries in responses
- **📱 Mobile Responsive** - Works seamlessly on all devices
- **⚡ Server Components** - Leverages Next.js 16 App Router for optimal performance

#### 🚀 Quick Start

```bash
cd typescript
npm install

# Set your API key
echo "OPENRAG_API_KEY=your_key_here" > .env

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting!

#### 📦 OpenRAG Utils Library

TypeScript utilities mirror the Python package for consistency:

```typescript
import {
  chatSimple,
  chatStreaming,
  searchQuery,
  ingestDocument,
  createFilter,
  getSettings,
} from '@/lib/openrag-utils';

// Use in API routes or components
const response = await chatSimple('What is RAG?');
const results = await searchQuery('machine learning', 5);
```

**Available Modules:**
- `chat.ts` - Chat operations and conversation management
- `search.ts` - Document search with filters
- `documents.ts` - Document ingestion and management
- `settings.ts` - Settings configuration
- `knowledge-filters.ts` - Knowledge filter CRUD operations

[📖 Full TypeScript Documentation](typescript/lib/openrag-utils/README.md)

---

### ⚔️ Battle Arena

<div align="center">
  <img src="https://img.shields.io/badge/Status-Beta-yellow?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/AI_Powered-OpenRAG-purple?style=flat-square" alt="AI Powered"/>
  
  <br/>
  
  <img src="typescript/public/cdn/decals/battle-arena.png" alt="Battle Arena" width="600"/>
</div>

An innovative RPG-style battle simulator that leverages OpenRAG for **AI-powered character generation**, **intelligent battle narration**, and **dynamic opponent strategies**.

#### ✨ Features

##### 🎭 Character Creation
- **📄 PDF Character Sheets** - Upload character sheets for automatic stat extraction
- **🤖 AI-Generated Characters** - Create heroes and monsters from text descriptions
- **🎨 Image Generation** - Integrated EverArt API for character artwork
- **📊 Dynamic Stat Scaling** - Context-aware stat generation (tiny fairy vs. massive dragon)
- **💾 Character Database** - Save and manage custom characters

##### ⚔️ Battle System
- **🎲 RPG Mechanics** - Authentic dice rolling, attack rolls, and damage calculations
- **🤖 AI Opponents** - OpenRAG-powered intelligent battle decisions
- **👥 Team Battles** - Support for multiple heroes vs. monsters
- **✨ Visual Effects** - Projectiles, damage numbers, spell effects, and animations
- **📜 Battle Narration** - AI-generated battle descriptions and summaries

##### 🧠 OpenRAG Integration
- **Document Ingestion** - Character sheets stored as RAG documents
- **Semantic Search** - Find characters by abilities, traits, or descriptions
- **AI Battle Strategy** - RAG-powered opponent decision making
- **Character Generation** - LLM-based stat and ability creation
- **Battle Summaries** - AI-generated narrative recaps

#### 🚀 Quick Start

```bash
cd typescript
npm install

# Configure environment
cat > .env << EOF
OPENRAG_API_KEY=your_openrag_key
EVERART_API_KEY=your_everart_key  # For image generation
ASTRA_DB_APPLICATION_TOKEN=your_token  # For character storage
ASTRA_DB_API_ENDPOINT=your_endpoint
EOF

# Start the app
npm run dev
```

Navigate to [http://localhost:3000/battle-arena](http://localhost:3000/battle-arena)

#### 🎮 How to Play

1. **Create Characters**
   - Upload PDF character sheets, or
   - Use AI to generate characters from descriptions
   - Load default heroes and monsters

2. **Setup Battle**
   - Select your hero(es)
   - Choose opponent type (AI or Player 2)
   - Select monster opponent(s)

3. **Battle!**
   - Take turns attacking with different abilities
   - Watch AI opponents make strategic decisions
   - Enjoy visual effects and battle narration

#### 🏗️ Architecture Highlights

```typescript
// Character generation with OpenRAG
const character = await generateCharacterStats({
  name: "Shadowstrike",
  description: "A stealthy rogue with dual daggers",
  characterType: "hero"
});

// AI opponent decision making
const aiDecision = await getAIOpponentAction({
  currentState: battleState,
  availableAbilities: character.abilities,
  battleContext: battleLog
});

// Document ingestion for character sheets
await ingestDocument({
  file: characterSheet,
  metadata: {
    type: "character",
    class: "Rogue",
    level: 5
  }
});
```

#### 📚 Advanced Features

- **Dynamic Stat Scaling** - Automatically adjusts HP/AC based on entity size (tiny fairy vs. ancient dragon)
- **Multi-Attack Abilities** - Support for abilities that hit multiple times
- **Status Effects** - Buffs, debuffs, and ongoing effects
- **Battle History** - Complete log of all actions and outcomes
- **Export/Import** - Save battles and characters as JSON

[📖 Character Generation Docs](typescript/app/battle-arena/services/CHARACTER_STAT_GENERATION.md) | [🎨 Image Setup](typescript/app/battle-arena/EVERART_SETUP.md)

---

## 🔧 OpenRAG SDK Integration

This monorepo demonstrates comprehensive OpenRAG SDK usage across both Python and TypeScript:

### Core SDK Features Used

| Feature | Python CLI | TypeScript Chat | Battle Arena |
|---------|-----------|----------------|--------------|
| **Chat (Simple)** | ✅ | ✅ | ✅ |
| **Chat (Streaming)** | ✅ | ✅ | ✅ |
| **Document Search** | ✅ | ✅ | ✅ |
| **Document Ingestion** | ✅ | ✅ | ✅ |
| **Knowledge Filters** | ✅ | ✅ | ✅ |
| **Settings Management** | ✅ | ✅ | ✅ |
| **Conversation History** | ✅ | ✅ | ✅ |

### SDK Usage Examples

#### Python
```python
from openrag_sdk import OpenRAGClient

client = OpenRAGClient(
    api_key=os.getenv("OPENRAG_API_KEY"),
    base_url=os.getenv("OPENRAG_URL", "http://localhost:3000")
)

# Streaming chat
async for event in client.chat.stream(
    message="What is RAG?",
    chat_id="conversation-123"
):
    if event.type == "content":
        print(event.content, end="", flush=True)
```

#### TypeScript
```typescript
import { OpenRAGClient } from 'openrag-sdk';

const client = new OpenRAGClient({
  apiKey: process.env.OPENRAG_API_KEY!,
  baseUrl: process.env.OPENRAG_URL || 'http://localhost:3000'
});

// Streaming chat
for await (const event of client.chat.stream({
  message: 'What is RAG?',
  chatId: 'conversation-123'
})) {
  if (event.type === 'content') {
    process.stdout.write(event.content);
  }
}
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.13+** (for Python CLI)
- **Node.js 18+** (for TypeScript apps)
- **OpenRAG Server** running (default: http://localhost:3000)
- **OpenRAG API Key**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd openrag-langflow-app

# Setup Python CLI
cd python
uv sync  # or: pip install -e .
echo "OPENRAG_API_KEY=your_key" > .env
uv run python main.py

# Setup TypeScript apps (in a new terminal)
cd ../typescript
npm install
echo "OPENRAG_API_KEY=your_key" > .env
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required
OPENRAG_API_KEY=orag_your_api_key_here

# Optional
OPENRAG_URL=http://localhost:3000

# Battle Arena (optional)
EVERART_API_KEY=your_everart_key
ASTRA_DB_APPLICATION_TOKEN=your_token
ASTRA_DB_API_ENDPOINT=your_endpoint
```

---

## 📁 Project Structure

```
openrag-langflow-app/
├── python/                          # Python CLI Application
│   ├── main.py                      # CLI entrypoint
│   ├── utils.py                     # Streaming & formatting utilities
│   ├── config.py                    # Configuration management
│   ├── pyproject.toml               # Python dependencies
│   └── openrag_utils/               # OpenRAG SDK utilities
│       ├── chat.py                  # Chat operations
│       ├── search.py                # Document search
│       ├── documents.py             # Document management
│       ├── settings.py              # Settings management
│       └── knowledge_filters.py     # Filter operations
│
├── typescript/                      # Next.js TypeScript Application
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # Chat interface (home)
│   │   ├── components/
│   │   │   ├── Chat.tsx             # Main chat component
│   │   │   └── BattleArena.tsx      # Battle arena wrapper
│   │   ├── battle-arena/            # Battle Arena app
│   │   │   ├── page.tsx             # Battle arena page
│   │   │   ├── components/          # UI components
│   │   │   ├── hooks/               # React hooks
│   │   │   ├── services/            # API services
│   │   │   ├── utils/               # Utility functions
│   │   │   └── types.ts             # TypeScript types
│   │   └── api/                     # API routes
│   │       ├── chat/                # Chat endpoint
│   │       ├── heroes/              # Hero management
│   │       ├── monsters/            # Monster management
│   │       └── openrag/             # OpenRAG operations
│   ├── lib/
│   │   ├── openrag-utils/           # OpenRAG SDK utilities
│   │   │   ├── chat.ts              # Chat operations
│   │   │   ├── search.ts            # Document search
│   │   │   ├── documents.ts         # Document management
│   │   │   ├── settings.ts          # Settings management
│   │   │   └── knowledge-filters.ts # Filter operations
│   │   └── db/
│   │       └── astra.ts             # DataStax Astra DB client
│   └── public/
│       └── cdn/                     # Static assets
│           ├── decals/              # App icons
│           └── monsters/            # Generated monster images
│
├── characters/                      # Character data
│   ├── default_heroes/              # Pre-made heroes
│   │   ├── heroes.json              # Hero metadata
│   │   └── *.pdf                    # Character sheets
│   ├── default_monsters/            # Pre-made monsters
│   │   ├── monsters.json            # Monster metadata
│   │   └── *.pdf                    # Monster sheets (if any)
│   └── custom_heroes/               # User-created heroes
│
└── README.md                        # This file
```

---

## 🤝 Contributing

Contributions are welcome! This project demonstrates OpenRAG SDK integration patterns that can be adapted for your own applications.

### Development

```bash
# Python development
cd python
uv sync --dev
pytest

# TypeScript development
cd typescript
npm install
npm run dev
npm test
```

### Adding New Features

1. **Python CLI** - Add new utilities to `python/openrag_utils/`
2. **TypeScript Chat** - Extend components in `typescript/app/components/`
3. **Battle Arena** - Add features to `typescript/app/battle-arena/`

---

## 📄 License

This project is provided as-is for demonstration purposes.

---

## 🔗 Links

- [OpenRAG Documentation](https://docs.openrag.com)
- [OpenRAG Python SDK](https://github.com/openrag/openrag-python-sdk)
- [OpenRAG TypeScript SDK](https://github.com/openrag/openrag-typescript-sdk)
- [Next.js Documentation](https://nextjs.org/docs)

---

<div align="center">

**Built with ❤️ using OpenRAG SDK**

*Showcasing the power of Retrieval-Augmented Generation*

</div>
