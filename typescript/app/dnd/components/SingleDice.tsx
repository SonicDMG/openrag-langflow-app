'use client';

// Single Dice Component
interface SingleDiceProps {
  diceType: string;
  result: number;
  startX: number;
  startY: number;
  delay: number;
  showResult: boolean;
}

export function SingleDice({ diceType, result, startX, startY, delay, showResult }: SingleDiceProps) {
  const sides = parseInt(diceType.replace(/[^\d]/g, '')) || 6;
  
  // Determine dice class based on type
  const getDiceClass = () => {
    if (sides === 20) return 'dice-d20';
    if (sides === 12) return 'dice-d12';
    if (sides === 10) return 'dice-d10';
    if (sides === 8) return 'dice-d8';
    if (sides === 6) return 'dice-d6';
    if (sides === 4) return 'dice-d4';
    return 'dice-d6'; // Default to d6
  };

  return (
    <div
      className={`dice-roll ${getDiceClass()} ${showResult ? 'dice-roll-result' : 'dice-roll-rolling'}`}
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        animationDelay: `${delay}s`,
      } as React.CSSProperties}
    >
      <div className="dice-face">
        {showResult ? (
          <span className="dice-result">{result}</span>
        ) : (
          <div className="dice-rolling-content">
            {sides === 20 && <span className="dice-label">d20</span>}
            {sides === 12 && <span className="dice-label">d12</span>}
            {sides === 10 && <span className="dice-label">d10</span>}
            {sides === 8 && <span className="dice-label">d8</span>}
            {sides === 6 && (
              <div className="dice-dots d6-dots">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="dice-dot" style={{ animationDelay: `${i * 0.03}s` }} />
                ))}
              </div>
            )}
            {sides === 4 && <span className="dice-label">d4</span>}
            {![20, 12, 10, 8, 6, 4].includes(sides) && (
              <span className="dice-label">d{sides}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

