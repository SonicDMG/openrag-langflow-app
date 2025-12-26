# Eliminate FALLBACK_* Constants Refactor Plan

## Problem Statement
The dual-use of character names and class names creates confusion and bugs:
- FALLBACK_CLASSES contain class names ("Ranger", "Fighter")
- Custom heroes have character names ("Sylvan the Hunter") with class field ("Ranger")
- Images use `klass` field that can be EITHER character name OR class name
- This creates ambiguity when looking up images and determining character types

## Solution
Move ALL heroes and monsters to the database, eliminating FALLBACK_* constants entirely.

## Benefits
1. **Consistency**: All characters (default or custom) treated the same
2. **Clarity**: No more character name vs class name confusion
3. **Simplicity**: Clearer image association (always by character name)
4. **Maintainability**: Less special-case logic

## Implementation Strategy

### Phase 1: Ensure Defaults in Database ✅
- Default heroes/monsters already loadable via `/battle arena/load-data` page
- "Load Default Heroes" and "Load Default Monsters" buttons available
- User can manually load defaults if needed

### Phase 2: Update Core Loading Logic
**Files to modify:**
1. `typescript/app/battle arena/utils/dataLoader.ts`
   - Remove FALLBACK_* fallback logic
   - Always load from database → localStorage → empty array
   
2. `typescript/app/battle arena/hooks/useBattleData.ts`
   - Remove FALLBACK_* emergency fallback
   - Rely on database + localStorage only

### Phase 3: Update Type Detection Logic
**Files to modify:**
1. `typescript/app/battle arena/components/utils/characterMetadata.ts`
   - Remove FALLBACK_MONSTERS checks
   - Use `_type` marker and `isCreatedMonster` flag only
   
2. `typescript/app/battle arena/components/utils/characterTypeUtils.ts`
   - Remove FALLBACK_* checks
   - Use `_type` marker and character metadata

### Phase 4: Update Image Lookup
**Files to modify:**
1. `typescript/app/battle arena/unified-character-creator/page.tsx`
   - Always match images by character name (not class)
   - Remove class name fallback logic

### Phase 5: Update Helper Functions
**Files to modify:**
1. `typescript/app/battle arena/constants.ts`
   - Keep FALLBACK_* for JSON loading (build time)
   - Mark as deprecated, only for initial database seeding
   - Update `isMonster()` to not rely on FALLBACK_MONSTERS
   
2. `typescript/app/battle arena/utils/names.ts`
   - Remove FALLBACK_CLASSES checks
   - Simplify character name logic

### Phase 6: Update Components
**Files to modify:**
1. `typescript/app/battle arena/components/MonsterCreator.tsx`
   - Remove FALLBACK_* filtering logic
   - All characters from database are "custom" if not in database

2. `typescript/app/battle arena/components/CharacterCardZoom.tsx`
   - Remove FALLBACK_* checks for determining default vs custom

3. Test pages (can keep FALLBACK_* for testing purposes)

### Phase 7: Update Tests
**Files to modify:**
1. `typescript/app/battle arena/utils/__tests__/names.test.ts`
   - Update tests to not rely on FALLBACK_* being available

## Migration Path
1. **No breaking changes**: Existing data continues to work
2. **Graceful degradation**: If database empty, show "Load Defaults" buttons
3. **User action required**: Users must click "Load Default Heroes/Monsters" once
4. **Offline support**: localStorage cache maintains offline functionality

## Rollback Plan
If issues arise, we can:
1. Revert commits
2. Re-enable FALLBACK_* emergency fallback
3. Keep database-first approach but add safety net

## Testing Checklist
- [ ] Load default heroes/monsters into database
- [ ] Verify character selection works
- [ ] Verify image lookup works for all character types
- [ ] Verify type detection (hero vs monster) works
- [ ] Test offline mode (localStorage cache)
- [ ] Test character creation and editing
- [ ] Verify no console errors
- [ ] Test battle functionality

## Files Affected (75 references)
See search results for complete list of files using FALLBACK_*