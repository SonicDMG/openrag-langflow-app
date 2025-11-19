'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DnDClass, Ability, AttackAbility, HealingAbility } from '../types';
import { FALLBACK_CLASSES, FALLBACK_MONSTERS, isMonster } from '../constants';

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

  // Determine edit type automatically if not provided
  const determinedEditType = editType || (isMonster(playerClass.name) ? 'monster' : 'hero');
  
  const handleEdit = () => {
    router.push(`/dnd/create-character?id=${encodeURIComponent(playerClass.name)}&type=${determinedEditType}`);
  };

  const isCustomHero = !isMonster(playerClass.name) && !FALLBACK_CLASSES.some(fc => fc.name === playerClass.name);
  const isCustomMonster = !FALLBACK_MONSTERS.some(fm => fm.name === playerClass.name) && isMonster(playerClass.name);

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
          {/* Close button - printed text on card */}
          <button
            onClick={onClose}
            className="absolute right-2 z-10 text-xl font-bold transition-all cursor-pointer"
            style={{
              top: '0.5rem',
              backgroundColor: 'transparent',
              color: '#5C4033',
              fontFamily: 'serif',
              border: 'none',
              padding: 0,
              lineHeight: '1',
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

          {/* Edit button - printed text on card */}
          {canEdit && (
            <button
              onClick={handleEdit}
              className="absolute left-2 z-10 text-base font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                top: '0.5rem',
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          {/* Card Back Header */}
          <div className="text-center mb-2 pb-1.5 border-b-2" style={{ borderColor: '#8B6F47' }}>
            <h2 
              className="text-4xl font-bold mb-0.5"
              style={{ color: '#5C4033' }}
            >
              {characterName}
            </h2>
            <p 
              className="text-base italic"
              style={{ color: '#8B6F47' }}
            >
              {isCustomHero ? 'Custom Hero' : isCustomMonster ? 'Custom Monster' : isMonster(playerClass.name) ? 'Monster' : 'Hero'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-2">
            <h3 
              className="text-lg font-semibold mb-1.5"
              style={{ color: '#8B6F47' }}
            >
              STATISTICS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-base" style={{ color: '#5C4033' }}>
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
          <div className="mb-2">
            <h3 
              className="text-lg font-semibold mb-1.5"
              style={{ color: '#8B6F47' }}
            >
              DESCRIPTION
            </h3>
            <p 
              className="text-sm leading-relaxed line-clamp-2"
              style={{ color: '#5C4033' }}
            >
              {playerClass.description || `A ${isMonster(playerClass.name) ? 'monster' : 'hero'} named ${characterName}.`}
            </p>
          </div>

          {/* Abilities */}
          {playerClass.abilities && playerClass.abilities.length > 0 && (
            <div className="mb-2 flex-1 min-h-0 flex flex-col">
              <h3 
                className="text-lg font-semibold mb-1.5"
                style={{ color: '#8B6F47' }}
              >
                ABILITIES
              </h3>
              <div className="space-y-1 flex-1 min-h-0">
                {(playerClass.abilities.slice(0, 5)).map((ability, index) => (
                  <AbilityDetailCardBack key={index} ability={ability} />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-2 border-t-2" style={{ borderColor: '#D4C4B0' }}>
            <div className="flex items-center justify-between text-sm" style={{ color: '#8B6F47' }}>
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
      className="border-2 rounded-lg p-1.5 flex-shrink-0"
      style={{ 
        borderColor: '#D4C4B0',
        backgroundColor: 'rgba(139, 111, 71, 0.1)',
      }}
    >
      <div className="flex items-start justify-between mb-0.5">
        <h4 
          className="text-base font-bold"
          style={{ color: '#5C4033' }}
        >
          {ability.name}
        </h4>
        <span 
          className="text-sm font-semibold uppercase px-1.5 py-0.5 rounded"
          style={{ 
            color: '#8B6F47',
            backgroundColor: 'rgba(139, 111, 71, 0.2)',
          }}
        >
          {isAttack ? '⚔️' : '💚'}
        </span>
      </div>

      {ability.description && (
        <p 
          className="text-xs leading-tight mb-0.5 line-clamp-1"
          style={{ color: '#5C4033' }}
        >
          {ability.description}
        </p>
      )}

      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-sm" style={{ color: '#8B6F47' }}>
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

