/**
 * OpenRAG SDK Utility Modules
 * 
 * This package provides simple, testable utility functions for each OpenRAG SDK endpoint.
 * Each module can be run independently to test specific functionality.
 */

// Settings
export { getSettings, updateSettings } from './settings';

// Chat
export {
  chatSimple,
  chatStreaming,
  listConversations,
  getConversation,
  deleteConversation
} from './chat';

// Search
export { searchQuery } from './search';

// Documents
export { ingestDocument, deleteDocument } from './documents';

// Knowledge Filters
export {
  createFilter,
  searchFilters,
  getFilter,
  updateFilter,
  deleteFilter
} from './knowledge-filters';

// Re-export types from openrag-sdk for convenience
export type {
  OpenRAGClient,
  ChatResponse,
  StreamEvent,
  SearchResponse,
  SearchFilters,
  IngestResponse,
  DeleteDocumentResponse,
  SettingsResponse,
  SettingsUpdateOptions,
  KnowledgeFilter,
  CreateKnowledgeFilterOptions,
  UpdateKnowledgeFilterOptions
} from 'openrag-sdk';

// Made with Bob
