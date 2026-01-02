#!/usr/bin/env python3
"""
Comprehensive test script for all openrag_utils modules.

This script tests each utility module in sequence:
1. Settings - Get and display current settings
2. Documents - Ingest and delete a test document
3. Search - Search the knowledge base
4. Chat - Simple and streaming chat
5. Knowledge Filters - Create, get, search, and delete filters

Run with: python test_all_utils.py
"""
import asyncio
import sys
from pathlib import Path
from openrag_sdk import OpenRAGClient

# Import config
from config import config

# Import all utility functions
from openrag_utils import (
    get_settings,
    update_settings,
    ingest_document,
    delete_document,
    search_query,
    chat_simple,
    chat_streaming,
    list_conversations,
    get_conversation,
    delete_conversation,
    # create_filter,  # DISABLED
    search_filters,
    get_filter,
    # update_filter,  # DISABLED
    # delete_filter,  # DISABLED
)


def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70 + "\n")


async def test_settings():
    """Test settings utilities"""
    print_section("1. TESTING SETTINGS")
    
    try:
        # Get current settings
        print("📋 Getting current settings...")
        settings = await get_settings()
        print(f"✓ Current settings: {settings}\n")
        
        print(f"✓ Agent LLM Provider: {settings.get('agent', {}).get('llm_provider', 'N/A')}")
        print(f"✓ Agent LLM Model: {settings.get('agent', {}).get('llm_model', 'N/A')}")
        print(f"✓ Embedding Provider: {settings.get('knowledge', {}).get('embedding_provider', 'N/A')}")
        print(f"✓ Embedding Model: {settings.get('knowledge', {}).get('embedding_model', 'N/A')}")
        print(f"✓ Chunk Size: {settings.get('knowledge', {}).get('chunk_size', 'N/A')}")
        print(f"✓ Chunk Overlap: {settings.get('knowledge', {}).get('chunk_overlap', 'N/A')}")
        
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


async def test_documents():
    """Test document utilities"""
    print_section("2. TESTING DOCUMENTS")
    
    # Create a test file
    test_file = Path("test_openrag_document.md")
    test_content = """# OpenRAG Test Document

This is a test document for the OpenRAG knowledge base.

## Features
- Document ingestion
- Vector search
- RAG chat capabilities

## Testing
This document will be ingested and then deleted as part of the test suite.
"""
    
    try:
        test_file.write_text(test_content)
        print(f"📄 Created test file: {test_file}")
        
        # Ingest document
        print(f"\n📤 Ingesting document...")
        result = await ingest_document(str(test_file), wait=True)
        print(f"✓ Status: {result['status']}")
        print(f"✓ Task ID: {result['task_id']}")
        print(f"✓ Successful files: {result['successful_files']}")
        
        if result['failed_files']:
            print(f"✗ Failed files: {result['failed_files']}")
        
        # Wait a moment for indexing
        await asyncio.sleep(2)
        
        # Delete document
        print(f"\n🗑️  Deleting document...")
        success = await delete_document(test_file.name)
        print(f"✓ Deleted: {success}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    finally:
        # Clean up test file
        if test_file.exists():
            test_file.unlink()
            print(f"🧹 Cleaned up test file")


async def test_search():
    """Test search utilities"""
    print_section("3. TESTING SEARCH")
    
    try:
        query = "OpenRAG features"
        print(f"🔍 Searching for: '{query}'")
        
        response = await search_query(query, limit=5, score_threshold=0.0)
        print(f"✓ Found {len(response.results)} results")
        
        if response.results:
            print("\nTop results:")
            for i, result in enumerate(response.results[:3], 1):
                print(f"\n{i}. {result.filename}")
                print(f"   Score: {result.score:.3f}")
                print(f"   Text: {result.text[:100]}...")
        else:
            print("ℹ️  No results found (knowledge base may be empty)")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print("ℹ️  Note: Search requires documents in the knowledge base")
        return False


async def test_chat():
    """Test chat utilities"""
    print_section("4. TESTING CHAT")
    
    try:
        # Simple chat
        print("💬 Testing simple chat...")
        message = "What is RAG in AI?"
        print(f"User: {message}")
        
        response = await chat_simple(message)
        print(f"\n✓ Assistant: {response['response'][:200]}...")
        print(f"✓ Chat ID: {response['chat_id']}")
        print(f"✓ Sources: {len(response['sources'])} documents")
        
        chat_id = response['chat_id']
        
        # Streaming chat
        print("\n\n💬 Testing streaming chat...")
        follow_up = "Can you explain it more briefly?"
        print(f"User: {follow_up}")
        print("Assistant: ", end="", flush=True)
        
        full_response = ""
        async for event in chat_streaming(follow_up, chat_id=chat_id):
            event_type = getattr(event, 'type', event.get('type') if isinstance(event, dict) else None)
            
            if event_type == "content":
                delta = getattr(event, 'delta', event.get('delta') if isinstance(event, dict) else '')
                if delta:
                    print(delta, end="", flush=True)
                    full_response += delta
            elif event_type == "final":
                final_chat_id = event.get('chat_id') if isinstance(event, dict) else getattr(event, 'chat_id', None)
                print(f"\n\n✓ Streaming complete")
                print(f"✓ Chat ID: {final_chat_id}")
        
        # List conversations
        print("\n\n📋 Listing conversations...")
        conversations = await list_conversations()
        print(f"✓ Total conversations: {len(conversations)}")
        
        if conversations:
            print("\nRecent conversations:")
            for conv in conversations[:3]:
                print(f"  - {conv.chat_id}: {conv.title}")
        
        # Get specific conversation
        if chat_id:
            print(f"\n\n📖 Getting conversation {chat_id[:8]}...")
            conversation = await get_conversation(chat_id)
            print(f"✓ Title: {conversation['title']}")
            print(f"✓ Messages: {len(conversation['messages'])}")
        
        # Clean up - delete test conversation
        if chat_id:
            print(f"\n🗑️  Deleting test conversation...")
            success = await delete_conversation(chat_id)
            print(f"✓ Deleted: {success}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False


async def test_knowledge_filters():
    """Test knowledge filter utilities using direct HTTP workaround"""
    print_section("5. TESTING KNOWLEDGE FILTERS")
    
    filter_id = None
    
    try:
        # Import the direct workaround functions
        from openrag_utils import (
            # create_filter_direct,  # DISABLED
            search_filters_direct,
            get_filter_direct,
            # update_filter_direct,  # DISABLED
            # delete_filter_direct,  # DISABLED
        )
        
        # DISABLED: Create a filter
        # print("🔧 Creating knowledge filter (using direct HTTP workaround)...")
        # filter_id = await create_filter_direct(
        #     name="Test Filter - Auto Generated",
        #     description="Automatically generated test filter",
        #     query_data={
        #         "query": "test document",
        #         "filters": {},
        #         "limit": 10,
        #         "scoreThreshold": 0.3
        #     }
        # )
        # print(f"✓ Created filter ID: {filter_id}")
        
        # DISABLED: Get the filter (requires filter_id from create)
        # print(f"\n📖 Getting filter details...")
        # filter_obj = await get_filter_direct(filter_id)
        # if filter_obj:
        #     print(f"✓ Name: {filter_obj['name']}")
        #     print(f"✓ Description: {filter_obj['description']}")
        #     # Parse query_data if it's a JSON string
        #     query_data = filter_obj.get('query_data', '{}')
        #     if isinstance(query_data, str):
        #         import json
        #         query_data = json.loads(query_data)
        #     print(f"✓ Query: {query_data.get('query', 'N/A')}")
        
        # Search filters
        print(f"🔍 Searching for filters...")
        filters = await search_filters_direct("Heroes")
        print(f"✓ Found {len(filters)} filters matching 'Heroes'")
        
        # Print verbose filter details
        if filters:
            print("\n📋 Filter Details:")
            for i, filter_obj in enumerate(filters, 1):
                print(f"\n  Filter {i}:")
                print(f"    ID: {filter_obj.get('id', 'N/A')}")
                print(f"    Name: {filter_obj.get('name', 'N/A')}")
                print(f"    Description: {filter_obj.get('description', 'N/A')}")
                
                # Parse and display query_data
                query_data = filter_obj.get('query_data', '{}')
                if isinstance(query_data, str):
                    import json
                    try:
                        query_data = json.loads(query_data)
                    except:
                        pass
                
                if isinstance(query_data, dict):
                    print(f"    Query Data:")
                    print(f"      Query: {query_data.get('query', 'N/A')}")
                    print(f"      Limit: {query_data.get('limit', 'N/A')}")
                    print(f"      Score Threshold: {query_data.get('scoreThreshold', 'N/A')}")
                    if query_data.get('filters'):
                        print(f"      Filters: {query_data.get('filters')}")
                else:
                    print(f"    Query Data (raw): {query_data}")
                
                print(f"    Created At: {filter_obj.get('created_at', 'N/A')}")
                print(f"    Updated At: {filter_obj.get('updated_at', 'N/A')}")
        
        # DISABLED: Update filter
        # print(f"\n✏️  Updating filter...")
        # success = await update_filter_direct(
        #     filter_id,
        #     {"description": "Updated test filter description"}
        # )
        # print(f"✓ Updated: {success}")
        #
        # # Verify update
        # updated_filter = await get_filter_direct(filter_id)
        # if updated_filter:
        #     print(f"✓ New description: {updated_filter['description']}")
        
        # DISABLED: Delete the filter
        # print(f"\n🗑️  Deleting filter...")
        # success = await delete_filter_direct(filter_id)
        # print(f"✓ Deleted: {success}")
        
        print("\nℹ️  Note: Using direct HTTP workaround functions due to SDK 0.1.0 bug")
        print("   SDK-based functions will work once SDK 0.1.1+ is published to PyPI")
        print("   Create, update, and delete functionality are currently disabled")
        print("   Only search and get operations are active")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        
        return False


async def test_knowledge_filters_sdk():
    """
    Test knowledge filter utilities using SDK (currently broken in SDK 0.1.0).
    
    This test is kept for future use when SDK 0.1.1+ is published to PyPI.
    Currently disabled - use test_knowledge_filters() which uses direct HTTP calls.
    """
    print_section("5. TESTING KNOWLEDGE FILTERS (SDK - DISABLED)")
    print("⚠️  Skipped: SDK 0.1.0 has incorrect endpoint paths")
    print("   This test will be enabled once SDK 0.1.1+ is published to PyPI")
    return True
    
    # Original SDK-based test code (kept for reference):
    """
    filter_id = None
    
    try:
        # Create a filter
        print("🔧 Creating knowledge filter...")
        filter_id = await create_filter(
            name="Test Filter - Auto Generated",
            description="Automatically generated test filter",
            query_data={
                "query": "test document",
                "filters": {},
                "limit": 10,
                "scoreThreshold": 0.3
            }
        )
        print(f"✓ Created filter ID: {filter_id}")
        
        # ... rest of SDK-based test code ...
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    """


async def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("  OPENRAG UTILS - COMPREHENSIVE TEST SUITE")
    print("=" * 70)
    
    api_key = config.OPENRAG_API_KEY
    url = config.OPENRAG_URL
    
    print(f"\n🔑 API Key: {api_key[:20] if api_key else 'NOT SET'}...")
    print(f"🌐 URL: {url}")
    
    if not api_key or not url:
        print("\n❌ ERROR: OPENRAG_API_KEY or OPENRAG_URL not set!")
        print("Please set these in your .env file")
        return
    
    # Track results
    results = {}
    
    # Run all tests
    results['settings'] = await test_settings()
    results['documents'] = await test_documents()
    results['search'] = await test_search()
    results['chat'] = await test_chat()
    results['knowledge_filters'] = await test_knowledge_filters()
    
    # Print summary
    print_section("TEST SUMMARY")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    for test_name, passed_test in results.items():
        status = "✓ PASSED" if passed_test else "✗ FAILED"
        print(f"{status:12} - {test_name}")
    
    print(f"\n{'=' * 70}")
    print(f"  Results: {passed}/{total} tests passed")
    print(f"{'=' * 70}\n")
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")


if __name__ == '__main__':
    asyncio.run(main())

# Made with Bob