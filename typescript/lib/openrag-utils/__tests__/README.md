# OpenRAG Utils Test Suite

This directory contains comprehensive tests for the OpenRAG utility functions that wrap the OpenRAG SDK.

## Test Coverage

All tests mock the OpenRAG SDK to ensure we're testing our utility layer without depending on the actual SDK implementation or external services.

### Test Files

- **`knowledge-filters.test.ts`** - Tests for knowledge filter CRUD operations
  - Creating filters with various configurations
  - Searching filters with queries and limits
  - Getting, updating, and deleting filters
  - Error handling for SDK failures
  - Custom client instance support

- **`chat.test.ts`** - Tests for chat operations
  - Simple (non-streaming) chat messages
  - Streaming chat with event handling
  - Conversation management (list, get, delete)
  - Chat ID continuation for multi-turn conversations
  - Stream cleanup and error handling

- **`search.test.ts`** - Tests for document search
  - Basic semantic search queries
  - Custom limits and score thresholds
  - Filter application (filterId and filters)
  - Complex filter scenarios
  - Parameter validation

- **`documents.test.ts`** - Tests for document operations
  - Document ingestion (file path and File object)
  - Synchronous and asynchronous ingestion
  - Document deletion
  - Various file types (PDF, DOCX, TXT)
  - Error handling for invalid files

- **`settings.test.ts`** - Tests for settings management
  - Getting current settings
  - Updating agent settings (LLM provider, model)
  - Updating knowledge settings (embedding, chunking)
  - Partial and full updates
  - Configuration validation

- **`index.test.ts`** - Tests for module exports
  - Verifies all functions are properly exported
  - Ensures no unexpected exports

## Running Tests

Run all OpenRAG utils tests:
```bash
npm test -- lib/openrag-utils/__tests__
```

Run with coverage:
```bash
npm test -- lib/openrag-utils/__tests__ --coverage --collectCoverageFrom="lib/openrag-utils/**/*.ts" --coveragePathIgnorePatterns="__tests__"
```

Run a specific test file:
```bash
npm test -- lib/openrag-utils/__tests__/chat.test.ts
```

## Test Strategy

### Mocking Approach
- All tests use `jest.mock('openrag-sdk')` to mock the SDK
- Each test creates a fresh mock client with mocked methods
- Tests verify that SDK methods are called with correct parameters
- Tests validate that responses are handled correctly
- No actual HTTP requests are made

### Coverage Goals
- ✅ All exported functions are tested
- ✅ SDK method calls are verified with correct parameters
- ✅ Response handling is validated
- ✅ Error cases are covered
- ✅ Custom client instances are supported
- ⚠️ Standalone script execution (`main()` functions) not covered (lines 105-161 in most files)

### What's NOT Tested
- The OpenRAG SDK itself (that's the SDK's responsibility)
- Actual HTTP requests to OpenRAG services
- Network connectivity
- Authentication with real API keys
- Standalone script execution (main functions)

## Test Results

Latest test run (117 tests):
- ✅ All tests passing
- ✅ 6 test suites
- ✅ 117 total tests
- ✅ 100% coverage on index.ts
- ⚠️ ~21-52% coverage on utility files (uncovered lines are standalone script code)

## Key Testing Patterns

### 1. SDK Method Verification
```typescript
expect(mockClient.chat.create).toHaveBeenCalledWith({
  message: 'test',
  chatId: undefined
});
```

### 2. Response Handling
```typescript
const mockResponse = { response: 'test', chatId: 'chat-123', sources: [] };
mockChat.create.mockResolvedValue(mockResponse);
const result = await chatSimple('test');
expect(result).toEqual(mockResponse);
```

### 3. Error Propagation
```typescript
const sdkError = new Error('SDK error');
mockChat.create.mockRejectedValue(sdkError);
await expect(chatSimple('test')).rejects.toThrow('SDK error');
```

### 4. Custom Client Support
```typescript
const customClient = { chat: { create: jest.fn() } } as any;
await chatSimple('test', undefined, customClient);
expect(customClient.chat.create).toHaveBeenCalled();
```

## Notes

- Console logs from `knowledge-filters.ts` appear during tests (lines 44, 47, 62, 65) - these are debug logs that don't affect test results
- The uncovered lines (105-161 range) in most files are the `main()` functions used for standalone script execution
- All core functionality is fully tested with proper SDK mocking
- No HTTP fallback code exists in the utilities (removed as per requirements)