# 💬 OpenRAG Python CLI Chat

> **Terminal-based chat interface powered by the OpenRAG SDK**

[![Python](https://img.shields.io/badge/Python-3.13+-blue?style=flat-square&logo=python)](https://python.org)
[![OpenRAG SDK](https://img.shields.io/badge/OpenRAG-SDK-purple?style=flat-square)](https://github.com/langflow-ai/openrag)

A terminal chat application with streaming responses, rich markdown rendering, and a comprehensive utility library for all OpenRAG SDK operations. Chat with your RAG-powered assistant right from your command line.

---

## ✨ Features

- **🌊 Real-Time Streaming** - Watch responses appear token-by-token for a responsive chat experience
- **📝 Rich Markdown** - Beautiful rendering with syntax highlighting, tables, lists, and clickable links
- **💬 Conversation Context** - Maintains chat history across multiple turns for coherent conversations
- **🔧 Modular SDK Utilities** - Complete `openrag_utils` package for all OpenRAG endpoints
- **⚡ Lightning Fast Setup** - Get chatting in under 2 minutes
- **🎨 Terminal UI** - Clean, colorful interface powered by Rich library

---

## 🚀 Quick Start

### Prerequisites

- Python 3.13 or higher
- OpenRAG server running (default: `http://localhost:3000`)
- OpenRAG API key

### Installation

```bash
# Navigate to the python directory
cd python

# Install with uv (recommended)
uv sync

# Or install with pip
pip install -e .
```

### Configuration

Create a `.env` file in the `python` directory:

```bash
# Required
OPENRAG_API_KEY=orag_your_api_key_here

# Optional (defaults shown)
OPENRAG_URL=http://localhost:3000
```

### Run the Chat

```bash
# With uv
uv run python main.py

# Or with python directly
python main.py
```

That's it! Start chatting with your RAG-powered assistant. 🎉

---

## 📦 OpenRAG Utils Package

The Python app includes a comprehensive utility library that wraps all OpenRAG SDK endpoints. Use it in your own projects or as a reference implementation.

### Package Structure

```
openrag_utils/
├── __init__.py              # Convenient imports
├── chat.py                  # Chat operations
├── search.py                # Document search
├── documents.py             # Document ingestion
├── settings.py              # Settings management
├── knowledge_filters.py     # Knowledge filter CRUD
└── README.md               # Detailed documentation
```

### Usage Examples

#### Simple Chat

```python
from openrag_utils import chat_simple

# Send a message and get a complete response
response = await chat_simple(
    message="What is Retrieval-Augmented Generation?",
    chat_id="my-conversation"
)
print(response)
```

#### Streaming Chat

```python
from openrag_utils import chat_streaming

# Stream responses token-by-token
async for event in chat_streaming(
    message="Explain RAG in detail",
    chat_id="my-conversation"
):
    if event["type"] == "content":
        print(event["content"], end="", flush=True)
```

#### Document Search

```python
from openrag_utils import search_query

# Search your knowledge base
results = await search_query(
    query="machine learning best practices",
    limit=5,
    score_threshold=0.7
)

for result in results:
    print(f"Score: {result['score']}")
    print(f"Content: {result['content']}")
```

#### Document Ingestion

```python
from openrag_utils import ingest_document

# Add documents to your knowledge base
await ingest_document(
    file_path="./docs/guide.pdf",
    wait=True  # Wait for processing to complete
)
```

#### Knowledge Filters

```python
from openrag_utils import create_filter, search_filters

# Create a filter for specific topics
filter_id = await create_filter(
    name="Python Documentation",
    description="Filter for Python-related content",
    query_data={"tags": ["python", "programming"]}
)

# Search with the filter
results = await search_query(
    query="async functions",
    filter_id=filter_id
)
```

### Available Functions

| Module | Functions |
|--------|-----------|
| **chat.py** | `chat_simple()`, `chat_streaming()`, `list_conversations()`, `get_conversation()`, `delete_conversation()` |
| **search.py** | `search_query()` |
| **documents.py** | `ingest_document()`, `delete_document()` |
| **settings.py** | `get_settings()`, `update_settings()` |
| **knowledge_filters.py** | `create_filter()`, `search_filters()`, `get_filter()`, `update_filter()`, `delete_filter()` |

📖 **[Full OpenRAG Utils Documentation](openrag_utils/README.md)**

---

## 🎯 How It Works

The CLI chat application demonstrates best practices for OpenRAG SDK integration:

1. **Client Initialization** - Creates an `OpenRAGClient` with your API key
2. **Streaming Events** - Processes server-sent events for real-time responses
3. **Rich Rendering** - Uses the Rich library to display markdown beautifully
4. **Conversation Management** - Maintains chat context across multiple turns
5. **Error Handling** - Gracefully handles network issues and API errors

### Architecture

```
┌─────────────────────────────────────────┐
│         Python CLI Application          │
│                                         │
│  ┌─────────────┐    ┌───────────────┐  │
│  │   main.py   │───▶│   utils.py    │  │
│  │  (CLI UI)   │    │  (Streaming)  │  │
│  └─────────────┘    └───────────────┘  │
│         │                               │
│         ▼                               │
│  ┌─────────────────────────────────┐   │
│  │      openrag_utils Package      │   │
│  │  (SDK Wrapper & Utilities)      │   │
│  └─────────────────────────────────┘   │
│         │                               │
└─────────┼───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         OpenRAG SDK (Python)            │
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
# Install test dependencies
uv sync --extra test

# Run all tests
pytest

# Run with coverage
pytest --cov=openrag_utils --cov-report=html
```

### Code Quality

```bash
# Install dev dependencies
uv sync --extra dev

# Format and lint
ruff check .
ruff format .
```

### Testing Individual Modules

Each module in `openrag_utils` can be run standalone for testing:

```bash
# Test settings endpoint
python openrag_utils/settings.py

# Test chat functionality
python openrag_utils/chat.py

# Test document search
python openrag_utils/search.py

# Test document ingestion
python openrag_utils/documents.py

# Test knowledge filters
python openrag_utils/knowledge_filters.py
```

---

## 📚 Project Structure

```
python/
├── main.py                      # CLI application entrypoint
├── utils.py                     # Streaming & rendering utilities
├── config.py                    # Configuration management
├── pyproject.toml               # Dependencies & project config
├── README.md                    # This file
├── .env                         # Environment variables (create this)
│
├── openrag_utils/               # OpenRAG SDK utilities package
│   ├── __init__.py              # Package exports
│   ├── chat.py                  # Chat operations
│   ├── search.py                # Document search
│   ├── documents.py             # Document management
│   ├── settings.py              # Settings management
│   ├── knowledge_filters.py     # Filter operations
│   └── README.md               # Package documentation
│
└── tests/                       # Test suite
    ├── test_all_utils.py        # Unit tests
    └── test_integration.py      # Integration tests
```

---

## 💡 Usage Tips

### Conversation Management

The CLI automatically manages conversation context. Each session gets a unique chat ID, allowing you to:

- Continue conversations across multiple messages
- Maintain context for follow-up questions
- Get coherent, contextual responses

### Markdown Support

The CLI renders full markdown including:

- **Bold** and *italic* text
- `Code blocks` with syntax highlighting
- Lists (ordered and unordered)
- Tables
- Links (clickable in supported terminals)
- Blockquotes

### Keyboard Shortcuts

- `Ctrl+C` - Exit the application
- `Ctrl+D` - End input (alternative to pressing Enter)

---

## 🔗 Related Documentation

- **[Main Project README](../README.md)** - Overview of all applications
- **[TypeScript Chat App](../typescript/app/chat/README.md)** - Web-based chat interface
- **[Battle Arena](../typescript/app/battle-arena/README.md)** - RPG battle simulator
- **[OpenRAG Utils Package](openrag_utils/README.md)** - Detailed SDK utilities documentation
- **[OpenRAG GitHub](https://github.com/langflow-ai/openrag)** - Official OpenRAG repository

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

### Import errors

Ensure dependencies are installed:
```bash
uv sync
# or
pip install -e .
```

---

## 📄 License

This project is provided as-is for demonstration purposes.

---

<div align="center">

**Built with ❤️ using the OpenRAG SDK**

*Bringing RAG to your terminal, one token at a time* 🚀

</div>