/**
 * Tests for GlobalTestControls Component
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalTestControls } from '../GlobalTestControls';

describe('GlobalTestControls', () => {
  const mockOnToggleAIMode = jest.fn();
  const mockOnReset = jest.fn();

  beforeEach(() => {
    mockOnToggleAIMode.mockClear();
    mockOnReset.mockClear();
  });

  describe('Rendering', () => {
    it('should render AI Mode button when AI mode is off', () => {
      render(
        <GlobalTestControls
          isAIModeActive={false}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText(/🤖 AI Mode: OFF/i)).toBeInTheDocument();
    });

    it('should render AI Mode button when AI mode is on', () => {
      render(
        <GlobalTestControls
          isAIModeActive={true}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText(/🤖 AI Mode: ON/i)).toBeInTheDocument();
    });

    it('should render Reset Test button', () => {
      render(
        <GlobalTestControls
          isAIModeActive={false}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText(/🔄 Reset Test/i)).toBeInTheDocument();
    });

    it('should show AI mode status message when AI mode is active', () => {
      render(
        <GlobalTestControls
          isAIModeActive={true}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText(/🤖 AI Mode Active/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 2 \(opponent\) will automatically play/i)).toBeInTheDocument();
    });

    it('should not show AI mode status message when AI mode is inactive', () => {
      render(
        <GlobalTestControls
          isAIModeActive={false}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      expect(screen.queryByText(/🤖 AI Mode Active/i)).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onToggleAIMode when AI Mode button is clicked', () => {
      render(
        <GlobalTestControls
          isAIModeActive={false}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      fireEvent.click(screen.getByText(/🤖 AI Mode: OFF/i));
      expect(mockOnToggleAIMode).toHaveBeenCalledTimes(1);
    });

    it('should call onReset when Reset Test button is clicked', () => {
      render(
        <GlobalTestControls
          isAIModeActive={false}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      fireEvent.click(screen.getByText(/🔄 Reset Test/i));
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks correctly', () => {
      render(
        <GlobalTestControls
          isAIModeActive={false}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      fireEvent.click(screen.getByText(/🤖 AI Mode: OFF/i));
      fireEvent.click(screen.getByText(/🔄 Reset Test/i));
      fireEvent.click(screen.getByText(/🤖 AI Mode: OFF/i));

      expect(mockOnToggleAIMode).toHaveBeenCalledTimes(2);
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should apply green styling when AI mode is active', () => {
      render(
        <GlobalTestControls
          isAIModeActive={true}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      const aiButton = screen.getByText(/🤖 AI Mode: ON/i);
      expect(aiButton).toHaveClass('bg-green-900');
      expect(aiButton).toHaveClass('border-green-700');
    });

    it('should apply blue styling when AI mode is inactive', () => {
      render(
        <GlobalTestControls
          isAIModeActive={false}
          onToggleAIMode={mockOnToggleAIMode}
          onReset={mockOnReset}
        />
      );

      const aiButton = screen.getByText(/🤖 AI Mode: OFF/i);
      expect(aiButton).toHaveClass('bg-blue-900');
      expect(aiButton).toHaveClass('border-blue-700');
    });
  });
});

// Made with Bob
