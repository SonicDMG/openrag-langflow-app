"""
OpenRAG Knowledge Filters Utilities

Functions for creating and managing knowledge filters.
Can be run as a standalone script to test knowledge filter endpoints.
"""
import asyncio
from typing import Optional

from openrag_sdk import OpenRAGClient
from openrag_sdk.models import KnowledgeFilter

from config import config


async def create_filter(
    name: str,
    description: str,
    query_data: dict,
    client: Optional[OpenRAGClient] = None
) -> str:
    """
    Create a new knowledge filter.

    Args:
        name: Filter name
        description: Filter description
        query_data: Query configuration dict with query, filters, limit, scoreThreshold
        client: Optional OpenRAGClient instance

    Returns:
        str: The created filter ID
    """
    filter_config = {
        "name": name,
        "description": description,
        "queryData": query_data
    }

    if client:
        result = await client.knowledge_filters.create(filter_config)
        return result.id  # type: ignore

    async with OpenRAGClient() as client:
        result = await client.knowledge_filters.create(filter_config)
        return result.id  # type: ignore


async def search_filters(
    search_term: str,
    client: Optional[OpenRAGClient] = None
) -> list:
    """
    Search for knowledge filters by name.

    Args:
        search_term: Term to search for in filter names
        client: Optional OpenRAGClient instance

    Returns:
        list: List of matching filters
    """
    if client:
        filters = await client.knowledge_filters.search(search_term)
        return filters

    async with OpenRAGClient() as client:
        filters = await client.knowledge_filters.search(search_term)
        return filters


async def get_filter(
    filter_id: str,
    client: Optional[OpenRAGClient] = None
) -> Optional[KnowledgeFilter]:
    """
    Get a specific knowledge filter.

    Args:
        filter_id: The filter ID
        client: Optional OpenRAGClient instance

    Returns:
        KnowledgeFilter: Filter object or None if not found
    """
    if client:
        return await client.knowledge_filters.get(filter_id)

    async with OpenRAGClient() as client:
        return await client.knowledge_filters.get(filter_id)


async def update_filter(
    filter_id: str,
    updates: dict,
    client: Optional[OpenRAGClient] = None
) -> bool:
    """
    Update a knowledge filter.

    Args:
        filter_id: The filter ID to update
        updates: Dictionary of fields to update
        client: Optional OpenRAGClient instance

    Returns:
        bool: True if successful
    """
    if client:
        await client.knowledge_filters.update(filter_id, updates)
        return True

    async with OpenRAGClient() as client:
        await client.knowledge_filters.update(filter_id, updates)
        return True


async def delete_filter(
    filter_id: str,
    client: Optional[OpenRAGClient] = None
) -> bool:
    """
    Delete a knowledge filter.

    Args:
        filter_id: The filter ID to delete
        client: Optional OpenRAGClient instance

    Returns:
        bool: True if successful
    """
    if client:
        await client.knowledge_filters.delete(filter_id)
        return True

    async with OpenRAGClient() as client:
        await client.knowledge_filters.delete(filter_id)
        return True


async def main():
    """Test knowledge filter endpoints"""
    api_key = config.OPENRAG_API_KEY
    url = config.OPENRAG_URL

    print(f'Using API Key: {api_key[:20] if api_key else "NOT SET"}...')
    print(f'Using URL: {url}\n')

    try:
        # Create a filter
        print('=== Create Knowledge Filter ===')
        filter_id = await create_filter(
            name="Test Filter",
            description="A test knowledge filter",
            query_data={
                "query": "test",
                "filters": {"document_types": ["application/pdf"]},
                "limit": 10,
                "scoreThreshold": 0.5
            }
        )
        print(f"Created filter ID: {filter_id}\n")

        # Get the filter
        print('=== Get Knowledge Filter ===')
        filter_obj = await get_filter(filter_id)
        if filter_obj:
            print(f"Name: {filter_obj.name}")
            print(f"Description: {filter_obj.description}\n")

        # Search filters
        print('=== Search Knowledge Filters ===')
        filters = await search_filters("Test")
        print(f"Found {len(filters)} filters matching 'Test'\n")

        # Delete the filter
        print('=== Delete Knowledge Filter ===')
        success = await delete_filter(filter_id)
        print(f"Deleted: {success}\n")

    except Exception as e:
        print(f"Error: {e}")
        print("Note: Knowledge filters may not be available in all OpenRAG deployments")


if __name__ == '__main__':
    asyncio.run(main())

# Made with Bob
