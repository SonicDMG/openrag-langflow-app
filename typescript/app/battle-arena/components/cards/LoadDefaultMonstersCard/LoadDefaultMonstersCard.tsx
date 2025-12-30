'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoadDefaultMonstersCardProps {
  size?: 'normal' | 'compact';
}

export function LoadDefaultMonstersCard({ size = 'compact' }: LoadDefaultMonstersCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadDefaults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/monsters/load-defaults', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load default monsters');
      }

      const data = await response.json();
      console.log(`Loaded ${data.count} default monsters`);
      
      // Reload the page to refresh the monster list
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error('Failed to load default monsters:', error);
      alert(error instanceof Error ? error.message : 'Failed to load default monsters. Please try again.');
      setIsLoading(false);
    }
  };

  const isCompact = size === 'compact';
  const cardWidth = isCompact ? 'w-48' : 'w-80';
  const cardHeight = isCompact ? 'h-64' : 'h-96';
  const iconSize = isCompact ? 'w-12 h-12' : 'w-16 h-16';
  const textSize = isCompact ? 'text-sm' : 'text-base';
  const titleSize = isCompact ? 'text-base' : 'text-xl';

  return (
    <button
      onClick={handleLoadDefaults}
      disabled={isLoading}
      className={`${cardWidth} ${cardHeight} bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl border-2 border-red-700/50 hover:border-red-600 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-900/50 flex flex-col items-center justify-center gap-3 p-4 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
    >
      {/* Icon */}
      <div className={`${iconSize} rounded-full bg-red-800/30 flex items-center justify-center group-hover:bg-red-700/40 transition-colors`}>
        <svg 
          className={`${iconSize} text-red-400 group-hover:text-red-300 transition-colors`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isLoading ? (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              className="animate-spin origin-center"
            />
          ) : (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          )}
        </svg>
      </div>

      {/* Text */}
      <div className="text-center">
        <h3 className={`${titleSize} font-bold text-red-200 mb-1`}>
          {isLoading ? 'Loading...' : 'Load Default Monsters'}
        </h3>
        <p className={`${textSize} text-red-300/80`}>
          {isLoading ? 'Adding monsters to database...' : 'Add 59 Battle Arena monsters'}
        </p>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/10 transition-all duration-300 pointer-events-none" />
    </button>
  );
}

// Made with Bob