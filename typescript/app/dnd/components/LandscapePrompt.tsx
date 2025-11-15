'use client';

import { useState, useEffect } from 'react';

export function LandscapePrompt() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobileDevice = window.innerWidth < 768; // md breakpoint
      const isPortraitMode = window.innerHeight > window.innerWidth;
      
      setIsMobile(isMobileDevice);
      setIsPortrait(isPortraitMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isMobile || !isPortrait) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-amber-900/95 flex items-center justify-center p-4">
      <div className="bg-amber-800 border-4 border-amber-700 rounded-lg p-8 shadow-2xl max-w-md text-center">
        <div className="mb-6">
          <svg 
            className="w-24 h-24 mx-auto text-amber-200 animate-spin-slow" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-amber-100 mb-4" style={{ fontFamily: 'serif' }}>
          Rotate Your Device
        </h2>
        <p className="text-amber-200 mb-2">
          Battle Arena is best played in landscape mode.
        </p>
        <p className="text-amber-300 text-sm">
          Please rotate your device to continue.
        </p>
      </div>
    </div>
  );
}

