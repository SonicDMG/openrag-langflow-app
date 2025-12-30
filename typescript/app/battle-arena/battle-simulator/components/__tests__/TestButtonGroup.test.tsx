/**
 * Tests for TestButtonGroup Component
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestButtonGroup } from '../TestButtonGroup';

describe('TestButtonGroup', () => {
  const mockOnTestAction = jest.fn();

  beforeEach(() => {
    mockOnTestAction.mockClear();
  });

  describe('Rendering', () => {
    it('should render all 7 test action buttons', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      expect(screen.getByText(/High Damage/i)).toBeInTheDocument();
      expect(screen.getByText(/Low Damage/i)).toBeInTheDocument();
      expect(screen.getByText(/Full Heal/i)).toBeInTheDocument();
      expect(screen.getByText(/Low Heal/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Miss/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Cast/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Defeat/i)).toBeInTheDocument();
    });

    it('should render buttons with correct icons', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      expect(screen.getByText(/💥 High Damage/i)).toBeInTheDocument();
      expect(screen.getByText(/💚 Full Heal/i)).toBeInTheDocument();
      expect(screen.getByText(/❌ Test Miss/i)).toBeInTheDocument();
      expect(screen.getByText(/🔮 Test Cast/i)).toBeInTheDocument();
      expect(screen.getByText(/💀 Test Defeat/i)).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onTestAction with highDamage when High Damage button is clicked', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/💥 High Damage/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('highDamage');
      expect(mockOnTestAction).toHaveBeenCalledTimes(1);
    });

    it('should call onTestAction with lowDamage when Low Damage button is clicked', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/💥 Low Damage/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('lowDamage');
    });

    it('should call onTestAction with fullHeal when Full Heal button is clicked', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/💚 Full Heal/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('fullHeal');
    });

    it('should call onTestAction with lowHeal when Low Heal button is clicked', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/💚 Low Heal/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('lowHeal');
    });

    it('should call onTestAction with miss when Test Miss button is clicked', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/❌ Test Miss/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('miss');
    });

    it('should call onTestAction with cast when Test Cast button is clicked', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/🔮 Test Cast/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('cast');
    });

    it('should call onTestAction with defeat when Test Defeat button is clicked', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/💀 Test Defeat/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('defeat');
    });
  });

  describe('Disabled State', () => {
    it('should not call onTestAction when buttons are disabled', () => {
      render(
        <TestButtonGroup
          player="player2"
          onTestAction={mockOnTestAction}
          isDisabled={true}
        />
      );

      const highDamageButton = screen.getByText(/💥 High Damage/i);
      fireEvent.click(highDamageButton);
      
      expect(mockOnTestAction).not.toHaveBeenCalled();
    });

    it('should apply disabled styling when isDisabled is true', () => {
      render(
        <TestButtonGroup
          player="player2"
          onTestAction={mockOnTestAction}
          isDisabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('opacity-50');
        expect(button).toHaveClass('cursor-not-allowed');
        expect(button).toBeDisabled();
      });
    });

    it('should not apply disabled styling when isDisabled is false', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
          isDisabled={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('opacity-50');
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Player Prop', () => {
    it('should work correctly with player1', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/💥 High Damage/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('highDamage');
    });

    it('should work correctly with player2', () => {
      render(
        <TestButtonGroup
          player="player2"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/💚 Full Heal/i));
      expect(mockOnTestAction).toHaveBeenCalledWith('fullHeal');
    });
  });

  describe('Multiple Button Clicks', () => {
    it('should handle multiple button clicks correctly', () => {
      render(
        <TestButtonGroup
          player="player1"
          onTestAction={mockOnTestAction}
        />
      );

      fireEvent.click(screen.getByText(/💥 High Damage/i));
      fireEvent.click(screen.getByText(/💚 Full Heal/i));
      fireEvent.click(screen.getByText(/❌ Test Miss/i));

      expect(mockOnTestAction).toHaveBeenCalledTimes(3);
      expect(mockOnTestAction).toHaveBeenNthCalledWith(1, 'highDamage');
      expect(mockOnTestAction).toHaveBeenNthCalledWith(2, 'fullHeal');
      expect(mockOnTestAction).toHaveBeenNthCalledWith(3, 'miss');
    });
  });
});

// Made with Bob
