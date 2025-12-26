# Image URL Utilities - Centralized Image Management

## Overview

This module provides centralized utilities for managing character and monster image URLs throughout the application. All image URL generation should use these utilities instead of hardcoding paths.

## Why Centralized?

- **Single Source of Truth**: Change the URL pattern in one place
- **Type Safety**: Consistent handling of null/undefined values
- **Maintainability**: Easy to update if CDN structure changes
- **Consistency**: All components use the same logic
- **Testing**: Easier to mock and test

## Exports

### `PLACEHOLDER_IMAGE_URL`

A constant for the placeholder image used when no character image is available.

```typescript
export const PLACEHOLDER_IMAGE_URL = '/cdn/placeholder.png';
```

**Usage:**
```typescript
import { PLACEHOLDER_IMAGE_URL } from './utils/imageUtils';

<img src={PLACEHOLDER_IMAGE_URL} alt="No image available" />
```

### `getCharacterImageUrl(monsterId)`

Generates the image URL for a character (hero or monster) given their monsterId.

**Parameters:**
- `monsterId: string | null | undefined` - The unique identifier for the character's image

**Returns:**
- `string | undefined` - The full image URL, or `undefined` if no monsterId provided

**Usage:**
```typescript
import { getCharacterImageUrl } from './utils/imageUtils';

const imageUrl = getCharacterImageUrl(character.monsterId);
// Returns: '/cdn/monsters/abc123/280x200.png' or undefined

<CharacterCard monsterImageUrl={imageUrl} />
```

### `getCharacterImageUrlOrPlaceholder(monsterId)`

Convenience function that always returns a valid image URL, using the placeholder as fallback.

**Parameters:**
- `monsterId: string | null | undefined` - The unique identifier for the character's image

**Returns:**
- `string` - The character image URL or placeholder (never undefined)

**Usage:**
```typescript
import { getCharacterImageUrlOrPlaceholder } from './utils/imageUtils';

const imageUrl = getCharacterImageUrlOrPlaceholder(character.monsterId);
// Always returns a valid URL

<img src={imageUrl} alt={character.name} />
```

## Migration Guide

### Before (Hardcoded)
```typescript
// ❌ Don't do this
const imageUrl = `/cdn/monsters/${monsterId}/280x200.png`;
const fallback = '/cdn/placeholder.png';
```

### After (Centralized)
```typescript
// ✅ Do this instead
import { getCharacterImageUrl, PLACEHOLDER_IMAGE_URL } from './utils/imageUtils';

const imageUrl = getCharacterImageUrl(monsterId);
// or with automatic fallback:
const imageUrl = getCharacterImageUrlOrPlaceholder(monsterId);
```

## File Structure

```
typescript/app/battle arena/
├── components/
│   └── utils/
│       ├── imageUtils.ts          # Main utilities (THIS FILE)
│       └── IMAGE_UTILS_README.md  # This documentation
└── test/
    └── utils/
        └── testActions.ts         # Re-exports for test compatibility
```

## Image URL Pattern

All character images follow this pattern:
```
/cdn/monsters/{monsterId}/280x200.png
```

Where:
- `{monsterId}` is a unique identifier (UUID or similar)
- `280x200.png` is the standard card display size (wider format)

Other available sizes (stored on server, not exposed via these utilities):
- `128.png` - Thumbnail
- `200.png` - Square format
- `256.png` - Medium square
- `512.png` - Large square

## Components Using These Utilities

- `BattleArena.tsx` - Battle display
- `CharacterCard.tsx` - Card rendering (via CardImage)
- `SelectableClassCard.tsx` - Class selection carousel
- `OpponentHeader.tsx` - Opponent display
- `character-image-creator/page.tsx` - Image creation workflow
- `monster-test/page.tsx` - Monster testing page
- `test/utils/testActions.ts` - Test utilities

## Notes

- The term "monster" in the path is historical; it applies to both heroes and monsters
- All character images are stored in the same CDN structure regardless of type
- The `imageUrl` field in database records may contain old formats (256.png, 200.png) which are normalized by `useBattleData.ts` for backward compatibility

## Related Files

- `typescript/app/battle arena/server/storage.ts` - Server-side image storage
- `typescript/app/battle arena/hooks/useBattleData.ts` - Data loading with URL normalization
- `typescript/app/battle arena/components/card-parts/CardImage.tsx` - Image rendering component

---

**Last Updated:** 2024-12-24  
**Maintained by:** Bob (AI Assistant)