/**
 * Tests for OpenRAG Knowledge Filters Utilities
 * 
 * These tests verify SDK integration without testing the SDK itself.
 * All SDK methods are mocked to ensure we're testing our utility layer.
 */

import { OpenRAGClient } from 'openrag-sdk';
import {
  createFilter,
  searchFilters,
  getFilter,
  updateFilter,
  deleteFilter
} from '../knowledge-filters';

// Mock the OpenRAG SDK
jest.mock('openrag-sdk');

describe('Knowledge Filters Utilities', () => {
  let mockClient: jest.Mocked<OpenRAGClient>;
  let mockKnowledgeFilters: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock knowledge filters object
    mockKnowledgeFilters = {
      create: jest.fn(),
      search: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    // Create mock client
    mockClient = {
      knowledgeFilters: mockKnowledgeFilters
    } as any;

    // Mock OpenRAGClient constructor
    (OpenRAGClient as jest.MockedClass<typeof OpenRAGClient>).mockImplementation(() => mockClient);
  });

  describe('createFilter', () => {
    it('should create a filter using SDK with correct parameters', async () => {
      const mockResponse = { success: true, id: 'filter-123' };
      mockKnowledgeFilters.create.mockResolvedValue(mockResponse);

      const options = {
        name: 'Test Filter',
        description: 'Test description',
        queryData: {
          query: 'test query',
          filters: { document_types: ['application/pdf'] },
          limit: 10,
          scoreThreshold: 0.5
        }
      };

      const result = await createFilter(options);

      expect(mockKnowledgeFilters.create).toHaveBeenCalledWith(options);
      expect(mockKnowledgeFilters.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should use provided client instance', async () => {
      const customClient = {
        knowledgeFilters: {
          create: jest.fn().mockResolvedValue({ success: true, id: 'custom-123' })
        }
      } as any;

      const options = {
        name: 'Custom Filter',
        description: 'Custom description',
        queryData: { query: 'custom', limit: 5 }
      };

      await createFilter(options, customClient);

      expect(customClient.knowledgeFilters.create).toHaveBeenCalledWith(options);
      expect(mockKnowledgeFilters.create).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const mockError = { success: false, error: 'Invalid filter configuration' };
      mockKnowledgeFilters.create.mockResolvedValue(mockError);

      const options = {
        name: 'Bad Filter',
        description: 'Bad description',
        queryData: { query: 'bad' }
      };

      const result = await createFilter(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid filter configuration');
    });
  });

  describe('searchFilters', () => {
    it('should search filters with query using SDK', async () => {
      const mockFilters = [
        { id: '1', name: 'Filter 1', description: 'Desc 1', queryData: { query: 'test' } },
        { id: '2', name: 'Filter 2', description: 'Desc 2', queryData: { query: 'test' } }
      ];
      mockKnowledgeFilters.search.mockResolvedValue(mockFilters);

      const result = await searchFilters('test query', 50);

      expect(mockKnowledgeFilters.search).toHaveBeenCalledWith('test query', 50);
      expect(result).toEqual(mockFilters);
      expect(result).toHaveLength(2);
    });

    it('should use default parameters when not provided', async () => {
      mockKnowledgeFilters.search.mockResolvedValue([]);

      await searchFilters();

      expect(mockKnowledgeFilters.search).toHaveBeenCalledWith('', 100);
    });

    it('should handle empty query string', async () => {
      const mockFilters = [{ id: '1', name: 'All Filters', description: 'All', queryData: {} }];
      mockKnowledgeFilters.search.mockResolvedValue(mockFilters);

      const result = await searchFilters('', 10);

      expect(mockKnowledgeFilters.search).toHaveBeenCalledWith('', 10);
      expect(result).toEqual(mockFilters);
    });

    it('should use provided client instance', async () => {
      const customClient = {
        knowledgeFilters: {
          search: jest.fn().mockResolvedValue([{ id: 'custom' }])
        }
      } as any;

      await searchFilters('query', 20, customClient);

      expect(customClient.knowledgeFilters.search).toHaveBeenCalledWith('query', 20);
      expect(mockKnowledgeFilters.search).not.toHaveBeenCalled();
    });
  });

  describe('getFilter', () => {
    it('should get filter by ID using SDK', async () => {
      const mockFilter = {
        id: 'filter-123',
        name: 'Test Filter',
        description: 'Test description',
        queryData: { query: 'test' }
      };
      mockKnowledgeFilters.get.mockResolvedValue(mockFilter);

      const result = await getFilter('filter-123');

      expect(mockKnowledgeFilters.get).toHaveBeenCalledWith('filter-123');
      expect(result).toEqual(mockFilter);
    });

    it('should return null when filter not found', async () => {
      mockKnowledgeFilters.get.mockResolvedValue(null);

      const result = await getFilter('nonexistent-id');

      expect(mockKnowledgeFilters.get).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should use provided client instance', async () => {
      const customClient = {
        knowledgeFilters: {
          get: jest.fn().mockResolvedValue({ id: 'custom-filter' })
        }
      } as any;

      await getFilter('filter-id', customClient);

      expect(customClient.knowledgeFilters.get).toHaveBeenCalledWith('filter-id');
      expect(mockKnowledgeFilters.get).not.toHaveBeenCalled();
    });
  });

  describe('updateFilter', () => {
    it('should update filter using SDK with correct parameters', async () => {
      mockKnowledgeFilters.update.mockResolvedValue(true);

      const updates = {
        description: 'Updated description',
        queryData: { query: 'updated query', limit: 20 }
      };

      const result = await updateFilter('filter-123', updates);

      expect(mockKnowledgeFilters.update).toHaveBeenCalledWith('filter-123', updates);
      expect(result).toBe(true);
    });

    it('should handle partial updates', async () => {
      mockKnowledgeFilters.update.mockResolvedValue(true);

      const updates = { description: 'Only description updated' };

      await updateFilter('filter-123', updates);

      expect(mockKnowledgeFilters.update).toHaveBeenCalledWith('filter-123', updates);
    });

    it('should return false on update failure', async () => {
      mockKnowledgeFilters.update.mockResolvedValue(false);

      const result = await updateFilter('filter-123', { name: 'New Name' });

      expect(result).toBe(false);
    });

    it('should use provided client instance', async () => {
      const customClient = {
        knowledgeFilters: {
          update: jest.fn().mockResolvedValue(true)
        }
      } as any;

      await updateFilter('filter-id', { name: 'Updated' }, customClient);

      expect(customClient.knowledgeFilters.update).toHaveBeenCalledWith('filter-id', { name: 'Updated' });
      expect(mockKnowledgeFilters.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteFilter', () => {
    it('should delete filter using SDK', async () => {
      mockKnowledgeFilters.delete.mockResolvedValue(true);

      const result = await deleteFilter('filter-123');

      expect(mockKnowledgeFilters.delete).toHaveBeenCalledWith('filter-123');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockKnowledgeFilters.delete.mockResolvedValue(false);

      const result = await deleteFilter('nonexistent-id');

      expect(result).toBe(false);
    });

    it('should use provided client instance', async () => {
      const customClient = {
        knowledgeFilters: {
          delete: jest.fn().mockResolvedValue(true)
        }
      } as any;

      await deleteFilter('filter-id', customClient);

      expect(customClient.knowledgeFilters.delete).toHaveBeenCalledWith('filter-id');
      expect(mockKnowledgeFilters.delete).not.toHaveBeenCalled();
    });
  });

  describe('SDK Error Handling', () => {
    it('should propagate SDK errors from create', async () => {
      const sdkError = new Error('SDK connection failed');
      mockKnowledgeFilters.create.mockRejectedValue(sdkError);

      await expect(createFilter({
        name: 'Test',
        description: 'Test',
        queryData: { query: 'test' }
      })).rejects.toThrow('SDK connection failed');
    });

    it('should propagate SDK errors from search', async () => {
      const sdkError = new Error('Search service unavailable');
      mockKnowledgeFilters.search.mockRejectedValue(sdkError);

      await expect(searchFilters('query')).rejects.toThrow('Search service unavailable');
    });

    it('should propagate SDK errors from get', async () => {
      const sdkError = new Error('Filter not accessible');
      mockKnowledgeFilters.get.mockRejectedValue(sdkError);

      await expect(getFilter('filter-id')).rejects.toThrow('Filter not accessible');
    });

    it('should propagate SDK errors from update', async () => {
      const sdkError = new Error('Update failed');
      mockKnowledgeFilters.update.mockRejectedValue(sdkError);

      await expect(updateFilter('filter-id', { name: 'New' })).rejects.toThrow('Update failed');
    });

    it('should propagate SDK errors from delete', async () => {
      const sdkError = new Error('Delete failed');
      mockKnowledgeFilters.delete.mockRejectedValue(sdkError);

      await expect(deleteFilter('filter-id')).rejects.toThrow('Delete failed');
    });
  });
});

// Made with Bob
