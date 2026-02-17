/**
 * Tests for OpenRAG Documents Utilities
 * 
 * These tests verify SDK integration without testing the SDK itself.
 * All SDK methods are mocked to ensure we're testing our utility layer.
 */

import { OpenRAGClient } from 'openrag-sdk';
import { ingestDocument, deleteDocument } from '../documents';

// Mock the OpenRAG SDK
jest.mock('openrag-sdk');

describe('Documents Utilities', () => {
  let mockClient: jest.Mocked<OpenRAGClient>;
  let mockDocuments: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock documents object
    mockDocuments = {
      ingest: jest.fn(),
      delete: jest.fn()
    };

    // Create mock client
    mockClient = {
      documents: mockDocuments
    } as any;

    // Mock OpenRAGClient constructor
    (OpenRAGClient as jest.MockedClass<typeof OpenRAGClient>).mockImplementation(() => mockClient);
  });

  describe('ingestDocument', () => {
    it('should ingest document with filePath using SDK', async () => {
      const mockResponse = {
        status: 'completed',
        task_id: 'task-123',
        filename: 'test.pdf'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      const result = await ingestDocument({
        filePath: '/path/to/test.pdf',
        wait: true
      });

      expect(mockDocuments.ingest).toHaveBeenCalledWith({
        filePath: '/path/to/test.pdf',
        file: undefined,
        filename: undefined,
        wait: true
      });
      expect(result).toEqual(mockResponse);
    });

    it('should ingest document with File object using SDK', async () => {
      const mockResponse = {
        status: 'completed',
        task_id: 'task-456',
        filename: 'upload.pdf'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      const mockFile = new File(['content'], 'upload.pdf', { type: 'application/pdf' });

      const result = await ingestDocument({
        file: mockFile,
        filename: 'upload.pdf',
        wait: true
      });

      expect(mockDocuments.ingest).toHaveBeenCalledWith({
        filePath: undefined,
        file: mockFile,
        filename: 'upload.pdf',
        wait: true
      });
      expect(result).toEqual(mockResponse);
    });

    it('should use wait=true by default', async () => {
      const mockResponse = {
        status: 'completed',
        task_id: 'task-789',
        filename: 'default.pdf'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      await ingestDocument({
        filePath: '/path/to/default.pdf'
      });

      expect(mockDocuments.ingest).toHaveBeenCalledWith({
        filePath: '/path/to/default.pdf',
        file: undefined,
        filename: undefined,
        wait: true
      });
    });

    it('should allow wait=false for async ingestion', async () => {
      const mockResponse = {
        status: 'processing',
        task_id: 'task-async',
        filename: 'async.pdf'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      const result = await ingestDocument({
        filePath: '/path/to/async.pdf',
        wait: false
      });

      expect(mockDocuments.ingest).toHaveBeenCalledWith({
        filePath: '/path/to/async.pdf',
        file: undefined,
        filename: undefined,
        wait: false
      });
      expect(result.status).toBe('processing');
    });

    it('should use provided client instance', async () => {
      const customClient = {
        documents: {
          ingest: jest.fn().mockResolvedValue({
            status: 'completed',
            task_id: 'custom-task',
            filename: 'custom.pdf'
          })
        }
      } as any;

      await ingestDocument({
        filePath: '/path/to/custom.pdf'
      }, customClient);

      expect(customClient.documents.ingest).toHaveBeenCalled();
      expect(mockDocuments.ingest).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Ingestion failed: Invalid file format');
      mockDocuments.ingest.mockRejectedValue(sdkError);

      await expect(ingestDocument({
        filePath: '/path/to/invalid.txt'
      })).rejects.toThrow('Ingestion failed: Invalid file format');
    });

    it('should handle file size errors', async () => {
      const sizeError = new Error('File too large');
      mockDocuments.ingest.mockRejectedValue(sizeError);

      await expect(ingestDocument({
        filePath: '/path/to/large.pdf'
      })).rejects.toThrow('File too large');
    });

    it('should handle network errors during upload', async () => {
      const networkError = new Error('Network timeout');
      mockDocuments.ingest.mockRejectedValue(networkError);

      await expect(ingestDocument({
        filePath: '/path/to/test.pdf'
      })).rejects.toThrow('Network timeout');
    });

    it('should handle processing status response', async () => {
      const mockResponse = {
        status: 'processing',
        task_id: 'task-processing',
        filename: 'processing.pdf'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      const result = await ingestDocument({
        filePath: '/path/to/processing.pdf',
        wait: false
      });

      expect(result.status).toBe('processing');
      expect(result.task_id).toBe('task-processing');
    });

    it('should handle failed status response', async () => {
      const mockResponse = {
        status: 'failed',
        task_id: 'task-failed',
        filename: 'failed.pdf'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      const result = await ingestDocument({
        filePath: '/path/to/failed.pdf'
      });

      expect(result.status).toBe('failed');
      expect(result.task_id).toBe('task-failed');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document using SDK', async () => {
      const mockResponse = {
        success: true,
        message: 'Document deleted successfully'
      };
      mockDocuments.delete.mockResolvedValue(mockResponse);

      const result = await deleteDocument('test.pdf');

      expect(mockDocuments.delete).toHaveBeenCalledWith('test.pdf');
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
    });

    it('should handle deletion failure', async () => {
      const mockResponse = {
        success: false
      };
      mockDocuments.delete.mockResolvedValue(mockResponse);

      const result = await deleteDocument('nonexistent.pdf');

      expect(result.success).toBe(false);
    });

    it('should use provided client instance', async () => {
      const customClient = {
        documents: {
          delete: jest.fn().mockResolvedValue({
            success: true,
            message: 'Deleted'
          })
        }
      } as any;

      await deleteDocument('custom.pdf', customClient);

      expect(customClient.documents.delete).toHaveBeenCalledWith('custom.pdf');
      expect(mockDocuments.delete).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Delete operation failed');
      mockDocuments.delete.mockRejectedValue(sdkError);

      await expect(deleteDocument('test.pdf')).rejects.toThrow('Delete operation failed');
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('Insufficient permissions');
      mockDocuments.delete.mockRejectedValue(permissionError);

      await expect(deleteDocument('protected.pdf')).rejects.toThrow('Insufficient permissions');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Connection refused');
      mockDocuments.delete.mockRejectedValue(networkError);

      await expect(deleteDocument('test.pdf')).rejects.toThrow('Connection refused');
    });

    it('should handle filenames with special characters', async () => {
      const mockResponse = {
        success: true,
        message: 'Document deleted'
      };
      mockDocuments.delete.mockResolvedValue(mockResponse);

      await deleteDocument('file with spaces & special-chars.pdf');

      expect(mockDocuments.delete).toHaveBeenCalledWith('file with spaces & special-chars.pdf');
    });

    it('should handle filenames with paths', async () => {
      const mockResponse = {
        success: true,
        message: 'Document deleted'
      };
      mockDocuments.delete.mockResolvedValue(mockResponse);

      await deleteDocument('folder/subfolder/document.pdf');

      expect(mockDocuments.delete).toHaveBeenCalledWith('folder/subfolder/document.pdf');
    });
  });

  describe('SDK Integration', () => {
    it('should create new client when none provided for ingest', async () => {
      mockDocuments.ingest.mockResolvedValue({
        status: 'completed',
        task_id: 'task-123',
        filename: 'test.pdf'
      });

      await ingestDocument({ filePath: '/path/to/test.pdf' });

      expect(OpenRAGClient).toHaveBeenCalled();
    });

    it('should create new client when none provided for delete', async () => {
      mockDocuments.delete.mockResolvedValue({
        success: true,
        message: 'Deleted'
      });

      await deleteDocument('test.pdf');

      expect(OpenRAGClient).toHaveBeenCalled();
    });

    it('should not create new client when one is provided', async () => {
      const customClient = {
        documents: {
          ingest: jest.fn().mockResolvedValue({
            status: 'completed',
            task_id: 'task-123',
            filename: 'test.pdf'
          })
        }
      } as any;

      await ingestDocument({ filePath: '/path/to/test.pdf' }, customClient);

      // OpenRAGClient constructor should not be called since we provided a client
      expect(OpenRAGClient).not.toHaveBeenCalled();
    });
  });

  describe('File Type Handling', () => {
    it('should handle PDF files', async () => {
      const mockResponse = {
        status: 'completed',
        task_id: 'task-pdf',
        filename: 'document.pdf'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      await ingestDocument({ filePath: '/path/to/document.pdf' });

      expect(mockDocuments.ingest).toHaveBeenCalled();
    });

    it('should handle DOCX files', async () => {
      const mockResponse = {
        status: 'completed',
        task_id: 'task-docx',
        filename: 'document.docx'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      await ingestDocument({ filePath: '/path/to/document.docx' });

      expect(mockDocuments.ingest).toHaveBeenCalled();
    });

    it('should handle text files', async () => {
      const mockResponse = {
        status: 'completed',
        task_id: 'task-txt',
        filename: 'document.txt'
      };
      mockDocuments.ingest.mockResolvedValue(mockResponse);

      await ingestDocument({ filePath: '/path/to/document.txt' });

      expect(mockDocuments.ingest).toHaveBeenCalled();
    });
  });
});

// Made with Bob
