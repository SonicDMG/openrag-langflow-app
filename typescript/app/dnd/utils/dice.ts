// Roll dice function
export function rollDice(dice: string): number {
  // Handle both formats: "d10" (defaults to 1 die) and "1d10" (explicit count)
  let match = dice.match(/(\d+)d(\d+)/);
  if (!match) {
    // Try format without count (e.g., "d10" means "1d10")
    match = dice.match(/d(\d+)/);
    if (!match) return 0;
    const sides = parseInt(match[1]);
    return Math.floor(Math.random() * sides) + 1;
  }
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

// Roll with modifier
export function rollWithModifier(dice: string, modifier: number = 0): number {
  return rollDice(dice) + modifier;
}

// Parse dice notation with modifiers (e.g., "1d8+3", "2d6+2", "3d6")
// Returns { dice: string, modifier: number }
export function parseDiceNotation(notation: string): { dice: string; modifier: number } {
  const match = notation.match(/(\d+d\d+)([+-]\d+)?/);
  if (!match) {
    // Try format without count (e.g., "d8+3")
    const match2 = notation.match(/(d\d+)([+-]\d+)?/);
    if (match2) {
      return {
        dice: `1${match2[1]}`, // Add 1 prefix
        modifier: match2[2] ? parseInt(match2[2]) : 0,
      };
    }
    return { dice: 'd6', modifier: 0 }; // Fallback
  }
  return {
    dice: match[1],
    modifier: match[2] ? parseInt(match[2]) : 0,
  };
}

// Roll dice with notation that may include modifiers (e.g., "1d8+3")
export function rollDiceWithNotation(notation: string): number {
  const { dice, modifier } = parseDiceNotation(notation);
  return rollDice(dice) + modifier;
}

