import React, { memo } from 'react';
import { CARD_THEME } from '../cardTheme';

interface DividerProps {
  diamondSize: string;
  padding: string;
  marginBottom: string;
}

/**
 * Decorative divider with diamond icon
 */
export const Divider = memo(function Divider({
  diamondSize,
  padding,
  marginBottom,
}: DividerProps) {
  return (
    <div 
      className="flex items-center justify-center" 
      style={{ 
        marginBottom, 
        paddingLeft: padding, 
        paddingRight: padding 
      }}
    >
      <div className="flex-1 border-t" style={{ borderColor: CARD_THEME.colors.text }} />
      <div
        className="mx-2"
        style={{
          width: diamondSize,
          height: diamondSize,
          backgroundColor: CARD_THEME.colors.text,
          transform: 'rotate(45deg)'
        }}
      />
      <div className="flex-1 border-t" style={{ borderColor: CARD_THEME.colors.text }} />
    </div>
  );
});

// Made with Bob
