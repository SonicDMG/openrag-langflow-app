/**
 * Tests for OpenRAG Settings Utilities
 * 
 * These tests verify SDK integration without testing the SDK itself.
 * All SDK methods are mocked to ensure we're testing our utility layer.
 */

import { OpenRAGClient } from 'openrag-sdk';
import { getSettings, updateSettings } from '../settings';

// Mock the OpenRAG SDK
jest.mock('openrag-sdk');

describe('Settings Utilities', () => {
  let mockClient: jest.Mocked<OpenRAGClient>;
  let mockSettings: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock settings object
    mockSettings = {
      get: jest.fn(),
      update: jest.fn()
    };

    // Create mock client
    mockClient = {
      settings: mockSettings
    } as any;

    // Mock OpenRAGClient constructor
    (OpenRAGClient as jest.MockedClass<typeof OpenRAGClient>).mockImplementation(() => mockClient);
  });

  describe('getSettings', () => {
    it('should get current settings using SDK', async () => {
      const mockResponse = {
        agent: {
          llm_provider: 'openai',
          llm_model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000
        },
        knowledge: {
          embedding_provider: 'openai',
          embedding_model: 'text-embedding-3-small',
          chunk_size: 1000,
          chunk_overlap: 200
        }
      };
      mockSettings.get.mockResolvedValue(mockResponse);

      const result = await getSettings();

      expect(mockSettings.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
      expect(result.agent.llm_provider).toBe('openai');
      expect(result.knowledge.chunk_size).toBe(1000);
    });

    it('should handle settings with minimal configuration', async () => {
      const mockResponse = {
        agent: {
          llm_provider: 'openai',
          llm_model: 'gpt-3.5-turbo'
        },
        knowledge: {
          embedding_provider: 'openai',
          embedding_model: 'text-embedding-ada-002'
        }
      };
      mockSettings.get.mockResolvedValue(mockResponse);

      const result = await getSettings();

      expect(result.agent.llm_provider).toBe('openai');
      expect(result.knowledge.embedding_provider).toBe('openai');
    });

    it('should use provided client instance', async () => {
      const customClient = {
        settings: {
          get: jest.fn().mockResolvedValue({
            agent: { llm_provider: 'custom' },
            knowledge: { embedding_provider: 'custom' }
          })
        }
      } as any;

      await getSettings(customClient);

      expect(customClient.settings.get).toHaveBeenCalled();
      expect(mockSettings.get).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Failed to retrieve settings');
      mockSettings.get.mockRejectedValue(sdkError);

      await expect(getSettings()).rejects.toThrow('Failed to retrieve settings');
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockSettings.get.mockRejectedValue(timeoutError);

      await expect(getSettings()).rejects.toThrow('Request timeout');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      mockSettings.get.mockRejectedValue(authError);

      await expect(getSettings()).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateSettings', () => {
    it('should update settings using SDK', async () => {
      const mockResponse = {
        message: 'Settings updated successfully'
      };
      mockSettings.update.mockResolvedValue(mockResponse);

      const updates = {
        chunk_size: 1500,
        chunk_overlap: 300
      };

      const result = await updateSettings(updates);

      expect(mockSettings.update).toHaveBeenCalledWith(updates);
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe('Settings updated successfully');
    });

    it('should handle partial updates for agent settings', async () => {
      const mockResponse = {
        message: 'Agent settings updated'
      };
      mockSettings.update.mockResolvedValue(mockResponse);

      const updates = {
        llm_model: 'gpt-4-turbo'
      };

      await updateSettings(updates);

      expect(mockSettings.update).toHaveBeenCalledWith(updates);
    });

    it('should handle partial updates for knowledge settings', async () => {
      const mockResponse = {
        message: 'Knowledge settings updated'
      };
      mockSettings.update.mockResolvedValue(mockResponse);

      const updates = {
        embedding_model: 'text-embedding-3-large',
        chunk_size: 2000
      };

      await updateSettings(updates);

      expect(mockSettings.update).toHaveBeenCalledWith(updates);
    });

    it('should handle single field updates', async () => {
      const mockResponse = {
        message: 'Setting updated'
      };
      mockSettings.update.mockResolvedValue(mockResponse);

      const updates = {
        chunk_size: 800
      };

      await updateSettings(updates);

      expect(mockSettings.update).toHaveBeenCalledWith(updates);
    });

    it('should handle multiple field updates', async () => {
      const mockResponse = {
        message: 'Multiple settings updated'
      };
      mockSettings.update.mockResolvedValue(mockResponse);

      const updates = {
        llm_provider: 'anthropic',
        llm_model: 'claude-3-opus',
        chunk_size: 1200,
        chunk_overlap: 250
      };

      await updateSettings(updates);

      expect(mockSettings.update).toHaveBeenCalledWith(updates);
    });

    it('should use provided client instance', async () => {
      const customClient = {
        settings: {
          update: jest.fn().mockResolvedValue({
            message: 'Custom update successful'
          })
        }
      } as any;

      await updateSettings({ chunk_size: 1000 }, customClient);

      expect(customClient.settings.update).toHaveBeenCalledWith({ chunk_size: 1000 });
      expect(mockSettings.update).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Update failed: Invalid configuration');
      mockSettings.update.mockRejectedValue(sdkError);

      await expect(updateSettings({
        chunk_size: -100
      })).rejects.toThrow('Update failed: Invalid configuration');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid chunk_size value');
      mockSettings.update.mockRejectedValue(validationError);

      await expect(updateSettings({
        chunk_size: 0
      })).rejects.toThrow('Invalid chunk_size value');
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('Insufficient permissions to update settings');
      mockSettings.update.mockRejectedValue(permissionError);

      await expect(updateSettings({
        llm_model: 'gpt-4'
      })).rejects.toThrow('Insufficient permissions to update settings');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Connection failed');
      mockSettings.update.mockRejectedValue(networkError);

      await expect(updateSettings({
        chunk_size: 1000
      })).rejects.toThrow('Connection failed');
    });
  });

  describe('SDK Integration', () => {
    it('should create new client when none provided for get', async () => {
      mockSettings.get.mockResolvedValue({
        agent: { llm_provider: 'openai' },
        knowledge: { embedding_provider: 'openai' }
      });

      await getSettings();

      expect(OpenRAGClient).toHaveBeenCalled();
    });

    it('should create new client when none provided for update', async () => {
      mockSettings.update.mockResolvedValue({
        message: 'Updated'
      });

      await updateSettings({ chunk_size: 1000 });

      expect(OpenRAGClient).toHaveBeenCalled();
    });

    it('should not create new client when one is provided', async () => {
      const customClient = {
        settings: {
          get: jest.fn().mockResolvedValue({
            agent: { llm_provider: 'custom' },
            knowledge: { embedding_provider: 'custom' }
          })
        }
      } as any;

      await getSettings(customClient);

      // OpenRAGClient constructor should not be called since we provided a client
      expect(OpenRAGClient).not.toHaveBeenCalled();
    });
  });

  describe('Settings Configuration Scenarios', () => {
    it('should handle OpenAI configuration', async () => {
      const mockResponse = {
        agent: {
          llm_provider: 'openai',
          llm_model: 'gpt-4',
          temperature: 0.7
        },
        knowledge: {
          embedding_provider: 'openai',
          embedding_model: 'text-embedding-3-small',
          chunk_size: 1000,
          chunk_overlap: 200
        }
      };
      mockSettings.get.mockResolvedValue(mockResponse);

      const result = await getSettings();

      expect(result.agent.llm_provider).toBe('openai');
      expect(result.knowledge.embedding_provider).toBe('openai');
    });

    it('should handle Anthropic configuration', async () => {
      const mockResponse = {
        agent: {
          llm_provider: 'anthropic',
          llm_model: 'claude-3-opus',
          temperature: 0.5
        },
        knowledge: {
          embedding_provider: 'openai',
          embedding_model: 'text-embedding-3-small',
          chunk_size: 1500,
          chunk_overlap: 300
        }
      };
      mockSettings.get.mockResolvedValue(mockResponse);

      const result = await getSettings();

      expect(result.agent.llm_provider).toBe('anthropic');
      expect(result.agent.llm_model).toBe('claude-3-opus');
    });

    it('should handle custom chunk sizes', async () => {
      const mockResponse = {
        message: 'Chunk size updated'
      };
      mockSettings.update.mockResolvedValue(mockResponse);

      await updateSettings({
        chunk_size: 2000,
        chunk_overlap: 400
      });

      expect(mockSettings.update).toHaveBeenCalledWith({
        chunk_size: 2000,
        chunk_overlap: 400
      });
    });

    it('should handle embedding model updates', async () => {
      const mockResponse = {
        message: 'Embedding model updated'
      };
      mockSettings.update.mockResolvedValue(mockResponse);

      await updateSettings({
        embedding_model: 'text-embedding-3-large'
      });

      expect(mockSettings.update).toHaveBeenCalledWith({
        embedding_model: 'text-embedding-3-large'
      });
    });

    it('should handle provider updates', async () => {
      const mockResponse = {
        message: 'Provider updated'
      };
      mockSettings.update.mockResolvedValue(mockResponse);

      await updateSettings({
        llm_provider: 'anthropic'
      });

      expect(mockSettings.update).toHaveBeenCalledWith({
        llm_provider: 'anthropic'
      });
    });
  });
});

// Made with Bob
