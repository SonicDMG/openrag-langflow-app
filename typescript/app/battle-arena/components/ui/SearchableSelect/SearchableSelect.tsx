'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
  name: string;
  type: 'class' | 'monster';
  isCustom?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  helpText?: string;
}

/**
 * SearchableSelect component provides a dropdown with search functionality
 * Supports keyboard navigation and groups options by standard/custom
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select a class or monster...',
  disabled = false,
  className = '',
  label,
  helpText,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options;
    }
    const term = searchTerm.toLowerCase();
    return options.filter(option => 
      option.name.toLowerCase().includes(term) ||
      option.type.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  // Get selected option display name
  const selectedOption = options.find(opt => opt.name === value);
  const displayValue = selectedOption 
    ? `${selectedOption.name} (${selectedOption.type === 'class' ? 'Class' : 'Monster'})${selectedOption.isCustom ? ' [Custom]' : ''}`
    : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const option = filteredOptions[focusedIndex];
        if (option) {
          onChange(option.name);
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredOptions, focusedIndex, onChange]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  const handleSelect = (optionName: string) => {
    onChange(optionName);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearchTerm('');
      setFocusedIndex(-1);
    }
  };

  // Group options: fallback first, then custom
  const groupedOptions = useMemo(() => {
    const fallback = filteredOptions.filter(opt => !opt.isCustom);
    const custom = filteredOptions.filter(opt => opt.isCustom);
    return { fallback, custom };
  }, [filteredOptions]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-amber-100 mb-2">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100 text-left flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-900/70 cursor-pointer'
        }`}
      >
        <span className={value ? '' : 'text-amber-400'}>
          {displayValue || placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-amber-900 border-2 border-amber-700 rounded-lg shadow-2xl max-h-96 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-amber-700">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFocusedIndex(-1);
                }}
                placeholder="Search..."
                className="w-full px-3 py-2 pl-8 border border-amber-700 rounded bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
                autoFocus
              />
              <svg
                className="absolute left-2 top-2.5 w-4 h-4 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <div className="mt-1 text-xs text-amber-300">
                {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="overflow-y-auto flex-1"
            style={{ maxHeight: 'calc(24rem - 80px)' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-amber-300 text-sm">
                No results found
              </div>
            ) : (
              <>
                {/* Fallback Options */}
                {groupedOptions.fallback.length > 0 && (
                  <div>
                    {groupedOptions.fallback.length < filteredOptions.length && (
                      <div className="px-3 py-1 text-xs font-semibold text-amber-200 bg-amber-800/50 sticky top-0">
                        Standard
                      </div>
                    )}
                    {groupedOptions.fallback.map((option, index) => {
                      const globalIndex = index;
                      const isFocused = globalIndex === focusedIndex;
                      return (
                        <button
                          key={option.name}
                          type="button"
                          onClick={() => handleSelect(option.name)}
                          className={`w-full px-3 py-2 text-left text-sm ${
                            option.name === value
                              ? 'bg-amber-700 text-amber-50'
                              : isFocused
                              ? 'bg-amber-800 text-amber-100'
                              : 'text-amber-200 hover:bg-amber-800/50'
                          }`}
                          onMouseEnter={() => setFocusedIndex(globalIndex)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.name}</span>
                            <span className="text-xs text-amber-400">
                              {option.type === 'class' ? 'Class' : 'Monster'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Custom Options */}
                {groupedOptions.custom.length > 0 && (
                  <div>
                    {groupedOptions.fallback.length > 0 && (
                      <div className="px-3 py-1 text-xs font-semibold text-amber-200 bg-amber-800/50 sticky top-0 border-t border-amber-700">
                        Custom
                      </div>
                    )}
                    {groupedOptions.custom.map((option, index) => {
                      const globalIndex = groupedOptions.fallback.length + index;
                      const isFocused = globalIndex === focusedIndex;
                      return (
                        <button
                          key={option.name}
                          type="button"
                          onClick={() => handleSelect(option.name)}
                          className={`w-full px-3 py-2 text-left text-sm ${
                            option.name === value
                              ? 'bg-amber-700 text-amber-50'
                              : isFocused
                              ? 'bg-amber-800 text-amber-100'
                              : 'text-amber-200 hover:bg-amber-800/50'
                          }`}
                          onMouseEnter={() => setFocusedIndex(globalIndex)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.name} <span className="text-xs text-amber-400">[Custom]</span></span>
                            <span className="text-xs text-amber-400">
                              {option.type === 'class' ? 'Class' : 'Monster'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {helpText && (
        <p className="text-xs text-amber-300 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
}

// Made with Bob
