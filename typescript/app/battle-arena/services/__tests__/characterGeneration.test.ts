import {
  extractRaceFromDescription,
  extractSexFromDescription,
  extractNameFromDescription,
  generateCharacterStats,
} from '../characterGeneration';
import { PLAYER_RACES } from '../../lib/constants';

// Mock the API utilities
jest.mock('../../utils/api', () => ({
  parseSSEResponse: jest.fn(),
  extractJsonFromResponse: jest.fn(),
}));

describe('Character Generation - Extraction Functions', () => {
  describe('extractRaceFromDescription', () => {
    it('should extract "Human" from description', () => {
      expect(extractRaceFromDescription('A brave Human warrior')).toBe('Human');
      expect(extractRaceFromDescription('human fighter')).toBe('Human');
      expect(extractRaceFromDescription('A HUMAN paladin')).toBe('Human');
    });

    it('should extract "Elf" from description', () => {
      expect(extractRaceFromDescription('An Elf from the forest')).toBe('Elf');
      expect(extractRaceFromDescription('elf ranger')).toBe('Elf');
      expect(extractRaceFromDescription('An ELF wizard')).toBe('Elf');
    });

    it('should extract "Dwarf" from description', () => {
      expect(extractRaceFromDescription('A Dwarf blacksmith')).toBe('Dwarf');
      expect(extractRaceFromDescription('dwarf fighter')).toBe('Dwarf');
    });

    it('should extract race with parentheses if it exists in PLAYER_RACES', () => {
      // Check if "Dark Elf (Drow)" exists in the races list
      const hasDrow = PLAYER_RACES.some(r => r.name.includes('Drow'));
      if (hasDrow) {
        const drowRace = PLAYER_RACES.find(r => r.name.includes('Drow'));
        expect(extractRaceFromDescription(`Dark Elf (Drow) mage`)).toBe(drowRace?.name);
      } else {
        // If Drow doesn't exist, test with a race that does exist
        const testRace = PLAYER_RACES[0];
        expect(extractRaceFromDescription(`${testRace.name} warrior`)).toBe(testRace.name);
      }
    });

    it('should extract race from middle of sentence', () => {
      expect(extractRaceFromDescription('The warrior was a Human fighter')).toBe('Human');
      expect(extractRaceFromDescription('A powerful Elf mage cast spells')).toBe('Elf');
    });

    it('should extract race at start of sentence', () => {
      expect(extractRaceFromDescription('Human warrior with sword')).toBe('Human');
      expect(extractRaceFromDescription('Elf ranger in the woods')).toBe('Elf');
    });

    it('should be case-insensitive', () => {
      expect(extractRaceFromDescription('HUMAN warrior')).toBe('Human');
      expect(extractRaceFromDescription('eLf ranger')).toBe('Elf');
      expect(extractRaceFromDescription('DwArF fighter')).toBe('Dwarf');
    });

    it('should return undefined when no race found', () => {
      expect(extractRaceFromDescription('No race mentioned here')).toBeUndefined();
      expect(extractRaceFromDescription('A warrior with a sword')).toBeUndefined();
      expect(extractRaceFromDescription('')).toBeUndefined();
    });

    it('should not match partial words', () => {
      // "Elf" should not match "Elfwood" or "shelf"
      expect(extractRaceFromDescription('Elfwood forest')).toBeUndefined();
      expect(extractRaceFromDescription('On the shelf')).toBeUndefined();
    });

    it('should extract various Battle Arena races', () => {
      // Test specific races that are known to exist
      const testRaces = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn'];
      
      testRaces.forEach((raceName) => {
        const race = PLAYER_RACES.find(r => r.name === raceName);
        if (race) {
          const desc = `A ${race.name} warrior`;
          expect(extractRaceFromDescription(desc)).toBe(race.name);
        }
      });
    });
  });

  describe('extractSexFromDescription', () => {
    describe('male patterns', () => {
      it('should extract "male" from "male"', () => {
        expect(extractSexFromDescription('A male warrior')).toBe('male');
      });

      it('should extract "male" from "man"', () => {
        expect(extractSexFromDescription('A man with a sword')).toBe('male');
        expect(extractSexFromDescription('The man fought')).toBe('male');
      });

      it('should extract "male" from "men"', () => {
        expect(extractSexFromDescription('Two men warriors')).toBe('male');
      });

      it('should extract "male" from "boy"', () => {
        expect(extractSexFromDescription('A boy wizard')).toBe('male');
      });

      it('should extract "male" from pronouns (he, him, his)', () => {
        expect(extractSexFromDescription('He is a fighter')).toBe('male');
        expect(extractSexFromDescription('Him the warrior')).toBe('male');
        expect(extractSexFromDescription('His sword glows')).toBe('male');
      });
    });

    describe('female patterns', () => {
      it('should extract "female" from "female"', () => {
        expect(extractSexFromDescription('A female warrior')).toBe('female');
      });

      it('should extract "female" from "woman"', () => {
        expect(extractSexFromDescription('A woman with magic')).toBe('female');
        expect(extractSexFromDescription('The woman fought')).toBe('female');
      });

      it('should extract "female" from "women"', () => {
        expect(extractSexFromDescription('Two women rangers')).toBe('female');
      });

      it('should extract "female" from "girl"', () => {
        expect(extractSexFromDescription('A girl cleric')).toBe('female');
      });

      it('should extract "female" from pronouns (she, her, hers)', () => {
        expect(extractSexFromDescription('She is a wizard')).toBe('female');
        expect(extractSexFromDescription('Her staff glows')).toBe('female');
        expect(extractSexFromDescription('The staff is hers')).toBe('female');
      });
    });

    describe('other patterns', () => {
      it('should extract "other" from "non-binary"', () => {
        expect(extractSexFromDescription('A non-binary character')).toBe('other');
      });

      it('should extract "other" from "nonbinary"', () => {
        expect(extractSexFromDescription('A nonbinary bard')).toBe('other');
      });

      it('should extract "other" from "enby"', () => {
        expect(extractSexFromDescription('An enby druid')).toBe('other');
      });

      it('should extract "other" from pronouns (they, them, their)', () => {
        expect(extractSexFromDescription('They are a fighter')).toBe('other');
        expect(extractSexFromDescription('Them the warrior')).toBe('other');
        expect(extractSexFromDescription('Their sword glows')).toBe('other');
      });
    });

    it('should be case-insensitive', () => {
      expect(extractSexFromDescription('MALE warrior')).toBe('male');
      expect(extractSexFromDescription('FEMALE wizard')).toBe('female');
      expect(extractSexFromDescription('NON-BINARY character')).toBe('other');
    });

    it('should return undefined when no sex found', () => {
      expect(extractSexFromDescription('No gender mentioned')).toBeUndefined();
      expect(extractSexFromDescription('A warrior with a sword')).toBeUndefined();
      expect(extractSexFromDescription('')).toBeUndefined();
    });

    it('should not match partial words', () => {
      // "male" should not match "female" or "pale"
      expect(extractSexFromDescription('female warrior')).toBe('female'); // Should match female, not male
      expect(extractSexFromDescription('pale warrior')).toBeUndefined();
    });
  });

  describe('extractNameFromDescription', () => {
    it('should extract name from "Name the Class" pattern', () => {
      expect(extractNameFromDescription('Gandalf the Wizard')).toBe('Gandalf');
      expect(extractNameFromDescription('Aragorn the Ranger')).toBe('Aragorn');
      expect(extractNameFromDescription('Legolas the Archer')).toBe('Legolas');
    });

    it('should extract name from "Name, a Class" pattern', () => {
      expect(extractNameFromDescription('Gandalf, a Wizard')).toBe('Gandalf');
      expect(extractNameFromDescription('Aragorn, a Ranger')).toBe('Aragorn');
    });

    it('should extract name from "Name is a..." pattern', () => {
      expect(extractNameFromDescription('Gandalf is a wizard')).toBe('Gandalf');
      expect(extractNameFromDescription('Aragorn was a ranger')).toBe('Aragorn');
    });

    it('should extract name from "Name: description" pattern', () => {
      expect(extractNameFromDescription('Gandalf: skilled wizard')).toBe('Gandalf');
      expect(extractNameFromDescription('Aragorn: brave ranger')).toBe('Aragorn');
    });

    it('should extract name from "The character Name..." pattern', () => {
      expect(extractNameFromDescription('The character Gandalf')).toBe('Gandalf');
      expect(extractNameFromDescription('The hero Aragorn')).toBe('Aragorn');
      expect(extractNameFromDescription('A warrior Legolas')).toBe('Legolas');
    });

    it('should handle multi-word names', () => {
      expect(extractNameFromDescription('Aragorn son of Arathorn the Ranger')).toBe('Aragorn son of Arathorn');
      expect(extractNameFromDescription('Gandalf the Grey: wizard')).toBe('Gandalf the Grey');
    });

    it('should not extract common class/race words', () => {
      expect(extractNameFromDescription('Human the Warrior')).toBeUndefined();
      expect(extractNameFromDescription('Elf the Ranger')).toBeUndefined();
      expect(extractNameFromDescription('Dwarf the Fighter')).toBeUndefined();
      expect(extractNameFromDescription('Halfling the Rogue')).toBeUndefined();
      expect(extractNameFromDescription('Dragonborn the Paladin')).toBeUndefined();
    });

    it('should return undefined when no name found', () => {
      expect(extractNameFromDescription('A warrior with a sword')).toBeUndefined();
      expect(extractNameFromDescription('No name mentioned here')).toBeUndefined();
      expect(extractNameFromDescription('')).toBeUndefined();
    });

    it('should handle case variations', () => {
      expect(extractNameFromDescription('gandalf the wizard')).toBe('gandalf');
      expect(extractNameFromDescription('ARAGORN the ranger')).toBe('ARAGORN');
    });
  });
});

describe('Character Generation - generateCharacterStats', () => {
  // Mock fetch
  global.fetch = jest.fn();

  // Mock TextDecoder for Node.js environment
  global.TextDecoder = class TextDecoder {
    decode(input: any) {
      return String.fromCharCode(...new Uint8Array(input));
    }
  } as any;

  const { parseSSEResponse, extractJsonFromResponse } = require('../../utils/api');

  // Store original console.warn
  const originalWarn = console.warn;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected warnings in tests
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore original console.warn
    console.warn = originalWarn;
  });

  describe('race and sex extraction and assignment', () => {
    it('should extract race from description and include in result', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse) // Stats API call
        .mockResolvedValueOnce(mockResponse); // Abilities API call

      // Mock parseSSEResponse to return empty content (will trigger fallback)
      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({ content: '', responseId: null }) // Stats response
        .mockResolvedValueOnce({ content: '', responseId: null }); // Abilities response
      (extractJsonFromResponse as jest.Mock)
        .mockReturnValueOnce(null) // Stats JSON
        .mockReturnValueOnce(null); // Abilities JSON

      const result = await generateCharacterStats('', 'A Human warrior', 'hero');

      // Race should be extracted from description
      expect(result.race).toBe('Human');
      // Sex should be randomly assigned (not undefined)
      expect(result.sex).toBeDefined();
      expect(['male', 'female', 'other']).toContain(result.sex);
    });

    it('should extract sex from description and include in result', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse) // Stats API call
        .mockResolvedValueOnce(mockResponse); // Abilities API call

      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({ content: '', responseId: null }) // Stats response
        .mockResolvedValueOnce({ content: '', responseId: null }); // Abilities response
      (extractJsonFromResponse as jest.Mock)
        .mockReturnValueOnce(null) // Stats JSON
        .mockReturnValueOnce(null); // Abilities JSON

      const result = await generateCharacterStats('', 'A male fighter', 'hero');

      // Sex should be extracted from description
      expect(result.sex).toBe('male');
      // Race should be randomly assigned for heroes
      expect(result.race).toBeDefined();
      expect(PLAYER_RACES.map(r => r.name)).toContain(result.race);
    });

    it('should randomly assign race for heroes when not found', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse) // Stats API call
        .mockResolvedValueOnce(mockResponse); // Abilities API call

      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({ content: '', responseId: null }) // Stats response
        .mockResolvedValueOnce({ content: '', responseId: null }); // Abilities response
      (extractJsonFromResponse as jest.Mock)
        .mockReturnValueOnce(null) // Stats JSON
        .mockReturnValueOnce(null); // Abilities JSON

      const result = await generateCharacterStats('', 'A warrior with no race mentioned', 'hero');

      // Race should be randomly assigned
      expect(result.race).toBeDefined();
      expect(result.race).not.toBe('n/a');
      expect(PLAYER_RACES.map(r => r.name)).toContain(result.race);
      // Sex should also be assigned
      expect(result.sex).toBeDefined();
    });

    it('should randomly assign sex when not found', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse) // Stats API call
        .mockResolvedValueOnce(mockResponse); // Abilities API call

      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({ content: '', responseId: null }) // Stats response
        .mockResolvedValueOnce({ content: '', responseId: null }); // Abilities response
      (extractJsonFromResponse as jest.Mock)
        .mockReturnValueOnce(null) // Stats JSON
        .mockReturnValueOnce(null); // Abilities JSON

      const result = await generateCharacterStats('', 'A warrior with no gender', 'hero');

      // Sex should be randomly assigned
      expect(result.sex).toBeDefined();
      expect(result.sex).not.toBe('n/a');
      expect(['male', 'female', 'other']).toContain(result.sex);
    });

    it('should filter out "n/a" values from AI response', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse) // Stats API call
        .mockResolvedValueOnce(mockResponse); // Abilities API call

      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({ content: '{"race": "n/a", "sex": "n/a"}', responseId: null }) // Stats response
        .mockResolvedValueOnce({ content: '', responseId: null }); // Abilities response
      (extractJsonFromResponse as jest.Mock)
        .mockReturnValueOnce('{"race": "n/a", "sex": "n/a"}') // Stats JSON
        .mockReturnValueOnce(null); // Abilities JSON

      const result = await generateCharacterStats('', 'A warrior', 'hero');

      // Should filter out "n/a" and assign defaults
      expect(result.race).toBeDefined();
      expect(result.race).not.toBe('n/a');
      expect(result.sex).toBeDefined();
      expect(result.sex).not.toBe('n/a');
    });

    it('should not assign race to monsters', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          })),
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse) // Stats API call
        .mockResolvedValueOnce(mockResponse); // Abilities API call

      (parseSSEResponse as jest.Mock)
        .mockResolvedValueOnce({ content: '', responseId: null }) // Stats response
        .mockResolvedValueOnce({ content: '', responseId: null }); // Abilities response
      (extractJsonFromResponse as jest.Mock)
        .mockReturnValueOnce(null) // Stats JSON
        .mockReturnValueOnce(null); // Abilities JSON

      const result = await generateCharacterStats('', 'A goblin warrior', 'monster');

      // Monsters should not get random race assignment
      expect(result.race).toBeUndefined();
      // But should get random sex
      expect(result.sex).toBeDefined();
      expect(['male', 'female', 'other']).toContain(result.sex);
    });
  });
});

