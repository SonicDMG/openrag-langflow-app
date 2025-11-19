# Plan: Fix Monster Team Play and Hero Knockout Issues

## Problem 1: Monsters Incorrectly Labeled as Heroes
**Issue**: Some monsters are not triggering team play because they're not being recognized as monsters.

**Root Cause**: The `isMonster()` function only checks if a class name exists in `FALLBACK_MONSTERS`. However, monsters loaded from the database (via `availableMonsters` from `useBattleData()`) may have names that aren't in `FALLBACK_MONSTERS`, causing them to be treated as heroes instead of monsters.

**Impact**: 
- Support heroes are not added when fighting database-loaded monsters
- Team play mechanics don't trigger correctly

## Problem 2: Main Hero Knockout on Test Page
**Issue**: On the test page, when the main hero (player1) is knocked out, they are just knocked out as long as other support cards are still in play, but the battle may not be continuing correctly.

**Root Cause**: The knockout logic checks `isTeamBattle = supportHeroes.length > 0`, but if support heroes weren't added (due to Problem 1), the battle ends prematurely. Additionally, the HP check timing might be off.

**Impact**:
- Battle ends when it should continue with support heroes
- User experience is confusing

## Solution Plan

### Critical Requirement: Shared Battle Logic
**IMPORTANT**: The test page and battle page should use the **SAME battle logic**.

- `typescript/app/components/DnDBattle.tsx` (main battle page) - uses battle hooks
- `typescript/app/dnd/test/page.tsx` (test page) - uses **THE SAME** battle hooks + UI test buttons

**Key Principle**: 
- The test page should NOT duplicate battle logic
- The test page should use the same hooks: `useBattleActions`, `useBattleState`, `useBattleEffects`, etc.
- The test page only adds UI buttons/triggers to manually test the battle logic
- All battle logic changes happen in the hooks/utilities, automatically affecting both pages

**Current Issue**: 
- **The test page has DUPLICATED battle logic** (testAttackHit, testUseAbility, etc.) instead of using shared hooks
- The test page does NOT use `useBattleActions` hook - it has its own implementation
- This means fixes need to be applied to BOTH the hook AND the test page's duplicated logic
- **Long-term**: Test page should be refactored to use shared hooks, but that's a larger refactor
- **Short-term**: Ensure duplicated logic in test page matches hook behavior exactly

### Phase 1: Enhance Monster Detection
1. **Update `isMonster()` function** in `constants.ts`
   - Add optional second parameter: `availableMonsters?: DnDClass[]`
   - Check both `FALLBACK_MONSTERS` and `availableMonsters` if provided
   - Maintain backward compatibility (existing calls without second param still work)

2. **Update support hero logic** in `DnDBattle.tsx`
   - Pass `availableMonsters` to `isMonster()` when checking if player2 is a monster
   - Ensure support heroes are added for any monster (not just FALLBACK_MONSTERS)
   - **Verify**: Same logic is applied in test page

3. **Update test page** (`test/page.tsx`)
   - Pass `availableMonsters` (or check against available monsters) when determining if opponent is a monster
   - Ensure support heroes are correctly added
   - **Verify**: Logic matches DnDBattle.tsx exactly

### Phase 2: Fix Knockout Logic
1. **Review knockout logic** in `useBattleActions.ts`
   - Verify HP checks happen after HP updates
   - Ensure team battle detection works correctly
   - Make sure "KNOCKED OUT!" is shown and battle continues when support heroes exist
   - **This is the SINGLE SOURCE OF TRUTH** for knockout logic - both pages use this hook

2. **Fix test page duplicated knockout logic** (`test/page.tsx`)
   - **Note**: Test page currently has duplicated battle logic (testAttackHit, etc.) instead of using hooks
   - Fix the duplicated knockout logic in `testAttackHit` to match `useBattleActions` behavior
   - Ensure player1 knockout properly checks for support heroes (same logic as useBattleActions.ts)
   - Verify turn switching skips knocked-out player1 but continues with support heroes
   - Make sure `getAvailableTargets()` correctly excludes knocked-out player1
   - **Future refactor**: Consider migrating test page to use `useBattleActions` hook to eliminate duplication

### Phase 3: Testing & Verification
**Test on BOTH pages** (DnDBattle.tsx and test/page.tsx):

1. Test with FALLBACK_MONSTERS (should work as before)
2. Test with database-loaded monsters (should now trigger team play)
3. Test main hero knockout with support heroes present (should continue battle)
4. Test main hero knockout without support heroes (should end battle)
5. Verify turn order skips knocked-out heroes correctly
6. **Cross-verify**: Ensure both pages behave identically in all scenarios

## Files to Modify

1. `typescript/app/dnd/constants.ts` - Enhance `isMonster()` function
2. `typescript/app/components/DnDBattle.tsx` - Pass availableMonsters to isMonster() when checking for support heroes
3. `typescript/app/dnd/test/page.tsx` - Pass availableMonsters to isMonster() when checking for support heroes, verify it uses shared hooks
4. `typescript/app/dnd/hooks/useBattleActions.ts` - Verify knockout logic handles team battles correctly (this is the single source of truth)
5. **If needed**: Refactor test page to remove duplicated battle logic and use shared hooks instead

## Architecture Verification Checklist

**Current State**:
- [ ] Both pages use the same `isMonster()` function with `availableMonsters` parameter
- [ ] DnDBattle.tsx uses `useBattleActions` hook (correct)
- [ ] Test page has duplicated battle logic (needs to match hook behavior)
- [ ] Test page knockout logic matches `useBattleActions` knockout logic exactly
- [ ] Both pages tested with same scenarios

**Future Refactor** (not in scope for this fix):
- [ ] Test page should be refactored to use `useBattleActions` hook instead of duplicating logic
- [ ] This would eliminate duplication and ensure single source of truth

## Implementation Details

### Enhanced isMonster() Function
```typescript
export function isMonster(className: string, availableMonsters?: DnDClass[]): boolean {
  // Check FALLBACK_MONSTERS first (for backward compatibility)
  if (FALLBACK_MONSTERS.some(monster => monster.name === className)) {
    return true;
  }
  // If availableMonsters is provided, check that too
  if (availableMonsters && availableMonsters.some(monster => monster.name === className)) {
    return true;
  }
  return false;
}
```

### Support Hero Check Update
In `DnDBattle.tsx`, when checking if we need support heroes:
```typescript
const isP2Monster = isMonster(p2.name, availableMonsters);
const needsSupportHeroes = isP2Monster && p2.maxHitPoints > 50;
```

### Test Page Monster Check
In `test/page.tsx`, when checking if entity is a monster:
- Use the same `isMonster()` function with `availableMonsters` parameter
- Load `availableMonsters` from `useBattleData()` hook (same as DnDBattle.tsx)
- **CRITICAL**: Use the exact same logic as DnDBattle.tsx - no duplication

### Architecture Notes

**Current State**:
- DnDBattle.tsx uses shared hooks: `useBattleActions`, `useBattleState`, `useBattleEffects` ✅
- Test page has DUPLICATED battle logic (testAttackHit, testUseAbility, etc.) ⚠️
- Test page does NOT use shared hooks - it implements its own battle logic

**For This Fix**:
- Ensure test page's duplicated logic matches hook behavior exactly
- Both pages must use same `isMonster()` with `availableMonsters`
- Test page knockout logic must match `useBattleActions` knockout logic

**Future Improvement** (not in scope):
- Refactor test page to use `useBattleActions` hook instead of duplicating
- This would eliminate code duplication and ensure single source of truth
- Test page would only have UI buttons that call hook functions

