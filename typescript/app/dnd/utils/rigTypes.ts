// Rig type definitions for pixel art character animation

export type PartName = 
  | 'torso' 
  | 'head' 
  | 'eyeL' 
  | 'eyeR' 
  | 'mouth' 
  | 'armL' 
  | 'armR' 
  | 'wingL' 
  | 'wingR' 
  | 'legL' 
  | 'legR' 
  | 'tail'
  | 'beard'
  | 'hair'
  | 'cape'
  | 'sleeveL'
  | 'sleeveR'
  | 'robeL'
  | 'robeR'
  | 'hatTip'
  | 'staffTip'
  | 'swordTip'
  | 'wandTip'
  | 'hand'
  | 'weaponTip'
  | string; // Allow custom parts

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Pivot {
  x: number;
  y: number;
}

export interface Part {
  name: PartName;
  rect: Rect | null;
  pivot: Pivot | null;
  z: number;
  parent?: string;
}

export interface Bone {
  name: string;
  parent?: string;
  x?: number;
  y?: number;
  rotation?: number;
}

export interface Slot {
  name: string;
  bone: string;
  texture: string;
  z: number;
}

export interface AnimationConfig {
  windParts?: string[]; // Parts affected by wind (e.g., ['hair', 'robeL', 'robeR', 'cape'])
  weaponPart?: string; // Part that represents the weapon/spell source (e.g., 'staffTip', 'swordTip', 'hand', 'wingL', 'tail')
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
    weaponPart?: string; // Name of the part that represents the weapon (staffTip, swordTip, wandTip, hand, etc.)
    weaponPosition?: { x: number; y: number }; // Position of weapon tip in image coordinates
    animationConfig?: AnimationConfig; // Custom animation configuration
  };
  bones: Bone[];
  slots: Slot[];
  parts?: Record<PartName, Part>;
  expressions?: Record<string, Partial<Record<string, string>>>;
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
    partsPngs?: Record<string, Buffer>;
  };
}

// Animation types (for future use)
export interface Keyframe {
  time: number;
  rotation?: number;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface AnimationClip {
  name: string;
  duration: number;
  loop: boolean;
  keyframes: Record<string, Keyframe[]>;
}

export interface AnimationState {
  currentClip: string | null;
  time: number;
  isPlaying: boolean;
  speed?: number;
}

export interface CharacterRenderState {
  expression: string;
  animation: AnimationState;
  isDefeated?: boolean;
  isAttacking?: boolean;
  isCasting?: boolean;
  shouldShake?: boolean;
  isVictor?: boolean;
  emotion?: string;
  currentClip?: string | null;
  time?: number;
}
