# Battle Arena - Final Directory Structure

## Overview
This document describes the final, clean directory structure for the battle-arena application after completing the reorganization to follow Next.js best practices and eliminate confusion.

## Key Improvements Made

### 1. Eliminated Server/Services Confusion
**Before:** Both `server/` and `services/` directories existed
**After:** Single `services/` directory with clear subdirectories:
- `services/client/` - Browser-only code (API calls)
- `services/server/` - Node.js-only code (image processing, storage)
- `services/shared/` - Universal business logic

### 2. Eliminated Shared Components Directory
**Before:** `components/shared/` with files at root level
**After:** Components in their own subdirectories following Next.js conventions:
- `components/character-cards/CharacterCard/` - Base character card component
  - `CharacterCard/BattleCharacterCard/` - Battle wrapper (shows relationship)
- `components/character-cards/SupportHeroesContainer/` - Support heroes container

### 3. Organized Cards by Purpose
**Before:** Single `cards/` directory mixing action and display cards
**After:** Clear semantic separation:
- `components/action-cards/` - Navigation/action cards (AddHeroCard, LoadDefaultMonstersCard, etc.)
- `components/character-cards/` - Character display cards (CharacterCard, BattleCharacterCard, SupportHeroesContainer)

### 4. Consolidated Utils Directories
**Before:** Multiple utils directories (`utils/`, `components/utils/`, `components/shared/utils/`)
**After:** Single `utils/` directory at battle-arena root with focused modules

## Final Directory Structure

```
battle-arena/
├── components/
│   ├── BattleArena.tsx                    # Main battle component
│   ├── action-cards/                      # Navigation/action cards
│   │   ├── AddHeroCard/
│   │   ├── AddMonsterCard/
│   │   ├── ExportDefaultHeroesCard/
│   │   ├── ExportDefaultMonstersCard/
│   │   ├── LoadDefaultMonstersCard/
│   │   └── SelectableClassCard/
│   ├── character-cards/                   # Character display cards
│   │   ├── CharacterCard/
│   │   │   ├── CharacterCard.tsx          # Base card component
│   │   │   ├── index.ts                   # Barrel export
│   │   │   ├── BattleCharacterCard/       # Battle-specific wrapper
│   │   │   │   ├── BattleCharacterCard.tsx
│   │   │   │   └── index.ts
│   │   │   └── card-parts/                # Card sub-components
│   │   │       ├── AbilitiesSection.tsx
│   │   │       ├── AttackButtons.tsx
│   │   │       ├── CardFooter.tsx
│   │   │       ├── CardHeader.tsx
│   │   │       ├── CardImage.tsx
│   │   │       ├── Divider.tsx
│   │   │       └── StatsSection.tsx
│   │   └── SupportHeroesContainer/        # Support heroes display
│   │       ├── SupportHeroesContainer.tsx
│   │       └── index.ts
│   ├── effects/                           # Visual effects
│   │   ├── Confetti/
│   │   ├── FloatingNumber/
│   │   ├── ProjectileEffect/
│   │   └── Sparkles/
│   ├── ui/                                # UI components
│   │   ├── LandscapePrompt/
│   │   ├── PageHeader/
│   │   ├── ScrollButton/
│   │   └── SearchableSelect/
│   └── utils/                             # Component-specific utilities
│       ├── characterMetadata.ts
│       ├── characterTypeUtils.ts
│       ├── imageUtils.ts
│       └── tooltipUtils.ts
├── hooks/
│   ├── battle/                            # Battle logic hooks
│   │   ├── useAIOpponent.ts
│   │   ├── useBattleActions.ts
│   │   ├── useBattleData.ts
│   │   ├── useBattleEffects.ts
│   │   ├── useBattleNarrative.ts
│   │   ├── useBattleState.ts
│   │   ├── useProjectileEffects.ts
│   │   └── index.ts
│   └── ui/                                # UI hooks
│       ├── useCardAnimations.ts
│       ├── useCardSizing.ts
│       ├── useImageState.ts
│       ├── useMonsterAssociation.ts
│       ├── useZoomModal.ts
│       └── index.ts
├── services/
│   ├── client/                            # Browser-only services
│   │   └── apiService.ts                  # API calls, fetch operations
│   ├── server/                            # Node.js-only services
│   │   ├── image/                         # Image processing
│   │   │   ├── battleEndingImage.ts
│   │   │   └── imageGeneration.ts
│   │   └── storage/                       # File operations
│   │       └── fileStorage.ts
│   └── shared/                            # Universal services
│       └── characterGeneration.ts         # Business logic
├── utils/                                 # Global utilities
│   ├── battle.ts                          # Battle calculations
│   ├── dataLoader.ts                      # Data loading
│   ├── dice.ts                            # Dice rolling
│   ├── imagePosition.ts                   # Image positioning
│   ├── names.ts                           # Name generation
│   ├── playerEffects.ts                   # Player effects
│   └── playerState.ts                     # Player state
├── lib/
│   ├── constants.ts                       # Constants
│   └── types.ts                           # TypeScript types
└── styles/
    ├── animations/                        # CSS animations
    └── effects/                           # CSS effects
```

## Import Patterns

### Component Imports
```typescript
// Character display cards
import { CharacterCard } from './character-cards/CharacterCard';
import { BattleCharacterCard } from './character-cards/CharacterCard/BattleCharacterCard';
import { SupportHeroesContainer } from './character-cards/SupportHeroesContainer';

// Action cards
import { AddHeroCard } from './action-cards/AddHeroCard';
import { SelectableClassCard } from './action-cards/SelectableClassCard';
```

### Service Imports
```typescript
// Client-side API calls
import { fetchCharacterAbilities } from '../services/client/apiService';

// Server-side image processing
import { generateBattleEndingImage } from '../services/server/image/battleEndingImage';

// Shared business logic
import { generateCharacterStats } from '../services/shared/characterGeneration';
```

### Utility Imports
```typescript
// Global utilities
import { rollDice } from '../utils/dice';
import { resolveImagePosition } from '../utils/imagePosition';
import { extractPlayerEffects } from '../utils/playerEffects';

// Component-specific utilities
import { getCharacterImageUrls } from '../components/utils/imageUtils';
```

## Design Principles

### 1. Component Hierarchy
- Components are in their own subdirectories with barrel exports
- Wrapper components are subdirectories of the components they wrap
- This shows relationships clearly (e.g., `BattleCharacterCard` wraps `CharacterCard`)

### 2. Service Layer Separation
- **Client services**: Browser-only code (fetch, localStorage, DOM)
- **Server services**: Node.js-only code (fs, sharp, server APIs)
- **Shared services**: Universal business logic (calculations, validation)

### 3. Single Responsibility
- Each utility file has a focused purpose
- No monolithic utility files
- Clear naming indicates purpose

### 4. Next.js Conventions
- Barrel exports (index.ts) for clean imports
- Components in subdirectories
- No unnecessary "shared" or "common" directories
- Structure reflects relationships

## Migration Notes

### Breaking Changes
None - all imports were updated during migration

### Deprecated Patterns
- ❌ `components/shared/` directory (eliminated)
- ❌ `server/` directory (merged into `services/`)
- ❌ Multiple utils directories (consolidated)
- ❌ Wrapper functions like `getCharacterImageUrlWithFallback` (removed)

### Best Practices
- ✅ Use barrel exports for cleaner imports
- ✅ Keep components in subdirectories
- ✅ Separate client/server/shared code clearly
- ✅ Use focused utility modules
- ✅ Show component relationships through directory structure

## Testing
All tests pass after reorganization:
- 422 tests passing
- Build succeeds
- No runtime errors

## Future Considerations
- Consider moving `lib/types.ts` to a more specific location if it grows
- May want to split `services/client/apiService.ts` if it becomes too large
- Keep monitoring for new "shared" or "common" directories creeping in