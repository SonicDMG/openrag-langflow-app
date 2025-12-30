<div align="center">

# 🚀 OpenRAG Application Suite

### *Three Ways to Harness RAG: CLI, Web, and... Epic Battles?*

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

[![OpenRAG](https://img.shields.io/badge/OpenRAG-SDK-blue?style=for-the-badge)](https://github.com/langflow-ai/openrag)
[![Python](https://img.shields.io/badge/Python-3.13+-green?style=for-the-badge&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**A monorepo showcasing OpenRAG SDK integration across Python and TypeScript**

[Quick Start](#-quick-start) • [Applications](#-choose-your-adventure) • [Documentation](#-documentation)

</div>

---

## 🎯 What's This All About?

This monorepo demonstrates the versatility of the **OpenRAG SDK** through three distinct applications:

1. **💬 Python CLI Chat** - Terminal-based RAG conversations with streaming responses
2. **🌐 TypeScript Web Chat** - Modern Next.js web interface for RAG interactions  
3. **⚔️ Battle Arena** - An RPG battle simulator where AI generates characters and controls opponents

Each application showcases different aspects of the OpenRAG SDK, from simple chat to complex document ingestion and AI-powered content generation. Plus, they all share a common `openrag-utils` library pattern for consistency across languages.

---

## 🎮 Choose Your Adventure

### 💬 Python CLI Chat

**For terminal enthusiasts and Python developers**

Chat with your RAG-powered assistant directly from the command line. Features streaming responses, rich markdown rendering, and a comprehensive utility library.

```bash
cd python
uv sync
uv run python main.py
```

**Perfect for:**
- Quick RAG testing and experimentation
- Terminal-based workflows
- Python SDK integration examples
- Building CLI tools with RAG

📖 **[Python CLI Documentation](python/README.md)**

---

### 🌐 TypeScript Web Chat

**For web developers and modern UI lovers**

A responsive Next.js 16 application with real-time streaming, markdown rendering, and a clean interface. Built with App Router and React Server Components.

```bash
cd typescript
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting!

**Perfect for:**
- Web-based RAG applications
- Learning Next.js + OpenRAG integration
- Building production chat interfaces
- TypeScript SDK examples

📖 **[TypeScript Chat Documentation](typescript/app/chat/README.md)**

---

### ⚔️ Battle Arena

**For the adventurous**

An RPG battle simulator where OpenRAG generates characters from PDFs or text descriptions, controls AI opponents, and narrates epic battles. Watch heroes and monsters clash with stunning visual effects!

```bash
cd typescript
npm install
npm run dev
```

Navigate to [http://localhost:3000/battle-arena](http://localhost:3000/battle-arena)

**Perfect for:**
- Exploring creative RAG applications
- AI-powered game mechanics
- Document ingestion examples (character sheets)
- Complex OpenRAG SDK usage

📖 **[Battle Arena Documentation](typescript/app/battle-arena/README.md)**

---

## 🏗️ Architecture

All three applications share a common pattern: they use dedicated `openrag-utils` libraries that wrap the OpenRAG SDK for cleaner, more maintainable code.

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
         │ openrag_    │ │ openrag-  │ │ openrag-      │
         │ utils/      │ │ utils/    │ │ utils/        │
         └─────────────┘ └───────────┘ └───────────────┘
```

### The `openrag-utils` Pattern

Both Python and TypeScript apps include utility libraries that:

- ✅ Wrap all OpenRAG SDK endpoints
- ✅ Provide consistent APIs across languages
- ✅ Include usage examples and tests
- ✅ Can be used standalone or imported

**Python:** `python/openrag_utils/`  
**TypeScript:** `typescript/lib/openrag-utils/`

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
uv sync
echo "OPENRAG_API_KEY=your_key" > .env
uv run python main.py

# Setup TypeScript apps (in a new terminal)
cd ../typescript
npm install
echo "OPENRAG_API_KEY=your_key" > .env
npm run dev
```

### Environment Variables

Create a `.env` file in each app directory:

```bash
# Required
OPENRAG_API_KEY=orag_your_api_key_here

# Optional
OPENRAG_URL=http://localhost:3000

# Battle Arena only (optional)
EVERART_API_KEY=your_everart_key
ASTRA_DB_APPLICATION_TOKEN=your_token
ASTRA_DB_API_ENDPOINT=your_endpoint
```

---

## 📊 Feature Comparison

| Feature | Python CLI | TypeScript Chat | Battle Arena |
|---------|-----------|----------------|--------------|
| **Chat (Simple)** | ✅ | ✅ | ✅ |
| **Chat (Streaming)** | ✅ | ✅ | ✅ |
| **Document Search** | ✅ | ✅ | ✅ |
| **Document Ingestion** | ✅ | ✅ | ✅ (PDFs) |
| **Knowledge Filters** | ✅ | ✅ | ✅ |
| **Conversation History** | ✅ | ✅ | ✅ |
| **Rich Markdown** | ✅ | ✅ | ✅ |
| **Visual Effects** | ❌ | ❌ | ✅ |
| **AI Opponents** | ❌ | ❌ | ✅ |
| **Image Generation** | ❌ | ❌ | ✅ |
| **Database Storage** | ❌ | ❌ | ✅ (Optional) |

---

## 🔧 OpenRAG SDK Integration

### Python Example

```python
from openrag_utils import chat_streaming, search_query, ingest_document

# Streaming chat
async for event in chat_streaming("What is RAG?", "chat-123"):
    if event["type"] == "content":
        print(event["content"], end="", flush=True)

# Document search
results = await search_query("machine learning", limit=5)

# Document ingestion
await ingest_document("./docs/guide.pdf", wait=True)
```

### TypeScript Example

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

## 📚 Documentation

### Application Guides
- **[Python CLI Chat](python/README.md)** - Terminal chat interface
- **[TypeScript Web Chat](typescript/app/chat/README.md)** - Web chat interface
- **[Battle Arena](typescript/app/battle-arena/README.md)** - RPG battle simulator

### SDK Utilities
- **[Python OpenRAG Utils](python/openrag_utils/README.md)** - Python SDK wrapper
- **[TypeScript OpenRAG Utils](typescript/lib/openrag-utils/README.md)** - TypeScript SDK wrapper

### External Resources
- **[OpenRAG GitHub](https://github.com/langflow-ai/openrag)** - Official OpenRAG repository
- **[Next.js Documentation](https://nextjs.org/docs)** - Next.js framework docs

---

## 🐛 Troubleshooting

### Connection Issues

Make sure your OpenRAG server is running:
```bash
curl http://localhost:3000/health
```

### API Key Issues

Verify your API key in `.env`:
```bash
cat .env | grep OPENRAG_API_KEY
```

### Dependency Issues

```bash
# Python
cd python && uv sync

# TypeScript
cd typescript && npm install
```

---

## 📄 License

This project is provided as-is for demonstration purposes.

---

<div align="center">

**Built with ❤️ using the OpenRAG SDK**

*Three apps, one SDK, infinite possibilities* 🚀

[Get Started](#-quick-start) • [View on GitHub](https://github.com/langflow-ai/openrag)

</div>
