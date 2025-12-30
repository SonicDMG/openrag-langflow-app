'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ImagePosition } from '../../../lib/types';

interface ImagePositionEditorProps {
  imageUrl: string;
  currentPosition: ImagePosition;
  onPositionChange: (position: ImagePosition) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  children: React.ReactNode; // CharacterCard preview
}

export function ImagePositionEditor({
  imageUrl,
  currentPosition,
  onPositionChange,
  onSave,
  isSaving = false,
  children,
}: ImagePositionEditorProps) {
  const [position, setPosition] = useState<ImagePosition>(currentPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, startOffsetX: 0, startOffsetY: 0 });

  // Card aspect ratio (280x200 = 1.4:1 or 16:9 approximately)
  const CARD_ASPECT_RATIO = 280 / 200;

  // Update position when currentPosition prop changes
  useEffect(() => {
    setPosition(currentPosition);
  }, [currentPosition]);

  // Load image dimensions
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  // Calculate bounding box dimensions and position
  const getBoundingBox = useCallback(() => {
    if (!containerRef.current || !imageSize.width || !imageSize.height) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate how the image is displayed (object-fit: contain)
    const imageAspect = imageSize.width / imageSize.height;
    const containerAspect = containerWidth / containerHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageAspect > containerAspect) {
      // Image is wider - fit to width
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspect;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      // Image is taller - fit to height
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspect;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }

    // Calculate bounding box size (maintaining card aspect ratio)
    let boxWidth, boxHeight;
    if (CARD_ASPECT_RATIO > imageAspect) {
      // Box is wider than image aspect - fit to width
      boxWidth = displayWidth * 0.8; // 80% of image width
      boxHeight = boxWidth / CARD_ASPECT_RATIO;
    } else {
      // Box is taller - fit to height
      boxHeight = displayHeight * 0.8; // 80% of image height
      boxWidth = boxHeight * CARD_ASPECT_RATIO;
    }

    // Calculate position based on offset percentages
    const boxLeft = offsetX + (displayWidth - boxWidth) * (position.offsetX / 100);
    const boxTop = offsetY + (displayHeight - boxHeight) * (position.offsetY / 100);

    return {
      left: boxLeft,
      top: boxTop,
      width: boxWidth,
      height: boxHeight,
      displayWidth,
      displayHeight,
      displayOffsetX: offsetX,
      displayOffsetY: offsetY,
    };
  }, [imageSize, position, CARD_ASPECT_RATIO]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: position.offsetX,
      startOffsetY: position.offsetY,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const box = getBoundingBox();
      if (!box.displayWidth || !box.displayHeight) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Convert pixel delta to percentage
      const percentDeltaX = (deltaX / (box.displayWidth - box.width)) * 100;
      const percentDeltaY = (deltaY / (box.displayHeight - box.height)) * 100;

      const newOffsetX = Math.max(
        0,
        Math.min(100, dragStartRef.current.startOffsetX + percentDeltaX)
      );
      const newOffsetY = Math.max(
        0,
        Math.min(100, dragStartRef.current.startOffsetY + percentDeltaY)
      );

      const newPosition = {
        offsetX: Math.round(newOffsetX * 10) / 10, // Round to 1 decimal
        offsetY: Math.round(newOffsetY * 10) / 10,
      };

      setPosition(newPosition);
      onPositionChange(newPosition);
    },
    [isDragging, getBoundingBox, onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      e.preventDefault();
      const step = e.shiftKey ? 5 : 1; // Shift for larger steps

      setPosition((prev) => {
        let newOffsetX = prev.offsetX;
        let newOffsetY = prev.offsetY;

        switch (e.key) {
          case 'ArrowLeft':
            newOffsetX = Math.max(0, prev.offsetX - step);
            break;
          case 'ArrowRight':
            newOffsetX = Math.min(100, prev.offsetX + step);
            break;
          case 'ArrowUp':
            newOffsetY = Math.max(0, prev.offsetY - step);
            break;
          case 'ArrowDown':
            newOffsetY = Math.min(100, prev.offsetY + step);
            break;
        }

        const newPosition = { offsetX: newOffsetX, offsetY: newOffsetY };
        onPositionChange(newPosition);
        return newPosition;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPositionChange]);

  const handleReset = () => {
    const defaultPosition = { offsetX: 50, offsetY: 50 };
    setPosition(defaultPosition);
    onPositionChange(defaultPosition);
  };

  const box = getBoundingBox();

  return (
    <div className="space-y-4 w-full">
      <div className="bg-amber-900/70 border-4 border-amber-800 rounded-lg p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'serif' }}>
          Image Position Editor
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Full Image with Bounding Box */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-amber-100" style={{ fontFamily: 'serif' }}>
              Full Generated Image
            </h3>
            <div
              ref={containerRef}
              className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-amber-700"
              style={{ aspectRatio: '16/9', minHeight: '300px', width: '100%' }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Full generated image"
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
                onLoad={handleImageLoad}
              />

              {/* Bounding Box Overlay */}
              {box.width > 0 && (
                <div
                  className="absolute border-4 border-green-500 cursor-move"
                  style={{
                    left: `${box.left}px`,
                    top: `${box.top}px`,
                    width: `${box.width}px`,
                    height: `${box.height}px`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    transition: isDragging ? 'none' : 'all 0.1s ease-out',
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Corner handles */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 rounded-full" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-500 rounded-full" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 rounded-full" />

                  {/* Center label */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-3 py-1 rounded text-sm font-bold pointer-events-none">
                    Card View
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-amber-200 space-y-1">
              <p>
                <strong>Drag</strong> the green box to reposition the image
              </p>
              <p>
                <strong>Arrow keys</strong> for fine adjustments (Shift for larger steps)
              </p>
            </div>
          </div>

          {/* Card Preview */}
          <div className="space-y-3 border-l-4 border-amber-700 pl-6">
            <h3 className="text-lg font-semibold text-amber-100" style={{ fontFamily: 'serif' }}>
              Card Preview
            </h3>
            <div className="flex justify-center items-start">
              {children}
            </div>
          </div>
        </div>

        {/* Position Info and Controls - Full Width Below */}
        <div className="bg-amber-800/50 border-2 border-amber-700 rounded-lg p-4 space-y-3 mt-6">
          <div className="text-amber-100 text-center">
            <p className="text-lg font-semibold">
              <strong>Position:</strong> X: {position.offsetX.toFixed(1)}%, Y:{' '}
              {position.offsetY.toFixed(1)}%
            </p>
          </div>

          <div className="flex gap-4 max-w-2xl mx-auto">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-lg transition-all border-2 border-amber-600 shadow-lg"
            >
              🔄 Reset to Center
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border-2 border-green-600 shadow-lg"
            >
              {isSaving ? '⏳ Saving...' : '💾 Save Position'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
