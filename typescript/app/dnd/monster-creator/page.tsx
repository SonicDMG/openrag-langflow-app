'use client';

import { useState, useCallback } from 'react';
import MonsterCreator from '../components/MonsterCreator';
import { CharacterCard } from '../components/CharacterCard';
import { DnDClass } from '../types';

export default function MonsterCreatorPage() {
  const [createdMonsterId, setCreatedMonsterId] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string>('');
  
  // Card animation states
  const [shouldShake, setShouldShake] = useState(false);
  const [shouldSparkle, setShouldSparkle] = useState(false);
  const [shouldMiss, setShouldMiss] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [sparkleTrigger, setSparkleTrigger] = useState(0);
  const [missTrigger, setMissTrigger] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [sparkleIntensity, setSparkleIntensity] = useState(0);

  // Create a basic DnDClass object for the preview
  const previewMonsterClass: DnDClass = {
    name: monsterName || 'Monster',
    hitPoints: 30,
    maxHitPoints: 30,
    armorClass: 14,
    attackBonus: 4,
    damageDie: 'd8',
    abilities: [],
    description: `A ${monsterName || 'monster'} created in the monster creator.`,
    color: 'bg-slate-900',
  };

  const testShake = useCallback(() => {
    setShakeIntensity(10);
    setShouldShake(true);
    setShakeTrigger(prev => prev + 1);
  }, []);

  const testSparkle = useCallback(() => {
    setSparkleIntensity(15);
    setShouldSparkle(true);
    setSparkleTrigger(prev => prev + 1);
  }, []);

  const testMiss = useCallback(() => {
    setShouldMiss(true);
    setMissTrigger(prev => prev + 1);
  }, []);

  const handleMonsterCreated = useCallback((monsterId: string) => {
    setCreatedMonsterId(monsterId);
    // Extract monster name from the ID or use a default
    // The monster ID is a UUID, so we'll use a generic name
    setMonsterName('Created Monster');
  }, []);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Monster Creator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <MonsterCreator onMonsterCreated={handleMonsterCreated} />
        </div>

        {createdMonsterId && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Preview</h2>
            
            <CharacterCard
              playerClass={previewMonsterClass}
              characterName={monsterName || 'Created Monster'}
              monsterImageUrl={`/cdn/monsters/${createdMonsterId}/256.png`}
              shouldShake={shouldShake}
              shouldSparkle={shouldSparkle}
              shouldMiss={shouldMiss}
              shakeTrigger={shakeTrigger}
              sparkleTrigger={sparkleTrigger}
              missTrigger={missTrigger}
              shakeIntensity={shakeIntensity}
              sparkleIntensity={sparkleIntensity}
              onShakeComplete={() => setShouldShake(false)}
              onSparkleComplete={() => setShouldSparkle(false)}
              onMissComplete={() => setShouldMiss(false)}
              testButtons={[
                {
                  label: 'Test Shake',
                  onClick: testShake,
                  className: 'px-2 py-0.5 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all'
                },
                {
                  label: 'Test Sparkle',
                  onClick: testSparkle,
                  className: 'px-2 py-0.5 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all'
                },
                {
                  label: 'Test Miss',
                  onClick: testMiss,
                  className: 'px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all'
                }
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

