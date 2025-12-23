# TypeScript OpenRAG SDK Migration

This document describes the migration from using the OpenAI SDK with Langflow to using the official OpenRAG TypeScript SDK.

## Overview

**Before:** Direct API calls using OpenAI SDK configured for Langflow's OpenAI-compatible API  
**After:** Official OpenRAG SDK with utility wrappers for common operations

## Changes Made

### 1. Created OpenRAG Utilities Library

Created `lib/openrag-utils/` with utility wrappers for all OpenRAG SDK endpoints:

```
lib/openrag-utils/
├── chat.ts              # Chat operations
├── search.ts            # Document search
├── documents.ts         # Document ingestion
├── settings.ts          # Settings management
├── knowledge-filters.ts # Knowledge filter management
├── index.ts             # Exports
└── README.md           # Documentation
```

### 2. Migrated Chat API Route

**Before (`app/api/chat/route.ts`):**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: `${langflowServerUrl}/api/v1/`,
  defaultHeaders: { 'x-api-key': langflowApiKey },
  apiKey: 'dummy-api-key',
});

const stream = await client.responses.create({
  model: modelId,
  input: message,
  stream: true,
  previous_response_id: previousResponseId
});
```

**After:**
```typescript
import { OpenRAGClient } from 'openrag-sdk';

const client = new OpenRAGClient();

const stream = await client.chat.stream({
  message,
  chatId: previousResponseId || undefined
});
```

### 3. Key Improvements

1. **Simplified Configuration**
   - No need for Langflow-specific URLs and model IDs
   - Auto-discovers `OPENRAG_API_KEY` and `OPENRAG_URL` from environment
   - No dummy API keys required

2. **Better Type Safety**
   - Full TypeScript support with proper types
   - Typed events: `ContentEvent`, `SourcesEvent`, `DoneEvent`
   - Typed responses and errors

3. **Cleaner Code**
   - Removed custom response ID extraction logic
   - SDK handles conversation continuity via `chatId`
   - Built-in streaming support with proper cleanup

4. **Consistent API**
   - Matches Python SDK implementation
   - Same patterns across all endpoints
   - Reusable utility functions

## Environment Variables

### Before
```bash
LANGFLOW_SERVER_URL=http://localhost:3000
LANGFLOW_API_KEY=your-api-key
```

### After
```bash
OPENRAG_URL=http://localhost:3000
OPENRAG_API_KEY=orag_your-api-key
```

## Migration Steps

1. ✅ Installed `openrag-sdk` npm package (already in package.json v0.1.0)
2. ✅ Created utility wrappers in `lib/openrag-utils/`
3. ✅ Updated chat API route to use OpenRAG SDK
4. ✅ Maintained existing SSE streaming format for frontend compatibility
5. ✅ Preserved conversation continuity via chatId mapping

## Testing

The migration maintains full backward compatibility with the existing frontend:

- Same SSE event format (`type: 'chunk'`, `type: 'done'`, `type: 'error'`)
- Same conversation continuity mechanism (previousResponseId → chatId)
- Same streaming behavior and error handling

To test:
```bash
cd typescript
npm run dev
```

Then open http://localhost:3001 and test the chat interface.

## Utility Functions

The new utility wrappers can be used throughout the application:

```typescript
import { chatSimple, searchQuery, getSettings } from '@/lib/openrag-utils';

// Simple chat
const response = await chatSimple('What is RAG?');

// Search documents
const results = await searchQuery('machine learning', 5);

// Get settings
const settings = await getSettings();
```

## Future Enhancements

With the OpenRAG SDK in place, we can now easily add:

1. **Document Management**
   - Upload documents via API
   - Delete documents
   - Track ingestion status

2. **Knowledge Filters**
   - Create reusable search filters
   - Apply filters to chat and search
   - Manage filter configurations

3. **Settings Management**
   - Update LLM models
   - Configure embedding models
   - Adjust chunk sizes

4. **Advanced Search**
   - Semantic search with filters
   - Score thresholds
   - Document type filtering

## Comparison with Python Implementation

The TypeScript migration follows the same pattern as the Python implementation:

| Aspect | Python | TypeScript |
|--------|--------|------------|
| SDK Package | `openrag-sdk` (pip) | `openrag-sdk` (npm) |
| Utilities Location | `python/openrag_utils/` | `typescript/lib/openrag-utils/` |
| Configuration | Environment variables | Environment variables |
| Streaming | `async with client.chat.stream()` | `await client.chat.stream()` |
| Conversation ID | `chat_id` | `chatId` |

## Breaking Changes

None! The migration is fully backward compatible with the existing frontend implementation.

## Rollback

If needed, the previous implementation can be restored by:

1. Reverting `app/api/chat/route.ts` to use OpenAI SDK
2. Keeping the utility wrappers for future use
3. Switching environment variables back to `LANGFLOW_*`

However, the new implementation is recommended for:
- Better maintainability
- Consistent API across Python and TypeScript
- Access to all OpenRAG features
- Improved type safety

## Resources

- [OpenRAG TypeScript SDK Documentation](../lib/openrag_typescript_sdk.md)
- [Utility Functions README](../lib/openrag-utils/README.md)
- [Python Migration Summary](../../MIGRATION_SUMMARY.md)

## Summary

The TypeScript migration successfully brings the OpenRAG SDK to the Next.js application, matching the pattern established in the Python implementation. The chat functionality now uses the official SDK while maintaining full compatibility with the existing frontend.