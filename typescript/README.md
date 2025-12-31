# 🌐 OpenRAG TypeScript Applications

> **Next.js applications powered by the OpenRAG SDK**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![OpenRAG SDK](https://img.shields.io/badge/OpenRAG-SDK-purple?style=flat-square)](https://github.com/langflow-ai/openrag)

This directory contains two TypeScript applications built with Next.js 16 and the OpenRAG SDK:

1. **💬 Web Chat** - Real-time streaming chat interface
2. **⚔️ Battle Arena** - AI-powered RPG battle simulator

---

## ✨ Features

- **🌊 Real-Time Streaming** - Server-sent events for responsive chat
- **📝 Rich Markdown** - Beautiful rendering with syntax highlighting
- **🎮 Interactive UI** - Modern, responsive design with animations
- **🔧 Modular SDK Utilities** - Complete `openrag-utils` library for all OpenRAG endpoints
- **⚡ Next.js 16** - Built with App Router and React Server Components

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- OpenRAG server running (default: `http://localhost:3000`)
- OpenRAG API key

### Installation

```bash
# Navigate to the typescript directory
cd typescript

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the **root directory** of the project (one level up from `typescript/`):

```bash
# From the typescript directory, create the root .env file
cd ..
cp .env.example .env
# Edit .env and add your OPENRAG_API_KEY
```

The `.env` file should contain:

```bash
# Required
OPENRAG_API_KEY=orag_your_api_key_here

# Optional
OPENRAG_URL=http://localhost:3000

# Battle Arena only (optional)
EVERART_API_KEY=your_everart_key
ASTRA_DB_APPLICATION_TOKEN=your_token
ASTRA_DB_ENDPOINT=your_endpoint
```

**Note:** All TypeScript applications read environment variables from the root `.env` file, which is shared with the Python CLI.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access:
- **Chat Interface**: [http://localhost:3000/chat](http://localhost:3000/chat)
- **Battle Arena**: [http://localhost:3000/battle-arena](http://localhost:3000/battle-arena)

---

## 📦 Applications

### 💬 Web Chat

A responsive chat interface with real-time streaming, markdown rendering, and conversation history.

**Features:**
- Real-time streaming responses
- Rich markdown rendering
- Conversation context
- Clean, modern UI

### ⚔️ Battle Arena

An AI-powered RPG battle simulator where you create heroes and monsters, then watch them battle!

**Features:**
- AI character generation from PDFs or text
- Dynamic battle narration
- Visual effects and animations
- Optional image generation and database storage

---

## 📚 Project Structure

```
typescript/
├── app/
│   ├── page.tsx                 # Home page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   │
│   ├── chat/                    # Web Chat application
│   │   ├── Chat.tsx
│   │   └── README.md
│   │
│   ├── battle-arena/            # Battle Arena application
│   │   ├── BattleArena.tsx
│   │   └── README.md
│   │
│   └── api/                     # API routes
│       ├── chat/
│       └── monsters/
│
├── lib/
│   ├── openrag-utils/           # OpenRAG SDK utilities
│   │   ├── chat.ts
│   │   ├── search.ts
│   │   ├── documents.ts
│   │   ├── settings.ts
│   │   └── knowledge-filters.ts
│   │
│   └── db/                      # Database utilities
│       └── astra.ts
│
├── public/                      # Static assets
├── package.json                 # Dependencies
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

**Note:** The `.env` file is located in the project root directory (one level up from `typescript/`).

---

## 🔧 OpenRAG SDK Integration

The TypeScript apps include a comprehensive utility library (`lib/openrag-utils/`) that wraps all OpenRAG SDK endpoints.

### Usage Example

```typescript
import { chatStreaming, searchQuery, ingestDocument } from '@/lib/openrag-utils';

// Streaming chat
for await (const event of chatStreaming('What is RAG?', 'chat-123')) {
  if (event.type === 'content') {
    process.stdout.write(event.content);
  }
}

// Document search
const results = await searchQuery('machine learning', 5);

// Document ingestion
await ingestDocument({ file: pdfFile, wait: true });
```

---

## 🐛 Troubleshooting

### Connection Issues

Make sure your OpenRAG server is running:
```bash
curl http://localhost:3000/health
```

### API Key Issues

Verify your API key in the root `.env`:
```bash
cd ..
cat .env | grep OPENRAG_API_KEY
```

### Dependency Issues

```bash
npm install
# or
rm -rf node_modules package-lock.json && npm install
```

---

## 📄 License

This project is provided as-is for demonstration purposes.

---

<div align="center">

**Built with ❤️ using the OpenRAG SDK**

*Bringing RAG to the web, one component at a time* 🚀

[Get Started](#-quick-start) • [View on GitHub](https://github.com/langflow-ai/openrag)

</div>
