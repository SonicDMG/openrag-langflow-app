# Bones, Rigs, and Emotions Cleanup Plan

## Overview
This document outlines all references to bones systems, rigs, and emotions that should be removed from the codebase. These systems were planned but never fully implemented - the application now relies solely on particle, cast, flash, shake, sparkle, miss, and hit effects.

## Analysis Summary

### ✅ Systems Still in Use (DO NOT REMOVE)
- Particle effects (ProjectileEffect component)
- Cast effects (card-cast-* CSS classes)
- Flash effects (card-flash-* CSS classes)
- Shake effects (shake animations)
- Sparkle effects (Sparkles component)
- Miss effects (miss animations)
- Hit effects (hit animations)
- All battle hooks and visual effect systems

### ❌ Dead Code to Remove

#### 1. Rig System (Unimplemented)
**Status**: Rig system was designed but never fully implemented. No RigPlayer component exists.

**Files to Clean:**
- **`typescript/app/dnd/utils/monsterTypes.ts`** - Remove/simplify Rig interface
  - `Rig` interface with `bones`, `slots`, `parts`, `expressions` fields
  - These are always empty/undefined but kept for "JSON structure compatibility"
  - **Action**: Simplify to only keep what's actually used (meta fields for image dimensions, etc.)

- **`typescript/app/api/monsters/route.ts`** - Remove rig structure creation
  - Creates `rig` objects with `bones: []`, `slots: []`, `parts: {}`, `expressions: { neutral: {} }`
  - These are never actually used for rendering
  - **Action**: Remove bones/slots/parts/expressions, keep only meta fields that are actually used

- **`typescript/app/dnd/server/storage.ts`** - Check if rig structure is needed for storage
  - Likely loads/saves rig data but if it's never used, can simplify

- **`typescript/app/globals.css`** - Remove unused CSS
  - `.rig-player-container canvas` styles (line 40-44)
  - No RigPlayer component exists to use this

- **`typescript/app/dnd/README_MONSTER_CREATION.md`** - Update documentation
  - References RigPlayer component (doesn't exist)
  - References autoRig.ts (doesn't exist)
  - References bones, slots, expressions in storage format
  - **Action**: Update to reflect actual implementation (static images only)

#### 2. Bones System (Unused)
**Status**: Bones are always empty arrays, never populated or used.

**References:**
- `monsterTypes.ts` - `bones: unknown[]` in Rig interface
- `route.ts` - Creates `bones: []` in rig objects
- **Action**: Remove all bones references

#### 3. Emotions/Expressions System (Unused)
**Status**: CharacterEmotion type exists but is never used. Expressions in rig are always `{ neutral: {} }`.

**Files to Clean:**
- **`typescript/app/dnd/types.ts`** - Remove CharacterEmotion type
  - Line 46: `export type CharacterEmotion = 'happy' | 'sad' | 'hurt' | ...`
  - Not imported or used anywhere in the codebase
  - **Action**: Remove the type definition

- **`typescript/app/dnd/utils/monsterTypes.ts`** - Remove expressions from Rig
  - `expressions?: Record<string, Partial<Record<string, string>>>`
  - Always set to `{ neutral: {} }` but never used
  - **Action**: Remove expressions field

- **`typescript/app/api/monsters/route.ts`** - Remove expressions creation
  - Creates `expressions: { neutral: {} }` but never used
  - **Action**: Remove expressions from rig creation

- **`typescript/app/dnd/monster-test/page.tsx`** - Remove expression state
  - Line 36: `const [expression, setExpression] = useState('neutral');`
  - Lines 565-568: Expression dropdown (but no RigPlayer to use it)
  - **Action**: Remove expression state and UI

#### 4. Auto-Rigging System (Doesn't Exist)
**Status**: Referenced in documentation but file doesn't exist.

**References:**
- `README_MONSTER_CREATION.md` - References `autoRig.ts` file
- No actual file exists in `server/` directory
- **Action**: Remove references from documentation

## Detailed Changes

### File: `typescript/app/dnd/utils/monsterTypes.ts`
**Current:**
```typescript
export interface Rig {
  meta?: {
    sourceImage?: string;
    imageW?: number;
    imageH?: number;
    monsterId?: string;
    class?: string;
    seed?: number;
    weaponPart?: string;
    weaponPosition?: { x: number; y: number };
    animationConfig?: AnimationConfig;
  };
  bones: unknown[]; // Currently always empty
  slots: unknown[]; // Currently always empty
  parts?: Record<string, unknown>; // Currently always empty
  expressions?: Record<string, Partial<Record<string, string>>>;
}
```

**Proposed:**
```typescript
// Simplified - only keep what's actually used
export interface Rig {
  meta?: {
    sourceImage?: string;
    imageW?: number;
    imageH?: number;
    monsterId?: string;
    class?: string;
    seed?: number;
    weaponPart?: string;
    weaponPosition?: { x: number; y: number };
    animationConfig?: AnimationConfig;
    skipCutout?: boolean;
  };
  // Removed: bones, slots, parts, expressions (never used)
}
```

### File: `typescript/app/dnd/types.ts`
**Remove:**
- Line 45-46: `CharacterEmotion` type definition (entire type)

### File: `typescript/app/api/monsters/route.ts`
**Remove from rig creation:**
- `bones: []`
- `slots: []`
- `parts: {}`
- `expressions: { neutral: {} }`

**Keep:**
- `meta` object (actually used for image dimensions, etc.)

### File: `typescript/app/globals.css`
**Remove:**
- Lines 39-45: `.rig-player-container canvas` styles

### File: `typescript/app/dnd/monster-test/page.tsx`
**Remove:**
- Line 36: `const [expression, setExpression] = useState('neutral');`
- Lines 565-568: Expression dropdown UI
- Any references to `expression` variable

### File: `typescript/app/dnd/README_MONSTER_CREATION.md`
**Update:**
- Remove references to RigPlayer component
- Remove references to autoRig.ts
- Remove references to bones, slots, expressions in storage format
- Update to reflect actual implementation (static images with cutouts)

## Verification Checklist

Before removing each item, verify:
- [ ] Type/interface is not imported anywhere (checked via grep)
- [ ] Field is not accessed in any code
- [ ] CSS class is not used in any component
- [ ] State variable is not used in component logic
- [ ] Removal won't break build
- [ ] Removal won't break monster creation/storage

## Risk Assessment

**Low Risk:**
- Removing `CharacterEmotion` type - Not used anywhere
- Removing `bones`, `slots`, `parts`, `expressions` from rig - Always empty/unused
- Removing `.rig-player-container` CSS - No component uses it
- Removing expression state from monster-test page - Not connected to any rendering

**Medium Risk:**
- Simplifying Rig interface - Need to ensure meta fields are still accessible
- Updating storage.ts - Need to ensure backward compatibility with existing monster bundles

**Mitigation:**
- Keep meta fields in Rig interface (they're actually used)
- Storage can handle both old and new rig formats (empty arrays/objects are fine)
- Test monster creation and loading after changes

## Notes

- The rig structure is still created and stored, but only the `meta` fields are actually used
- Monster images are static PNGs - no actual rigging/animation system exists
- All visual effects come from CSS animations and particle effects, not rig-based animations
- This cleanup removes ~50-100 lines of unused code and simplifies the type system

