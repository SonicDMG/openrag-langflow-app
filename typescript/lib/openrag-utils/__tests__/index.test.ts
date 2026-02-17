/**
 * Tests for OpenRAG Utils Index Module
 * 
 * Verifies that all exports are properly exposed from the index file.
 */

import * as openragUtils from '../index';

describe('OpenRAG Utils Index', () => {
  describe('Exports', () => {
    it('should export settings functions', () => {
      expect(openragUtils.getSettings).toBeDefined();
      expect(openragUtils.updateSettings).toBeDefined();
      expect(typeof openragUtils.getSettings).toBe('function');
      expect(typeof openragUtils.updateSettings).toBe('function');
    });

    it('should export chat functions', () => {
      expect(openragUtils.chatSimple).toBeDefined();
      expect(openragUtils.chatStreaming).toBeDefined();
      expect(openragUtils.listConversations).toBeDefined();
      expect(openragUtils.getConversation).toBeDefined();
      expect(openragUtils.deleteConversation).toBeDefined();
      expect(typeof openragUtils.chatSimple).toBe('function');
      expect(typeof openragUtils.chatStreaming).toBe('function');
      expect(typeof openragUtils.listConversations).toBe('function');
      expect(typeof openragUtils.getConversation).toBe('function');
      expect(typeof openragUtils.deleteConversation).toBe('function');
    });

    it('should export search functions', () => {
      expect(openragUtils.searchQuery).toBeDefined();
      expect(typeof openragUtils.searchQuery).toBe('function');
    });

    it('should export document functions', () => {
      expect(openragUtils.ingestDocument).toBeDefined();
      expect(openragUtils.deleteDocument).toBeDefined();
      expect(typeof openragUtils.ingestDocument).toBe('function');
      expect(typeof openragUtils.deleteDocument).toBe('function');
    });

    it('should export knowledge filter functions', () => {
      expect(openragUtils.createFilter).toBeDefined();
      expect(openragUtils.searchFilters).toBeDefined();
      expect(openragUtils.getFilter).toBeDefined();
      expect(openragUtils.updateFilter).toBeDefined();
      expect(openragUtils.deleteFilter).toBeDefined();
      expect(typeof openragUtils.createFilter).toBe('function');
      expect(typeof openragUtils.searchFilters).toBe('function');
      expect(typeof openragUtils.getFilter).toBe('function');
      expect(typeof openragUtils.updateFilter).toBe('function');
      expect(typeof openragUtils.deleteFilter).toBe('function');
    });
  });

  describe('Module Structure', () => {
    it('should have all expected exports', () => {
      const expectedExports = [
        // Settings
        'getSettings',
        'updateSettings',
        // Chat
        'chatSimple',
        'chatStreaming',
        'listConversations',
        'getConversation',
        'deleteConversation',
        // Search
        'searchQuery',
        // Documents
        'ingestDocument',
        'deleteDocument',
        // Knowledge Filters
        'createFilter',
        'searchFilters',
        'getFilter',
        'updateFilter',
        'deleteFilter'
      ];

      expectedExports.forEach(exportName => {
        expect(openragUtils).toHaveProperty(exportName);
      });
    });

    it('should not have unexpected exports', () => {
      const exports = Object.keys(openragUtils);
      const expectedExports = [
        'getSettings',
        'updateSettings',
        'chatSimple',
        'chatStreaming',
        'listConversations',
        'getConversation',
        'deleteConversation',
        'searchQuery',
        'ingestDocument',
        'deleteDocument',
        'createFilter',
        'searchFilters',
        'getFilter',
        'updateFilter',
        'deleteFilter'
      ];

      // All exports should be in the expected list
      exports.forEach(exportName => {
        expect(expectedExports).toContain(exportName);
      });
    });
  });
});

// Made with Bob
