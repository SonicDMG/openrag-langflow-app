# Dead Code Cleanup Plan

## Overview
This document outlines all dead code, unused components, and styles that can be safely removed from the codebase. The cleanup focuses on old visual dice rolling components that are no longer used (dice are now rolled mathematically but not displayed visually).

## Analysis Summary

### ✅ Code Still in Use (DO NOT REMOVE)
- `typescript/app/dnd/utils/dice.ts` - **KEEP** - Contains `rollDice()`, `parseDiceNotation()`, `rollDiceWithNotation()` which are actively used for mathematical dice rolling
- `typescript/app/styles/animations/card-animations.css` - **KEEP MOST** - Contains card pulse, breathing animations, and card zoom flip that are still used
- All battle hooks and utilities are actively used

### ❌ Dead Code to Remove

#### 1. Unused Visual Dice Components
- **`typescript/app/dnd/components/DiceRoll.tsx`** - Not imported anywhere
  - Old component for visual dice rolling animation
  - Only imports `SingleDice` (which is also unused)
  
- **`typescript/app/dnd/components/SingleDice.tsx`** - Only imported by `DiceRoll.tsx` (unused)
  - Individual dice component for rolling animation
  - Not used anywhere else in codebase

- **`typescript/app/dnd/components/CardDiceDisplay.tsx`** - Not imported anywhere
  - Component to display dice results on character cards
  - Was intended to show dice results but never integrated

#### 2. Unused CSS Styles

**`typescript/app/styles/animations/dice-animations.css`** - **ENTIRE FILE CAN BE REMOVED**
- Contains all styles for visual dice rolling animations
- Only used by `DiceRoll` and `SingleDice` components (which are unused)
- Styles include:
  - `dice-roll-rolling` animation
  - `dice-bounce` animation
  - `dice-roll-container`, `.dice-roll` classes
  - All dice shape classes (`.dice-d20`, `.dice-d12`, `.dice-d10`, `.dice-d8`, `.dice-d6`, `.dice-d4`)
  - `dice-rolling-content`, `.dice-label`, `.dice-dots`, `.dice-dot` styles
  - All related animations (`dice-label-spin`, `dot-pulse`, `fade-in-scale`)

**`typescript/app/styles/animations/card-animations.css`** - **REMOVE CARD-DICE SECTION (lines 53-279)**
- Section "Card dice display" is only used by `CardDiceDisplay` component (unused)
- Remove:
  - `@keyframes card-dice-fade-in` (lines 54-63)
  - `@keyframes card-dice-fade-out` (lines 65-74)
  - `.card-dice-display` (lines 76-83)
  - `.card-dice` (lines 85-111)
  - `@keyframes card-dice-3d-rotate` (lines 113-120)
  - `@keyframes card-dice-3d-rotate-d8` (lines 122-129)
  - `.card-dice .dice-face` (lines 131-141)
  - `.card-dice .dice-result` (lines 143-160)
  - All `.card-dice.dice-d*` classes (lines 162-279)
- **KEEP**: Card pulse, breathing animations, card zoom flip (lines 1-52, 281-325)

#### 3. Documentation Files (Review for Archival)
- **`COMMIT_MESSAGE.md`** (root) - Temporary commit message file
- **`typescript/COMMIT_MESSAGE.md`** - Temporary commit message file
- **`PLAN_MONSTER_TEAM_PLAY_FIX.md`** - Planning document, may be archived
- **`typescript/TEST_DISCUSSION.md`** - Test discussion, may be archived
- **`typescript/TEST_PLAN_RACE_SEX.md`** - Test plan, may be archived

## Cleanup Steps

### Phase 1: Remove Unused Components
1. Delete `typescript/app/dnd/components/DiceRoll.tsx`
2. Delete `typescript/app/dnd/components/SingleDice.tsx`
3. Delete `typescript/app/dnd/components/CardDiceDisplay.tsx`

### Phase 2: Clean Up CSS
1. Remove `@import "./styles/animations/dice-animations.css";` from `typescript/app/globals.css`
2. Delete `typescript/app/styles/animations/dice-animations.css` entirely
3. Remove card-dice section (lines 53-279) from `typescript/app/styles/animations/card-animations.css`

### Phase 3: Review Documentation
1. Review and decide on archival/removal of planning/test documentation files
2. Remove temporary `COMMIT_MESSAGE.md` files if no longer needed

### Phase 4: Testing
1. Run `npm run build` to ensure no broken imports
2. Run test suite to verify functionality
3. Manually test battle system to ensure dice rolling (mathematical) still works
4. Verify no visual regressions

## Verification Checklist

Before removing each item, verify:
- [ ] Component/file is not imported anywhere (checked via grep)
- [ ] Component/file is not referenced in any other way
- [ ] CSS classes are not used elsewhere
- [ ] No tests reference the component/file
- [ ] Removal won't break build

## Risk Assessment

**Low Risk:**
- Removing `DiceRoll.tsx`, `SingleDice.tsx`, `CardDiceDisplay.tsx` - Not imported anywhere
- Removing `dice-animations.css` - Only used by unused components
- Removing card-dice styles from `card-animations.css` - Only used by unused component

**Medium Risk:**
- Removing documentation files - Should review first to ensure no important information is lost

## Notes

- The mathematical dice rolling functionality (`dice.ts`) is **NOT** being removed - it's actively used
- Only visual dice rolling components are being removed
- All battle mechanics remain intact
- This cleanup removes approximately:
  - 3 component files (~300 lines)
  - 1 CSS file (~300 lines)
  - ~230 lines from card-animations.css
  - Total: ~830 lines of dead code

