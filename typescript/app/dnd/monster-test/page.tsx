'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MonsterCreator from '../components/MonsterCreator';
import RigPlayer from '../components/RigPlayer';

interface CreatedMonster {
  monsterId: string;
  klass: string;
  prompt: string;
  createdAt: string;
}

export default function MonsterTestPage() {
  const router = useRouter();
  const [createdMonsters, setCreatedMonsters] = useState<CreatedMonster[]>([]);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);
  const [expression, setExpression] = useState('neutral');
  const [wind, setWind] = useState(0.6);
  const [cast, setCast] = useState(false);
  const [spellType, setSpellType] = useState<'attack' | 'heal' | 'neutral'>('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing monsters from localStorage (or you could fetch from an API)
  useEffect(() => {
    const saved = localStorage.getItem('createdMonsters');
    if (saved) {
      try {
        const monsters = JSON.parse(saved);
        setCreatedMonsters(monsters);
        if (monsters.length > 0 && !selectedMonsterId) {
          setSelectedMonsterId(monsters[0].monsterId);
        }
      } catch (e) {
        console.error('Failed to load saved monsters:', e);
      }
    }
  }, []);

  const handleMonsterCreated = (monsterId: string) => {
    const newMonster: CreatedMonster = {
      monsterId,
      klass: 'Unknown', // Could be enhanced to fetch from API
      prompt: 'Unknown',
      createdAt: new Date().toISOString(),
    };
    const updated = [newMonster, ...createdMonsters];
    setCreatedMonsters(updated);
    setSelectedMonsterId(monsterId);
    localStorage.setItem('createdMonsters', JSON.stringify(updated));
  };

  const handleDeleteMonster = (monsterId: string) => {
    const updated = createdMonsters.filter((m) => m.monsterId !== monsterId);
    setCreatedMonsters(updated);
    localStorage.setItem('createdMonsters', JSON.stringify(updated));
    if (selectedMonsterId === monsterId) {
      setSelectedMonsterId(updated.length > 0 ? updated[0].monsterId : null);
    }
  };

  const testApiDirectly = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Example: Create a monster with a test image URL
      // In a real scenario, you'd generate this with EverArt first
      const response = await fetch('/api/monsters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          klass: 'TestMonster',
          prompt: 'A test monster for API testing',
          seed: Math.floor(Math.random() * 1000000),
          imageUrl: '', // Leave empty to test error handling, or provide a URL
          stats: {
            hitPoints: 25,
            maxHitPoints: 25,
            armorClass: 12,
            attackBonus: 3,
            damageDie: 'd6',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create monster');
      }

      handleMonsterCreated(data.monsterId);
      alert(`Monster created successfully! ID: ${data.monsterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 text-amber-50">
      {/* Header */}
      <div className="border-b-4 border-amber-800 px-4 sm:px-6 py-4 bg-amber-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-100 mb-2" style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              🎨 Monster Creator
            </h1>
            <p className="text-sm text-amber-200 italic">
              Create and test pixel art monsters with dynamic animations
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={testApiDirectly}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test API Directly'}
            </button>
            <button
              onClick={() => router.push('/dnd')}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold rounded-lg border-2 border-amber-700 transition-all"
            >
              ← Back to Battle
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-600 text-red-100 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Monster Creator */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-amber-100">Create New Monster</h2>
          <MonsterCreator onMonsterCreated={handleMonsterCreated} />
        </div>

        {/* Right Column: Preview & Controls */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-amber-100">Preview & Test</h2>

          {/* Monster Selection */}
          {createdMonsters.length > 0 ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-amber-100">
                Select Monster
                <select
                  value={selectedMonsterId || ''}
                  onChange={(e) => setSelectedMonsterId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                >
                  {createdMonsters.map((monster) => (
                    <option key={monster.monsterId} value={monster.monsterId}>
                      {monster.klass} ({monster.monsterId.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => {
                  if (selectedMonsterId) {
                    handleDeleteMonster(selectedMonsterId);
                  }
                }}
                className="w-full px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Delete Selected Monster
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-900/30 border border-amber-700 rounded text-center text-amber-200">
              No monsters created yet. Create one to see the preview.
            </div>
          )}

          {/* Preview */}
          {selectedMonsterId && (
            <>
              <div className="border border-amber-700 rounded p-4 bg-amber-950/50 flex items-center justify-center min-h-[512px] overflow-hidden">
                <div className="flex items-center justify-center">
                  <RigPlayer
                    bundleUrl={`/cdn/monsters/${selectedMonsterId}`}
                    expression={expression}
                    wind={wind}
                    cast={cast}
                    spellType={spellType}
                    width={256}
                    height={256}
                  />
                </div>
              </div>

              {/* Animation Controls */}
              <div className="border border-amber-700 rounded p-4 space-y-4 bg-amber-900/30">
                <h3 className="font-semibold text-amber-100">Animation Controls</h3>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-amber-100">
                    Expression
                    <select
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="happy">Happy</option>
                      <option value="angry">Angry</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-amber-100">
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
                  <div className="flex gap-2 text-xs text-amber-200">
                    <span>None</span>
                    <span className="flex-1"></span>
                    <span>Strong</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cast}
                      onChange={(e) => setCast(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-amber-100">Cast Spell (Particle Effects)</span>
                  </label>
                </div>

                {cast && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-amber-100">
                      Spell Type
                      <select
                        value={spellType}
                        onChange={(e) => setSpellType(e.target.value as 'attack' | 'heal' | 'neutral')}
                        className="mt-1 w-full px-3 py-2 border border-amber-700 rounded bg-amber-900/50 text-amber-100"
                      >
                        <option value="neutral">Neutral (Blue)</option>
                        <option value="attack">Attack (Red/Orange)</option>
                        <option value="heal">Heal (Green)</option>
                      </select>
                    </label>
                  </div>
                )}

                {/* Quick Test Buttons */}
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-medium text-amber-200">Quick Tests:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setExpression('happy');
                        setWind(0.3);
                        setCast(false);
                      }}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                    >
                      Happy + Light Wind
                    </button>
                    <button
                      onClick={() => {
                        setExpression('angry');
                        setWind(0.9);
                        setCast(false);
                      }}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                    >
                      Angry + Strong Wind
                    </button>
                    <button
                      onClick={() => {
                        setExpression('neutral');
                        setWind(0);
                        setCast(true);
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                      Casting Spell
                    </button>
                    <button
                      onClick={() => {
                        setExpression('neutral');
                        setWind(0.6);
                        setCast(false);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monster List */}
      {createdMonsters.length > 0 && (
        <div className="border border-amber-700 rounded p-4 bg-amber-900/30">
          <h2 className="text-xl font-semibold mb-4 text-amber-100">Created Monsters ({createdMonsters.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {createdMonsters.map((monster) => (
              <div
                key={monster.monsterId}
                className={`border rounded p-3 cursor-pointer transition-colors ${
                  selectedMonsterId === monster.monsterId
                    ? 'bg-amber-800/50 border-amber-500'
                    : 'bg-amber-900/30 border-amber-700 hover:bg-amber-800/40'
                }`}
                onClick={() => setSelectedMonsterId(monster.monsterId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-100">{monster.klass}</h3>
                    <p className="text-xs text-amber-200 mt-1">
                      ID: {monster.monsterId.slice(0, 12)}...
                    </p>
                    <p className="text-xs text-amber-300 mt-1">
                      {new Date(monster.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMonster(monster.monsterId);
                    }}
                    className="ml-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Testing Info */}
      <div className="border border-amber-700 rounded p-4 bg-amber-900/30">
        <h3 className="font-semibold mb-2 text-amber-100">API Testing Information</h3>
        <div className="text-sm space-y-2 text-amber-200">
          <p>
            <strong className="text-amber-100">Endpoint:</strong> <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">POST /api/monsters</code>
          </p>
          <p>
            <strong className="text-amber-100">Required Fields:</strong> <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">klass</code>,{' '}
            <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">prompt</code>
          </p>
          <p>
            <strong className="text-amber-100">Optional Fields:</strong> <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">seed</code>,{' '}
            <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">imageUrl</code>, <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">stats</code>
          </p>
          <p className="text-amber-200 mt-2">
            <strong className="text-amber-100">Note:</strong> If <code className="bg-amber-950 px-2 py-1 rounded border border-amber-700 text-amber-100">imageUrl</code> is not provided, the API will attempt to generate an image.
            For best results, generate images using the EverArt API and provide the URL.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

