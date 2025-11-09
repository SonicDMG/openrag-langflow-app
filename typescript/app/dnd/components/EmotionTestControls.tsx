'use client';

import { CharacterEmotion } from '../types';

interface EmotionTestControlsProps {
  characterName: string;
  currentEmotion: CharacterEmotion | null;
  onEmotionChange: (emotion: CharacterEmotion | null) => void;
}

const ALL_EMOTIONS: CharacterEmotion[] = [
  'happy', 'sad', 'hurt', 'laughing', 'rage', 'determined', 
  'worried', 'frustrated', 'dead', 'victorious', 'excited', 
  'confident', 'surprised', 'triumphant'
];

export function EmotionTestControls({ 
  characterName, 
  currentEmotion, 
  onEmotionChange 
}: EmotionTestControlsProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-amber-200">
        {characterName} Emotions
      </h3>
      <div className="flex flex-wrap gap-2 mb-2">
        {ALL_EMOTIONS.map((emotion) => (
          <button
            key={emotion}
            onClick={() => onEmotionChange(currentEmotion === emotion ? null : emotion)}
            className={`px-3 py-1 text-xs rounded border transition-all ${
              currentEmotion === emotion
                ? 'bg-amber-600 text-amber-100 border-amber-400 font-bold'
                : 'bg-amber-800 text-amber-200 border-amber-700 hover:bg-amber-700'
            }`}
          >
            {emotion}
          </button>
        ))}
      </div>
      <button
        onClick={() => onEmotionChange(null)}
        className="px-3 py-1 text-xs bg-red-800 text-red-100 rounded border border-red-700 hover:bg-red-700 transition-all"
      >
        Clear (Use Auto)
      </button>
      {currentEmotion && (
        <span className="ml-2 text-xs text-amber-300 italic">
          Currently: {currentEmotion}
        </span>
      )}
    </div>
  );
}

