# OpenRAG SDK Utilities

Modular utility functions for each OpenRAG SDK endpoint. Each module can be run independently to test specific functionality.

## Structure

```
openrag-utils/
├── index.ts                 # Package exports
├── settings.ts              # Settings management
├── chat.ts                  # Chat operations
├── search.ts                # Document search
├── documents.ts             # Document ingestion
├── knowledge-filters.ts     # Knowledge filter management
└── README.md               # This file
```

## Usage

### As a Library

Import and use the utility functions in your code:

```typescript
import { getSettings, chatSimple, searchQuery } from '@/lib/openrag-utils';

// Get settings
const settings = await getSettings();

// Simple chat
const response = await chatSimple('What is RAG?');

// Search documents
const results = await searchQuery('machine learning', 5);
```

### As Standalone Scripts

Each module can be run independently to test endpoints:

```bash
# Test settings
npx tsx lib/openrag-utils/settings.ts

# Test chat
npx tsx lib/openrag-utils/chat.ts

# Test search
npx tsx lib/openrag-utils/search.ts

# Test documents
npx tsx lib/openrag-utils/documents.ts

# Test knowledge filters
npx tsx lib/openrag-utils/knowledge-filters.ts
```

## Modules

### settings.ts
- `getSettings()` - Get current OpenRAG settings
- `updateSettings(updates)` - Update settings

### chat.ts
- `chatSimple(message, chatId)` - Simple non-streaming chat
- `chatStreaming(message, chatId)` - Streaming chat with events
- `listConversations()` - List all conversations
- `getConversation(chatId)` - Get conversation details
- `deleteConversation(chatId)` - Delete a conversation

### search.ts
- `searchQuery(query, limit, scoreThreshold, filterId, filters)` - Search documents

### documents.ts
- `ingestDocument(options)` - Ingest a document
- `deleteDocument(filename)` - Delete a document

### knowledge-filters.ts
- `createFilter(options)` - Create a filter
- `searchFilters(searchTerm)` - Search for filters
- `getFilter(filterId)` - Get filter details
- `updateFilter(filterId, updates)` - Update a filter
- `deleteFilter(filterId)` - Delete a filter

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
for module in settings chat search documents knowledge-filters; do
    echo "Testing $module..."
    npx tsx lib/openrag-utils/$module.ts
done
```

## Integration

These utilities are designed to be used in the Next.js application and can be easily integrated into any TypeScript project that uses the OpenRAG SDK.

## Example: Using in API Routes

```typescript
// app/api/chat/route.ts
import { chatStreaming } from '@/lib/openrag-utils';

export async function POST(request: Request) {
  const { message, chatId } = await request.json();
  
  // Use the utility function
  for await (const event of chatStreaming(message, chatId)) {
    if (event.type === 'content') {
      // Handle streaming content
    }
  }
}
```

## Known Issues

- **Chat endpoints** require OpenAI API key to be configured in the OpenRAG backend
- **Search endpoints** require documents to be ingested and embedding model configured
- **Knowledge filters** may not be available in all OpenRAG deployments