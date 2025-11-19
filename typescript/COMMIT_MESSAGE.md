feat: Add race and sex fields to character system with auto-extraction and random assignment

This commit adds comprehensive race and sex support throughout the character
creation and management system, including extraction from descriptions, random
assignment when not specified, and display in all relevant UI components.

## Key Changes

### Data Model
- Added `race` and `sex` optional fields to `DnDClass` interface
- Updated `HeroRecord` and `MonsterRecord` database types to include race/sex
- Updated all database conversion functions to handle race/sex fields

### Character Generation
- Added `extractRaceFromDescription()` to extract race from character descriptions
- Added `extractSexFromDescription()` to extract sex/gender from descriptions
- Added `extractNameFromDescription()` to extract character names from descriptions
- Updated `generateCharacterStats()` to:
  - Extract race/sex from descriptions when mentioned
  - Randomly assign race for heroes when not found (from DND_PLAYER_RACES)
  - Randomly assign sex for all characters when not found
  - Filter out "n/a" values from AI responses
  - Always return valid race/sex values (never "n/a")

### UI Components
- Added race and sex input fields to character creator form (after description)
- Auto-fill race/sex fields when using "Generate Name & Stats" button
- Updated CharacterCardZoom to display race and sex (shows "n/a" if not set)
- Updated PDF exports to include CHARACTER DETAILS section with race/sex
- Updated image creator (MonsterCreator) to use race/sex from selected class

### Image Generation
- Removed "--ar 16:9 --style raw" from all image generation prompts (not applicable to EverArt)
- Updated all prompt building functions to include race/sex in image generation
- Updated `enhanceDescriptionWithRaceAndSex()` to properly format race/sex in prompts

### Testing
- Added 42 comprehensive tests for extraction functions (race, sex, name)
- Added tests for PDF export with race/sex
- Added database conversion tests for race/sex
- Added 6 integration tests for character generation with race/sex
- All 284 tests passing

### Bug Fixes
- Fixed early return bug that prevented race/sex assignment when abilities API failed
- Fixed race extraction to handle multi-word races (e.g., "Dark Elf (Drow)")
- Fixed name extraction to handle multi-word names (e.g., "Gandalf the Grey")
- Suppressed expected console warnings in test environment

## Testing
- All 284 tests passing
- 12 test suites passing
- No console warnings in test output

