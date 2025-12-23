# Migration from Langflow API to OpenRAG SDK

## Summary

Successfully migrated the Python CLI application from using the Langflow API (via OpenAI Responses API) to the official OpenRAG Python SDK.

## Changes Made

### 1. Environment Variables (.env)
**Before:**
```
LANGFLOW_SERVER_URL=http://localhost:7860
LANGFLOW_API_KEY=sk-...
MODEL_ID=1098eea1-6649-4e1d-aed1-b77249fb8dd0
```

**After:**
```
OPENRAG_API_KEY=sk-...
# OPENRAG_URL defaults to http://localhost:3000 if not set
```

**Key Changes:**
- Removed `LANGFLOW_SERVER_URL` (replaced by `OPENRAG_URL` which defaults to http://localhost:3000)
- Renamed `LANGFLOW_API_KEY` to `OPENRAG_API_KEY`
- Removed `MODEL_ID` (not needed with OpenRAG SDK)

### 2. Dependencies (python/pyproject.toml)
**Before:**
```toml
dependencies = [
    "openai>=2.7.0",
    "python-dotenv>=1.2.0",
    "rich>=14.0.0",
]
```

**After:**
```toml
dependencies = [
    "openrag-sdk",
    "python-dotenv>=1.2.0",
    "rich>=14.0.0",
]
```

**Key Changes:**
- Replaced `openai` with `openrag-sdk`
- Updated version from 0.1.0 to 0.2.0
- Updated description to reflect OpenRAG usage

### 3. Main Application (python/main.py)
**Architecture Changes:**
- **Synchronous → Async/Await**: Converted entire application to use async/await pattern
- **Client Initialization**: Changed from `OpenAI(base_url=..., default_headers=...)` to `OpenRAGClient()`
- **Streaming API**: Changed from `client.responses.create()` to `client.chat.stream()`
- **Conversation Tracking**: Changed from `previous_response_id` to `chat_id`
- **Event Handling**: Changed from chunk-based to event-based streaming

**Before:**
```python
from openai import OpenAI

client = OpenAI(
    base_url=f"{LANGFLOW_SERVER_URL}/api/v1/",
    default_headers={"x-api-key": LANGFLOW_API_KEY},
    api_key="dummy-api-key"
)

stream = client.responses.create(
    model=model_id,
    input=user_input,
    stream=True,
    extra_body={"previous_response_id": previous_response_id}
)

for chunk in stream:
    delta = getattr(chunk, "delta", None)
    # Process delta...
```

**After:**
```python
from openrag_sdk import OpenRAGClient
import asyncio

async with OpenRAGClient() as client:
    async with client.chat.stream(message=user_input, chat_id=chat_id) as stream:
        async for event in stream:
            if event.type == "content":
                text = event.delta
                # Process text...
            elif event.type == "done":
                chat_id = event.chat_id
```

### 4. Utilities (python/utils.py)
**Key Changes:**
- Made `run_chat_session()` async
- Updated to use `OpenRAGClient` type hints
- Changed conversation tracking from `previous_response_id` to `chat_id`
- Updated error handling for async operations
- Maintained all Rich formatting and UI features

### 5. Documentation (README.md)
**Updated sections:**
- Project title and description
- Prerequisites (removed Langflow-specific requirements)
- Configuration instructions (new environment variables)
- Notes section (removed OpenAI API key mention)

## Benefits of Migration

1. **Simpler Configuration**: No need to manage MODEL_ID or construct base URLs
2. **Native Async**: More efficient I/O handling with async/await
3. **Better Type Safety**: SDK provides proper type hints
4. **Cleaner API**: Event-based streaming is more intuitive
5. **Future-Proof**: Access to additional SDK features (search, documents, settings, knowledge filters)

## Testing

To test the migrated application:

1. Ensure OpenRAG server is running on http://localhost:3000 (or set `OPENRAG_URL` in .env)
2. Set `OPENRAG_API_KEY` in .env file
3. Run the application:
   ```bash
   cd python
   uv run python main.py
   ```

## Backward Compatibility

This is a **breaking change**. The application no longer works with Langflow's API. To use this application:
- You must have an OpenRAG server running
- You must use OpenRAG API keys (not Langflow API keys)
- The server must be accessible at the configured URL (default: http://localhost:3000)

## Additional Features

### Centralized Configuration (config.py)
A new `config.py` module provides centralized configuration management:
- Automatic .env file loading from project root
- Type-safe access to configuration values
- Validation of required settings
- Support for multiple services (OpenRAG, EverArt, Astra DB)

### OpenRAG Utilities Package (openrag_utils/)
A comprehensive utilities package provides modular functions for all OpenRAG SDK endpoints:
- **chat.py**: Chat operations (simple, streaming, conversation management)
- **search.py**: Document search with filters
- **documents.py**: Document ingestion and management
- **settings.py**: Settings management
- **knowledge_filters.py**: Knowledge filter CRUD operations

Each module can be used as a library or run independently for testing. See `python/openrag_utils/README.md` for details.

## Migration Checklist

- [x] Update environment variables
- [x] Update dependencies in pyproject.toml
- [x] Refactor main.py to use OpenRAG SDK
- [x] Update utils.py for async operations
- [x] Remove MODEL_ID dependency
- [x] Update documentation
- [x] Install new dependencies
- [ ] Test with live OpenRAG server
- [ ] Verify conversation continuity works
- [ ] Verify streaming and Rich formatting work correctly

## Next Steps

1. **Test the application** with a running OpenRAG server
2. **Verify all features** work as expected (streaming, conversation continuity, markdown rendering)
3. **Consider adding** additional OpenRAG SDK features:
   - Search functionality
   - Document management
   - Knowledge filters
   - Settings management