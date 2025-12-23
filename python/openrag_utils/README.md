# OpenRAG SDK Utilities

Modular utility functions for each OpenRAG SDK endpoint. Each module can be run independently to test specific functionality.

## Structure

```
openrag_utils/
├── __init__.py              # Package exports
├── settings.py              # Settings management
├── chat.py                  # Chat operations
├── search.py                # Document search
├── documents.py             # Document ingestion
├── knowledge_filters.py     # Knowledge filter management
└── README.md               # This file
```

## Usage

### As a Library

Import and use the utility functions in your code:

```python
from openrag_utils import get_settings, chat_simple, search_query

# Get settings
settings = await get_settings()

# Simple chat
response = await chat_simple("What is RAG?")

# Search documents
results = await search_query("machine learning", limit=5)
```

### As Standalone Scripts

Each module can be run independently to test endpoints:

```bash
# Test settings
python openrag_utils/settings.py

# Test chat
python openrag_utils/chat.py

# Test search
python openrag_utils/search.py

# Test documents
python openrag_utils/documents.py

# Test knowledge filters
python openrag_utils/knowledge_filters.py
```

## Modules

### settings.py
- `get_settings()` - Get current OpenRAG settings
- `update_settings(updates)` - Update settings

### chat.py
- `chat_simple(message, chat_id)` - Simple non-streaming chat
- `chat_streaming(message, chat_id)` - Streaming chat with events
- `list_conversations()` - List all conversations
- `get_conversation(chat_id)` - Get conversation details
- `delete_conversation(chat_id)` - Delete a conversation

### search.py
- `search_query(query, limit, score_threshold, filter_id)` - Search documents

### documents.py
- `ingest_document(file_path, wait)` - Ingest a document
- `delete_document(filename)` - Delete a document

### knowledge_filters.py
- `create_filter(name, description, query_data)` - Create a filter
- `search_filters(search_term)` - Search for filters
- `get_filter(filter_id)` - Get filter details
- `update_filter(filter_id, updates)` - Update a filter
- `delete_filter(filter_id)` - Delete a filter

## Configuration

All modules use environment variables from `.env`:

```bash
OPENRAG_URL=http://localhost:3000
OPENRAG_API_KEY=orag_...
```

## Testing

Each module includes a `main()` function that demonstrates its functionality:

```bash
# Run all tests
for module in settings chat search documents knowledge_filters; do
    echo "Testing $module..."
    python openrag_utils/$module.py
done
```

## Known Issues

- **Chat endpoints** require OpenAI API key to be configured in the OpenRAG backend
- **Search endpoints** require documents to be ingested and embedding model configured
- **Knowledge filters** may not be available in all OpenRAG deployments

## Integration

These utilities are designed to be used in the main application (`main.py`) and can be easily integrated into any Python project that uses the OpenRAG SDK.