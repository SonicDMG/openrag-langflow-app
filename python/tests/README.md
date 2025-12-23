# OpenRAG Python SDK Integration Tests

This directory contains comprehensive integration tests for the OpenRAG Python SDK.

## Overview

The test suite validates all major SDK functionality:
- **Settings**: Get and update configuration
- **Knowledge Filters**: Full CRUD operations + usage in chat/search
- **Documents**: Ingestion (sync/async) and deletion
- **Search**: Query operations
- **Chat**: Non-streaming, streaming (multiple methods), conversation management

## Prerequisites

1. **Running OpenRAG Instance**: Tests require a running OpenRAG server
2. **Environment Variables**: Configure in `.env` file (one level up from python directory)

## Configuration

### Environment Variables

```bash
# Required
OPENRAG_URL=http://localhost:8000  # Your OpenRAG instance URL

# Optional - to skip tests when no instance is available
SKIP_SDK_INTEGRATION_TESTS=true
```

### Test Dependencies

Install test dependencies:
```bash
cd python
uv pip install pytest pytest-asyncio httpx
```

Or install with the test extras:
```bash
cd python
uv pip install -e ".[test]"
```

## Running Tests

### Run All Tests
```bash
cd python
pytest tests/test_integration.py -v
```

### Run Specific Test Class
```bash
pytest tests/test_integration.py::TestChat -v
```

### Run Specific Test
```bash
pytest tests/test_integration.py::TestChat::test_chat_non_streaming -v
```

### Skip Tests (when no OpenRAG instance available)
```bash
SKIP_SDK_INTEGRATION_TESTS=true pytest tests/test_integration.py -v
```

## Test Structure

### Test Classes

- **TestSettings**: Settings endpoint operations
- **TestKnowledgeFilters**: Knowledge filter CRUD and usage
- **TestDocuments**: Document ingestion and deletion
- **TestSearch**: Search query operations
- **TestChat**: Chat operations (streaming, non-streaming, conversations)

### Fixtures

- `client`: Creates an OpenRAG client with auto-generated API key
- `test_file`: Creates a temporary test document with unique content

### API Key Management

Tests automatically create a test API key on first run and reuse it for all tests. The key is cached at the module level to avoid creating multiple keys.

## Expected Behavior

### With Running OpenRAG Instance
Tests should pass (or fail with meaningful errors if the API behavior differs from expectations).

### Without Running OpenRAG Instance
Tests will error with "Connection refused" - this is expected. Either:
1. Start your OpenRAG instance
2. Set `SKIP_SDK_INTEGRATION_TESTS=true` to skip tests

## Troubleshooting

### Connection Refused
```
httpx.ConnectError: [Errno 61] Connection refused
```
**Solution**: Start your OpenRAG instance or set `SKIP_SDK_INTEGRATION_TESTS=true`

### Authentication Required
```
pytest.skip: Cannot create API key - authentication required
```
**Solution**: Configure authentication for your OpenRAG instance

### Import Errors
```
ModuleNotFoundError: No module named 'pytest'
```
**Solution**: Install test dependencies: `uv pip install pytest pytest-asyncio httpx`

## CI/CD Integration

For CI/CD pipelines, set `SKIP_SDK_INTEGRATION_TESTS=true` if no OpenRAG instance is available, or configure a test instance.

Example GitHub Actions:
```yaml
- name: Run Integration Tests
  env:
    OPENRAG_URL: http://localhost:8000
    SKIP_SDK_INTEGRATION_TESTS: ${{ secrets.OPENRAG_URL == '' }}
  run: |
    cd python
    pytest tests/test_integration.py -v
```

## Test Coverage

The test suite covers:
- ✅ Settings management (get, update)
- ✅ Knowledge filters (create, read, update, delete, search)
- ✅ Knowledge filter usage in chat and search
- ✅ Document ingestion (with and without waiting)
- ✅ Document deletion
- ✅ Search queries
- ✅ Non-streaming chat
- ✅ Streaming chat (multiple methods)
- ✅ Chat conversation continuation
- ✅ Conversation management (list, get, delete)

Total: **18 test cases** across **8 test classes**