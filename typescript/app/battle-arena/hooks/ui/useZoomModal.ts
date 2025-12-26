import { useState, useCallback } from 'react';
import { Character } from '../../types';

export interface ZoomCardData {
  playerClass: Character;
  characterName: string;
  monsterImageUrl?: string;
  canEdit: boolean;
  editType?: 'hero' | 'monster';
  imagePrompt?: string;
  imageSetting?: string;
}

/**
 * Custom hook to manage zoom modal state for character cards.
 * Provides a clean API for opening and closing the zoom view.
 * 
 * @returns Object with zoom state and control functions
 */
export function useZoomModal() {
  const [zoomedCard, setZoomedCard] = useState<ZoomCardData | null>(null);
  
  const openZoom = useCallback((data: ZoomCardData) => {
    setZoomedCard(data);
  }, []);
  
  const closeZoom = useCallback(() => {
    setZoomedCard(null);
  }, []);
  
  return {
    zoomedCard,
    openZoom,
    closeZoom,
    isOpen: !!zoomedCard,
  };
}

// Made with Bob
