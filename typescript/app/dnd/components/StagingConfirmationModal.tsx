'use client';

import { useEffect } from 'react';

type StagingConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: string[];
  itemType: 'heroes' | 'monsters';
  searchContext?: string;
};

export function StagingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  itemType,
  searchContext,
}: StagingConfirmationModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const itemTypeLabel = itemType === 'heroes' ? 'Heroes/Classes' : 'Monsters';
  const contextLabel = searchContext ? ` (${searchContext})` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-amber-900 border-4 border-amber-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-2 border-amber-800">
          <h2 className="text-2xl font-bold text-amber-100" style={{ fontFamily: 'serif' }}>
            Confirm {itemTypeLabel} Staging
          </h2>
          <p className="text-amber-200 mt-2">
            Found {items.length} {itemType === 'heroes' ? 'hero/class' : 'monster'}{items.length !== 1 ? 's' : ''}{contextLabel}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            <p className="text-amber-200 mb-4">
              The following {itemType === 'heroes' ? 'heroes/classes' : 'monsters'} will be staged from OpenRAG:
            </p>
            <div className="bg-amber-950/50 border border-amber-800 rounded p-4 max-h-96 overflow-y-auto">
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li
                    key={index}
                    className="text-amber-100 flex items-center gap-2"
                  >
                    <span className="text-amber-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-amber-300 text-sm mt-4 italic">
              Click "Confirm and Stage" to proceed with fetching stats and abilities, then saving to localStorage and Astra DB.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-amber-800 flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold rounded-lg border-2 border-amber-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-green-900 hover:bg-green-800 text-white font-semibold rounded-lg border-2 border-green-700 transition-all"
          >
            Confirm and Stage
          </button>
        </div>
      </div>
    </div>
  );
}

