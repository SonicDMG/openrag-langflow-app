import React, { memo } from 'react';
import { Character } from '../../../lib/types';
import { CardSizing } from '../../../hooks/ui/useCardSizing';
import { CARD_THEME } from '../../cardTheme';
import { AttackButtons } from './AttackButtons';
import { buildAbilityTooltip } from '../../utils/tooltipUtils';

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
  const iconSize = sizing.isCompact ? '0.65em' : '0.75em';
  
  const abilityButtonStyle = {
    color: CARD_THEME.colors.buttonText,
    backgroundColor: CARD_THEME.colors.buttonBg,
    border: `1px solid ${CARD_THEME.colors.border}`,
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
  
  return (
    <div style={{ marginBottom: sizing.isCompact ? '0.375rem' : '0.75rem', paddingLeft: sizing.padding, paddingRight: sizing.padding }}>
      <div className="flex items-center justify-between" style={{ marginBottom: sizing.isCompact ? '0.125rem' : '0.375rem' }}>
        <h4 
          className={`${sizing.abilityHeadingSize} font-semibold`}
          style={{ color: CARD_THEME.colors.textLight }}
        >
          Abilities
        </h4>
        {isOpponent && (
          <div className={`${sizing.abilityTextSize} italic font-semibold`} style={{ color: CARD_THEME.colors.textLight }}>
            Auto-playing opponent
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap" style={{ gap: sizing.isCompact ? '2px' : '2px', alignItems: 'flex-start' }}>
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
          
          // For non-interactive mode (auto-playing opponents or preview), show as disabled buttons
          if (shouldDisableOpponent || !onUseAbility) {
            return (
              <button
                key={idx}
                disabled
                className="opacity-75 cursor-default"
                style={abilityButtonStyle}
                title={buildAbilityTooltip(ability) || undefined}
              >
                <span style={{ fontSize: iconSize, lineHeight: '1' }}>{abilityIcon}</span>
                {ability.name}
              </button>
            );
          }
          
          // For interactive mode, show as clickable buttons
          return (
            <button
              key={idx}
              onClick={() => onUseAbility(idx)}
              disabled={!effectiveIsActive || isDisabled}
              className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80"
              style={{ 
                ...abilityButtonStyle,
                cursor: (!effectiveIsActive || isDisabled) ? 'not-allowed' : 'pointer',
              }}
              title={buildAbilityTooltip(ability) || undefined}
            >
              <span style={{ fontSize: iconSize, lineHeight: '1' }}>{abilityIcon}</span>
              {ability.name}
            </button>
          );
        })}
        
        {/* Render remaining test buttons (excluding Test Miss since it's already rendered) */}
        {!isOpponent && testButtons.filter(btn => !btn.label.includes('Test Miss')).map((testButton, idx) => (
          <button
            key={`test-${idx}`}
            onClick={testButton.onClick}
            className={testButton.className || "ml-2 px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded border border-amber-600 transition-all"}
          >
            {testButton.label}
          </button>
        ))}
      </div>
    </div>
  );
});

// Made with Bob
