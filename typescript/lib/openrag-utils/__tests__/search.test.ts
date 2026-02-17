/**
 * Tests for OpenRAG Search Utilities
 * 
 * These tests verify SDK integration without testing the SDK itself.
 * All SDK methods are mocked to ensure we're testing our utility layer.
 */

import { OpenRAGClient } from 'openrag-sdk';
import { searchQuery } from '../search';

// Mock the OpenRAG SDK
jest.mock('openrag-sdk');

describe('Search Utilities', () => {
  let mockClient: jest.Mocked<OpenRAGClient>;
  let mockSearch: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock search object
    mockSearch = {
      query: jest.fn()
    };

    // Create mock client
    mockClient = {
      search: mockSearch
    } as any;

    // Mock OpenRAGClient constructor
    (OpenRAGClient as jest.MockedClass<typeof OpenRAGClient>).mockImplementation(() => mockClient);
  });

  describe('searchQuery', () => {
    it('should search documents using SDK with default parameters', async () => {
      const mockResponse = {
        results: [
          {
            filename: 'doc1.pdf',
            text: 'Sample text content',
            score: 0.95,
            metadata: {}
          },
          {
            filename: 'doc2.pdf',
            text: 'Another sample text',
            score: 0.87,
            metadata: {}
          }
        ]
      };
      mockSearch.query.mockResolvedValue(mockResponse);

      const result = await searchQuery('test query');

      expect(mockSearch.query).toHaveBeenCalledWith('test query', {
        limit: 10,
        scoreThreshold: 0.0,
        filterId: undefined,
        filters: undefined
      });
      expect(result).toEqual(mockResponse);
      expect(result.results).toHaveLength(2);
    });

    it('should pass custom limit and scoreThreshold to SDK', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      await searchQuery('test query', 25, 0.75);

      expect(mockSearch.query).toHaveBeenCalledWith('test query', {
        limit: 25,
        scoreThreshold: 0.75,
        filterId: undefined,
        filters: undefined
      });
    });

    it('should include filterId when provided', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      await searchQuery('test query', 10, 0.5, 'filter-123');

      expect(mockSearch.query).toHaveBeenCalledWith('test query', {
        limit: 10,
        scoreThreshold: 0.5,
        filterId: 'filter-123',
        filters: undefined
      });
    });

    it('should include filters when provided', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      const filters = {
        document_types: ['application/pdf', 'text/plain'],
        tags: ['technical', 'documentation']
      };

      await searchQuery('test query', 10, 0.0, undefined, filters);

      expect(mockSearch.query).toHaveBeenCalledWith('test query', {
        limit: 10,
        scoreThreshold: 0.0,
        filterId: undefined,
        filters
      });
    });

    it('should include both filterId and filters when provided', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      const filters = { document_types: ['application/pdf'] };

      await searchQuery('test query', 15, 0.6, 'filter-456', filters);

      expect(mockSearch.query).toHaveBeenCalledWith('test query', {
        limit: 15,
        scoreThreshold: 0.6,
        filterId: 'filter-456',
        filters
      });
    });

    it('should use provided client instance', async () => {
      const customClient = {
        search: {
          query: jest.fn().mockResolvedValue({ results: [{ filename: 'custom.pdf', text: 'Custom', score: 0.9, metadata: {} }] })
        }
      } as any;

      await searchQuery('test query', 10, 0.0, undefined, undefined, customClient);

      expect(customClient.search.query).toHaveBeenCalledWith('test query', {
        limit: 10,
        scoreThreshold: 0.0,
        filterId: undefined,
        filters: undefined
      });
      expect(mockSearch.query).not.toHaveBeenCalled();
    });

    it('should handle empty search results', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      const result = await searchQuery('nonexistent query');

      expect(result.results).toEqual([]);
      expect(result.results).toHaveLength(0);
    });

    it('should handle search results with all fields', async () => {
      const mockResponse = {
        results: [
          {
            filename: 'doc1.pdf',
            text: 'Content with all fields',
            score: 0.92
          }
        ]
      };
      mockSearch.query.mockResolvedValue(mockResponse);

      const result = await searchQuery('test query');

      expect(result.results[0].filename).toBe('doc1.pdf');
      expect(result.results[0].text).toBe('Content with all fields');
      expect(result.results[0].score).toBe(0.92);
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Search service unavailable');
      mockSearch.query.mockRejectedValue(sdkError);

      await expect(searchQuery('test query')).rejects.toThrow('Search service unavailable');
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockSearch.query.mockRejectedValue(timeoutError);

      await expect(searchQuery('test query', 10, 0.0)).rejects.toThrow('Request timeout');
    });

    it('should handle invalid query parameters gracefully', async () => {
      const validationError = new Error('Invalid score threshold');
      mockSearch.query.mockRejectedValue(validationError);

      await expect(searchQuery('test', 10, 2.0)).rejects.toThrow('Invalid score threshold');
    });
  });

  describe('Parameter Validation', () => {
    it('should accept zero as scoreThreshold', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      await searchQuery('test', 10, 0);

      expect(mockSearch.query).toHaveBeenCalledWith('test', {
        limit: 10,
        scoreThreshold: 0,
        filterId: undefined,
        filters: undefined
      });
    });

    it('should accept high scoreThreshold values', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      await searchQuery('test', 10, 0.99);

      expect(mockSearch.query).toHaveBeenCalledWith('test', {
        limit: 10,
        scoreThreshold: 0.99,
        filterId: undefined,
        filters: undefined
      });
    });

    it('should accept large limit values', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      await searchQuery('test', 1000);

      expect(mockSearch.query).toHaveBeenCalledWith('test', {
        limit: 1000,
        scoreThreshold: 0.0,
        filterId: undefined,
        filters: undefined
      });
    });

    it('should handle empty query string', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      await searchQuery('');

      expect(mockSearch.query).toHaveBeenCalledWith('', {
        limit: 10,
        scoreThreshold: 0.0,
        filterId: undefined,
        filters: undefined
      });
    });
  });

  describe('SDK Integration', () => {
    it('should create new client when none provided', async () => {
      mockSearch.query.mockResolvedValue({ results: [] });

      await searchQuery('test');

      expect(OpenRAGClient).toHaveBeenCalled();
    });

    it('should not create new client when one is provided', async () => {
      const customClient = {
        search: {
          query: jest.fn().mockResolvedValue({ results: [] })
        }
      } as any;

      await searchQuery('test', 10, 0.0, undefined, undefined, customClient);

      // OpenRAGClient constructor should not be called since we provided a client
      expect(OpenRAGClient).not.toHaveBeenCalled();
    });
  });

  describe('Complex Filter Scenarios', () => {
    it('should handle multiple document types in filters', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      const filters = {
        document_types: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      };

      await searchQuery('test', 10, 0.0, undefined, filters);

      expect(mockSearch.query).toHaveBeenCalledWith('test', {
        limit: 10,
        scoreThreshold: 0.0,
        filterId: undefined,
        filters
      });
    });

    it('should handle complex nested filters', async () => {
      const mockResponse = { results: [] };
      mockSearch.query.mockResolvedValue(mockResponse);

      const filters = {
        document_types: ['application/pdf'],
        tags: ['technical', 'api'],
        date_range: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      };

      await searchQuery('test', 10, 0.0, undefined, filters);

      expect(mockSearch.query).toHaveBeenCalledWith('test', {
        limit: 10,
        scoreThreshold: 0.0,
        filterId: undefined,
        filters
      });
    });
  });
});

// Made with Bob
