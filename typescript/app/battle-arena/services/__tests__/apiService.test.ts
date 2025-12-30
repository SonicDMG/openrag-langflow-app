import {
  fetchAvailableClasses,
  fetchClassStats,
} from '../client/apiService';
import { parseSSEResponse, extractJsonFromResponse } from '../../utils/api';

// Mock the API utilities
jest.mock('../../utils/api', () => ({
  parseSSEResponse: jest.fn(),
  extractJsonFromResponse: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock TextDecoder for Node.js environment
global.TextDecoder = class TextDecoder {
  decode(input: any) {
    return String.fromCharCode(...new Uint8Array(input));
  }
} as any;

describe('apiService - Query Structure Tests', () => {
  const mockAddLog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (parseSSEResponse as jest.Mock).mockClear();
    (extractJsonFromResponse as jest.Mock).mockClear();
  });

  describe('fetchAvailableClasses', () => {
    it('should use the correct query structure with search context', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (parseSSEResponse as jest.Mock).mockResolvedValue({
        content: '["Fighter", "Wizard", "Rogue"]',
        responseId: null,
      });

      await fetchAvailableClasses(mockAddLog, 'Battle Arena');

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Verify the query structure
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      // Should use the exact query structure specified
      expect(requestBody.message).toContain('Using your tools, find all character sheets, details, and descriptions for heroes or classes that match "Battle Arena"');
      expect(requestBody.message).toContain('Return only a JSON array of class or hero names');
      expect(requestBody.message).not.toContain('Based on your knowledge base');
      expect(requestBody.message).not.toContain('what character classes are available');
    });

    it('should default to "Battle Arena" when no search context provided', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (parseSSEResponse as jest.Mock).mockResolvedValue({
        content: '["Fighter", "Wizard"]',
        responseId: null,
      });

      await fetchAvailableClasses(mockAddLog);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      // Should default to "Battle Arena"
      expect(requestBody.message).toContain('match "Battle Arena"');
    });

    it('should use custom search context when provided', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (parseSSEResponse as jest.Mock).mockResolvedValue({
        content: '["Pikachu", "Charizard"]',
        responseId: null,
      });

      await fetchAvailableClasses(mockAddLog, 'Pokemon');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      // Should use the provided search context
      expect(requestBody.message).toContain('match "Pokemon"');
    });
  });

  describe('processSingleCharacter (via fetchClassStats)', () => {
    it('should make exactly 2 queries: search + follow-up in same thread', async () => {
      const mockChatResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      const mockHeroesResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ heroes: [] }),
      };

      const mockMonstersResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ monsters: [] }),
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/heroes') {
          return Promise.resolve(mockHeroesResponse);
        }
        if (url === '/api/monsters-db') {
          return Promise.resolve(mockMonstersResponse);
        }
        return Promise.resolve(mockChatResponse);
      });
      
      // First call: search query
      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({
          content: 'Found character sheet for Scanlan',
          responseId: 'response-123',
        });
      
      // Second call: follow-up query
      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            name: 'Scanlan',
            hitPoints: 30,
            armorClass: 15,
            attackBonus: 4,
            damageDie: 'd8',
            description: 'A bard character',
            abilities: [],
          }),
          responseId: 'response-123',
        });

      (extractJsonFromResponse as jest.Mock).mockReturnValue(
        JSON.stringify({
          name: 'Scanlan',
          hitPoints: 30,
          armorClass: 15,
          attackBonus: 4,
          damageDie: 'd8',
          description: 'A bard character',
          abilities: [],
        })
      );

      const results = await fetchClassStats('Scanlan', mockAddLog);

      // Should make exactly 2 chat API calls (search + follow-up) plus 2 database check calls
      // Total: 4 calls (2 chat + 2 database checks)
      expect(global.fetch).toHaveBeenCalledTimes(4);
      
      // Filter to only chat API calls for the main assertions
      const chatCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[0] === '/api/chat'
      );
      expect(chatCalls).toHaveLength(2);

      // First call: search query (filter to chat calls only)
      const firstCall = chatCalls[0];
      const firstRequestBody = JSON.parse(firstCall[1].body);
      expect(firstRequestBody.message).toBe('using your tools, find character sheet, details, description, name, and abilities for Scanlan. Be sure to list the name as "Name: nameHere"');
      expect(firstRequestBody.previousResponseId).toBeNull(); // New thread

      // Second call: follow-up query
      const secondCall = chatCalls[1];
      const secondRequestBody = JSON.parse(secondCall[1].body);
      expect(secondRequestBody.message).toContain('Based on the information found about Scanlan');
      expect(secondRequestBody.message).toContain('provide the complete character information in JSON format');
      expect(secondRequestBody.previousResponseId).toBe('response-123'); // Same thread
      
      // Should return results
      expect(results).toHaveLength(1);
      expect(results[0].characterName).toBe('Scanlan');
    });

    it('should not make a third query for abilities separately', async () => {
      const mockChatResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      const mockHeroesResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ heroes: [] }),
      };

      const mockMonstersResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ monsters: [] }),
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/heroes') {
          return Promise.resolve(mockHeroesResponse);
        }
        if (url === '/api/monsters-db') {
          return Promise.resolve(mockMonstersResponse);
        }
        return Promise.resolve(mockChatResponse);
      });
      
      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({
          content: 'Found character sheet',
          responseId: 'response-123',
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            hitPoints: 30,
            armorClass: 15,
            abilities: [
              { name: 'Fireball', type: 'attack', damageDice: '3d6', attackRoll: true },
            ],
          }),
          responseId: 'response-123',
        });

      (extractJsonFromResponse as jest.Mock).mockReturnValue(
        JSON.stringify({
          hitPoints: 30,
          armorClass: 15,
          abilities: [
            { name: 'Fireball', type: 'attack', damageDice: '3d6', attackRoll: true },
          ],
        })
      );

      const results = await fetchClassStats('Wizard', mockAddLog);

      // Should make 2 chat API calls (search + follow-up) plus 2 database check calls
      const chatCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[0] === '/api/chat'
      );
      expect(chatCalls).toHaveLength(2);
      
      // Abilities should be included in the result from the second query
      expect(results[0].abilities).toHaveLength(1);
      expect(results[0].abilities[0].name).toBe('Fireball');
    });

    it('should include abilities in the follow-up query structure', async () => {
      const mockChatResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      const mockHeroesResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ heroes: [] }),
      };

      const mockMonstersResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ monsters: [] }),
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/heroes') {
          return Promise.resolve(mockHeroesResponse);
        }
        if (url === '/api/monsters-db') {
          return Promise.resolve(mockMonstersResponse);
        }
        return Promise.resolve(mockChatResponse);
      });
      
      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({
          content: 'Found character',
          responseId: 'response-123',
        })
        .mockResolvedValueOnce({
          content: '{}',
          responseId: 'response-123',
        });

      (extractJsonFromResponse as jest.Mock).mockReturnValue('{}');

      await fetchClassStats('Fighter', mockAddLog);

      // Check that the follow-up query includes abilities in the structure
      // Filter to chat calls only to get the follow-up query
      const chatCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[0] === '/api/chat'
      );
      const secondCall = chatCalls[1];
      const secondRequestBody = JSON.parse(secondCall[1].body);
      
      expect(secondRequestBody.message).toContain('"abilities"');
      expect(secondRequestBody.message).toContain('"attack" or "healing"');
      expect(secondRequestBody.message).toContain('"damageDice"');
      expect(secondRequestBody.message).toContain('"healingDice"');
    });
  });

  describe('fetchClassStats', () => {
    it('should call processSingleCharacter directly without duplicate search', async () => {
      const mockChatResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      const mockHeroesResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ heroes: [] }),
      };

      const mockMonstersResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ monsters: [] }),
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/heroes') {
          return Promise.resolve(mockHeroesResponse);
        }
        if (url === '/api/monsters-db') {
          return Promise.resolve(mockMonstersResponse);
        }
        return Promise.resolve(mockChatResponse);
      });
      
      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({
          content: 'Found character',
          responseId: 'response-123',
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            hitPoints: 30,
            armorClass: 15,
            abilities: [],
          }),
          responseId: 'response-123',
        });

      (extractJsonFromResponse as jest.Mock).mockReturnValue(
        JSON.stringify({
          hitPoints: 30,
          armorClass: 15,
          abilities: [],
        })
      );

      const results = await fetchClassStats('Rogue', mockAddLog);

      // Should make 2 chat API calls (search + follow-up) plus 2 database check calls
      const chatCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[0] === '/api/chat'
      );
      expect(chatCalls).toHaveLength(2);
      
      // Should not have a separate search query before processSingleCharacter
      const firstCall = chatCalls[0];
      const firstRequestBody = JSON.parse(firstCall[1].body);
      expect(firstRequestBody.message).toBe('using your tools, find character sheet, details, description, name, and abilities for Rogue. Be sure to list the name as "Name: nameHere"');
      
      // Should return results
      expect(results).toHaveLength(1);
      expect(results[0].characterName).toBe('Rogue');
    });

    it('should not make a separate extractAbilities call', async () => {
      const mockChatResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      const mockHeroesResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ heroes: [] }),
      };

      const mockMonstersResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ monsters: [] }),
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/heroes') {
          return Promise.resolve(mockHeroesResponse);
        }
        if (url === '/api/monsters-db') {
          return Promise.resolve(mockMonstersResponse);
        }
        return Promise.resolve(mockChatResponse);
      });
      
      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({
          content: 'Found character',
          responseId: 'response-123',
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            hitPoints: 30,
            armorClass: 15,
            abilities: [
              { name: 'Sneak Attack', type: 'attack', damageDice: '2d6', attackRoll: true },
            ],
          }),
          responseId: 'response-123',
        });

      (extractJsonFromResponse as jest.Mock).mockReturnValue(
        JSON.stringify({
          hitPoints: 30,
          armorClass: 15,
          abilities: [
            { name: 'Sneak Attack', type: 'attack', damageDice: '2d6', attackRoll: true },
          ],
        })
      );

      await fetchClassStats('Rogue', mockAddLog);

      // Should make 2 chat API calls (search + follow-up) plus 2 database check calls
      const chatCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[0] === '/api/chat'
      );
      expect(chatCalls).toHaveLength(2);
      
      // Verify no query contains "return ALL available attack and healing abilities" 
      // (which would indicate a separate extractAbilities call)
      const allCalls = chatCalls;
      allCalls.forEach((call) => {
        const body = JSON.parse(call[1].body);
        expect(body.message).not.toContain('return ALL available attack and healing abilities');
        expect(body.message).not.toContain('From the information found, return ALL available');
      });
    });
  });

  describe('Query Structure Validation', () => {
    it('should ensure fetchAvailableClasses query does not use old format', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (parseSSEResponse as jest.Mock).mockResolvedValue({
        content: '["Fighter"]',
        responseId: null,
      });

      await fetchAvailableClasses(mockAddLog, 'Battle Arena');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      // Should NOT contain old query patterns
      expect(requestBody.message).not.toContain('Based on your knowledge base, what character classes are available');
      expect(requestBody.message).not.toContain('List all available Battle Arena 5th edition character classes');
      
      // Should contain new query pattern
      expect(requestBody.message).toContain('Using your tools, find all character sheets, details, and descriptions');
    });

    it('should ensure fetchClassStats uses correct query sequence', async () => {
      const mockChatResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      const mockHeroesResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ heroes: [] }),
      };

      const mockMonstersResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ monsters: [] }),
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/heroes') {
          return Promise.resolve(mockHeroesResponse);
        }
        if (url === '/api/monsters-db') {
          return Promise.resolve(mockMonstersResponse);
        }
        return Promise.resolve(mockChatResponse);
      });
      
      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({
          content: 'Found',
          responseId: 'response-123',
        })
        .mockResolvedValueOnce({
          content: '{}',
          responseId: 'response-123',
        });

      (extractJsonFromResponse as jest.Mock).mockReturnValue('{}');

      await fetchClassStats('TestCharacter', mockAddLog);

      // Verify query sequence - filter to chat calls only
      const chatCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[0] === '/api/chat'
      );
      expect(chatCalls).toHaveLength(2);
      
      // First query should be the search query
      const firstCall = chatCalls[0];
      expect(JSON.parse(firstCall[1].body).message).toMatch(/^using your tools, find character sheet, details, description, name, and abilities for/);
      
      // Second query should be the follow-up
      const secondCall = chatCalls[1];
      expect(JSON.parse(secondCall[1].body).message).toContain('Based on the information found about');
      expect(JSON.parse(secondCall[1].body).previousResponseId).toBe('response-123');
    });
  });
});

