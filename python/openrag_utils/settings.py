"""
OpenRAG Settings Utilities

Functions for getting and updating OpenRAG settings.
Can be run as a standalone script to test settings endpoints.
"""
import asyncio
import json
from typing import Optional

from openrag_sdk import OpenRAGClient

from config import config


async def get_settings(client: Optional[OpenRAGClient] = None) -> dict:
    """
    Get current OpenRAG settings.

    Args:
        client: Optional OpenRAGClient instance. If not provided, creates a new one.

    Returns:
        dict: Settings dictionary with agent and knowledge configuration
    """
    if client:
        settings = await client.settings.get()
        return settings.model_dump()

    async with OpenRAGClient() as client:
        settings = await client.settings.get()
        return settings.model_dump()


async def update_settings(updates: dict, client: Optional[OpenRAGClient] = None) -> dict:
    """
    Update OpenRAG settings.

    Args:
        updates: Dictionary of settings to update (e.g., {"chunk_size": 1000})
        client: Optional OpenRAGClient instance. If not provided, creates a new one.

    Returns:
        dict: Updated settings
    """
    if client:
        result = await client.settings.update(updates)
        return result.model_dump()  # type: ignore

    async with OpenRAGClient() as client:
        result = await client.settings.update(updates)
        return result.model_dump()  # type: ignore


async def main():
    """Test settings endpoints"""
    api_key = config.OPENRAG_API_KEY
    url = config.OPENRAG_URL

    print(f'Using API Key: {api_key[:20] if api_key else "NOT SET"}...')
    print(f'Using URL: {url}\n')

    # Get current settings
    print('=== Current Settings ===')
    settings = await get_settings()
    print(json.dumps(settings, indent=2))
    print()

    # Example: Update settings (commented out to avoid accidental changes)
    # print('=== Updating Settings ===')
    # updated = await update_settings({"chunk_size": 1000, "chunk_overlap": 200})
    # print(json.dumps(updated, indent=2))


if __name__ == '__main__':
    asyncio.run(main())

# Made with Bob
