# Architecture Refactor Plan: Unified Character Model

## Overview
This document outlines the plan to eliminate the default/custom hero distinction while maintaining offline functionality through localStorage fallback.

## Current Issues

### 1. Complex Default/Custom Distinction
- **FALLBACK_CLASSES** constant loaded from JSON at build time
- **isDefault** flag in database to mark default heroes
- Complex filtering logic to prevent duplicates (e.g., "Sylvan the Hunter" custom vs "Ranger" fallback)
- Different code paths for default vs custom heroes
- Confusing for developers and users

### 2. Offline Functionality Requirement
- App needs to work at conferences with poor WiFi
- Currently uses FALLBACK_CLASSES as hardcoded fallback
- Need to maintain this capability without the complexity

## Proposed Solution

### Architecture: Unified Character Model with localStorage Fallback

```
┌─────────────────────────────────────────────────────────────┐
│ New Architecture: Unified + Offline-First                   │
├─────────────────────────────────────────────────────────────┤
│ 1. All characters stored in database                        │
│ 2. localStorage cache for offline access                    │
│ 3. FALLBACK_CLASSES as emergency fallback only             │
│ 4. No isDefault flag needed                                 │
│ 5. Single loading path for all characters                   │
│ 6. No duplicate filtering needed                            │
└─────────────────────────────────────────────────────────────┘
```

### Loading Strategy

```typescript
// Priority order for loading characters:
1. Try database (network call)
2. If network fails → use localStorage cache
3. If no cache → use FALLBACK_CLASSES (emergency only)
4. Save successful database loads to localStorage
```

### Benefits
✅ Simpler codebase - single character type
✅ Offline functionality maintained via localStorage
✅ FALLBACK_CLASSES only used as last resort
✅ No duplicate filtering logic needed
✅ Consistent behavior for all characters
✅ Easier to maintain and extend

## Implementation Steps

### Phase 1: Simplify Character Loading (useBattleData.ts)

**Current Complex Logic:**
- Load from database
- Filter out fallback classes with matching custom heroes
- Complex name matching logic

**New Simple Logic:**
```typescript
async function loadCharacters() {
  try {
    // Try database first
    const heroes = await loadHeroesFromDatabase();
    
    // Cache in localStorage for offline use
    localStorage.setItem('dnd_heroes_cache', JSON.stringify(heroes));
    
    return heroes;
  } catch (error) {
    // Network failed - try localStorage cache
    const cached = localStorage.getItem('dnd_heroes_cache');
    if (cached) {
      return JSON.parse(cached);
    }
    
    // No cache - use FALLBACK_CLASSES as emergency fallback
    return FALLBACK_CLASSES;
  }
}
```

### Phase 2: Remove Duplicate Filtering Logic

**Files to Update:**
- `typescript/app/dnd/hooks/useBattleData.ts` - Remove `filterFallbackClassesWithCustomHeroes`
- `typescript/app/dnd/hooks/useBattleData.ts` - Remove `isCustomHeroNameInClassList`
- `typescript/app/dnd/utils/names.ts` - Simplify `getCharacterName` (remove isCustomHero check)
- `typescript/app/dnd/components/utils/characterTypeUtils.ts` - Simplify type detection

### Phase 3: Remove isDefault Flag

**Files to Update:**
- `typescript/app/dnd/types.ts` - Remove `isDefault?: boolean` from DnDClass
- `typescript/app/api/heroes/load-defaults/route.ts` - Remove isDefault flag addition
- `typescript/app/api/heroes/export-defaults/route.ts` - Remove isDefault filtering

### Phase 4: Update Character Name Generation

**Current Logic:**
```typescript
// Different handling for custom heroes vs defaults
const isCustomHero = !isCreatedMonster && !isMonster(dndClass.name) && 
  !FALLBACK_CLASSES.some((fc: DnDClass) => fc.name === dndClass.name);

if (isCreatedMonster || isCustomHero) {
  return playerName || dndClass.name;
}
```

**New Logic:**
```typescript
// All characters handled the same way
if (playerName) {
  return playerName;
}
return dndClass.name;
```

## Migration Strategy

### Step 1: Update useBattleData.ts
- Implement new loading strategy with localStorage fallback
- Remove duplicate filtering functions
- Test offline functionality

### Step 2: Update Character Type Detection
- Simplify `characterTypeUtils.ts`
- Remove isCustomHero checks from `names.ts`
- Update `characterMetadata.ts`

### Step 3: Database Schema (Optional)
- Remove isDefault flag from database (or keep for backwards compatibility)
- Update API routes to not use isDefault

### Step 4: Testing
- Test online mode (database loading)
- Test offline mode (localStorage cache)
- Test emergency fallback (FALLBACK_CLASSES)
- Verify no duplicate characters appear

## Rollback Plan

If issues arise:
1. Keep FALLBACK_CLASSES constant (already exists)
2. localStorage cache is additive (doesn't break anything)
3. Can revert code changes while keeping data intact

## Timeline

- **Phase 1**: 30 minutes - Update useBattleData.ts
- **Phase 2**: 20 minutes - Remove duplicate filtering
- **Phase 3**: 15 minutes - Remove isDefault flag
- **Phase 4**: 15 minutes - Update name generation
- **Testing**: 30 minutes - Comprehensive testing

**Total**: ~2 hours

## Success Criteria

✅ App works online (loads from database)
✅ App works offline (uses localStorage cache)
✅ No duplicate characters in selection
✅ All existing characters still work
✅ Simpler, more maintainable code
✅ Conference-ready (offline functionality)