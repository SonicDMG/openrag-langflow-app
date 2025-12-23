'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DnDClass, Ability, AttackAbility, HealingAbility } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, isMonster } from '../constants';
import { exportCharacterToPDF, generateCharacterPDFBlob } from '../utils/pdfExport';

interface CharacterCardZoomProps {
  playerClass: DnDClass;
  characterName: string;
  monsterImageUrl?: string;
  monsterCutOutImageUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  // Determine if this character can be edited (custom heroes or created monsters)
  canEdit?: boolean;
  editType?: 'hero' | 'monster';
  // Image generation prompt used to create the character image
  imagePrompt?: string;
  // Setting/theme used to create the character image
  imageSetting?: string;
}

export function CharacterCardZoom({
  playerClass,
  characterName,
  monsterImageUrl,
  monsterCutOutImageUrl,
  isOpen,
  onClose,
  canEdit = false,
  editType,
  imagePrompt,
  imageSetting,
}: CharacterCardZoomProps) {
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine edit type - trust the provided editType if available, otherwise check fallback lists
  // The editType is determined earlier in the component tree where the full monster list is available
  const determinedEditType = editType || (
    FALLBACK_MONSTERS.some(fm => fm.name === playerClass.name) ? 'monster' : 'hero'
  );
  
  const handleEdit = () => {
    router.push(`/dnd/create-character?id=${encodeURIComponent(playerClass.name)}&type=${determinedEditType}`);
  };

  // Determine if this is a custom character based on the determined type
  const isDefaultHero = FALLBACK_CLASSES.some(fc => fc.name === playerClass.name);
  const isDefaultMonster = FALLBACK_MONSTERS.some(fm => fm.name === playerClass.name);
  
  const isCustomHero = determinedEditType === 'hero' && !isDefaultHero;
  const isCustomMonster = determinedEditType === 'monster' && !isDefaultMonster;
  
  // Allow delete for all characters to maintain consistent button spacing
  // This prevents button overlap with character name
  const canDelete = true;
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // OpenRAG upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const characterType = isCustomHero ? 'Custom Hero' : isCustomMonster ? 'Custom Monster' : determinedEditType === 'monster' ? 'Monster' : 'Hero';
      
      await exportCharacterToPDF({
        playerClass,
        characterName,
        imageUrl: monsterImageUrl,
        characterType,
        imagePrompt,
        imageSetting,
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Extract monsterId from image URL if present
  const extractMonsterId = (): string | null => {
    // Check if playerClass has monsterId property
    if ((playerClass as any).monsterId) {
      return (playerClass as any).monsterId;
    }
    
    // Try to extract from monsterImageUrl
    if (monsterImageUrl) {
      const match = monsterImageUrl.match(/\/cdn\/monsters\/([^\/]+)\//);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const endpoint = determinedEditType === 'hero' ? '/api/heroes' : '/api/monsters-db';
      const monsterId = extractMonsterId();
      
      // Build URL with name parameter
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set('name', playerClass.name);
      if (monsterId && determinedEditType === 'monster') {
        url.searchParams.set('monsterId', monsterId);
      }
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        
        // If hero/monster not found in database, it might be a stale cache entry
        // Clear localStorage and reload to sync with database
        if (data.error === 'Hero not found' || data.error === 'Monster not found') {
          console.log('Character not found in database - clearing cache and reloading');
          localStorage.removeItem('dnd_loaded_classes');
          localStorage.removeItem('dnd_loaded_monsters');
          onClose();
          window.location.reload();
          return;
        }
        
        throw new Error(data.error || 'Failed to delete character');
      }

      // Close the modal and reload the page to refresh the character list
      onClose();
      router.refresh();
      // Also reload the window to ensure all components update
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete character:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete character. Please try again.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExportToOpenRAG = async () => {
    setUploadStatus('uploading');
    setUploadError(null);
    
    try {
      const characterType = isCustomHero ? 'Custom Hero' : isCustomMonster ? 'Custom Monster' : determinedEditType === 'monster' ? 'Monster' : 'Hero';
      
      // Generate PDF as blob
      const { blob, filename } = await generateCharacterPDFBlob({
        playerClass,
        characterName,
        imageUrl: monsterImageUrl,
        characterType,
        imagePrompt,
        imageSetting,
      });
      
      // Create FormData to send to API
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('filename', filename);
      
      // Upload to OpenRAG via API route
      const response = await fetch('/api/openrag/ingest', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }
      
      setUploadStatus('success');
    } catch (error) {
      console.error('Failed to upload to OpenRAG:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        perspective: '1000px',
      }}
      onClick={onClose}
    >
      {/* Card Back - Styled like the front of the card, scaled up large */}
      <div
        className="relative flex flex-col card-zoom-flip"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#1a1a1a', // Dark black frame background (same as card front)
          borderRadius: '24px', // Scaled up border radius
          width: '640px', // 2x the original card width (320px * 2)
          maxWidth: '90vw', // Responsive on smaller screens
          aspectRatio: '3/4', // Portrait orientation: 3 wide by 4 tall
          padding: '20px', // Scaled up dark frame padding
          boxShadow: '0 16px 32px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.05)',
          // Paper texture effect for outer frame (same as card front, scaled)
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
            repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0, 0, 0, 0.1) 4px, rgba(0, 0, 0, 0.1) 8px),
            repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0, 0, 0, 0.1) 4px, rgba(0, 0, 0, 0.1) 8px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 8px 8px, 8px 8px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'serif',
        }}
      >
        {/* Inner card content area */}
        <div
          className="flex flex-col h-full rounded-lg overflow-hidden relative"
          style={{
            backgroundColor: '#E8E0D6', // Light beige background (same as card front)
            border: '6px solid #D4C4B0', // Scaled up border
            borderRadius: '24px', // Scaled up border radius
            padding: '1.5rem', // Increased padding to match larger fonts
            // Paper texture for inner card
            backgroundImage: `
              radial-gradient(circle at 30% 20%, rgba(139, 111, 71, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 111, 71, 0.1) 0%, transparent 50%)
            `,
          }}
        >
          {/* Background image layer with 50% opacity */}
          {monsterImageUrl && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${monsterImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.5,
                zIndex: 0,
                borderRadius: '18px', // Slightly smaller than parent to stay within border
              }}
            />
          )}
          {/* Close button - printed text on card */}
          <button
            onClick={onClose}
            className="absolute right-2 text-xl font-bold transition-all cursor-pointer"
            style={{
              top: '0.5rem',
              backgroundColor: 'transparent',
              color: '#5C4033',
              fontFamily: 'serif',
              border: 'none',
              padding: 0,
              lineHeight: '1',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            aria-label="Close"
          >
            ×
          </button>

          {/* Action buttons container */}
          <div className="absolute left-2 top-2 flex flex-col gap-1.5" style={{ zIndex: 10 }}>
            {/* Edit button - printed text on card */}
            {canEdit && (
              <button
                onClick={handleEdit}
                className="text-sm font-bold transition-all flex items-center gap-1 cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  color: '#5C4033',
                  fontFamily: 'serif',
                  border: 'none',
                  padding: 0,
                  lineHeight: '1',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            {/* Delete button - available for all characters */}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm font-bold transition-all flex items-center gap-1 cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  color: showDeleteConfirm ? '#dc2626' : '#5C4033',
                  fontFamily: 'serif',
                  border: 'none',
                  padding: 0,
                  lineHeight: '1',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.textDecoration = 'underline';
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.opacity = isDeleting ? '0.5' : '1';
                }}
                title={showDeleteConfirm ? 'Click again to confirm deletion' : 'Delete character'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleting ? 'Deleting...' : showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
            {/* PDF Export button */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="text-sm font-bold transition-all flex items-center gap-1 cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                color: '#5C4033',
                fontFamily: 'serif',
                border: 'none',
                padding: 0,
                lineHeight: '1',
                opacity: isExporting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
                e.currentTarget.style.opacity = isExporting ? '0.5' : '1';
              }}
              title="Export to PDF"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            
            {/* Export to OpenRAG button */}
            <button
              onClick={handleExportToOpenRAG}
              disabled={uploadStatus === 'uploading'}
              className="text-sm font-bold transition-all flex items-center gap-1 cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                color: uploadStatus === 'error' ? '#dc2626' : uploadStatus === 'success' ? '#22c55e' : '#5C4033',
                fontFamily: 'serif',
                border: 'none',
                padding: 0,
                lineHeight: '1',
                opacity: uploadStatus === 'uploading' ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (uploadStatus !== 'uploading') {
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
                e.currentTarget.style.opacity = uploadStatus === 'uploading' ? '0.5' : '1';
              }}
              title={
                uploadStatus === 'success' ? 'Successfully uploaded to OpenRAG' :
                uploadStatus === 'error' ? `Upload failed: ${uploadError || 'Unknown error'}` :
                uploadStatus === 'uploading' ? 'Uploading to OpenRAG...' :
                'Export to OpenRAG'
              }
            >
              {/* Icon changes based on status */}
              {uploadStatus === 'uploading' && (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              {uploadStatus === 'success' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {uploadStatus === 'error' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {uploadStatus === 'idle' && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              
              {uploadStatus === 'uploading' ? 'Uploading...' :
               uploadStatus === 'success' ? 'Uploaded to OpenRAG' :
               uploadStatus === 'error' ? 'Upload Failed (retry)' :
               'Export to OpenRAG'}
            </button>
          </div>
          {/* Card Back Header */}
          <div className="text-center mb-1.5 pb-1 border-b-2 relative" style={{ borderColor: '#8B6F47', zIndex: 1 }}>
            <h2
              className="text-4xl font-bold mb-0.5"
              style={{
                color: '#5C4033',
                textShadow: '0 0 8px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.7)',
              }}
            >
              {characterName}
            </h2>
            <p
              className="text-base italic"
              style={{
                color: '#8B6F47',
                textShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.7)',
              }}
            >
              {isCustomHero ? 'Custom Hero' : isCustomMonster ? 'Custom Monster' : determinedEditType === 'monster' ? 'Monster' : 'Hero'}
            </p>
          </div>

          {/* Character Details (Race and Sex) */}
          <div className="mb-1.5 relative" style={{ zIndex: 1 }}>
            <h3
              className="text-lg font-semibold mb-1"
              style={{
                color: '#8B6F47',
                textShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.7)',
              }}
            >
              CHARACTER DETAILS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-base" style={{
              color: '#5C4033',
              textShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 1px rgba(255, 255, 255, 0.7)',
            }}>
              <div>
                <span className="font-semibold">Race:</span> {playerClass.race && playerClass.race !== 'n/a' ? playerClass.race : 'n/a'}
              </div>
              <div>
                <span className="font-semibold">Sex:</span> {playerClass.sex && playerClass.sex !== 'n/a' ? playerClass.sex : 'n/a'}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mb-1.5 relative" style={{ zIndex: 1 }}>
            <h3
              className="text-lg font-semibold mb-1"
              style={{
                color: '#8B6F47',
                textShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.7)',
              }}
            >
              STATISTICS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-base" style={{
              color: '#5C4033',
              textShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 1px rgba(255, 255, 255, 0.7)',
            }}>
              <div>
                <span className="font-semibold">HP:</span> {playerClass.hitPoints}/{playerClass.maxHitPoints}
              </div>
              <div>
                <span className="font-semibold">AC:</span> {playerClass.armorClass}
              </div>
              <div>
                <span className="font-semibold">ATK:</span> +{playerClass.attackBonus}
              </div>
              <div>
                <span className="font-semibold">DMG:</span> {playerClass.damageDie}
              </div>
              {playerClass.meleeDamageDie && (
                <div>
                  <span className="font-semibold">Melee:</span> {playerClass.meleeDamageDie}
                </div>
              )}
              {playerClass.rangedDamageDie && (
                <div>
                  <span className="font-semibold">Ranged:</span> {playerClass.rangedDamageDie}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-1.5 relative" style={{ zIndex: 1 }}>
            <h3
              className="text-lg font-semibold mb-1"
              style={{
                color: '#8B6F47',
                textShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.7)',
              }}
            >
              DESCRIPTION
            </h3>
            <p
              className="text-xs leading-tight line-clamp-2"
              style={{
                color: '#5C4033',
                textShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 1px rgba(255, 255, 255, 0.7)',
              }}
            >
              {playerClass.description || `A ${determinedEditType === 'monster' ? 'monster' : 'hero'} named ${characterName}.`}
            </p>
          </div>

          {/* Abilities */}
          {playerClass.abilities && playerClass.abilities.length > 0 && (
            <div className="mb-1.5 flex-1 min-h-0 flex flex-col relative" style={{ zIndex: 1 }}>
              <h3
                className="text-lg font-semibold mb-1"
                style={{
                  color: '#8B6F47',
                  textShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.7)',
                }}
              >
                ABILITIES
              </h3>
              <div className="space-y-0.5 flex-1 min-h-0">
                {(playerClass.abilities.slice(0, 5)).map((ability, index) => (
                  <AbilityDetailCardBack key={index} ability={ability} />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-2 border-t-2 relative" style={{ borderColor: '#D4C4B0', zIndex: 1 }}>
            <div className="flex items-center justify-between text-sm" style={{
              color: '#8B6F47',
              textShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 1px rgba(255, 255, 255, 0.7)',
            }}>
              <span className="font-semibold">2025 OpenRAG</span>
              <div
                className="w-3 h-3"
                style={{
                  backgroundColor: '#8B6F47',
                  opacity: 0.6,
                  transform: 'rotate(45deg)',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbilityDetailCardBack({ ability }: { ability: Ability }) {
  const isAttack = ability.type === 'attack';
  const attackAbility = isAttack ? (ability as AttackAbility) : null;

  return (
    <div
      className="border-2 rounded-lg p-1 flex-shrink-0"
      style={{
        borderColor: '#D4C4B0',
        backgroundColor: 'rgba(232, 224, 214, 0.7)',
      }}
    >
      <div className="flex items-start justify-between mb-0.5">
        <h4
          className="text-sm font-bold"
          style={{
            color: '#5C4033',
            textShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        >
          {ability.name}
        </h4>
        <span
          className="text-xs font-semibold uppercase px-1 py-0.5 rounded"
          style={{
            color: '#8B6F47',
            backgroundColor: 'rgba(139, 111, 71, 0.3)',
            textShadow: '0 0 3px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.4)',
          }}
        >
          {isAttack ? '⚔️' : '💚'}
        </span>
      </div>

      {ability.description && (
        <p
          className="text-xs leading-tight mb-0.5 line-clamp-1"
          style={{
            color: '#5C4033',
            textShadow: '0 0 3px rgba(255, 255, 255, 0.9), 0 0 6px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.4)',
          }}
        >
          {ability.description}
        </p>
      )}

      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs" style={{
        color: '#8B6F47',
        textShadow: '0 0 3px rgba(255, 255, 255, 0.9), 0 0 6px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.4)',
      }}>
        {isAttack && attackAbility ? (
          <>
            <div className="flex items-center gap-0.5">
              <span className="font-semibold">DMG:</span>
              <span>{attackAbility.damageDice}</span>
            </div>
            {attackAbility.bonusDamageDice && (
              <div className="flex items-center gap-0.5">
                <span className="font-semibold">+:</span>
                <span>{attackAbility.bonusDamageDice}</span>
              </div>
            )}
            <div className="flex items-center gap-0.5">
              <span className="font-semibold">Roll:</span>
              <span>{attackAbility.attackRoll ? 'd20' : 'Auto'}</span>
            </div>
            {attackAbility.attacks && attackAbility.attacks > 1 && (
              <div className="flex items-center gap-0.5">
                <span className="font-semibold">×{attackAbility.attacks}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-0.5">
            <span className="font-semibold">Heal:</span>
            <span>{(ability as HealingAbility).healingDice}</span>
          </div>
        )}
      </div>
    </div>
  );
}

