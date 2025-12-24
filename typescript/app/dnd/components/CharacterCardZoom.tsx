'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DnDClass, Ability, AttackAbility, HealingAbility } from '../types';
import { exportCharacterToPDF, generateCharacterPDFBlob } from '../utils/pdfExport';

interface CharacterCardZoomProps {
  playerClass: DnDClass;
  characterName: string;
  monsterImageUrl?: string;
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

// Helper function to determine character type and classification
// Infers type from editType prop, _type marker, or _id prefix
function determineCharacterType(playerClass: DnDClass, editType?: 'hero' | 'monster') {
  // Strategy 1: Use provided editType
  if (editType) {
    return {
      editType,
      isDefaultHero: false,
      isDefaultMonster: false,
      isCustomHero: editType === 'hero',
      isCustomMonster: editType === 'monster',
    };
  }
  
  // Strategy 2: Check _type marker
  if ((playerClass as any)._type === 'monster') {
    return {
      editType: 'monster' as const,
      isDefaultHero: false,
      isDefaultMonster: false,
      isCustomHero: false,
      isCustomMonster: true,
    };
  }
  
  // Strategy 3: Infer from _id prefix (for fallback data)
  const characterId = (playerClass as any)._id;
  if (characterId && typeof characterId === 'string') {
    if (characterId.startsWith('fallback-monster-')) {
      return {
        editType: 'monster' as const,
        isDefaultHero: false,
        isDefaultMonster: false,
        isCustomHero: false,
        isCustomMonster: true,
      };
    }
    if (characterId.startsWith('fallback-hero-')) {
      return {
        editType: 'hero' as const,
        isDefaultHero: false,
        isDefaultMonster: false,
        isCustomHero: true,
        isCustomMonster: false,
      };
    }
  }
  
  // Strategy 4: Default to hero
  return {
    editType: 'hero' as const,
    isDefaultHero: false,
    isDefaultMonster: false,
    isCustomHero: true,
    isCustomMonster: false,
  };
}

// Helper function to get character type label
function getCharacterTypeLabel(isCustomHero: boolean, isCustomMonster: boolean, editType: string): string {
  // Simplified labels - no "Custom" prefix since all characters are treated equally
  return editType === 'monster' ? 'Monster' : 'Hero';
}

// Helper function to extract monster ID from various sources
function extractMonsterIdFromSources(playerClass: DnDClass, monsterImageUrl?: string): string | null {
  // Check if playerClass has monsterId property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((playerClass as any).monsterId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
}

// Helper function to build delete URL
function buildDeleteUrl(endpoint: string, name: string, monsterId: string | null, editType: string): string {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('name', name);
  if (monsterId && editType === 'monster') {
    url.searchParams.set('monsterId', monsterId);
  }
  return url.toString();
}

// Helper function to handle delete response
async function handleDeleteResponse(response: Response, onClose: () => void): Promise<void> {
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
  window.location.reload();
}

// Shared button styles
const baseButtonStyle = {
  backgroundColor: 'transparent',
  fontFamily: 'serif',
  border: 'none',
  padding: 0,
  lineHeight: '1' as const,
};

const buttonTextShadow = '0 0 6px rgba(255, 200, 255, 0.9), 0 0 10px rgba(255, 180, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 220, 255, 0.7)';

const iconDropShadow = 'drop-shadow(0 0 2px rgba(255, 200, 255, 0.8)) drop-shadow(0 0 4px rgba(255, 180, 255, 0.6)) drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5))';

// Upload status icon component
function UploadStatusIcon({ status }: { status: 'idle' | 'uploading' | 'success' | 'error' }) {
  const iconStyle = { filter: iconDropShadow };
  
  if (status === 'uploading') {
    return (
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" style={iconStyle}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
    );
  }
  
  if (status === 'success') {
    return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={iconStyle}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  
  if (status === 'error') {
    return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={iconStyle}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  
  // idle state
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={iconStyle}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

export function CharacterCardZoom({
  playerClass,
  characterName,
  monsterImageUrl,
  isOpen,
  onClose,
  canEdit = false,
  editType,
  imagePrompt,
  imageSetting,
}: CharacterCardZoomProps) {
  const router = useRouter();

  // State hooks - must be called before any early returns
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Determine character type and classification
  const characterType = determineCharacterType(playerClass, editType);
  const { editType: determinedEditType, isCustomHero, isCustomMonster } = characterType;

  // Memoize monster ID extraction
  const monsterId = useMemo(() =>
    extractMonsterIdFromSources(playerClass, monsterImageUrl),
    [playerClass, monsterImageUrl]
  );

  // Get character type label for display
  const characterTypeLabel = getCharacterTypeLabel(isCustomHero, isCustomMonster, determinedEditType);

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

  // Early return after all hooks
  if (!isOpen) return null;

  const handleEdit = () => {
    // All characters now have _id (both database and fallback)
    const characterId = (playerClass as any)._id;
    
    if (!characterId) {
      console.error(`[CharacterCardZoom] Character missing _id: ${characterName}`);
      return;
    }
    
    console.log(`[CharacterCardZoom] Editing character by ID: ${characterId}`);
    router.push(`/dnd/unified-character-creator?id=${encodeURIComponent(characterId)}&type=${determinedEditType}`);
  };

  // Allow delete for all characters to maintain consistent button spacing
  const canDelete = true;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportCharacterToPDF({
        playerClass,
        characterName,
        imageUrl: monsterImageUrl,
        characterType: characterTypeLabel,
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

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const endpoint = determinedEditType === 'hero' ? '/api/heroes' : '/api/monsters-db';
      const url = buildDeleteUrl(endpoint, playerClass.name, monsterId, determinedEditType);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      await handleDeleteResponse(response, onClose);
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
      // Generate PDF as blob
      const { blob, filename } = await generateCharacterPDFBlob({
        playerClass,
        characterName,
        imageUrl: monsterImageUrl,
        characterType: characterTypeLabel,
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
          {/* Background image layer with 75% opacity */}
          {monsterImageUrl && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${monsterImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.75,
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
              ...baseButtonStyle,
              color: '#3D2817',
              zIndex: 10,
              textShadow: buttonTextShadow,
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
                  ...baseButtonStyle,
                  color: '#3D2817',
                  textShadow: buttonTextShadow,
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
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ filter: iconDropShadow }}>
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
                  ...baseButtonStyle,
                  color: showDeleteConfirm ? '#dc2626' : '#3D2817',
                  opacity: isDeleting ? 0.5 : 1,
                  textShadow: buttonTextShadow,
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
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ filter: iconDropShadow }}>
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
                ...baseButtonStyle,
                color: '#3D2817',
                opacity: isExporting ? 0.5 : 1,
                textShadow: buttonTextShadow,
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
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ filter: iconDropShadow }}>
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
                ...baseButtonStyle,
                color: uploadStatus === 'error' ? '#dc2626' : uploadStatus === 'success' ? '#22c55e' : '#3D2817',
                opacity: uploadStatus === 'uploading' ? 0.5 : 1,
                textShadow: buttonTextShadow,
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
              <UploadStatusIcon status={uploadStatus} />
              {uploadStatus === 'uploading' ? 'Uploading...' :
               uploadStatus === 'success' ? 'Uploaded to OpenRAG' :
               uploadStatus === 'error' ? 'Upload Failed (retry)' :
               'Export to OpenRAG'}
            </button>
          </div>
          {/* Card Back Header */}
          <div className="text-center mb-1.5 pb-1 border-b-2 relative" style={{
            borderColor: '#4A3728',
            zIndex: 1,
            boxShadow: '0 2px 0 0 rgba(255, 255, 255, 0.3), 0 3px 0 0 rgba(0, 0, 0, 0.2)'
          }}>
            <h2
              className="text-4xl font-bold mb-0.5"
              style={{
                color: '#3D2817',
                textShadow: '0 0 8px rgba(220, 200, 255, 0.9), 0 0 12px rgba(200, 180, 255, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(230, 210, 255, 0.7)',
              }}
            >
              {characterName}
            </h2>
            <p
              className="text-base italic"
              style={{
                color: '#6B5333',
                textShadow: '0 0 6px rgba(200, 220, 255, 0.9), 0 0 10px rgba(180, 200, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(210, 230, 255, 0.7)',
              }}
            >
              {characterTypeLabel}
            </p>
          </div>

          {/* Character Details (Race and Sex) */}
          <div className="mb-1.5 relative" style={{ zIndex: 1 }}>
            <h3
              className="text-lg font-semibold mb-1"
              style={{
                color: '#4A3728',
                textShadow: '0 0 6px rgba(180, 230, 255, 0.9), 0 0 10px rgba(160, 210, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(190, 240, 255, 0.7)',
              }}
            >
              CHARACTER DETAILS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-base" style={{
              color: '#5C4033',
              textShadow: '0 0 4px rgba(180, 230, 255, 0.9), 0 0 8px rgba(160, 210, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 1px rgba(190, 240, 255, 0.7)',
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
                color: '#4A3728',
                textShadow: '0 0 6px rgba(180, 255, 230, 0.9), 0 0 10px rgba(160, 255, 210, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(190, 255, 240, 0.7)',
              }}
            >
              STATISTICS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-base" style={{
              color: '#5C4033',
              textShadow: '0 0 4px rgba(180, 255, 230, 0.9), 0 0 8px rgba(160, 255, 210, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 1px rgba(190, 255, 240, 0.7)',
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
                color: '#4A3728',
                textShadow: '0 0 6px rgba(200, 255, 200, 0.9), 0 0 10px rgba(180, 255, 180, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(210, 255, 210, 0.7)',
              }}
            >
              DESCRIPTION
            </h3>
            <p
              className="text-xs leading-tight line-clamp-2"
              style={{
                color: '#5C4033',
                textShadow: '0 0 4px rgba(200, 255, 200, 0.9), 0 0 8px rgba(180, 255, 180, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 1px rgba(210, 255, 210, 0.7)',
              }}
            >
              {playerClass.description || `A ${characterTypeLabel.toLowerCase()} named ${characterName}.`}
            </p>
          </div>

          {/* Abilities */}
          {playerClass.abilities && playerClass.abilities.length > 0 && (
            <div className="mb-1.5 flex-1 min-h-0 flex flex-col relative" style={{ zIndex: 1 }}>
              <h3
                className="text-lg font-semibold mb-1"
                style={{
                  color: '#4A3728',
                  textShadow: '0 0 6px rgba(255, 255, 180, 0.9), 0 0 10px rgba(255, 255, 160, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 255, 190, 0.7)',
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
          <div className="mt-auto pt-2 border-t-2 relative" style={{
            borderColor: '#4A3728',
            zIndex: 1,
            boxShadow: '0 -2px 0 0 rgba(255, 255, 255, 0.3), 0 -3px 0 0 rgba(0, 0, 0, 0.2)'
          }}>
            <div className="flex items-center justify-between text-sm" style={{
              color: '#4A3728',
              textShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 0.8), 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.7)',
            }}>
              <span className="font-semibold">2025 OpenRAG</span>
              <div
                className="w-3 h-3"
                style={{
                  backgroundColor: '#4A3728',
                  opacity: 0.8,
                  transform: 'rotate(45deg)',
                  boxShadow: '0 0 4px rgba(255, 255, 255, 0.6), 0 0 8px rgba(255, 255, 255, 0.4)',
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

