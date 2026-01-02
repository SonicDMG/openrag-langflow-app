"""
OpenRAG SDK Utility Modules

This package provides simple, testable utility functions for each OpenRAG SDK endpoint.
Each module can be run independently to test specific functionality.

NOTE: Knowledge filter functions include both SDK-based (currently broken in SDK 0.1.0)
and direct HTTP workaround functions (with _direct suffix).
"""

from .settings import get_settings, update_settings
from .chat import chat_simple, chat_streaming, list_conversations, get_conversation, delete_conversation
from .search import search_query
from .documents import ingest_document, delete_document
from .knowledge_filters import (
    # SDK-based functions (broken in SDK 0.1.0)
    # create_filter,  # DISABLED
    search_filters,
    get_filter,
    # update_filter,  # DISABLED
    # delete_filter,  # DISABLED
    # Workaround functions (direct HTTP calls)
    # create_filter_direct,  # DISABLED
    search_filters_direct,
    get_filter_direct,
    # update_filter_direct,  # DISABLED
    # delete_filter_direct,  # DISABLED
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
    # Knowledge Filters (SDK-based - broken in SDK 0.1.0)
    # "create_filter",  # DISABLED
    "search_filters",
    "get_filter",
    # "update_filter",  # DISABLED
    # "delete_filter",  # DISABLED
    # Knowledge Filters (Direct HTTP workarounds)
    # "create_filter_direct",  # DISABLED
    "search_filters_direct",
    "get_filter_direct",
    # "update_filter_direct",  # DISABLED
    # "delete_filter_direct",  # DISABLED
]

# Made with Bob
