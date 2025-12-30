import { useCallback } from 'react';
import { Character } from '../../lib/types';

type CreatedMonster = Character & { monsterId: string; imageUrl: string };

/**
 * Custom hook to find the most recently associated monster for a given class name.
 * Handles both created monsters (with klass field) and regular monsters (matched by name).
 * 
 * @param createdMonsters - Array of created monsters with metadata
 * @returns Function to find associated monster by class name
 */
export function useMonsterAssociation(createdMonsters: CreatedMonster[]) {
  return useCallback((className: string): CreatedMonster | null => {
    const associated = createdMonsters
      .filter(m => {
        // For created monsters, match by klass field; for regular monsters, match by name
        const monsterKlass = (m as any).klass;
        return monsterKlass ? monsterKlass === className : m.name === className;
      })
      .sort((a, b) => {
        // Sort by lastAssociatedAt (most recently associated first), then by createdAt (newest first)
        const aTime = (a as any).lastAssociatedAt || (a as any).createdAt || '';
        const bTime = (b as any).lastAssociatedAt || (b as any).createdAt || '';
        if (aTime && bTime) {
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }
        // Fallback to UUID sort if no timestamps
        return b.monsterId.localeCompare(a.monsterId);
      });
    
    return associated.length > 0 ? associated[0] : null;
  }, [createdMonsters]);
}

// Made with Bob
