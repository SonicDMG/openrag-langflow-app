import { Character } from '../types';
import { getCharacterImageUrlOrPlaceholder } from './utils/imageUtils';

interface OpponentHeaderProps {
  player2Class: Character | null;
  player2Name: string;
  findAssociatedMonster: (className: string) => (Character & { monsterId: string; imageUrl: string }) | null;
}

/**
 * Header section for the opponent selector showing the currently selected opponent.
 * Displays opponent avatar, name, and class information.
 */
export function OpponentHeader({
  player2Class,
  player2Name,
  findAssociatedMonster,
}: OpponentHeaderProps) {
  if (!player2Class) return null;

  const associatedMonster = findAssociatedMonster(player2Class.name);
  const imageUrl = getCharacterImageUrlOrPlaceholder(associatedMonster?.monsterId);

  return (
    <>
      <img
        src={imageUrl}
        alt={player2Class.name}
        className="w-10 h-10 object-cover rounded"
        style={{ imageRendering: 'pixelated' as const }}
      />
      <div className="flex items-center gap-2">
        <div>
          <div className="font-bold text-sm" style={{ color: '#5C4033' }}>
            {player2Name || player2Class.name}
          </div>
          <div className="text-xs text-gray-600 italic">{player2Class.name}</div>
        </div>
      </div>
    </>
  );
}

// Made with Bob