/**
 * Tests for OpenRAG Chat Utilities
 * 
 * These tests verify SDK integration without testing the SDK itself.
 * All SDK methods are mocked to ensure we're testing our utility layer.
 */

import { OpenRAGClient } from 'openrag-sdk';
import {
  chatSimple,
  chatStreaming,
  listConversations,
  getConversation,
  deleteConversation
} from '../chat';

// Mock the OpenRAG SDK
jest.mock('openrag-sdk');

describe('Chat Utilities', () => {
  let mockClient: jest.Mocked<OpenRAGClient>;
  let mockChat: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock chat object
    mockChat = {
      create: jest.fn(),
      stream: jest.fn(),
      list: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    };

    // Create mock client
    mockClient = {
      chat: mockChat
    } as any;

    // Mock OpenRAGClient constructor
    (OpenRAGClient as jest.MockedClass<typeof OpenRAGClient>).mockImplementation(() => mockClient);
  });

  describe('chatSimple', () => {
    it('should send a simple chat message using SDK', async () => {
      const mockResponse = {
        response: 'This is a test response',
        chatId: 'chat-123',
        sources: [{ filename: 'doc1.pdf', score: 0.9 }]
      };
      mockChat.create.mockResolvedValue(mockResponse);

      const result = await chatSimple('Hello, how are you?');

      expect(mockChat.create).toHaveBeenCalledWith({
        message: 'Hello, how are you?',
        chatId: undefined
      });
      expect(result).toEqual(mockResponse);
    });

    it('should include chatId when continuing conversation', async () => {
      const mockResponse = {
        response: 'Follow-up response',
        chatId: 'chat-123',
        sources: []
      };
      mockChat.create.mockResolvedValue(mockResponse);

      await chatSimple('Follow-up question', 'chat-123');

      expect(mockChat.create).toHaveBeenCalledWith({
        message: 'Follow-up question',
        chatId: 'chat-123'
      });
    });

    it('should use provided client instance', async () => {
      const customClient = {
        chat: {
          create: jest.fn().mockResolvedValue({ response: 'Custom response', chatId: 'custom-123', sources: [] })
        }
      } as any;

      await chatSimple('Test message', undefined, customClient);

      expect(customClient.chat.create).toHaveBeenCalledWith({
        message: 'Test message',
        chatId: undefined
      });
      expect(mockChat.create).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Chat service unavailable');
      mockChat.create.mockRejectedValue(sdkError);

      await expect(chatSimple('Test message')).rejects.toThrow('Chat service unavailable');
    });
  });

  describe('chatStreaming', () => {
    it('should stream chat responses using SDK', async () => {
      const mockEvents = [
        { type: 'content', delta: 'Hello ' },
        { type: 'content', delta: 'world!' },
        { type: 'done', chatId: 'chat-123' }
      ];

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const event of mockEvents) {
            yield event;
          }
        },
        text: 'Hello world!',
        chatId: 'chat-123',
        sources: [{ filename: 'doc1.pdf', score: 0.8 }],
        close: jest.fn()
      };

      mockChat.stream.mockResolvedValue(mockStream);

      const events = [];
      for await (const event of chatStreaming('Test streaming')) {
        events.push(event);
      }

      expect(mockChat.stream).toHaveBeenCalledWith({
        message: 'Test streaming',
        chatId: undefined
      });
      expect(events).toHaveLength(4); // 3 stream events + 1 final event
      expect(events[events.length - 1]).toEqual({
        type: 'final',
        text: 'Hello world!',
        chatId: 'chat-123',
        sources: [{ filename: 'doc1.pdf', score: 0.8 }]
      });
      expect(mockStream.close).toHaveBeenCalled();
    });

    it('should include chatId when continuing conversation', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content', delta: 'Response' };
        },
        text: 'Response',
        chatId: 'chat-456',
        sources: [],
        close: jest.fn()
      };

      mockChat.stream.mockResolvedValue(mockStream);

      const events = [];
      for await (const event of chatStreaming('Follow-up', 'chat-456')) {
        events.push(event);
      }

      expect(mockChat.stream).toHaveBeenCalledWith({
        message: 'Follow-up',
        chatId: 'chat-456'
      });
    });

    it('should close stream even if error occurs', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content', delta: 'Start' };
          throw new Error('Stream error');
        },
        text: '',
        chatId: null,
        sources: [],
        close: jest.fn()
      };

      mockChat.stream.mockResolvedValue(mockStream);

      try {
        for await (const event of chatStreaming('Test')) {
          // Process events
        }
      } catch (error) {
        // Expected error
      }

      expect(mockStream.close).toHaveBeenCalled();
    });

    it('should use provided client instance', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content', delta: 'Custom' };
        },
        text: 'Custom',
        chatId: 'custom-123',
        sources: [],
        close: jest.fn()
      };

      const customClient = {
        chat: {
          stream: jest.fn().mockResolvedValue(mockStream)
        }
      } as any;

      const events = [];
      for await (const event of chatStreaming('Test', undefined, customClient)) {
        events.push(event);
      }

      expect(customClient.chat.stream).toHaveBeenCalled();
      expect(mockChat.stream).not.toHaveBeenCalled();
    });
  });

  describe('listConversations', () => {
    it('should list all conversations using SDK', async () => {
      const mockConversations = [
        { chatId: 'chat-1', title: 'Conversation 1', createdAt: '2024-01-01' },
        { chatId: 'chat-2', title: 'Conversation 2', createdAt: '2024-01-02' }
      ];
      mockChat.list.mockResolvedValue({ conversations: mockConversations });

      const result = await listConversations();

      expect(mockChat.list).toHaveBeenCalled();
      expect(result).toEqual(mockConversations);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no conversations exist', async () => {
      mockChat.list.mockResolvedValue({ conversations: [] });

      const result = await listConversations();

      expect(result).toEqual([]);
    });

    it('should use provided client instance', async () => {
      const customClient = {
        chat: {
          list: jest.fn().mockResolvedValue({ conversations: [{ chatId: 'custom' }] })
        }
      } as any;

      await listConversations(customClient);

      expect(customClient.chat.list).toHaveBeenCalled();
      expect(mockChat.list).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Failed to list conversations');
      mockChat.list.mockRejectedValue(sdkError);

      await expect(listConversations()).rejects.toThrow('Failed to list conversations');
    });
  });

  describe('getConversation', () => {
    it('should get conversation with messages using SDK', async () => {
      const mockConversation = {
        chatId: 'chat-123',
        title: 'Test Conversation',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ]
      };
      mockChat.get.mockResolvedValue(mockConversation);

      const result = await getConversation('chat-123');

      expect(mockChat.get).toHaveBeenCalledWith('chat-123');
      expect(result).toEqual({
        chatId: 'chat-123',
        title: 'Test Conversation',
        messages: mockConversation.messages
      });
    });

    it('should use provided client instance', async () => {
      const customClient = {
        chat: {
          get: jest.fn().mockResolvedValue({
            chatId: 'custom-123',
            title: 'Custom',
            messages: []
          })
        }
      } as any;

      await getConversation('custom-123', customClient);

      expect(customClient.chat.get).toHaveBeenCalledWith('custom-123');
      expect(mockChat.get).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Conversation not found');
      mockChat.get.mockRejectedValue(sdkError);

      await expect(getConversation('nonexistent')).rejects.toThrow('Conversation not found');
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation using SDK', async () => {
      mockChat.delete.mockResolvedValue(undefined);

      const result = await deleteConversation('chat-123');

      expect(mockChat.delete).toHaveBeenCalledWith('chat-123');
      expect(result).toBe(true);
    });

    it('should return true even if SDK returns void', async () => {
      mockChat.delete.mockResolvedValue(undefined);

      const result = await deleteConversation('chat-456');

      expect(result).toBe(true);
    });

    it('should use provided client instance', async () => {
      const customClient = {
        chat: {
          delete: jest.fn().mockResolvedValue(undefined)
        }
      } as any;

      await deleteConversation('custom-123', customClient);

      expect(customClient.chat.delete).toHaveBeenCalledWith('custom-123');
      expect(mockChat.delete).not.toHaveBeenCalled();
    });

    it('should handle SDK errors properly', async () => {
      const sdkError = new Error('Delete failed');
      mockChat.delete.mockRejectedValue(sdkError);

      await expect(deleteConversation('chat-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('SDK Integration', () => {
    it('should create new client when none provided', async () => {
      mockChat.create.mockResolvedValue({ response: 'Test', chatId: 'test', sources: [] });

      await chatSimple('Test');

      expect(OpenRAGClient).toHaveBeenCalled();
    });

    it('should not create new client when one is provided', async () => {
      const customClient = {
        chat: {
          create: jest.fn().mockResolvedValue({ response: 'Test', chatId: 'test', sources: [] })
        }
      } as any;

      await chatSimple('Test', undefined, customClient);

      // OpenRAGClient constructor should not be called since we provided a client
      expect(OpenRAGClient).not.toHaveBeenCalled();
    });
  });
});

// Made with Bob
