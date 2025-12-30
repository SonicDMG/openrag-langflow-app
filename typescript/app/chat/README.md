# 💬 OpenRAG TypeScript Web Chat

> **Modern web chat interface built with Next.js 16 and the OpenRAG SDK**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![OpenRAG SDK](https://img.shields.io/badge/OpenRAG-SDK-purple?style=flat-square)](https://github.com/langflow-ai/openrag)

A responsive web application for RAG-powered conversations with real-time streaming, markdown rendering, and a clean modern UI. Built with Next.js 16 App Router and React Server Components.

---

## ✨ Features

- **🎨 Modern UI** - Clean, responsive design with smooth animations
- **💬 Real-time Streaming** - Live token streaming with Server-Sent Events
- **📝 Markdown Rendering** - Full markdown support with syntax highlighting
- **🔍 Search Highlighting** - Automatic highlighting of search queries in responses
- **📱 Mobile Responsive** - Works seamlessly on all devices
- **⚡ Server Components** - Leverages Next.js 16 App Router for optimal performance
- **🌙 Dark Mode Ready** - Built with modern styling for dark themes

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

Create a `.env` file in the `typescript` directory:

```bash
# Required
OPENRAG_API_KEY=orag_your_api_key_here

# Optional (defaults shown)
OPENRAG_URL=http://localhost:3000
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start chatting! 🎉

---

## 📦 OpenRAG Utils Library

The TypeScript app includes a comprehensive utility library that wraps all OpenRAG SDK endpoints, located in `lib/openrag-utils/`. This mirrors the Python implementation for consistency.

### Library Structure

```
lib/openrag-utils/
├── index.ts                 # Convenient exports
├── chat.ts                  # Chat operations
├── search.ts                # Document search
├── documents.ts             # Document ingestion
├── settings.ts              # Settings management
├── knowledge-filters.ts     # Knowledge filter CRUD
└── README.md               # Detailed documentation
```

### Usage Examples

#### Simple Chat

```typescript
import { chatSimple } from '@/lib/openrag-utils';

// Send a message and get a complete response
const response = await chatSimple(
  'What is Retrieval-Augmented Generation?',
  'my-conversation'
);
console.log(response);
```

#### Streaming Chat in API Routes

```typescript
import { chatStreaming } from '@/lib/openrag-utils';

export async function POST(request: Request) {
  const { message, chatId } = await request.json();
  
  // Create a streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of chatStreaming(message, chatId)) {
        if (event.type === 'content') {
          controller.enqueue(encoder.encode(event.content));
        }
      }
      controller.close();
    }
  });
  
  return new Response(stream);
}
```

#### Document Search

```typescript
import { searchQuery } from '@/lib/openrag-utils';

// Search your knowledge base
const results = await searchQuery(
  'machine learning best practices',
  5,  // limit
  0.7 // score threshold
);

results.forEach(result => {
  console.log(`Score: ${result.score}`);
  console.log(`Content: ${result.content}`);
});
```

#### Document Ingestion

```typescript
import { ingestDocument } from '@/lib/openrag-utils';

// Add documents to your knowledge base
await ingestDocument({
  file: uploadedFile,
  wait: true  // Wait for processing to complete
});
```

### Available Functions

| Module | Functions |
|--------|-----------|
| **chat.ts** | `chatSimple()`, `chatStreaming()`, `listConversations()`, `getConversation()`, `deleteConversation()` |
| **search.ts** | `searchQuery()` |
| **documents.ts** | `ingestDocument()`, `deleteDocument()` |
| **settings.ts** | `getSettings()`, `updateSettings()` |
| **knowledge-filters.ts** | `createFilter()`, `searchFilters()`, `getFilter()`, `updateFilter()`, `deleteFilter()` |

📖 **[Full OpenRAG Utils Documentation](../../lib/openrag-utils/README.md)**

---

## 🎯 How It Works

The web chat application demonstrates modern Next.js patterns with OpenRAG SDK integration:

1. **App Router** - Uses Next.js 16 App Router for file-based routing
2. **Server Components** - Leverages React Server Components for optimal performance
3. **API Routes** - Handles chat requests through Next.js API routes
4. **Streaming** - Implements Server-Sent Events for real-time responses
5. **Client Components** - Interactive UI with React hooks and state management

### Architecture

```
┌─────────────────────────────────────────┐
│         Next.js 16 Application          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      app/page.tsx (Home)        │   │
│  │    ┌─────────────────────┐      │   │
│  │    │   Chat Component    │      │   │
│  │    │  (Client Component) │      │   │
│  │    └─────────────────────┘      │   │
│  └─────────────────────────────────┘   │
│         │                               │
│         ▼                               │
│  ┌─────────────────────────────────┐   │
│  │    app/api/chat/route.ts        │   │
│  │    (API Route Handler)          │   │
│  └─────────────────────────────────┘   │
│         │                               │
│         ▼                               │
│  ┌─────────────────────────────────┐   │
│  │   lib/openrag-utils Library     │   │
│  │  (SDK Wrapper & Utilities)      │   │
│  └─────────────────────────────────┘   │
│         │                               │
└─────────┼───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│      OpenRAG SDK (TypeScript)           │
│    (Official OpenRAG Client)            │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         OpenRAG Backend Server          │
│   (Document Storage, Embeddings, LLM)   │
└─────────────────────────────────────────┘
```

---

## 🔧 Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Project Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
```

---

## 📚 Project Structure

```
typescript/
├── app/
│   ├── page.tsx                 # Home page (chat interface)
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   │
│   ├── chat/
│   │   ├── Chat.tsx             # Main chat component
│   │   └── README.md            # This file
│   │
│   └── api/
│       └── chat/
│           └── route.ts         # Chat API endpoint
│
├── lib/
│   └── openrag-utils/           # OpenRAG SDK utilities
│       ├── index.ts             # Exports
│       ├── chat.ts              # Chat operations
│       ├── search.ts            # Document search
│       ├── documents.ts         # Document management
│       ├── settings.ts          # Settings management
│       ├── knowledge-filters.ts # Filter operations
│       └── README.md            # Library documentation
│
├── public/                      # Static assets
├── package.json                 # Dependencies
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── .env                         # Environment variables (create this)
```

---

## 💡 Usage Tips

### Conversation Management

The chat interface automatically manages conversation context:

- Each chat session maintains its own history
- Follow-up questions use previous context
- Conversations persist across page refreshes (when using a database)

### Markdown Support

The chat renders full markdown including:

- **Bold** and *italic* text
- `Code blocks` with syntax highlighting
- Lists (ordered and unordered)
- Tables
- Links
- Blockquotes
- Images

### Streaming Responses

The application uses Server-Sent Events for real-time streaming:

- Tokens appear as they're generated
- Smooth, responsive user experience
- Efficient network usage
- Graceful error handling

---

## 🎨 Customization

### Styling

The chat interface uses CSS modules and global styles:

```typescript
// Customize in app/globals.css
.chat-container {
  /* Your custom styles */
}
```

### Components

The chat component is modular and can be customized:

```typescript
// app/chat/Chat.tsx
export default function Chat() {
  // Customize behavior, styling, and features
}
```

---

## 🔗 Related Documentation

- **[Main Project README](../../../README.md)** - Overview of all applications
- **[Python CLI Chat](../../../python/README.md)** - Terminal-based chat interface
- **[Battle Arena](../battle-arena/README.md)** - RPG battle simulator
- **[OpenRAG Utils Library](../../lib/openrag-utils/README.md)** - Detailed SDK utilities documentation
- **[OpenRAG GitHub](https://github.com/langflow-ai/openrag)** - Official OpenRAG repository
- **[Next.js Documentation](https://nextjs.org/docs)** - Next.js framework docs

---

## 🐛 Troubleshooting

### "Connection refused" error

Make sure your OpenRAG server is running:
```bash
# Check if server is accessible
curl http://localhost:3000/health
```

### "Invalid API key" error

Verify your API key in `.env`:
```bash
# Check your .env file
cat .env | grep OPENRAG_API_KEY
```

### Build errors

Ensure dependencies are installed:
```bash
npm install
```

### Port already in use

Change the port in `package.json` or kill the process:
```bash
# Find process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📄 License

This project is provided as-is for demonstration purposes.

---

<div align="center">

**Built with ❤️ using the OpenRAG SDK**

*Modern web chat, powered by RAG* 🚀

</div>