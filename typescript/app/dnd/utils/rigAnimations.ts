// Animation system for rig-based characters
// Provides predefined animation clips and animation state management

import { AnimationClip, AnimationState, CharacterRenderState } from './rigTypes';

// Predefined animation clips
export const ANIMATION_CLIPS: Record<string, AnimationClip> = {
  idle: {
    name: 'idle',
    duration: 2.0, // 2 seconds
    loop: true,
    keyframes: {
      armL: [
        { time: 0, rotation: 0 },
        { time: 0.5, rotation: 0.1 },
        { time: 1.0, rotation: 0 },
        { time: 1.5, rotation: -0.1 },
        { time: 2.0, rotation: 0 },
      ],
      armR: [
        { time: 0, rotation: 0 },
        { time: 0.5, rotation: -0.1 },
        { time: 1.0, rotation: 0 },
        { time: 1.5, rotation: 0.1 },
        { time: 2.0, rotation: 0 },
      ],
      head: [
        { time: 0, rotation: 0 },
        { time: 1.0, rotation: 0 },
        { time: 2.0, rotation: 0 },
      ],
    },
  },
  // Wizard-specific idle pose: left hand raised (casting gesture), right hand holding staff
  // Cloak blows in wind, but staff stays static
  wizardIdle: {
    name: 'wizardIdle',
    duration: 3.0, // Slower, more majestic wind effect
    loop: true,
    keyframes: {
      armL: [
        { time: 0, rotation: -0.7, y: -5 }, // Left arm raised (matching reference)
        { time: 1.5, rotation: -0.65, y: -4.5 }, // Very slight movement
        { time: 3.0, rotation: -0.7, y: -5 },
      ],
      armR: [
        { time: 0, rotation: 0.15, y: 0 }, // Right arm holding staff (static position)
        { time: 3.0, rotation: 0.15, y: 0 }, // No movement - staff stays in place
      ],
      // Cloak/robe wind animation - animate torso to create flowing effect
      torso: [
        { time: 0, rotation: 0, x: 0 },
        { time: 0.75, rotation: 0.05, x: 1 }, // Slight sway left
        { time: 1.5, rotation: 0, x: 0 }, // Center
        { time: 2.25, rotation: -0.05, x: -1 }, // Slight sway right
        { time: 3.0, rotation: 0, x: 0 }, // Back to center
      ],
      head: [
        { time: 0, rotation: 0 },
        { time: 3.0, rotation: 0 },
      ],
      // Staff stays completely static - no animation
    },
  },
  attack: {
    name: 'attack',
    duration: 0.5,
    loop: false,
    keyframes: {
      armR: [
        { time: 0, rotation: 0 },
        { time: 0.2, rotation: -1.2 },
        { time: 0.4, rotation: 0.3 },
        { time: 0.5, rotation: 0 },
      ],
      torso: [
        { time: 0, rotation: 0 },
        { time: 0.2, rotation: 0.1 },
        { time: 0.4, rotation: -0.05 },
        { time: 0.5, rotation: 0 },
      ],
    },
  },
  cast: {
    name: 'cast',
    duration: 0.8,
    loop: false,
    keyframes: {
      armL: [
        { time: 0, rotation: 0, y: 0 },
        { time: 0.3, rotation: -0.8, y: -2 },
        { time: 0.6, rotation: -0.5, y: -1 },
        { time: 0.8, rotation: 0, y: 0 },
      ],
      armR: [
        { time: 0, rotation: 0, y: 0 },
        { time: 0.3, rotation: -1.2, y: -8 }, // Raise arm up and rotate to point staff upward
        { time: 0.6, rotation: -1.0, y: -6 }, // Hold position
        { time: 0.8, rotation: 0, y: 0 }, // Return to rest
      ],
      head: [
        { time: 0, rotation: 0 },
        { time: 0.3, rotation: 0.1 },
        { time: 0.6, rotation: -0.05 },
        { time: 0.8, rotation: 0 },
      ],
      // Staff follows armR, so it will inherit the arm's transform
      // No additional rotation needed - staff should just follow the arm
    },
  },
  hurt: {
    name: 'hurt',
    duration: 0.4,
    loop: false,
    keyframes: {
      torso: [
        { time: 0, rotation: 0, x: 0 },
        { time: 0.1, rotation: 0.15, x: 2 },
        { time: 0.2, rotation: -0.15, x: -2 },
        { time: 0.3, rotation: 0.1, x: 1 },
        { time: 0.4, rotation: 0, x: 0 },
      ],
      head: [
        { time: 0, rotation: 0 },
        { time: 0.1, rotation: 0.2 },
        { time: 0.2, rotation: -0.2 },
        { time: 0.3, rotation: 0.1 },
        { time: 0.4, rotation: 0 },
      ],
    },
  },
  celebrate: {
    name: 'celebrate',
    duration: 1.0,
    loop: false,
    keyframes: {
      armL: [
        { time: 0, rotation: 0 },
        { time: 0.3, rotation: -1.5, y: -3 },
        { time: 0.6, rotation: -1.5, y: -3 },
        { time: 1.0, rotation: 0, y: 0 },
      ],
      armR: [
        { time: 0, rotation: 0 },
        { time: 0.3, rotation: 1.5, y: -3 },
        { time: 0.6, rotation: 1.5, y: -3 },
        { time: 1.0, rotation: 0, y: 0 },
      ],
      head: [
        { time: 0, rotation: 0, y: 0 },
        { time: 0.3, rotation: 0, y: -2 },
        { time: 0.6, rotation: 0, y: -2 },
        { time: 1.0, rotation: 0, y: 0 },
      ],
    },
  },
  walk: {
    name: 'walk',
    duration: 0.8,
    loop: true,
    keyframes: {
      legL: [
        { time: 0, rotation: 0, y: 0 },
        { time: 0.25, rotation: 0.3, y: 1 },
        { time: 0.5, rotation: 0, y: 0 },
        { time: 0.75, rotation: -0.3, y: -1 },
        { time: 0.8, rotation: 0, y: 0 },
      ],
      legR: [
        { time: 0, rotation: 0, y: 0 },
        { time: 0.25, rotation: -0.3, y: -1 },
        { time: 0.5, rotation: 0, y: 0 },
        { time: 0.75, rotation: 0.3, y: 1 },
        { time: 0.8, rotation: 0, y: 0 },
      ],
      armL: [
        { time: 0, rotation: 0 },
        { time: 0.25, rotation: -0.3 },
        { time: 0.5, rotation: 0 },
        { time: 0.75, rotation: 0.3 },
        { time: 0.8, rotation: 0 },
      ],
      armR: [
        { time: 0, rotation: 0 },
        { time: 0.25, rotation: 0.3 },
        { time: 0.5, rotation: 0 },
        { time: 0.75, rotation: -0.3 },
        { time: 0.8, rotation: 0 },
      ],
    },
  },
  // Dragon-specific animations
  dragonIdle: {
    name: 'dragonIdle',
    duration: 2.0,
    loop: true,
    keyframes: {
      head: [
        { time: 0, rotation: 0, x: 0, y: 0 },
        { time: 0.5, rotation: 0.1, x: 1, y: -0.5 },
        { time: 1.0, rotation: 0, x: 0, y: 0 },
        { time: 1.5, rotation: -0.1, x: -1, y: -0.5 },
        { time: 2.0, rotation: 0, x: 0, y: 0 },
      ],
      tail: [
        { time: 0, rotation: 0, x: 0, y: 0 },
        { time: 0.5, rotation: -0.15, x: -1.5, y: 1 },
        { time: 1.0, rotation: 0, x: 0, y: 0 },
        { time: 1.5, rotation: 0.15, x: 1.5, y: 1 },
        { time: 2.0, rotation: 0, x: 0, y: 0 },
      ],
      wingL: [
        { time: 0, rotation: 0 },
        { time: 1.0, rotation: 0.05 },
        { time: 2.0, rotation: 0 },
      ],
      wingR: [
        { time: 0, rotation: 0 },
        { time: 1.0, rotation: -0.05 },
        { time: 2.0, rotation: 0 },
      ],
    },
  },
  dragonAttack: {
    name: 'dragonAttack',
    duration: 0.6,
    loop: false,
    keyframes: {
      head: [
        { time: 0, rotation: 0, x: 0 },
        { time: 0.2, rotation: 0.2, x: -2 },
        { time: 0.4, rotation: -0.1, x: 1 },
        { time: 0.6, rotation: 0, x: 0 },
      ],
      neck: [
        { time: 0, rotation: 0 },
        { time: 0.2, rotation: 0.15 },
        { time: 0.4, rotation: -0.05 },
        { time: 0.6, rotation: 0 },
      ],
    },
  },
};

// Determine which animation to play based on character state
export function getAnimationForState(state: CharacterRenderState, characterType?: string): string {
  if (state.isDefeated) {
    // When defeated, use default idle (no special pose)
    return characterType === 'Dragon' ? 'dragonIdle' : (characterType === 'Wizard' ? 'wizardIdle' : 'idle');
  }
  if (state.isAttacking) {
    return characterType === 'Dragon' ? 'dragonAttack' : 'attack';
  }
  if (state.isCasting) {
    return 'cast';
  }
  if (state.shouldShake) {
    return 'hurt';
  }
  if (state.isVictor || state.emotion === 'victorious' || state.emotion === 'triumphant') {
    return 'celebrate';
  }
  // Default to idle - wizard has special idle pose with left hand raised
  if (characterType === 'Dragon') {
    return 'dragonIdle';
  } else if (characterType === 'Wizard') {
    return 'wizardIdle';
  }
  return 'idle';
}

// Update animation state
export function updateAnimationState(
  state: AnimationState,
  deltaTime: number,
  clips: Record<string, AnimationClip>
): AnimationState {
  if (!state.currentClip) {
    return state;
  }

  const clip = clips[state.currentClip];
  if (!clip) {
    return state;
  }

  let newTime = state.time + deltaTime * (state.speed ?? 1.0);

  if (clip.loop) {
    newTime = newTime % clip.duration;
  } else {
    newTime = Math.min(newTime, clip.duration);
  }

  return {
    ...state,
    time: newTime,
  };
}

// Create initial animation state
export function createAnimationState(clipName?: string): AnimationState {
  return {
    currentClip: clipName || 'idle',
    time: 0,
    isPlaying: true,
    speed: 1.0,
  };
}

