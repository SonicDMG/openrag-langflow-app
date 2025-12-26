'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type BattleSummaryOverlayProps = {
  summary: string;
  isVisible: boolean;
  onClose: () => void;
  onNewBattle?: () => void;
  onReset?: () => void;
  victorName: string;
  defeatedName: string;
  isLoading?: boolean;
  battleEndingImageUrl?: string | null;
  isGeneratingImage?: boolean;
};

export function BattleSummaryOverlay({
  summary,
  isVisible,
  onClose,
  onNewBattle,
  onReset,
  victorName,
  defeatedName,
  isLoading = false,
  battleEndingImageUrl = null,
  isGeneratingImage = false,
}: BattleSummaryOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [startTranslateX, setStartTranslateX] = useState(0);
  const DRAG_THRESHOLD = 10; // pixels to move before starting drag
  
  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState('');
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const displayedLengthRef = useRef(0);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isVisible && overlayRef.current) {
      // Trigger slide-in animation
      overlayRef.current.classList.add('battle-summary-visible');
      setCurrentX(0);
    } else if (overlayRef.current) {
      overlayRef.current.classList.remove('battle-summary-visible');
      setCurrentX(0);
    }
  }, [isVisible]);

  // Typewriter effect - gradually reveal text with fire effect
  useEffect(() => {
    if (!summary) {
      setDisplayedText('');
      displayedLengthRef.current = 0;
      return;
    }

    // If summary was cleared (regenerated), reset displayed text
    if (summary === '' && displayedText.length > 0) {
      setDisplayedText('');
      displayedLengthRef.current = 0;
      return;
    }

    // Clear any existing interval
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }

    // Start from current displayed length
    let currentIndex = displayedLengthRef.current;
    const charsPerTick = 1; // Characters to reveal per tick
    const tickDelay = 40; // Milliseconds between ticks (slower = more dramatic)

    // If we're already at the end, just set it
    if (currentIndex >= summary.length) {
      setDisplayedText(summary);
      displayedLengthRef.current = summary.length;
      return;
    }

    typewriterIntervalRef.current = setInterval(() => {
      if (currentIndex < summary.length) {
        currentIndex += charsPerTick;
        displayedLengthRef.current = currentIndex;
        setDisplayedText(summary.substring(0, currentIndex));
      } else {
        // Finished typing
        displayedLengthRef.current = summary.length;
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
      }
    }, tickDelay);

    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
    };
  }, [summary]); // Only depend on summary

  // Position cursor at end of text - simpler approach using CSS
  // The cursor will be positioned inline after ReactMarkdown content

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) {
      return;
    }
    setDragStartX(e.touches[0].clientX);
    setDragStartY(e.touches[0].clientY);
    setStartTranslateX(currentX);
  }, [currentX]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStartX && !dragStartY) return;
    
    const deltaX = e.touches[0].clientX - dragStartX;
    const deltaY = Math.abs(e.touches[0].clientY - dragStartY);
    
    // Only start dragging if horizontal movement exceeds threshold and is greater than vertical
    if (!isDragging && Math.abs(deltaX) > DRAG_THRESHOLD && Math.abs(deltaX) > deltaY) {
      setIsDragging(true);
    }
    
    if (isDragging) {
      // Only allow dragging to the right (positive X)
      const newX = Math.max(0, startTranslateX + deltaX);
      setCurrentX(newX);
      if (overlayRef.current) {
        overlayRef.current.style.transform = `translateX(${newX}px)`;
      }
    }
  }, [isDragging, dragStartX, dragStartY, startTranslateX]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      
      // If dragged more than 30% of the way to the right, close it
      const threshold = overlayRef.current ? overlayRef.current.offsetWidth * 0.3 : 200;
      if (currentX > threshold) {
        onClose();
        setCurrentX(0);
      } else {
        // Snap back
        setCurrentX(0);
        if (overlayRef.current) {
          overlayRef.current.style.transform = 'translateX(0)';
        }
      }
    }
    // Reset drag start positions
    setDragStartX(0);
    setDragStartY(0);
  }, [isDragging, currentX, onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) {
      return;
    }
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setStartTranslateX(currentX);
  }, [currentX]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartX && !dragStartY) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = Math.abs(e.clientY - dragStartY);
    
    // Only start dragging if horizontal movement exceeds threshold and is greater than vertical
    if (!isDragging && Math.abs(deltaX) > DRAG_THRESHOLD && Math.abs(deltaX) > deltaY) {
      setIsDragging(true);
    }
    
    if (isDragging) {
      // Only allow dragging to the right (positive X)
      const newX = Math.max(0, startTranslateX + deltaX);
      setCurrentX(newX);
      if (overlayRef.current) {
        overlayRef.current.style.transform = `translateX(${newX}px)`;
      }
    }
  }, [isDragging, dragStartX, dragStartY, startTranslateX]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      
      // If dragged more than 30% of the way to the right, close it
      const threshold = overlayRef.current ? overlayRef.current.offsetWidth * 0.3 : 200;
      if (currentX > threshold) {
        onClose();
        setCurrentX(0);
      } else {
        // Snap back
        setCurrentX(0);
        if (overlayRef.current) {
          overlayRef.current.style.transform = 'translateX(0)';
        }
      }
    }
    // Reset drag start positions
    setDragStartX(0);
    setDragStartY(0);
  }, [isDragging, currentX, onClose]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Always render if visible (for streaming and reopening)
  if (!isVisible && !summary) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
        style={{ 
          opacity: isVisible ? 1 : 0, 
          zIndex: 2100,
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
      />
      
      {/* Parchment Overlay */}
      <div
        ref={overlayRef}
        className="battle-summary-overlay fixed right-0 top-0 h-full w-full max-w-2xl overflow-y-auto"
        style={{ 
          zIndex: 2101,
          transform: isDragging 
            ? `translateX(${currentX}px)` 
            : isVisible 
              ? undefined 
              : 'translateX(100%)',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'pan-x pan-y',
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Close button - fixed to overlay container */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-800/80 hover:bg-amber-900 text-amber-100 flex items-center justify-center transition-all shadow-lg hover:shadow-xl z-20"
          aria-label="Close summary"
        >
          <svg
            className="w-6 h-6 md:w-7 md:h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        <div className="parchment-paper min-h-full p-8 md:p-12 relative">
          {/* Title */}
          <div className="text-center mb-6 md:mb-8">
            <h2
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3"
              style={{
                fontFamily: 'serif',
                color: '#2A1810',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                opacity: 1,
              }}
            >
              Battle Chronicle
            </h2>
            <div
              className="text-sm md:text-base italic"
              style={{ color: '#4A2F1F', opacity: 1 }}
            >
              {victorName} vs {defeatedName}
            </div>
          </div>

          {/* Decorative line */}
          <div
            className="h-px mb-6 md:mb-8"
            style={{
              background: 'linear-gradient(to right, transparent, #8B6F47, transparent)',
            }}
          />

          {/* Summary content */}
          <div 
            ref={textContainerRef}
            className="prose prose-lg max-w-none battle-summary-content" 
            style={{ 
              opacity: 1, 
              position: 'relative', 
              zIndex: 10,
              overflowX: 'hidden'
            }}
          >
            {summary ? (
              <div className="relative battle-summary-text-wrapper">
                <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                p: ({ children, node }) => {
                  // Check if this is likely the last paragraph (simple heuristic)
                  const paragraphs = displayedText.split('\n\n').filter(p => p.trim());
                  const isLastParagraph = node && paragraphs.length > 0 && 
                    displayedText.trim().endsWith(paragraphs[paragraphs.length - 1]?.slice(-50) || '');
                  const showCursor = isLastParagraph && displayedText.length < summary.length;
                  
                  return (
                    <p
                      className="mb-4 md:mb-6 text-lg md:text-xl lg:text-2xl leading-relaxed"
                      style={{ 
                        color: '#3D2817', 
                        fontFamily: 'serif', 
                        opacity: 1, 
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        wordSpacing: '0.05em',
                      }}
                    >
                      {children}
                      {showCursor && (
                        <span 
                          className="fire-cursor fire-cursor-inline"
                          style={{
                            display: 'inline-block',
                            width: '2px',
                            height: '1.2em',
                            verticalAlign: 'text-bottom',
                            marginLeft: '2px',
                            background: 'linear-gradient(to bottom, transparent, #FF6B35, #FF8C42, #FF6B35, transparent)',
                            boxShadow: '0 0 8px #FF6B35, 0 0 12px #FF8C42, 0 0 16px #FF6B35',
                            animation: 'fireFlicker 0.3s ease-in-out infinite alternate',
                          }}
                        />
                      )}
                    </p>
                  );
                },
                strong: ({ children }) => (
                  <strong
                    className="font-bold"
                    style={{ 
                      color: '#1A0F08', 
                      opacity: 1,
                      fontWeight: 700
                    }}
                  >
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em 
                    className="italic font-semibold" 
                    style={{ 
                      color: '#2A1810', 
                      opacity: 1,
                      fontWeight: 600
                    }}
                  >
                    {children}
                  </em>
                ),
                h1: ({ children }) => (
                  <h1
                    className="text-xl md:text-2xl mb-3 md:mb-4 mt-6 md:mt-8"
                    style={{ color: '#2A1810', fontWeight: 900, fontFamily: 'serif', opacity: 1 }}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2
                    className="text-lg md:text-xl mb-2 md:mb-3 mt-4 md:mt-6"
                    style={{ color: '#2A1810', fontWeight: 900, fontFamily: 'serif', opacity: 1 }}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    className="text-base md:text-lg mb-2 mt-4"
                    style={{ color: '#2A1810', fontWeight: 900, fontFamily: 'serif', opacity: 1 }}
                  >
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-2" style={{ color: '#3D2817', opacity: 1 }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-2" style={{ color: '#3D2817', opacity: 1 }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="ml-2" style={{ color: '#3D2817', opacity: 1 }}>{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="border-l-4 pl-4 italic my-4"
                    style={{ borderColor: '#8B6F47', color: '#4A2F1F', opacity: 1 }}
                  >
                    {children}
                  </blockquote>
                ),
              }}
            >
              {displayedText}
            </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block">
                  <span className="text-lg md:text-xl lg:text-2xl italic chronicle-waiting-text" style={{ color: '#4A2F1F', fontFamily: 'serif' }}>
                    The chronicle is being written...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Battle Ending Image */}
          {(battleEndingImageUrl || isGeneratingImage) && summary && (
            <>
              {/* Decorative line */}
              <div
                className="h-px mt-8 md:mt-10 mb-6 md:mb-8"
                style={{
                  background: 'linear-gradient(to right, transparent, #8B6F47, transparent)',
                }}
              />
              
              <div className="text-center mb-4">
                <h3
                  className="text-xl md:text-2xl font-bold mb-4"
                  style={{
                    fontFamily: 'serif',
                    color: '#2A1810',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                    opacity: 1,
                  }}
                >
                  The Final Moment
                </h3>
                
                {isGeneratingImage && !battleEndingImageUrl && (
                  <div className="py-8">
                    <div className="inline-block">
                      <span className="text-base md:text-lg italic chronicle-waiting-text" style={{ color: '#4A2F1F', fontFamily: 'serif' }}>
                        Painting the final scene...
                      </span>
                    </div>
                  </div>
                )}
                
                {battleEndingImageUrl && (
                  <div className="relative w-full max-w-4xl mx-auto">
                    <img
                      src={battleEndingImageUrl}
                      alt={`${victorName} victorious over ${defeatedName}`}
                      className="w-full h-auto rounded-lg border-4 shadow-2xl"
                      style={{
                        borderColor: '#8B6F47',
                        maxHeight: '60vh',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action buttons section */}
          {summary && (
            <>
              {/* Decorative line */}
              <div
                className="h-px mt-8 md:mt-10 mb-6 md:mb-8"
                style={{
                  background: 'linear-gradient(to right, transparent, #8B6F47, transparent)',
                }}
              />

              {/* Question text */}
              <div className="text-center mb-6 md:mb-8">
                <p
                  className="text-lg md:text-xl lg:text-2xl italic"
                  style={{ color: '#4A2F1F', fontFamily: 'serif', opacity: 1 }}
                >
                  What will you do next?
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
                {onNewBattle && (
                  <button
                    onClick={onNewBattle}
                    className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg lg:text-xl font-bold rounded-lg border-2 transition-all shadow-lg hover:shadow-xl"
                    style={{
                      fontFamily: 'serif',
                      backgroundColor: '#8B6F47',
                      borderColor: '#6B4E3D',
                      color: '#F2ECDE',
                    }}
                  >
                    Next Battle?
                  </button>
                )}
                <button
                  onClick={onReset || onClose}
                  className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg lg:text-xl font-bold rounded-lg border-2 transition-all shadow-lg hover:shadow-xl"
                  style={{
                    fontFamily: 'serif',
                    backgroundColor: '#A66D28',
                    borderColor: '#8B5A1F',
                    color: '#F2ECDE',
                  }}
                >
                  I think I'm done.
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

