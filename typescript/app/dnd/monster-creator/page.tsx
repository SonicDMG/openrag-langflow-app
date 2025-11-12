'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MonsterCreator from '../components/MonsterCreator';
import { Sparkles } from '../components/Sparkles';
import { applyAnimationClass } from '../utils/animations';

export default function MonsterCreatorPage() {
  const [createdMonsterId, setCreatedMonsterId] = useState<string | null>(null);
  const [expression, setExpression] = useState('neutral');
  
  // Card animation states (same as battle/test pages)
  const [shouldShake, setShouldShake] = useState(false);
  const [shouldSparkle, setShouldSparkle] = useState(false);
  const [shouldMiss, setShouldMiss] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [sparkleTrigger, setSparkleTrigger] = useState(0);
  const [missTrigger, setMissTrigger] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [sparkleIntensity, setSparkleIntensity] = useState(0);
  
  const animationRef = useRef<HTMLDivElement>(null);

  // Apply shake animation
  useEffect(() => {
    if (animationRef.current && shouldShake) {
      const intensity = shakeIntensity > 0 ? shakeIntensity : 1;
      const scale = 0.15 + (Math.sqrt(Math.min(intensity / 30, 1.0)) * 1.85); // Using 30 as default max HP
      animationRef.current.style.setProperty('--shake-intensity', scale.toString());
    }
    
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldShake,
      shakeTrigger,
      'shake',
      400,
      () => setShouldShake(false)
    );
    return cleanup;
  }, [shouldShake, shakeTrigger, shakeIntensity]);

  // Apply sparkle animation
  useEffect(() => {
    if (shouldSparkle && sparkleTrigger > 0) {
      const timer = setTimeout(() => {
        setShouldSparkle(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldSparkle, sparkleTrigger]);

  // Apply miss animation
  useEffect(() => {
    const cleanup = applyAnimationClass(
      animationRef.current,
      shouldMiss,
      missTrigger,
      'miss',
      600,
      () => setShouldMiss(false)
    );
    return cleanup;
  }, [shouldMiss, missTrigger]);

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
            
            <div 
              ref={animationRef}
              className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl sparkle-container relative"
            >
              {shouldSparkle && (
                <Sparkles 
                  key={sparkleTrigger} 
                  trigger={sparkleTrigger} 
                  count={sparkleIntensity > 0 ? Math.max(1, Math.ceil(sparkleIntensity * 0.6)) : 12}
                />
              )}
              
              <div className="flex justify-center">
                <img
                  src={`/cdn/monsters/${createdMonsterId}/256.png`}
                  alt="Monster preview"
                  style={{
                    imageRendering: 'pixelated',
                    width: '256px',
                    height: '256px',
                  }}
                  className={expression === 'happy' ? 'brightness-110' : expression === 'angry' ? 'brightness-90 contrast-110' : ''}
                />
              </div>
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

              <div className="flex gap-2 pt-2">
                <button
                  onClick={testShake}
                  className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white text-xs rounded border border-red-700 transition-all"
                >
                  Test Shake
                </button>
                <button
                  onClick={testSparkle}
                  className="px-3 py-1 bg-green-900 hover:bg-green-800 text-white text-xs rounded border border-green-700 transition-all"
                >
                  Test Sparkle
                </button>
                <button
                  onClick={testMiss}
                  className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"
                >
                  Test Miss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

