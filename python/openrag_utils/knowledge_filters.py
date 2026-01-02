"""
OpenRAG Knowledge Filters Utilities

Functions for creating and managing knowledge filters.
Can be run as a standalone script to test knowledge filter endpoints.

NOTE: This module includes both SDK-based functions (currently broken in SDK 0.1.0)
and direct HTTP workaround functions that bypass the SDK bug.
"""
import asyncio
import json
from typing import Optional

import httpx
from openrag_sdk import OpenRAGClient
from openrag_sdk.models import KnowledgeFilter

from config import config


# =============================================================================
# WORKAROUND FUNCTIONS - Direct HTTP calls bypassing SDK bug
# These functions work around the incorrect endpoint paths in SDK 0.1.0
# =============================================================================

# DISABLED: Create filter functionality
# async def create_filter_direct(
#     name: str,
#     description: str,
#     query_data: dict,
# ) -> str:
#     """
#     Create a new knowledge filter using direct HTTP call (workaround for SDK bug).
#
#     Args:
#         name: Filter name
#         description: Filter description
#         query_data: Query configuration dict with query, filters, limit, scoreThreshold
#
#     Returns:
#         str: The created filter ID
#     """
#     url = f"{config.OPENRAG_URL}/api/v1/knowledge-filters"
#     headers = {
#         "Authorization": f"Bearer {config.OPENRAG_API_KEY}",
#         "Content-Type": "application/json",
#     }
#
#     # Convert query_data to JSON string as the backend expects
#     query_data_str = json.dumps(query_data) if isinstance(query_data, dict) else str(query_data)
#
#     payload = {
#         "name": name,
#         "description": description,
#         "queryData": query_data_str,
#     }
#
#     async with httpx.AsyncClient() as client:
#         response = await client.post(url, json=payload, headers=headers)
#         response.raise_for_status()
#         data = response.json()
#
#         if not data.get("success"):
#             raise Exception(f"Failed to create filter: {data.get('error', 'Unknown error')}")
#
#         return data["id"]


async def search_filters_direct(search_term: str = "") -> list[dict]:
    """
    Search for knowledge filters using direct HTTP call (workaround for SDK bug).

    Args:
        search_term: Term to search for in filter names

    Returns:
        list: List of matching filters as dicts
    """
    url = f"{config.OPENRAG_URL}/api/v1/knowledge-filters/search"
    headers = {
        "Authorization": f"Bearer {config.OPENRAG_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "query": search_term,
        "limit": 20,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            return []

        return data.get("filters", [])


async def get_filter_direct(filter_id: str) -> Optional[dict]:
    """
    Get a specific knowledge filter using direct HTTP call (workaround for SDK bug).

    Args:
        filter_id: The filter ID

    Returns:
        dict: Filter object or None if not found
    """
    url = f"{config.OPENRAG_URL}/api/v1/knowledge-filters/{filter_id}"
    headers = {
        "Authorization": f"Bearer {config.OPENRAG_API_KEY}",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if not data.get("success"):
                return None
            
            return data.get("filter")
        except httpx.HTTPStatusError:
            return None


# DISABLED: Update filter functionality
# async def update_filter_direct(filter_id: str, updates: dict) -> bool:
#     """
#     Update a knowledge filter using direct HTTP call (workaround for SDK bug).
#
#     Args:
#         filter_id: The filter ID to update
#         updates: Dictionary of fields to update
#
#     Returns:
#         bool: True if successful
#     """
#     url = f"{config.OPENRAG_URL}/api/v1/knowledge-filters/{filter_id}"
#     headers = {
#         "Authorization": f"Bearer {config.OPENRAG_API_KEY}",
#         "Content-Type": "application/json",
#     }
#
#     # Convert queryData if present
#     if "queryData" in updates and isinstance(updates["queryData"], dict):
#         updates["queryData"] = json.dumps(updates["queryData"])
#
#     async with httpx.AsyncClient() as client:
#         response = await client.put(url, json=updates, headers=headers)
#         response.raise_for_status()
#         data = response.json()
#
#         return data.get("success", False)


# DISABLED: Delete filter functionality
# async def delete_filter_direct(filter_id: str) -> bool:
#     """
#     Delete a knowledge filter using direct HTTP call (workaround for SDK bug).
#
#     Args:
#         filter_id: The filter ID to delete
#
#     Returns:
#         bool: True if successful
#     """
#     url = f"{config.OPENRAG_URL}/api/v1/knowledge-filters/{filter_id}"
#     headers = {
#         "Authorization": f"Bearer {config.OPENRAG_API_KEY}",
#     }
#
#     async with httpx.AsyncClient() as client:
#         response = await client.delete(url, headers=headers)
#         response.raise_for_status()
#         data = response.json()
#
#         return data.get("success", False)


# =============================================================================
# SDK-BASED FUNCTIONS - Currently broken in SDK 0.1.0 (wrong endpoint paths)
# These will work once SDK 0.1.1+ is published to PyPI
# =============================================================================


# DISABLED: Create filter functionality
# async def create_filter(
#     name: str,
#     description: str,
#     query_data: dict,
#     client: Optional[OpenRAGClient] = None
# ) -> str:
#     """
#     Create a new knowledge filter.
#
#     Args:
#         name: Filter name
#         description: Filter description
#         query_data: Query configuration dict with query, filters, limit, scoreThreshold
#         client: Optional OpenRAGClient instance
#
#     Returns:
#         str: The created filter ID
#     """
#     filter_config = {
#         "name": name,
#         "description": description,
#         "queryData": query_data
#     }
#
#     if client:
#         result = await client.knowledge_filters.create(filter_config)
#         return result.id  # type: ignore
#
#     async with OpenRAGClient() as client:
#         result = await client.knowledge_filters.create(filter_config)
#         return result.id  # type: ignore


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


# DISABLED: Update filter functionality
# async def update_filter(
#     filter_id: str,
#     updates: dict,
#     client: Optional[OpenRAGClient] = None
# ) -> bool:
#     """
#     Update a knowledge filter.
#
#     Args:
#         filter_id: The filter ID to update
#         updates: Dictionary of fields to update
#         client: Optional OpenRAGClient instance
#
#     Returns:
#         bool: True if successful
#     """
#     if client:
#         await client.knowledge_filters.update(filter_id, updates)
#         return True
#
#     async with OpenRAGClient() as client:
#         await client.knowledge_filters.update(filter_id, updates)
#         return True


# DISABLED: Delete filter functionality
# async def delete_filter(
#     filter_id: str,
#     client: Optional[OpenRAGClient] = None
# ) -> bool:
#     """
#     Delete a knowledge filter.
#
#     Args:
#         filter_id: The filter ID to delete
#         client: Optional OpenRAGClient instance
#
#     Returns:
#         bool: True if successful
#     """
#     if client:
#         await client.knowledge_filters.delete(filter_id)
#         return True
#
#     async with OpenRAGClient() as client:
#         await client.knowledge_filters.delete(filter_id)
#         return True


async def main():
    """Test knowledge filter endpoints using direct HTTP workaround"""
    api_key = config.OPENRAG_API_KEY
    url = config.OPENRAG_URL

    print(f'Using API Key: {api_key[:20] if api_key else "NOT SET"}...')
    print(f'Using URL: {url}\n')
    print('ℹ️  Using direct HTTP workaround functions (SDK 0.1.0 has incorrect paths)\n')

    try:
        # DISABLED: Create a filter
        # print('=== Create Knowledge Filter (Direct) ===')
        # filter_id = await create_filter_direct(
        #     name="Test Filter",
        #     description="A test knowledge filter",
        #     query_data={
        #         "query": "test",
        #         "filters": {"document_types": ["application/pdf"]},
        #         "limit": 10,
        #         "scoreThreshold": 0.5
        #     }
        # )
        # print(f"Created filter ID: {filter_id}\n")

        # Get the filter (requires existing filter ID)
        # print('=== Get Knowledge Filter (Direct) ===')
        # filter_obj = await get_filter_direct(filter_id)
        # if filter_obj:
        #     print(f"Name: {filter_obj['name']}")
        #     print(f"Description: {filter_obj['description']}\n")

        # Search filters
        print('=== Search Knowledge Filters (Direct) ===')
        filters = await search_filters_direct("Heroes")
        print(f"Found {len(filters)} filters matching 'Heroes'\n")

        # DISABLED: Delete the filter
        # print('=== Delete Knowledge Filter (Direct) ===')
        # success = await delete_filter_direct(filter_id)
        # print(f"Deleted: {success}\n")
        
        print("✅ Knowledge filter search successful (create, update, delete disabled)!")
        print("   SDK-based functions will work once SDK 0.1.1+ is published to PyPI")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    asyncio.run(main())

# Made with Bob
