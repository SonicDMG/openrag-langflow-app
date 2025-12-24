# DnD Hooks Organization

This directory contains all React hooks for the DnD battle system, organized by domain.

## Structure

```
hooks/
├── battle/          # Battle logic and state management hooks
├── ui/              # UI component-specific hooks
├── __tests__/       # Hook tests
└── README.md        # This file
```

## Battle Hooks (`battle/`)

Battle-related hooks handle game logic, state management, and battle mechanics:

- **`useAIOpponent.ts`** - AI opponent decision-making and auto-play logic
- **`useBattleActions.ts`** - Attack, ability use, and heal actions
- **`useBattleData.ts`** - Data loading for classes and monsters
- **`useBattleEffects.ts`** - Visual effect coordination and management
- **`useBattleNarrative.ts`** - Battle narration and logging
- **`useBattleState.ts`** - Core battle state (HP, turns, defeat)
- **`useProjectileEffects.ts`** - Projectile animation management

### Usage Example

```typescript
import { useBattleActions, useBattleState } from '../hooks/battle';
// or
import { useBattleActions } from '../hooks/battle/useBattleActions';
```

## UI Hooks (`ui/`)

UI-specific hooks handle component behavior and visual presentation:

- **`useCardAnimations.ts`** - Character card animation effects
- **`useCardSizing.ts`** - Responsive card sizing calculations
- **`useImageState.ts`** - Image loading and error handling
- **`useMonsterAssociation.ts`** - Monster-character association logic
- **`useZoomModal.ts`** - Card zoom modal functionality

### Usage Example

```typescript
import { useCardAnimations, useCardSizing } from '../hooks/ui';
// or
import { useCardAnimations } from '../hooks/ui/useCardAnimations';
```

## Design Principles

### Domain-Based Organization
Hooks are grouped by their primary concern:
- **Battle domain**: Game logic, state, and mechanics
- **UI domain**: Visual presentation and component behavior

### Benefits
1. **Clear separation of concerns** - Easy to find related functionality
2. **Better scalability** - New hooks have obvious placement
3. **Improved maintainability** - Related code stays together
4. **Follows Next.js conventions** - Single hooks directory per feature

### Migration Notes
This structure was created on 2024-12-24 by consolidating:
- `dnd/hooks/` (7 battle hooks) → `dnd/hooks/battle/`
- `dnd/components/hooks/` (5 UI hooks) → `dnd/hooks/ui/`
- `dnd/test/hooks/` remains separate for test-specific utilities

All imports have been updated throughout the codebase.