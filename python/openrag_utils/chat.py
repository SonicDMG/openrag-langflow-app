"""
OpenRAG Chat Utilities

Functions for chat operations including simple chat, streaming, and conversation management.
Can be run as a standalone script to test chat endpoints.
"""
import asyncio
from typing import Optional

from openrag_sdk import OpenRAGClient

from config import config


async def chat_simple(message: str, chat_id: Optional[str] = None, client: Optional[OpenRAGClient] = None) -> dict:
    """
    Send a simple non-streaming chat message.

    Args:
        message: The message to send
        chat_id: Optional chat ID to continue a conversation
        client: Optional OpenRAGClient instance

    Returns:
        dict: Response with 'response', 'chat_id', and 'sources'
    """
    if client:
        response = await client.chat.create(message=message, chat_id=chat_id)
        return {
            "response": response.response,
            "chat_id": response.chat_id,
            "sources": response.sources
        }

    async with OpenRAGClient() as client:
        response = await client.chat.create(message=message, chat_id=chat_id)
        return {
            "response": response.response,
            "chat_id": response.chat_id,
            "sources": response.sources
        }


async def chat_streaming(message: str, chat_id: Optional[str] = None, client: Optional[OpenRAGClient] = None):
    """
    Send a streaming chat message and yield events.

    Args:
        message: The message to send
        chat_id: Optional chat ID to continue a conversation
        client: Optional OpenRAGClient instance

    Yields:
        Event objects with type, delta, sources, chat_id, etc.
    """
    if client:
        async with client.chat.stream(message=message, chat_id=chat_id) as stream:
            async for event in stream:
                yield event
            # Return final data
            yield {
                "type": "final",
                "text": stream.text,
                "chat_id": stream.chat_id,
                "sources": stream.sources
            }
    else:
        async with OpenRAGClient() as client:
            async with client.chat.stream(message=message, chat_id=chat_id) as stream:
                async for event in stream:
                    yield event
                # Return final data
                yield {
                    "type": "final",
                    "text": stream.text,
                    "chat_id": stream.chat_id,
                    "sources": stream.sources
                }


async def list_conversations(client: Optional[OpenRAGClient] = None) -> list:
    """
    List all conversations.

    Args:
        client: Optional OpenRAGClient instance

    Returns:
        list: List of conversation dictionaries
    """
    if client:
        result = await client.chat.list()
        return result.conversations

    async with OpenRAGClient() as client:
        result = await client.chat.list()
        return result.conversations


async def get_conversation(chat_id: str, client: Optional[OpenRAGClient] = None) -> dict:
    """
    Get a specific conversation with its messages.

    Args:
        chat_id: The conversation ID
        client: Optional OpenRAGClient instance

    Returns:
        dict: Conversation data with messages
    """
    if client:
        conversation = await client.chat.get(chat_id)
        return {
            "chat_id": conversation.chat_id,
            "title": conversation.title,
            "messages": conversation.messages
        }

    async with OpenRAGClient() as client:
        conversation = await client.chat.get(chat_id)
        return {
            "chat_id": conversation.chat_id,
            "title": conversation.title,
            "messages": conversation.messages
        }


async def delete_conversation(chat_id: str, client: Optional[OpenRAGClient] = None) -> bool:
    """
    Delete a conversation.

    Args:
        chat_id: The conversation ID to delete
        client: Optional OpenRAGClient instance

    Returns:
        bool: True if successful
    """
    if client:
        await client.chat.delete(chat_id)
        return True

    async with OpenRAGClient() as client:
        await client.chat.delete(chat_id)
        return True


async def main():
    """Test chat endpoints"""
    api_key = config.OPENRAG_API_KEY
    url = config.OPENRAG_URL

    print(f'Using API Key: {api_key[:20] if api_key else "NOT SET"}...')
    print(f'Using URL: {url}\n')

    # Simple chat
    print('=== Simple Chat ===')
    response = await chat_simple("Hello! What is RAG?")
    print(f"Response: {response['response'][:200]}...")
    print(f"Chat ID: {response['chat_id']}")
    print(f"Sources: {len(response['sources'])}")
    print()

    # Streaming chat
    print('=== Streaming Chat ===')
    print("Response: ", end="", flush=True)
    async for event in chat_streaming("Explain it briefly"):
        event_type = getattr(event, 'type', event.get('type') if isinstance(event, dict) else None)
        if event_type == "content":
            delta = getattr(event, 'delta', event.get('delta') if isinstance(event, dict) else '')
            print(delta, end="", flush=True)
        elif event_type == "done":
            chat_id = getattr(event, 'chat_id', event.get('chat_id') if isinstance(event, dict) else None)
            print(f"\nChat ID: {chat_id}")
    print()

    # List conversations
    print('=== List Conversations ===')
    conversations = await list_conversations()
    print(f"Total conversations: {len(conversations)}")
    for conv in conversations[:3]:
        print(f"  - {conv.chat_id}: {conv.title}")
    print()


if __name__ == '__main__':
    asyncio.run(main())

# Made with Bob
