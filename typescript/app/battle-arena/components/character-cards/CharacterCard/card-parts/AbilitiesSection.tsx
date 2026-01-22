import React, { memo } from 'react';
import { Character } from '../../../../lib/types';
import { CardSizing, getCardSizeClasses } from '../../../../hooks/ui/useCardSizing';
import { CARD_THEME } from '../../../cardTheme';
import { AttackButtons } from './AttackButtons';
import { buildAbilityTooltip } from '../../../utils/tooltipUtils';

// ============================================================================
// Type Definitions
// ============================================================================

interface AbilitiesSectionProps {
  playerClass: Character;
  onAttack?: (attackType?: 'melee' | 'ranged') => void;
  onUseAbility?: (index: number) => void;
  shouldDisableOpponent: boolean;
  isDisabled: boolean;
  effectiveIsActive: boolean;
  isOpponent: boolean;
  testButtons: Array<{ label: string; onClick: () => void; className?: string }>;
  sizing: CardSizing;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Abilities section component displaying attack and ability buttons
 */
export const AbilitiesSection = memo(function AbilitiesSection({
  playerClass,
  onAttack,
  onUseAbility,
  shouldDisableOpponent,
  isDisabled,
  effectiveIsActive,
  isOpponent,
  testButtons,
  sizing,
}: AbilitiesSectionProps) {
  // ===== DERIVED VALUES =====
  const sizeClasses = getCardSizeClasses(sizing.isCompact);
  const iconSize = sizing.isCompact ? '0.65em' : '0.75em';
  const filteredTestButtons = !isOpponent
    ? testButtons.filter(btn => !btn.label.includes('Test Miss'))
    : [];

  // ===== STYLE CALCULATIONS =====
  // Container style
  const containerStyle = {
    marginBottom: sizing.isCompact ? '0.375rem' : '0.75rem',
    paddingLeft: sizing.padding,
    paddingRight: sizing.padding,
  };

  // Header container style
  const headerContainerStyle = {
    marginBottom: sizing.isCompact ? '0.125rem' : '0.375rem',
  };

  // Ability button base style
  const abilityButtonStyle = {
    borderRadius: '6px',
    padding: sizing.abilityButtonPadding,
    whiteSpace: 'nowrap' as const,
    fontFamily: CARD_THEME.fonts.family,
    fontWeight: 'bold',
    fontSize: sizing.isCompact ? '8px' : '10px',
    lineHeight: '1.2',
    minHeight: 'auto',
    boxSizing: 'border-box' as const,
    margin: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    verticalAlign: 'top' as const,
  };

  // Ability button classes
  const abilityButtonClassName = 'text-stone-800 bg-stone-100 border-stone-100 border';
  const disabledButtonClassName = `opacity-75 cursor-default ${abilityButtonClassName}`;
  const interactiveButtonClassName = `disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80 ${abilityButtonClassName}`;

  // Icon span style
  const iconSpanStyle = {
    fontSize: iconSize,
    lineHeight: '1',
  };

  // ===== HANDLERS =====
  const handleAbilityClick = (index: number) => {
    onUseAbility?.(index);
  };

  // ===== RENDER =====
  return (
    <div style={containerStyle}>
      <div className="flex items-center justify-between" style={headerContainerStyle}>
        <h4 className={`${sizeClasses.abilityHeadingSize} font-semibold text-stone-300`}>
          Abilities
        </h4>
        {isOpponent && (
          <div className={`${sizeClasses.abilityTextSize} italic font-semibold text-stone-300`}>
            Auto-playing opponent
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap items-start"
        style={{ gap: sizing.isCompact ? '2px' : '2px' }}
      >
        {/* Basic Attack button(s) */}
        {onAttack && (
          <AttackButtons
            playerClass={playerClass}
            onAttack={onAttack}
            shouldDisableOpponent={shouldDisableOpponent}
            isDisabled={isDisabled}
            sizing={sizing}
          />
        )}

        {/* Ability buttons */}
        {playerClass.abilities.length > 0 && playerClass.abilities.map((ability, idx) => {
          const isAttack = ability.type === 'attack';
          const abilityIcon = isAttack ? '⚔️' : '💚';
          const tooltip = buildAbilityTooltip(ability);

          // For non-interactive mode (auto-playing opponents or preview), show as disabled buttons
          if (shouldDisableOpponent || !onUseAbility) {
            return (
              <button
                key={idx}
                disabled
                className={disabledButtonClassName}
                style={abilityButtonStyle}
                title={tooltip || undefined}
              >
                <span style={iconSpanStyle}>{abilityIcon}</span>
                {ability.name}
              </button>
            );
          }

          // For interactive mode, show as clickable buttons
          const isButtonDisabled = !effectiveIsActive || isDisabled;
          return (
            <button
              key={idx}
              onClick={() => handleAbilityClick(idx)}
              disabled={isButtonDisabled}
              className={interactiveButtonClassName}
              style={{
                ...abilityButtonStyle,
                cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
              }}
              title={tooltip || undefined}
            >
              <span style={iconSpanStyle}>{abilityIcon}</span>
              {ability.name}
            </button>
          );
        })}

        {/* Render remaining test buttons */}
        {filteredTestButtons.map((testButton, idx) => (
          <button
            key={`test-${idx}`}
            onClick={testButton.onClick}
            className={testButton.className || 'ml-2 px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all'}
          >
            {testButton.label}
          </button>
        ))}
      </div>
    </div>
  );
});

// Made with Bob
