// Type definitions for monster data structures

export interface AnimationConfig {
  windParts?: string[]; // Parts affected by wind (e.g., ['hair', 'robeL', 'robeR', 'cape'])
  spellEffectType?: 'particles' | 'fire' | 'sparkles' | 'glow'; // Type of spell effect
}

export interface Rig {
  meta?: {
    sourceImage?: string;
    imageW?: number;
    imageH?: number;
    monsterId?: string;
    class?: string;
    seed?: number;
    animationConfig?: AnimationConfig; // Custom animation configuration
  };
  // Removed: bones, slots, parts, expressions - these were never used
  // Only meta fields are actually used for image dimensions and configuration
}

export interface MonsterBundle {
  monsterId: string;
  klass: string;
  seed: number;
  prompt: string;
  stats: {
    hitPoints: number;
    maxHitPoints: number;
    armorClass: number;
    attackBonus: number;
    damageDie: string;
    abilities?: any[];
    description?: string;
  };
  palette: number[]; // RGBA color array
  rig: Rig;
  images: {
    png128: Buffer;
    png200: Buffer;
    png280x200: Buffer; // Wider version for card display
    png256: Buffer;
    png512: Buffer;
  };
  // Removed cutOutImages and backgroundOnlyImages - no longer generating cutouts
  cutOutImages?: undefined;
  backgroundOnlyImages?: undefined;
}
