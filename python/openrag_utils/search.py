"""
OpenRAG Search Utilities

Functions for searching documents in the knowledge base.
Can be run as a standalone script to test search endpoints.
"""
import asyncio
from typing import Optional

from openrag_sdk import OpenRAGClient
from openrag_sdk.models import SearchResponse

from config import config


async def search_query(
    query: str,
    limit: int = 10,
    score_threshold: float = 0.0,
    filter_id: Optional[str] = None,
    client: Optional[OpenRAGClient] = None
) -> SearchResponse:
    """
    Search for documents in the knowledge base.

    Args:
        query: Search query string
        limit: Maximum number of results to return
        score_threshold: Minimum similarity score (0.0 to 1.0)
        filter_id: Optional knowledge filter ID to apply
        client: Optional OpenRAGClient instance

    Returns:
        SearchResponse: Search response with results list
    """
    if client:
        return await client.search.query(
            query,
            limit=limit,
            score_threshold=score_threshold,
            filter_id=filter_id
        )

    async with OpenRAGClient() as client:
        return await client.search.query(
            query,
            limit=limit,
            score_threshold=score_threshold,
            filter_id=filter_id
        )


async def main():
    """Test search endpoints"""
    api_key = config.OPENRAG_API_KEY
    url = config.OPENRAG_URL

    print(f'Using API Key: {api_key[:20] if api_key else "NOT SET"}...')
    print(f'Using URL: {url}\n')

    # Basic search
    print('=== Search Query ===')
    query = "document processing"
    print(f"Query: {query}")

    try:
        response = await search_query(query, limit=5, score_threshold=0.3)
        print(f"Found {len(response.results)} results:\n")

        for i, result in enumerate(response.results, 1):
            print(f"{i}. {result.filename} (score: {result.score:.3f})")
            print(f"   {result.text[:100]}...")
            print()
    except Exception as e:
        print(f"Error: {e}")
        print("Note: Search requires documents to be ingested and embedding model configured")


if __name__ == '__main__':
    asyncio.run(main())

# Made with Bob
