'use client';

import { useState } from 'react';
import MonsterCreator from '../components/MonsterCreator';
import RigPlayer from '../components/RigPlayer';

export default function MonsterCreatorPage() {
  const [createdMonsterId, setCreatedMonsterId] = useState<string | null>(null);
  const [expression, setExpression] = useState('neutral');
  const [wind, setWind] = useState(0.6);
  const [cast, setCast] = useState(false);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Monster Creator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <MonsterCreator onMonsterCreated={setCreatedMonsterId} />
        </div>

        {createdMonsterId && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Preview</h2>
            
            <div className="border rounded p-4 bg-gray-50">
              <RigPlayer
                bundleUrl={`/cdn/monsters/${createdMonsterId}`}
                expression={expression}
                wind={wind}
                cast={cast}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Expression
                <select
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded"
                >
                  <option value="neutral">Neutral</option>
                  <option value="happy">Happy</option>
                  <option value="angry">Angry</option>
                </select>
              </label>

              <label className="block text-sm font-medium">
                Wind Strength: {wind.toFixed(1)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={wind}
                  onChange={(e) => setWind(parseFloat(e.target.value))}
                  className="mt-1 w-full"
                />
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={cast}
                  onChange={(e) => setCast(e.target.checked)}
                />
                <span>Cast Spell</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

