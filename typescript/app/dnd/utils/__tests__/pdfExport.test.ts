import { exportCharacterToPDF, exportMultipleCharactersToPDF, CharacterPDFExportOptions } from '../pdfExport';
import { DnDClass, AttackAbility, HealingAbility } from '../../types';

// Mock jsPDF
jest.mock('jspdf', () => {
  const mockDoc = {
    internal: {
      pageSize: {
        getWidth: () => 210, // A4 width in mm
        getHeight: () => 297, // A4 height in mm
      },
    },
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    splitTextToSize: jest.fn((text: string) => [text]),
    addPage: jest.fn(),
    addImage: jest.fn(),
    save: jest.fn(),
  };

  return jest.fn(() => mockDoc);
});

// Mock Image constructor for image loading
global.Image = jest.fn(() => {
  const img = {
    crossOrigin: '',
    src: '',
    width: 100,
    height: 100,
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
  } as any;
  
  // Simulate successful image load
  setTimeout(() => {
    if (img.onload) img.onload();
  }, 0);
  
  return img;
}) as any;

describe('PDF Export Utilities', () => {
  const mockCharacter: DnDClass = {
    name: 'Test Fighter',
    hitPoints: 25,
    maxHitPoints: 30,
    armorClass: 16,
    attackBonus: 5,
    damageDie: 'd8',
    meleeDamageDie: 'd10',
    rangedDamageDie: 'd6',
    abilities: [
      {
        name: 'Power Strike',
        type: 'attack',
        damageDice: '2d8',
        attackRoll: true,
        attacks: 1,
        description: 'A powerful melee attack',
      } as AttackAbility,
      {
        name: 'Heal',
        type: 'healing',
        healingDice: '1d8+3',
        description: 'Restore hit points',
      } as HealingAbility,
    ],
    description: 'A brave warrior who fights for justice',
    color: 'bg-blue-500',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportCharacterToPDF', () => {
    it('should export a character with all required fields', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
        characterType: 'Hero',
      };

      await exportCharacterToPDF(options);

      // Verify PDF was created and saved
      const jsPDF = require('jspdf');
      expect(jsPDF).toHaveBeenCalled();
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalledWith(expect.stringContaining('Test_Hero'));
    });

    it('should include image generation details when provided', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
        characterType: 'Custom Hero',
        imagePrompt: 'A warrior with a glowing sword',
        imageSetting: 'medieval',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      // Should call text for setting name and description
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Setting/Theme'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle missing optional fields gracefully', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      expect(jsPDF).toHaveBeenCalled();
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should include character image when imageUrl is provided', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
        imageUrl: '/test/image.png',
      };

      await exportCharacterToPDF(options);

      // Wait for image to load
      await new Promise(resolve => setTimeout(resolve, 10));

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.addImage).toHaveBeenCalled();
    });

    it('should handle custom filename', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
        filename: 'custom_filename.pdf',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalledWith('custom_filename.pdf');
    });

    it('should handle custom footer text', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
        footerText: 'Custom Footer 2025',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Custom Footer 2025',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include all statistics', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      
      // Check that stats are included
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      expect(textCalls.some((text: string) => text.includes('HP: 25/30'))).toBe(true);
      expect(textCalls.some((text: string) => text.includes('AC: 16'))).toBe(true);
      expect(textCalls.some((text: string) => text.includes('ATK: +5'))).toBe(true);
      expect(textCalls.some((text: string) => text.includes('DMG: d8'))).toBe(true);
      expect(textCalls.some((text: string) => text.includes('Melee: d10'))).toBe(true);
      expect(textCalls.some((text: string) => text.includes('Ranged: d6'))).toBe(true);
    });

    it('should include abilities with details', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      expect(textCalls.some((text: string) => text.includes('Power Strike'))).toBe(true);
      expect(textCalls.some((text: string) => text.includes('Heal'))).toBe(true);
    });

    it('should sanitize text with problematic Unicode characters', async () => {
      const characterWithUnicode: DnDClass = {
        ...mockCharacter,
        description: 'A warrior with a "smart quote" and an em—dash',
        name: 'Test\u2026Hero', // Contains ellipsis
      };

      const options: CharacterPDFExportOptions = {
        playerClass: characterWithUnicode,
        characterName: 'Test\u2026Hero',
        imagePrompt: 'Character with "quotes" and em—dash',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      
      // Verify that problematic characters are sanitized
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      // Should not contain raw Unicode characters
      const allText = textCalls.join(' ');
      expect(allText).not.toContain('\u2026'); // Ellipsis should be replaced
      expect(allText).not.toContain('\u2014'); // Em dash should be replaced
    });

    it('should handle characters without abilities', async () => {
      const characterWithoutAbilities: DnDClass = {
        ...mockCharacter,
        abilities: [],
      };

      const options: CharacterPDFExportOptions = {
        playerClass: characterWithoutAbilities,
        characterName: 'Test Hero',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should handle long descriptions with word wrapping', async () => {
      const longDescription = 'A'.repeat(500); // Very long description
      const characterWithLongDesc: DnDClass = {
        ...mockCharacter,
        description: longDescription,
      };

      const options: CharacterPDFExportOptions = {
        playerClass: characterWithLongDesc,
        characterName: 'Test Hero',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      // Should use splitTextToSize for wrapping
      expect(mockDoc.splitTextToSize).toHaveBeenCalled();
    });
  });

  describe('exportMultipleCharactersToPDF', () => {
    it('should export multiple characters to a single PDF', async () => {
      const characters: CharacterPDFExportOptions[] = [
        {
          playerClass: mockCharacter,
          characterName: 'Hero 1',
        },
        {
          playerClass: { ...mockCharacter, name: 'Test Wizard' },
          characterName: 'Hero 2',
        },
      ];

      await exportMultipleCharactersToPDF(characters);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      // Should add a page for the second character
      expect(mockDoc.addPage).toHaveBeenCalled();
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should handle empty array gracefully', async () => {
      await exportMultipleCharactersToPDF([]);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should use custom filename when provided', async () => {
      const characters: CharacterPDFExportOptions[] = [
        {
          playerClass: mockCharacter,
          characterName: 'Hero 1',
        },
      ];

      await exportMultipleCharactersToPDF(characters, {
        filename: 'custom_batch.pdf',
      });

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalledWith('custom_batch.pdf');
    });
  });

  describe('Text Sanitization (indirect testing)', () => {
    it('should replace em dashes with hyphens', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: {
          ...mockCharacter,
          description: 'Text with em—dash',
        },
        characterName: 'Test',
        imagePrompt: 'Prompt with em—dash',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      const allText = textCalls.join(' ');
      
      // Should not contain em dash
      expect(allText).not.toContain('—');
      // Should contain regular hyphen instead
      expect(allText).toContain('-');
    });

    it('should replace smart quotes with ASCII quotes', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: {
          ...mockCharacter,
          description: 'Text with "smart quotes" and \'single quotes\'',
        },
        characterName: 'Test',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      const allText = textCalls.join(' ');
      
      // Should not contain Unicode quotes
      expect(allText).not.toContain('\u201C'); // Left double quote
      expect(allText).not.toContain('\u201D'); // Right double quote
      expect(allText).not.toContain('\u2018'); // Left single quote
      expect(allText).not.toContain('\u2019'); // Right single quote
    });

    it('should replace ellipsis with three dots', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: {
          ...mockCharacter,
          description: 'Text with ellipsis…',
        },
        characterName: 'Test',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      const allText = textCalls.join(' ');
      
      // Should not contain Unicode ellipsis
      expect(allText).not.toContain('\u2026');
      // Should contain three dots instead
      expect(allText).toContain('...');
    });

    it('should filter out problematic Unicode characters', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: {
          ...mockCharacter,
          description: 'Text with emoji 🗡️ and symbols ⚔️',
        },
        characterName: 'Test',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      const allText = textCalls.join(' ');
      
      // Should not contain emoji characters
      expect(allText).not.toContain('🗡️');
      expect(allText).not.toContain('⚔️');
    });

    it('should preserve valid accented characters', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: {
          ...mockCharacter,
          description: 'José and François are valid',
        },
        characterName: 'José',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      const allText = textCalls.join(' ');
      
      // Should preserve accented characters (they're in Latin Extended range)
      expect(allText).toContain('José');
      expect(allText).toContain('François');
    });

    it('should handle empty strings', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: {
          ...mockCharacter,
          description: '',
        },
        characterName: '',
        imagePrompt: '',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle character with only imagePrompt (no setting)', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
        imagePrompt: 'A warrior',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should handle character with only imageSetting (no prompt)', async () => {
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: 'Test Hero',
        imageSetting: 'medieval',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should handle attack ability with all optional fields', async () => {
      const characterWithFullAbility: DnDClass = {
        ...mockCharacter,
        abilities: [
          {
            name: 'Multi-Strike',
            type: 'attack',
            damageDice: '2d6',
            attackRoll: true,
            attacks: 3,
            bonusDamageDice: '1d4',
            description: 'Strikes multiple times',
          } as AttackAbility,
        ],
      };

      const options: CharacterPDFExportOptions = {
        playerClass: characterWithFullAbility,
        characterName: 'Test Hero',
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      const textCalls = mockDoc.text.mock.calls.map((call: any[]) => call[0]);
      expect(textCalls.some((text: string) => text.includes('Multi-Strike'))).toBe(true);
    });

    it('should handle very long character name', async () => {
      const longName = 'A'.repeat(100);
      const options: CharacterPDFExportOptions = {
        playerClass: mockCharacter,
        characterName: longName,
      };

      await exportCharacterToPDF(options);

      const jsPDF = require('jspdf');
      const mockDoc = jsPDF();
      // Filename should be sanitized
      const saveCall = mockDoc.save.mock.calls[0][0];
      expect(saveCall).toContain('A');
      expect(saveCall.endsWith('.pdf')).toBe(true);
    });
  });
});

