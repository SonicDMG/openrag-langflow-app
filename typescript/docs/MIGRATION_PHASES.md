# Component Structure Migration - Phase Breakdown

## Overview

This document provides a detailed breakdown of each migration phase to restructure the battle-arena components following Next.js best practices and the Langflow pattern.

**Total Duration**: 5 weeks (can be adjusted based on team capacity)
**Approach**: Incremental migration to minimize risk and maintain functionality

---

## Phase 1: Effects & UI Components (Week 1)

### Objective
Migrate isolated components with minimal dependencies to establish the new pattern.

### Components to Migrate

#### 1.1 Effects Components
- [ ] `Confetti.tsx` → `components/effects/Confetti/`
- [ ] `Sparkles.tsx` → `components/effects/Sparkles/`
- [ ] `ProjectileEffect.tsx` → `components/effects/ProjectileEffect/`
- [ ] `FloatingNumber.tsx` → `components/effects/FloatingNumber/`

#### 1.2 UI Components
- [ ] `SearchableSelect.tsx` → `components/ui/SearchableSelect/`
- [ ] `ScrollButton.tsx` → `components/ui/ScrollButton/`
- [ ] `LandscapePrompt.tsx` → `components/ui/LandscapePrompt/`
- [ ] `PageHeader.tsx` → `components/ui/PageHeader/`

### New Structure Example
```
components/
├── effects/
│   ├── Confetti/
│   │   ├── Confetti.tsx
│   │   ├── Confetti.module.css
│   │   └── index.ts
│   ├── Sparkles/
│   │   ├── Sparkles.tsx
│   │   ├── Sparkles.module.css
│   │   └── index.ts
│   ├── ProjectileEffect/
│   │   ├── ProjectileEffect.tsx
│   │   ├── ProjectileEffect.module.css
│   │   └── index.ts
│   └── FloatingNumber/
│       ├── FloatingNumber.tsx
│       ├── FloatingNumber.module.css
│       └── index.ts
└── ui/
    ├── SearchableSelect/
    │   ├── SearchableSelect.tsx
    │   ├── SearchableSelect.module.css
    │   └── index.ts
    ├── ScrollButton/
    ├── LandscapePrompt/
    └── PageHeader/
```

### Tasks
1. [ ] Create new directory structure
2. [ ] Move component files
3. [ ] Extract relevant styles from global CSS to CSS Modules
4. [ ] Create `index.ts` barrel exports
5. [ ] Update import paths in consuming components
6. [ ] Test each component individually
7. [ ] Remove old files after verification

### CSS Migration Example
```css
/* Before: app/styles/effects/projectiles.css */
.projectile {
  position: absolute;
  pointer-events: none;
}

/* After: components/effects/ProjectileEffect/ProjectileEffect.module.css */
.projectile {
  position: absolute;
  pointer-events: none;
}
```

### Success Criteria
- ✅ All 8 components migrated to new structure
- ✅ All tests passing
- ✅ No visual regressions
- ✅ Import paths updated

---

## Phase 2: Card Components (Week 2)

### Objective
Migrate card-related components and establish the pattern for complex components with sub-parts.

### Components to Migrate

#### 2.1 Main Character Card
- [ ] `CharacterCard.tsx` → `components/cards/CharacterCard/`
- [ ] `CharacterCardZoom.tsx` → `components/cards/CharacterCard/Zoom/`
- [ ] `cardTheme.ts` → `components/cards/CharacterCard/theme.ts`

#### 2.2 Card Parts (Sub-components)
- [ ] `card-parts/CardHeader.tsx` → `components/cards/CharacterCard/parts/CardHeader/`
- [ ] `card-parts/CardFooter.tsx` → `components/cards/CharacterCard/parts/CardFooter/`
- [ ] `card-parts/CardImage.tsx` → `components/cards/CharacterCard/parts/CardImage/`
- [ ] `card-parts/AbilitiesSection.tsx` → `components/cards/CharacterCard/parts/AbilitiesSection/`
- [ ] `card-parts/StatsSection.tsx` → `components/cards/CharacterCard/parts/StatsSection/`
- [ ] `card-parts/AttackButtons.tsx` → `components/cards/CharacterCard/parts/AttackButtons/`
- [ ] `card-parts/Divider.tsx` → `components/cards/CharacterCard/parts/Divider/`

#### 2.3 Specialized Cards
- [ ] `SelectableClassCard.tsx` → `components/cards/SelectableClassCard/`
- [ ] `AddMonsterCard.tsx` → `components/cards/AddMonsterCard/`
- [ ] `AddHeroCard.tsx` → `components/cards/AddHeroCard/`
- [ ] `ExportDefaultHeroesCard.tsx` → `components/cards/ExportDefaultHeroesCard/`
- [ ] `ExportDefaultMonstersCard.tsx` → `components/cards/ExportDefaultMonstersCard/`
- [ ] `LoadDefaultHeroesCard.tsx` → `components/cards/LoadDefaultHeroesCard/`
- [ ] `LoadDefaultMonstersCard.tsx` → `components/cards/LoadDefaultMonstersCard/`

### New Structure
```
components/cards/
├── CharacterCard/
│   ├── CharacterCard.tsx
│   ├── CharacterCard.module.css
│   ├── index.ts
│   ├── theme.ts
│   ├── types.ts
│   ├── Zoom/
│   │   ├── CharacterCardZoom.tsx
│   │   ├── CharacterCardZoom.module.css
│   │   └── index.ts
│   └── parts/
│       ├── CardHeader/
│       │   ├── CardHeader.tsx
│       │   ├── CardHeader.module.css
│       │   └── index.ts
│       ├── CardFooter/
│       ├── CardImage/
│       ├── AbilitiesSection/
│       ├── StatsSection/
│       ├── AttackButtons/
│       └── Divider/
├── SelectableClassCard/
│   ├── SelectableClassCard.tsx
│   ├── SelectableClassCard.module.css
│   └── index.ts
├── AddMonsterCard/
├── AddHeroCard/
├── ExportDefaultHeroesCard/
├── ExportDefaultMonstersCard/
├── LoadDefaultHeroesCard/
└── LoadDefaultMonstersCard/
```

### Tasks
1. [ ] Create card directory structure
2. [ ] Migrate CharacterCard and its parts first (most complex)
3. [ ] Extract card-specific styles from:
   - `app/styles/animations/card-animations.css`
   - `app/styles/effects/card-effects.css`
4. [ ] Convert to CSS Modules
5. [ ] Create barrel exports for each component
6. [ ] Update all import paths
7. [ ] Migrate specialized cards
8. [ ] Test card rendering and interactions
9. [ ] Verify zoom functionality
10. [ ] Remove old files

### Import Path Changes
```tsx
// Before
import { CharacterCard } from '@/app/battle-arena/components/CharacterCard';
import { CardHeader } from '@/app/battle-arena/components/card-parts/CardHeader';
import { CARD_THEME } from '@/app/battle-arena/components/cardTheme';

// After
import { CharacterCard } from '@/app/battle-arena/components/cards/CharacterCard';
import { CardHeader } from '@/app/battle-arena/components/cards/CharacterCard/parts/CardHeader';
import { CARD_THEME } from '@/app/battle-arena/components/cards/CharacterCard/theme';
```

### Success Criteria
- ✅ All 15 card components migrated
- ✅ Card parts properly nested
- ✅ Styles scoped with CSS Modules
- ✅ All card interactions working
- ✅ Tests passing

---

## Phase 3: Battle Components (Week 3)

### Objective
Migrate battle-specific components that handle game logic and state.

### Components to Migrate

#### 3.1 Core Battle Components
- [ ] `BattleArena.tsx` → `components/battle/BattleArena/`
- [ ] `BattleLog.tsx` → `components/battle/BattleLog/`
- [ ] `BattleSummaryOverlay.tsx` → `components/battle/BattleSummaryOverlay/`

#### 3.2 Battle UI Components
- [ ] `OpponentSelector.tsx` → `components/battle/OpponentSelector/`
- [ ] `OpponentHeader.tsx` → `components/battle/OpponentHeader/`
- [ ] `OpponentTypeToggle.tsx` → `components/battle/OpponentTypeToggle/`

#### 3.3 Shared Battle Components
- [ ] `shared/BattleCharacterCard.tsx` → `components/battle/shared/BattleCharacterCard/`
- [ ] `shared/SupportHeroesContainer.tsx` → `components/battle/shared/SupportHeroesContainer/`
- [ ] Keep `shared/types.ts` and `shared/utils.ts` in shared/

### New Structure
```
components/battle/
├── BattleArena/
│   ├── BattleArena.tsx
│   ├── BattleArena.module.css
│   └── index.ts
├── BattleLog/
│   ├── BattleLog.tsx
│   ├── BattleLog.module.css
│   └── index.ts
├── BattleSummaryOverlay/
│   ├── BattleSummaryOverlay.tsx
│   ├── BattleSummaryOverlay.module.css
│   └── index.ts
├── OpponentSelector/
│   ├── OpponentSelector.tsx
│   ├── OpponentSelector.module.css
│   └── index.ts
├── OpponentHeader/
├── OpponentTypeToggle/
└── shared/
    ├── BattleCharacterCard/
    │   ├── BattleCharacterCard.tsx
    │   ├── BattleCharacterCard.module.css
    │   └── index.ts
    ├── SupportHeroesContainer/
    ├── types.ts
    ├── utils.ts
    └── index.ts
```

### Tasks
1. [ ] Create battle directory structure
2. [ ] Migrate BattleArena (most complex)
3. [ ] Extract battle-specific styles from:
   - `app/styles/animations/battle-animations.css`
   - `app/styles/animations/battle-drop.css`
   - `app/styles/effects/battle-summary.css`
4. [ ] Convert to CSS Modules
5. [ ] Migrate supporting battle components
6. [ ] Update shared battle components
7. [ ] Create barrel exports
8. [ ] Update import paths
9. [ ] Test battle flow end-to-end
10. [ ] Remove old files

### CSS Migration Strategy
```css
/* Keep truly shared animations in global CSS */
/* app/styles/animations/shared-animations.css */
@keyframes shake {
  /* Used by multiple components */
}

/* Move component-specific to CSS Modules */
/* components/battle/BattleArena/BattleArena.module.css */
.arena {
  /* BattleArena-specific styles */
}

.battleDrop {
  animation: battleDrop 0.5s ease-out;
}

@keyframes battleDrop {
  /* BattleArena-specific animation */
}
```

### Success Criteria
- ✅ All 9 battle components migrated
- ✅ Battle flow working correctly
- ✅ Animations and effects functional
- ✅ Shared utilities properly organized
- ✅ Tests passing

---

## Phase 4: Creation Components (Week 4)

### Objective
Migrate character creation and management components.

### Components to Migrate

#### 4.1 Creation Components
- [ ] `MonsterCreator.tsx` → `components/creation/MonsterCreator/`
- [ ] `ClassSelection.tsx` → `components/creation/ClassSelection/`
- [ ] `ImagePositionEditor.tsx` → `components/creation/ImagePositionEditor/`

#### 4.2 Data Management Components
- [ ] `DataInitializer.tsx` → `components/data/DataInitializer/`
- [ ] `StagingConfirmationModal.tsx` → `components/data/StagingConfirmationModal/`

### New Structure
```
components/
├── creation/
│   ├── MonsterCreator/
│   │   ├── MonsterCreator.tsx
│   │   ├── MonsterCreator.module.css
│   │   └── index.ts
│   ├── ClassSelection/
│   │   ├── ClassSelection.tsx
│   │   ├── ClassSelection.module.css
│   │   └── index.ts
│   └── ImagePositionEditor/
│       ├── ImagePositionEditor.tsx
│       ├── ImagePositionEditor.module.css
│       └── index.ts
└── data/
    ├── DataInitializer/
    │   ├── DataInitializer.tsx
    │   ├── DataInitializer.module.css
    │   └── index.ts
    └── StagingConfirmationModal/
        ├── StagingConfirmationModal.tsx
        ├── StagingConfirmationModal.module.css
        └── index.ts
```

### Tasks
1. [ ] Create creation and data directories
2. [ ] Migrate MonsterCreator (most complex)
3. [ ] Extract creation-specific styles
4. [ ] Convert to CSS Modules
5. [ ] Migrate ClassSelection
6. [ ] Migrate ImagePositionEditor
7. [ ] Migrate data management components
8. [ ] Create barrel exports
9. [ ] Update import paths
10. [ ] Test character creation flow
11. [ ] Test data initialization
12. [ ] Remove old files

### Success Criteria
- ✅ All 5 creation/data components migrated
- ✅ Character creation flow working
- ✅ Image editing functional
- ✅ Data initialization working
- ✅ Tests passing

---

## Phase 5: Cleanup & Optimization (Week 5)

### Objective
Remove old files, optimize imports, and finalize the migration.

### Tasks

#### 5.1 Remove Old Structure
- [ ] Delete old `components/` flat files
- [ ] Delete old `card-parts/` directory
- [ ] Delete old `shared/` directory (keep new one)
- [ ] Delete old `utils/` directory if empty

#### 5.2 Clean Up Global CSS
- [ ] Review `app/styles/animations/` directory
- [ ] Keep only truly global animations
- [ ] Remove component-specific styles (now in CSS Modules)
- [ ] Review `app/styles/effects/` directory
- [ ] Keep only shared effect styles
- [ ] Update `globals.css` imports

#### 5.3 Update Import Paths
- [ ] Search for old import patterns
- [ ] Update all remaining imports to new structure
- [ ] Use path aliases consistently (`@/app/battle-arena/components/`)

#### 5.4 Optimize Barrel Exports
- [ ] Create top-level barrel exports for common imports
- [ ] Example: `components/index.ts` for frequently used components

#### 5.5 Documentation
- [ ] Update component documentation
- [ ] Create component usage examples
- [ ] Document new structure in README
- [ ] Update developer onboarding guide

#### 5.6 Testing
- [ ] Run full test suite
- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Cross-browser testing

#### 5.7 Code Review
- [ ] Review all migrated components
- [ ] Ensure consistent patterns
- [ ] Check for unused imports
- [ ] Verify CSS Module naming conventions

### Final Structure
```
typescript/app/battle-arena/
├── components/
│   ├── battle/          # Battle-specific components
│   ├── cards/           # Card components
│   ├── creation/        # Character creation
│   ├── data/            # Data management
│   ├── effects/         # Visual effects
│   ├── ui/              # Generic UI components
│   └── index.ts         # Top-level barrel export
├── hooks/               # Custom hooks (unchanged)
├── services/            # Services (unchanged)
├── utils/               # Utilities (unchanged)
├── types.ts             # Shared types
└── constants.ts         # Constants
```

### Cleanup Checklist
- [ ] All old component files removed
- [ ] Global CSS cleaned up
- [ ] Import paths updated
- [ ] Barrel exports optimized
- [ ] Documentation updated
- [ ] Tests passing
- [ ] No console errors
- [ ] No visual regressions
- [ ] Performance metrics acceptable

### Success Criteria
- ✅ Old structure completely removed
- ✅ Global CSS optimized
- ✅ All imports using new paths
- ✅ Documentation complete
- ✅ Full test suite passing
- ✅ No regressions

---

## Migration Checklist Template

Use this template for each component migration:

```markdown
### Component: [ComponentName]

**Phase**: [1-5]
**Priority**: [High/Medium/Low]
**Complexity**: [Simple/Medium/Complex]

#### Pre-Migration
- [ ] Review component dependencies
- [ ] Identify all import locations
- [ ] Identify related styles
- [ ] Review tests

#### Migration
- [ ] Create new directory structure
- [ ] Move component file
- [ ] Extract and convert styles to CSS Module
- [ ] Create index.ts barrel export
- [ ] Update component imports
- [ ] Update style imports

#### Post-Migration
- [ ] Update all consuming components
- [ ] Run component tests
- [ ] Visual verification
- [ ] Remove old files
- [ ] Update documentation

#### Notes
[Any special considerations or issues encountered]
```

---

## Risk Mitigation

### Potential Issues & Solutions

1. **Import Path Breakage**
   - Risk: Missing imports after migration
   - Solution: Use IDE's "Find All References" before moving files
   - Solution: Keep old files until all imports updated

2. **Style Conflicts**
   - Risk: CSS Module naming conflicts
   - Solution: Use descriptive class names
   - Solution: Test each component in isolation

3. **Test Failures**
   - Risk: Tests break due to import changes
   - Solution: Update test imports incrementally
   - Solution: Run tests after each component migration

4. **Performance Regression**
   - Risk: CSS Modules increase bundle size
   - Solution: Monitor bundle size after each phase
   - Solution: Use code splitting if needed

### Rollback Plan

If issues arise during any phase:
1. Keep old files until phase is complete
2. Use git branches for each phase
3. Can revert to previous phase if needed
4. Document any blockers for future reference

---

## Progress Tracking

### Phase Completion Checklist

- [ ] **Phase 1**: Effects & UI Components
  - Start Date: ___________
  - End Date: ___________
  - Status: Not Started / In Progress / Complete
  
- [ ] **Phase 2**: Card Components
  - Start Date: ___________
  - End Date: ___________
  - Status: Not Started / In Progress / Complete
  
- [ ] **Phase 3**: Battle Components
  - Start Date: ___________
  - End Date: ___________
  - Status: Not Started / In Progress / Complete
  
- [ ] **Phase 4**: Creation Components
  - Start Date: ___________
  - End Date: ___________
  - Status: Not Started / In Progress / Complete
  
- [ ] **Phase 5**: Cleanup & Optimization
  - Start Date: ___________
  - End Date: ___________
  - Status: Not Started / In Progress / Complete

---

## Next Steps

1. **Review this migration plan** with the team
2. **Adjust timeline** based on team capacity
3. **Create git branch** for Phase 1
4. **Begin Phase 1 migration** with effects components
5. **Track progress** using the checklist above

---

*Migration plan created: 2025-12-30*
*Based on: Component Structure Analysis*
*Total Components to Migrate: ~40*
*Estimated Duration: 5 weeks*