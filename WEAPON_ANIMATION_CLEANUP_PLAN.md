# Weapon Animation Artifacts Cleanup Plan

## Overview
This document outlines the removal of old weapon animation artifacts (`weaponPart` and `weaponPosition`) that were used when animating weapons. The system now uses projectile effects that drop from the sky, so these fields are no longer needed.

## Analysis Summary

### Current State
- **`weaponPart`**: String field that identified which part of a character represented the weapon (e.g., 'staffTip', 'swordTip', 'hand')
- **`weaponPosition`**: Object with x/y coordinates for weapon tip position in image coordinates
- These fields are **only written/saved** but **never read/used** anywhere in the codebase
- Projectile effects now drop from the sky above targets, not from weapon positions

### Files Affected

#### 1. Type Definitions
**File**: `typescript/app/dnd/utils/monsterTypes.ts`
- `AnimationConfig.weaponPart` (line 5)
- `Rig.meta.weaponPart` (line 17)
- `Rig.meta.weaponPosition` (line 18)

#### 2. API Route (Monster Creation)
**File**: `typescript/app/api/monsters/route.ts`
- Line 140: `weaponPart: animationConfig?.weaponPart || undefined,`
- Line 226: `weaponPart: animationConfig?.weaponPart || undefined,`
- Line 282: `weaponPart: animationConfig?.weaponPart || undefined,`
- Line 521: `weaponPart: animationConfig?.weaponPart || undefined,`

#### 3. Documentation
**File**: `BONES_RIGS_EMOTIONS_CLEANUP_PLAN.md`
- Lines 99-100: References to `weaponPart` and `weaponPosition` in proposed changes
- Lines 121-122: Same references in proposed changes

## Detailed Changes

### File: `typescript/app/dnd/utils/monsterTypes.ts`

**Remove from `AnimationConfig` interface:**
```typescript
// REMOVE this line:
weaponPart?: string; // Part that represents the weapon/spell source (e.g., 'staffTip', 'swordTip', 'hand', 'wingL', 'tail')
```

**Remove from `Rig.meta` interface:**
```typescript
// REMOVE these lines:
weaponPart?: string; // Name of the part that represents the weapon (staffTip, swordTip, wandTip, hand, etc.)
weaponPosition?: { x: number; y: number }; // Position of weapon tip in image coordinates
```

### File: `typescript/app/api/monsters/route.ts`

**Remove from all 4 rig creation locations:**
- Line ~140 (skipCutout path, skipped placeholder)
- Line ~226 (skipCutout path, fallback placeholder)
- Line ~282 (skipCutout path, last resort)
- Line ~521 (full path with cutout)

**Change from:**
```typescript
weaponPart: animationConfig?.weaponPart || undefined,
```

**To:**
```typescript
// (simply remove the line)
```

### File: `BONES_RIGS_EMOTIONS_CLEANUP_PLAN.md`

**Update the proposed changes section to remove weapon references:**
- Remove `weaponPart` and `weaponPosition` from the proposed Rig interface example

## Verification Steps

Before making changes:
- [x] Confirmed `weaponPart` is never read/used (only written)
- [x] Confirmed `weaponPosition` is never read/used (only written)
- [x] Confirmed ProjectileEffect doesn't use weapon positioning
- [x] Confirmed no other files reference these fields

After making changes:
- [ ] TypeScript compilation succeeds
- [ ] No linter errors
- [ ] Monster creation still works
- [ ] Existing monsters can still be loaded (backward compatible - extra fields in JSON are fine)
- [ ] Projectile effects still work correctly

## Risk Assessment

**Low Risk:**
- These fields are never read, only written
- Removing them won't break any functionality
- Existing monster JSON files will still load (TypeScript will just ignore extra fields)
- No runtime code depends on these values

**Mitigation:**
- Changes are type-only and assignment-only removals
- No logic changes required
- Backward compatible (old JSON files with these fields will still work)

## Testing Plan

1. **Type Check**: Run `npm run build` or `tsc --noEmit` to verify no type errors
2. **Lint Check**: Run linter to ensure no issues
3. **Monster Creation**: Create a new monster via API to ensure it still works
4. **Monster Loading**: Load an existing monster to ensure backward compatibility
5. **Battle Test**: Run a battle to ensure projectile effects still work correctly

## Notes

- The `fromCardRotation` prop in ProjectileEffect is **NOT** related to weapon positioning - it's for card rotation and should be kept
- This cleanup removes unused data that was stored but never consumed
- Simplifies the type system and reduces confusion about what fields are actually used

