import React, { memo } from 'react';
import { Character } from '../../types';
import { CardSizing } from '../../hooks/ui/useCardSizing';
import { CARD_THEME } from '../cardTheme';
import { buildAttackTooltip } from '../utils/tooltipUtils';

interface AttackButtonsProps {
  playerClass: Character;
  onAttack: (attackType?: 'melee' | 'ranged') => void;
  shouldDisableOpponent: boolean;
  isDisabled: boolean;
  sizing: CardSizing;
}

/**
 * Attack buttons component - handles melee, ranged, or generic attacks
 */
export const AttackButtons = memo(function AttackButtons({
  playerClass,
  onAttack,
  shouldDisableOpponent,
  isDisabled,
  sizing,
}: AttackButtonsProps) {
  const hasMelee = !!playerClass.meleeDamageDie;
  const hasRanged = !!playerClass.rangedDamageDie;
  const showSeparate = hasMelee && hasRanged;
  const attackIcon = '⚔️';
  const iconSize = sizing.isCompact ? '0.65em' : '0.75em';
  
  const buttonStyle = {
    color: CARD_THEME.colors.buttonText,
    backgroundColor: CARD_THEME.colors.buttonBg,
    border: `1px solid ${CARD_THEME.colors.border}`,
    borderRadius: '6px',
    padding: sizing.abilityButtonPadding,
    cursor: (shouldDisableOpponent || isDisabled) ? 'not-allowed' : 'pointer',
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
  
  if (showSeparate) {
    // Show separate Melee and Ranged buttons
    return (
      <>
        <button
          onClick={() => onAttack('melee')}
          disabled={shouldDisableOpponent || isDisabled}
          className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80"
          style={buttonStyle}
          title={buildAttackTooltip(playerClass.meleeDamageDie!, 'melee')}
        >
          <span style={{ fontSize: iconSize, lineHeight: '1' }}>{attackIcon}</span>
          Melee
        </button>
        <button
          onClick={() => onAttack('ranged')}
          disabled={shouldDisableOpponent || isDisabled}
          className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80"
          style={buttonStyle}
          title={buildAttackTooltip(playerClass.rangedDamageDie!, 'ranged')}
        >
          <span style={{ fontSize: iconSize, lineHeight: '1' }}>{attackIcon}</span>
          Ranged
        </button>
      </>
    );
  }
  
  // Show single Attack button (fallback to damageDie)
  let damageDie: string;
  let attackType: 'melee' | 'ranged' | undefined;
  
  if (hasMelee) {
    damageDie = playerClass.meleeDamageDie!;
    attackType = 'melee';
  } else if (hasRanged) {
    damageDie = playerClass.rangedDamageDie!;
    attackType = 'ranged';
  } else {
    damageDie = playerClass.damageDie;
    attackType = undefined;
  }
  
  return (
    <button
      onClick={() => onAttack()}
      disabled={shouldDisableOpponent || isDisabled}
      className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-opacity-80"
      style={buttonStyle}
      title={buildAttackTooltip(damageDie, attackType)}
    >
      <span style={{ fontSize: iconSize, lineHeight: '1' }}>{attackIcon}</span>
      Attack
    </button>
  );
});

// Made with Bob
