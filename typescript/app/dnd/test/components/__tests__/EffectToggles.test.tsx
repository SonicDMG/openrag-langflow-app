/**
 * Tests for EffectToggles Component
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EffectToggles } from '../EffectToggles';
import { EffectToggles as EffectTogglesType } from '../../hooks/useEffectToggles';

describe('EffectToggles', () => {
  const mockOnToggle = jest.fn();
  const mockOnLog = jest.fn();

  const defaultToggles: EffectTogglesType = {
    particle: true,
    flash: true,
    shake: true,
    sparkle: true,
    hit: true,
    miss: true,
    cast: true,
  };

  beforeEach(() => {
    mockOnToggle.mockClear();
    mockOnLog.mockClear();
  });

  describe('Rendering', () => {
    it('should render all 7 effect toggle buttons', () => {
      render(
        <EffectToggles
          toggles={defaultToggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      expect(screen.getByText(/Particle: ON/i)).toBeInTheDocument();
      expect(screen.getByText(/Flash: ON/i)).toBeInTheDocument();
      expect(screen.getByText(/Shake: ON/i)).toBeInTheDocument();
      expect(screen.getByText(/Sparkle: ON/i)).toBeInTheDocument();
      expect(screen.getByText(/Hit: ON/i)).toBeInTheDocument();
      expect(screen.getByText(/Miss: ON/i)).toBeInTheDocument();
      expect(screen.getByText(/Cast: ON/i)).toBeInTheDocument();
    });

    it('should render Effects label', () => {
      render(
        <EffectToggles
          toggles={defaultToggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      expect(screen.getByText(/Effects:/i)).toBeInTheDocument();
    });

    it('should show ON state for enabled effects', () => {
      const toggles: EffectTogglesType = {
        ...defaultToggles,
        particle: true,
        flash: true,
      };

      render(
        <EffectToggles
          toggles={toggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      expect(screen.getByText(/Particle: ON/i)).toBeInTheDocument();
      expect(screen.getByText(/Flash: ON/i)).toBeInTheDocument();
    });

    it('should show OFF state for disabled effects', () => {
      const toggles: EffectTogglesType = {
        ...defaultToggles,
        particle: false,
        flash: false,
      };

      render(
        <EffectToggles
          toggles={toggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      expect(screen.getByText(/Particle: OFF/i)).toBeInTheDocument();
      expect(screen.getByText(/Flash: OFF/i)).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onToggle and onLog when Particle button is clicked', () => {
      render(
        <EffectToggles
          toggles={defaultToggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      fireEvent.click(screen.getByText(/Particle: ON/i));
      
      expect(mockOnToggle).toHaveBeenCalledWith('particle', false);
      expect(mockOnLog).toHaveBeenCalledWith(expect.stringContaining('Particle effects disabled'));
    });

    it('should call onToggle and onLog when Flash button is clicked', () => {
      render(
        <EffectToggles
          toggles={defaultToggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      fireEvent.click(screen.getByText(/Flash: ON/i));
      
      expect(mockOnToggle).toHaveBeenCalledWith('flash', false);
      expect(mockOnLog).toHaveBeenCalledWith(expect.stringContaining('Flash effects disabled'));
    });

    it('should call onToggle and onLog when Shake button is clicked', () => {
      render(
        <EffectToggles
          toggles={defaultToggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      fireEvent.click(screen.getByText(/Shake: ON/i));
      
      expect(mockOnToggle).toHaveBeenCalledWith('shake', false);
      expect(mockOnLog).toHaveBeenCalledWith(expect.stringContaining('Shake effects disabled'));
    });

    it('should toggle from OFF to ON', () => {
      const toggles: EffectTogglesType = {
        ...defaultToggles,
        particle: false,
      };

      render(
        <EffectToggles
          toggles={toggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      fireEvent.click(screen.getByText(/Particle: OFF/i));
      
      expect(mockOnToggle).toHaveBeenCalledWith('particle', true);
      expect(mockOnLog).toHaveBeenCalledWith(expect.stringContaining('Particle effects enabled'));
    });

    it('should handle multiple button clicks', () => {
      render(
        <EffectToggles
          toggles={defaultToggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      fireEvent.click(screen.getByText(/Particle: ON/i));
      fireEvent.click(screen.getByText(/Flash: ON/i));
      fireEvent.click(screen.getByText(/Shake: ON/i));

      expect(mockOnToggle).toHaveBeenCalledTimes(3);
      expect(mockOnLog).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling', () => {
    it('should apply green styling for enabled effects', () => {
      render(
        <EffectToggles
          toggles={defaultToggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      const particleButton = screen.getByText(/Particle: ON/i);
      expect(particleButton).toHaveClass('bg-green-600');
      expect(particleButton).toHaveClass('border-green-500');
    });

    it('should apply gray styling for disabled effects', () => {
      const toggles: EffectTogglesType = {
        ...defaultToggles,
        particle: false,
      };

      render(
        <EffectToggles
          toggles={toggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      const particleButton = screen.getByText(/Particle: OFF/i);
      expect(particleButton).toHaveClass('bg-gray-500');
      expect(particleButton).toHaveClass('border-gray-400');
    });
  });

  describe('All Effect Types', () => {
    it('should handle all 7 effect types correctly', () => {
      render(
        <EffectToggles
          toggles={defaultToggles}
          onToggle={mockOnToggle}
          onLog={mockOnLog}
        />
      );

      const effectTypes = ['Particle', 'Flash', 'Shake', 'Sparkle', 'Hit', 'Miss', 'Cast'];
      
      effectTypes.forEach(effectType => {
        const button = screen.getByText(new RegExp(`${effectType}: ON`, 'i'));
        expect(button).toBeInTheDocument();
      });
    });
  });
});

// Made with Bob
