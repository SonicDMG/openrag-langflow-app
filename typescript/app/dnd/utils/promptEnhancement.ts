/**
 * Utility functions for enhancing prompts with character attributes
 */

/**
 * Enhances a character description with race and sex information
 * @param description - The base character description
 * @param race - Character race (optional, use "n/a" if not applicable)
 * @param sex - Character sex (optional, use "n/a" if not applicable)
 * @returns Enhanced description with race and sex included
 */
export function enhanceDescriptionWithRaceAndSex(description: string, race?: string, sex?: string): string {
  const parts: string[] = [];
  
  if (race && race !== 'n/a' && race.trim()) {
    parts.push(race.trim());
  }
  
  if (sex && sex !== 'n/a' && sex.trim()) {
    parts.push(sex.trim());
  }
  
  if (parts.length > 0) {
    return `${parts.join(' ')} ${description}`.trim();
  }
  
  return description;
}

// Made with Bob
