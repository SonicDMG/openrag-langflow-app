"""
OpenRAG Chat Application - OpenRAG SDK Integration

This module demonstrates the usage of the OpenRAG Python SDK to create
an interactive chat interface with streaming responses.
"""
import asyncio
import os
import httpx
from dotenv import set_key
from openrag_sdk import OpenRAGClient

from config import config
from utils import render_streaming_response, run_chat_session


def get_or_create_api_key() -> str:
    """
    Get existing API key from environment or create a new one.

    If OPENRAG_API_KEY is not set in .env, this will:
    1. Create a new API key via the OpenRAG backend
    2. Save it to .env for future use
    3. Return the API key

    Returns:
        str: The API key to use
    """
    # Check if we already have an API key
    api_key = config.OPENRAG_API_KEY
    if api_key:
        print("✓ Using existing API key from .env")
        return api_key

    # Need to create a new API key
    base_url = config.OPENRAG_URL
    print(f"Creating new API key at {base_url}...")

    try:
        response = httpx.post(
            f"{base_url}/keys",
            json={"name": "OpenRAG CLI"},
            timeout=30.0,
        )

        if response.status_code != 200:
            raise Exception(f"Failed to create API key: {response.text}")

        api_key = response.json()["api_key"]

        # Save to .env file for future use
        env_file = config.get_env_path()

        if env_file.exists():
            set_key(str(env_file), "OPENRAG_API_KEY", api_key)
            print(f"✓ Created and saved new API key to {env_file}")
        else:
            print(f"✓ Created new API key: {api_key}")
            print(f"⚠ No .env file found - add OPENRAG_API_KEY={api_key} to .env to persist")

        # Set in current environment
        os.environ["OPENRAG_API_KEY"] = api_key
        return api_key

    except Exception as e:
        print(f"✗ Error creating API key: {e}")
        print(f"Please ensure OpenRAG backend is running at {base_url}")
        raise


async def stream_response(client: OpenRAGClient, user_input: str,
                         chat_id: str | None = None, on_chunk=None):
    """
    Stream a response from OpenRAG using the SDK's chat streaming.

    This uses the OpenRAG SDK's streaming API:
    - client.chat.stream() context manager for streaming
    - Iterating through streaming events
    - Extracting chat IDs for conversation continuity
    
    Args:
        client: OpenRAG client instance
        user_input: The user's question
        chat_id: Optional chat ID from previous message to continue conversation
        on_chunk: Optional callback function(text) called for each chunk of text

    Returns:
        tuple: (chat_id, accumulated_text)
    """
    accumulated = ""
    final_chat_id = chat_id
    stream_obj = None

    try:
        # Use the OpenRAG SDK's streaming context manager
        async with client.chat.stream(message=user_input, chat_id=chat_id) as stream:
            stream_obj = stream
            # Process streaming events with graceful error handling
            try:
                async for event in stream:
                    if event.type == "content":
                        # Extract text delta from content events
                        text = getattr(event, 'delta', None)
                        if text:
                            accumulated += text
                            # Call the callback if provided (for real-time rendering)
                            if on_chunk:
                                on_chunk(accumulated)
                    elif event.type == "done":
                        # Extract chat_id when stream completes
                        final_chat_id = getattr(event, 'chat_id', chat_id)
                    elif event.type == "error":
                        # Handle error events from the stream
                        error_msg = getattr(event, 'error', 'Unknown error')
                        raise Exception(f"Stream error: {error_msg}")
                    # Ignore other event types (sources, etc.)
            except (StopAsyncIteration, GeneratorExit):
                # Normal end of stream
                pass
            except Exception as stream_error:
                # Check if this is the "incomplete chunked read" error
                error_str = str(stream_error).lower()
                if "peer closed" in error_str or "incomplete chunked" in error_str:
                    # This is the known issue - stream ended but we got content
                    if accumulated:
                        # We have content, so this is actually successful
                        # Try to get chat_id from stream object
                        if hasattr(stream, 'chat_id') and stream.chat_id:
                            final_chat_id = stream.chat_id
                        # Don't raise error, just return what we have
                        pass
                    else:
                        # No content received, this is a real error
                        raise
                else:
                    # Different error, re-raise
                    raise

            # After iteration, try to get chat_id from stream object if we don't have it
            if not final_chat_id or final_chat_id == chat_id:
                if hasattr(stream, 'chat_id') and stream.chat_id:
                    final_chat_id = stream.chat_id

    except Exception as e:
        # If we have accumulated content, return it despite the error
        if accumulated and stream_obj:
            # Try one more time to get chat_id
            if hasattr(stream_obj, 'chat_id') and stream_obj.chat_id:
                final_chat_id = stream_obj.chat_id
            return final_chat_id, accumulated
        # Otherwise re-raise with more context
        raise Exception(f"Streaming error: {str(e)}") from e

    return final_chat_id, accumulated


async def main():
    """
    Main entry point demonstrating the OpenRAG SDK integration.

    This showcases the core connection pattern:
    1. Get or create API key (auto-generates if not in .env)
    2. Initialize OpenRAG client with the API key
    3. Use async context manager for proper resource management
    4. Stream responses using client.chat.stream()
    5. Handle conversation continuity via chat IDs
    """
    # Get or create API key (will auto-generate and save to .env if needed)
    api_key = get_or_create_api_key()

    # Initialize the OpenRAG client with the API key
    # Client auto-discovers OPENRAG_URL from environment
    async with OpenRAGClient(api_key=api_key) as client:
        # Run the interactive chat session
        await run_chat_session(client, stream_response, render_streaming_response)


if __name__ == "__main__":
    asyncio.run(main())
