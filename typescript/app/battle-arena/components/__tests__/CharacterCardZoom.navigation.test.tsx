import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { CharacterCardZoom } from '../battle/CharacterCardZoom';
import { Character } from '../../types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock pdfExport to avoid TextEncoder issues in tests
jest.mock('../../utils/pdfExport', () => ({
  exportCharacterToPDF: jest.fn(),
  generateCharacterPDFBlob: jest.fn(),
}));

describe('CharacterCardZoom - Navigation', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const mockCharacter: Character = {
    _id: 'test-hero-123',
    name: 'Test Hero',
    hitPoints: 30,
    maxHitPoints: 30,
    armorClass: 15,
    attackBonus: 5,
    damageDie: 'd8',
    abilities: [],
    description: 'A test hero',
    color: 'bg-blue-500',
  };

  it('should navigate to edit page with correct URL format (hyphenated path)', async () => {
    render(
      <CharacterCardZoom
        playerClass={mockCharacter}
        characterName="Test Hero"
        isOpen={true}
        onClose={jest.fn()}
        canEdit={true}
        editType="hero"
      />
    );

    // Find and click the edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    // Verify the URL uses hyphens, not spaces
    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('/battle-arena/unified-character-creator');
    expect(calledUrl).not.toContain('/battle arena/');
    expect(calledUrl).not.toContain('/battle%20arena/');
    
    // Verify it includes the character ID and type
    expect(calledUrl).toContain('id=test-hero-123');
    expect(calledUrl).toContain('type=hero');
  });

  it('should navigate with correct URL format for monsters', async () => {
    const mockMonster: Character = {
      ...mockCharacter,
      _id: 'test-monster-456',
      name: 'Test Monster',
    };

    render(
      <CharacterCardZoom
        playerClass={mockMonster}
        characterName="Test Monster"
        isOpen={true}
        onClose={jest.fn()}
        canEdit={true}
        editType="monster"
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('/battle-arena/unified-character-creator');
    expect(calledUrl).toContain('id=test-monster-456');
    expect(calledUrl).toContain('type=monster');
  });

  it('should properly encode special characters in character ID', async () => {
    const mockCharacterWithSpecialId: Character = {
      ...mockCharacter,
      _id: 'test-hero-with-special-chars-#@!',
    };

    render(
      <CharacterCardZoom
        playerClass={mockCharacterWithSpecialId}
        characterName="Test Hero"
        isOpen={true}
        onClose={jest.fn()}
        canEdit={true}
        editType="hero"
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    const calledUrl = mockPush.mock.calls[0][0];
    // Verify the ID is properly encoded
    expect(calledUrl).toContain('id=test-hero-with-special-chars');
    // Verify the base path is still correct
    expect(calledUrl).toContain('/battle-arena/unified-character-creator');
  });
});

// Made with Bob
