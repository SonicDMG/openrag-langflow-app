"""
OpenRAG Documents Utilities

Functions for document ingestion and management.
Can be run as a standalone script to test document endpoints.
"""
import asyncio
from pathlib import Path
from typing import Optional

from openrag_sdk import OpenRAGClient

from config import config


async def ingest_document(
    file_path: str,
    wait: bool = True,
    client: Optional[OpenRAGClient] = None
) -> dict:
    """
    Ingest a document into the knowledge base.

    Args:
        file_path: Path to the file to ingest
        wait: Whether to wait for ingestion to complete (default: True)
        client: Optional OpenRAGClient instance

    Returns:
        dict: Ingestion result with status, task_id, successful_files, failed_files
    """
    if client:
        result = await client.documents.ingest(file_path=file_path, wait=wait)
        return {
            "status": result.status,
            "task_id": result.task_id,
            "successful_files": result.successful_files,  # type: ignore
            "failed_files": result.failed_files  # type: ignore
        }

    async with OpenRAGClient() as client:
        result = await client.documents.ingest(file_path=file_path, wait=wait)
        return {
            "status": result.status,
            "task_id": result.task_id,
            "successful_files": result.successful_files,  # type: ignore
            "failed_files": result.failed_files  # type: ignore
        }


async def delete_document(
    filename: str,
    client: Optional[OpenRAGClient] = None
) -> bool:
    """
    Delete a document from the knowledge base.

    Args:
        filename: Name of the file to delete
        client: Optional OpenRAGClient instance

    Returns:
        bool: True if successful
    """
    if client:
        result = await client.documents.delete(filename)
        return result.success

    async with OpenRAGClient() as client:
        result = await client.documents.delete(filename)
        return result.success


async def main():
    """Test document endpoints"""
    api_key = config.OPENRAG_API_KEY
    url = config.OPENRAG_URL

    print(f'Using API Key: {api_key[:20] if api_key else "NOT SET"}...')
    print(f'Using URL: {url}\n')

    # Create a test file
    test_file = Path("test_document.md")
    test_file.write_text("# Test Document\n\nThis is a test document for OpenRAG ingestion.")

    try:
        # Ingest document
        print('=== Ingest Document ===')
        print(f"Ingesting: {test_file}")
        result = await ingest_document(str(test_file), wait=True)
        print(f"Status: {result['status']}")
        print(f"Task ID: {result['task_id']}")
        print(f"Successful: {result['successful_files']}")
        print(f"Failed: {result['failed_files']}")
        print()

        # Delete document
        print('=== Delete Document ===')
        print(f"Deleting: {test_file.name}")
        success = await delete_document(test_file.name)
        print(f"Success: {success}")
        print()

    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up test file
        if test_file.exists():
            test_file.unlink()
            print(f"Cleaned up test file: {test_file}")


if __name__ == '__main__':
    asyncio.run(main())

# Made with Bob
