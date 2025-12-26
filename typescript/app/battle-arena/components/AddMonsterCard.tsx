'use client';

import { useRouter } from 'next/navigation';

interface AddMonsterCardProps {
  size?: 'normal' | 'compact';
}

export function AddMonsterCard({ size = 'compact' }: AddMonsterCardProps) {
  const router = useRouter();
  
  // Size scaling - compact is 60% of normal
  const isCompact = size === 'compact';
  const maxWidth = isCompact ? '192px' : '320px';
  const padding = isCompact ? '0.75rem' : '1rem';
  const imageWidth = isCompact ? '180px' : '280px';
  const imageHeight = isCompact ? '130px' : '200px';
  const borderWidth = isCompact ? '2px' : '3px';
  const borderRadius = isCompact ? '8px' : '12px';
  const titleSize = isCompact ? 'text-base' : 'text-xl';
  const typeSize = isCompact ? 'text-[10px]' : 'text-xs';
  const framePadding = isCompact ? '6px' : '10px';
  const innerBorderRadius = isCompact ? '8px' : '12px';

  const handleClick = () => {
    router.push('/battle-arena/unified-character-creator?type=monster');
  };

  return (
    <div 
      className="relative flex flex-col cursor-pointer transition-all hover:scale-105"
      onClick={handleClick}
      style={{ 
        backgroundColor: '#1a1a1a',
        borderRadius: borderRadius,
        width: '100%',
        maxWidth: maxWidth,
        aspectRatio: '3/4',
        padding: framePadding,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 4px 4px, 4px 4px',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Texture overlay for outer frame */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: borderRadius,
          background: `
            repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.03) 0px,
              transparent 1px,
              transparent 2px,
              rgba(0, 0, 0, 0.03) 3px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.03) 0px,
              transparent 1px,
              transparent 2px,
              rgba(0, 0, 0, 0.03) 3px
            )
          `,
          opacity: 0.6,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Inner card */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          backgroundColor: '#F2ECDE',
          borderRadius: innerBorderRadius,
          flex: 1,
          minHeight: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.02) 0%, transparent 50%),
            repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 0, 0, 0.03) 1px, rgba(0, 0, 0, 0.03) 2px),
            repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0, 0, 0, 0.03) 1px, rgba(0, 0, 0, 0.03) 2px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 3px 3px, 3px 3px',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.5),
            inset 0 -1px 2px rgba(0, 0, 0, 0.1),
            0 2px 4px rgba(0, 0, 0, 0.15)
          `
        }}
      >
        {/* Paper grain texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: innerBorderRadius,
            background: `
              repeating-linear-gradient(
                0deg,
                rgba(139, 111, 71, 0.02) 0px,
                transparent 0.5px,
                transparent 1px,
                rgba(139, 111, 71, 0.02) 1.5px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(139, 111, 71, 0.02) 0px,
                transparent 0.5px,
                transparent 1px,
                rgba(139, 111, 71, 0.02) 1.5px
              )
            `,
            opacity: 0.8,
            mixBlendMode: 'multiply'
          }}
        />

        {/* Card Content */}
        <div className="h-full flex flex-col relative z-10" style={{ padding: padding }}>
          {/* Header */}
          <div className="relative" style={{ marginBottom: isCompact ? '0.5rem' : '0.75rem' }}>
            <h3 
              className={`${titleSize} font-bold mb-1`}
              style={{ 
                fontFamily: 'serif',
                color: '#5C4033',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Add Monster
            </h3>
            <p 
              className={typeSize}
              style={{ 
                color: '#8B6F47',
                fontStyle: 'italic'
              }}
            >
              Click to load
            </p>
          </div>

          {/* Placeholder image area */}
          <div 
            className="rounded-lg flex justify-center items-center overflow-hidden relative"
            style={{ 
              backgroundColor: '#E8E0D6',
              border: isCompact ? '1.5px solid #D4C4B0' : '2px solid #D4C4B0',
              borderRadius: isCompact ? '6px' : '8px',
              padding: '0',
              width: `calc(100% + ${padding} + ${padding})`,
              height: imageHeight,
              aspectRatio: '280/200',
              marginBottom: isCompact ? '1.5rem' : '0.75rem',
              marginLeft: `-${padding}`,
              marginRight: `-${padding}`,
            }}
          >
            {/* Plus icon with monster theme */}
            <div className="flex flex-col items-center justify-center gap-2">
              <svg 
                className="w-12 h-12 sm:w-16 sm:h-16" 
                fill="none" 
                stroke="#8B6F47" 
                viewBox="0 0 24 24"
                style={{ strokeWidth: 2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span 
                className="text-xs sm:text-sm"
                style={{ 
                  color: '#8B6F47',
                  fontFamily: 'serif',
                  fontWeight: 'bold'
                }}
              >
                Add Monster
              </span>
            </div>
          </div>

          {/* Divider with diamond icon */}
          <div className="flex items-center justify-center" style={{ marginBottom: isCompact ? '0.5rem' : '0.75rem' }}>
            <div className="flex-1 border-t" style={{ borderColor: '#5C4033' }}></div>
            <div 
              className="mx-2"
              style={{
                width: isCompact ? '6px' : '8px',
                height: isCompact ? '6px' : '8px',
                backgroundColor: '#5C4033',
                transform: 'rotate(45deg)'
              }}
            ></div>
            <div className="flex-1 border-t" style={{ borderColor: '#5C4033' }}></div>
          </div>

          {/* Footer text */}
          <div className="mt-auto text-center">
            <p 
              className={isCompact ? 'text-[10px]' : 'text-xs'}
              style={{ 
                color: '#8B6F47',
                fontFamily: 'serif',
                fontStyle: 'italic'
              }}
            >
              Create a new monster
            </p>
          </div>
        </div>
      </div>

      {/* Footer text in dark frame area */}
      <div 
        className="relative flex items-center"
        style={{ 
          marginTop: isCompact ? '4px' : '6px',
          paddingTop: '0',
          paddingBottom: '0',
          height: isCompact ? '16px' : '20px'
        }}
      >
        {/* Small symbol in center bottom */}
        <div 
          className="absolute"
          style={{
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: isCompact ? '8px' : '10px',
            height: isCompact ? '8px' : '10px',
            backgroundColor: '#F2ECDE',
            opacity: 0.6
          }}
        ></div>

        {/* "2025 OpenRAG" in bottom right */}
        <span 
          className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} ml-auto`}
          style={{ 
            color: '#F2ECDE',
            fontFamily: 'serif',
            fontWeight: 'bold'
          }}
        >
          2025 OpenRAG
        </span>
      </div>
    </div>
  );
}

// Made with Bob
