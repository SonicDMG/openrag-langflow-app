'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoadDefaultHeroesCardProps {
  size?: 'normal' | 'compact';
}

export function LoadDefaultHeroesCard({ size = 'compact' }: LoadDefaultHeroesCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadDefaults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/heroes/load-defaults', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load default heroes');
      }

      const data = await response.json();
      console.log(`Loaded ${data.count} default heroes`);
      
      // Reload the page to refresh the hero list
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error('Failed to load default heroes:', error);
      alert(error instanceof Error ? error.message : 'Failed to load default heroes. Please try again.');
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
      className={`${cardWidth} ${cardHeight} bg-gradient-to-br from-amber-900/40 to-amber-950/40 rounded-2xl border-2 border-amber-700/50 hover:border-amber-600 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-900/50 flex flex-col items-center justify-center gap-3 p-4 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
    >
      {/* Icon */}
      <div className={`${iconSize} rounded-full bg-amber-800/30 flex items-center justify-center group-hover:bg-amber-700/40 transition-colors`}>
        <svg 
          className={`${iconSize} text-amber-400 group-hover:text-amber-300 transition-colors`}
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          )}
        </svg>
      </div>

      {/* Text */}
      <div className="text-center">
        <h3 className={`${titleSize} font-bold text-amber-200 mb-1`}>
          {isLoading ? 'Loading...' : 'Load Default Heroes'}
        </h3>
        <p className={`${textSize} text-amber-300/80`}>
          {isLoading ? 'Adding heroes to database...' : 'Add 8 classic Battle Arena heroes'}
        </p>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/10 group-hover:to-amber-600/10 transition-all duration-300 pointer-events-none" />
    </button>
  );
}

// Made with Bob
