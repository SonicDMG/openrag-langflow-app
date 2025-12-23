"""
OpenRAG SDK Utility Modules

This package provides simple, testable utility functions for each OpenRAG SDK endpoint.
Each module can be run independently to test specific functionality.
"""

from .settings import get_settings, update_settings
from .chat import chat_simple, chat_streaming, list_conversations, get_conversation, delete_conversation
from .search import search_query
from .documents import ingest_document, delete_document
from .knowledge_filters import (
    create_filter,
    search_filters,
    get_filter,
    update_filter,
    delete_filter,
)

__all__ = [
    # Settings
    "get_settings",
    "update_settings",
    # Chat
    "chat_simple",
    "chat_streaming",
    "list_conversations",
    "get_conversation",
    "delete_conversation",
    # Search
    "search_query",
    # Documents
    "ingest_document",
    "delete_document",
    # Knowledge Filters
    "create_filter",
    "search_filters",
    "get_filter",
    "update_filter",
    "delete_filter",
]

# Made with Bob
