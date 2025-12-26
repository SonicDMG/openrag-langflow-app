'use client';

import { useEffect } from 'react';
import { loadAllCharacterData } from '../utils/dataLoader';

/**
 * Component that initializes character data (heroes and monsters) on app start
 * This ensures data is loaded from the database and cached in localStorage
 * regardless of which page the user visits first
 */
export function DataInitializer() {
  useEffect(() => {
    // Load both heroes and monsters on app initialization
    // This happens once when the app starts, regardless of which page is visited
    loadAllCharacterData().then(({ heroes, monsters }) => {
      console.log(`[DataInitializer] App initialization complete: ${heroes.length} heroes, ${monsters.length} monsters loaded`);
    }).catch((error) => {
      console.error('[DataInitializer] Failed to initialize character data:', error);
    });
  }, []); // Run once on mount

  // This component doesn't render anything
  return null;
}

