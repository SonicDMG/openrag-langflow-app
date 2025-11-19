# Test Plan for Race and Sex Features

## Overview
This document outlines the tests needed to support the new race and sex functionality added to the character system.

## Test Categories

### 1. Extraction Functions (Unit Tests)
**File:** `typescript/app/dnd/services/__tests__/characterGeneration.test.ts`

#### `extractRaceFromDescription()`
- ✅ Extract "Human" from description
- ✅ Extract "Elf" from description  
- ✅ Extract "Dwarf" from description
- ✅ Extract "Dark Elf (Drow)" with parentheses
- ✅ Extract race in middle of sentence
- ✅ Extract race at start of sentence
- ✅ Case-insensitive matching
- ✅ Return undefined when no race found
- ✅ Don't match partial words (e.g., "Elf" shouldn't match "Elfwood")

#### `extractSexFromDescription()`
- ✅ Extract "male" from various patterns (male, man, men, boy, he, him, his)
- ✅ Extract "female" from various patterns (female, woman, women, girl, she, her, hers)
- ✅ Extract "other" from various patterns (non-binary, nonbinary, enby, they, them, their)
- ✅ Case-insensitive matching
- ✅ Return undefined when no sex found
- ✅ Don't match partial words

#### `extractNameFromDescription()`
- ✅ Extract name from "Name the Class" pattern
- ✅ Extract name from "Name, a Class" pattern
- ✅ Extract name from "Name: description" pattern
- ✅ Extract name from "The character Name..." pattern
- ✅ Don't extract common words (human, elf, dwarf, etc.)
- ✅ Handle multi-word names
- ✅ Return undefined when no name found

### 2. Character Generation Service (Integration Tests)
**File:** `typescript/app/dnd/services/__tests__/characterGeneration.test.ts`

#### `generateCharacterStats()` - Race and Sex Handling
- ✅ Extract race from description when mentioned
- ✅ Extract sex from description when mentioned
- ✅ Extract name from description when mentioned
- ✅ Randomly assign race for heroes when not found
- ✅ Randomly assign sex when not found (heroes and monsters)
- ✅ Filter out "n/a" values from AI response
- ✅ Use extracted values over AI "n/a" values
- ✅ Return race and sex in GenerationResult
- ✅ Include race and sex in stats object
- ✅ Don't assign race to monsters (only heroes)
- ✅ Always assign sex (heroes and monsters)

#### Mock Requirements
- Mock `/api/chat` endpoint
- Mock SSE response parsing
- Mock JSON extraction

### 3. PDF Export (Unit Tests)
**File:** `typescript/app/dnd/utils/__tests__/pdfExport.test.ts`

#### Race and Sex in PDFs
- ✅ Display race when provided
- ✅ Display sex when provided
- ✅ Display "n/a" for race when not provided
- ✅ Display "n/a" for sex when not provided
- ✅ Always show CHARACTER DETAILS section
- ✅ Handle both single and multiple character exports
- ✅ Filter out "n/a" values before displaying

### 4. Database Conversions (Unit Tests)
**File:** `typescript/lib/db/__tests__/astra.test.ts` (new file)

#### Conversion Functions
- ✅ `classToHeroRecord()` includes race and sex
- ✅ `classToMonsterRecord()` includes race and sex
- ✅ `heroRecordToClass()` includes race and sex
- ✅ `monsterRecordToClass()` includes race and sex
- ✅ Handle undefined race/sex gracefully
- ✅ Handle "n/a" values in conversions

### 5. Prompt Building (Unit Tests)
**File:** `typescript/app/dnd/utils/__tests__/promptBuilding.test.ts` (new file)

#### `enhanceDescriptionWithRaceAndSex()`
- ✅ Add race to description when provided
- ✅ Add sex to description when provided
- ✅ Add both race and sex when both provided
- ✅ Don't add "n/a" values
- ✅ Don't modify description when race/sex are undefined
- ✅ Preserve original description format

#### Prompt Building Functions
- ✅ `buildBasePrompt()` includes race and sex
- ✅ `buildPixelArtPrompt()` includes race and sex
- ✅ Race and sex appear in generated prompts
- ✅ Transparent background prompts include race/sex
- ✅ Background prompts include race/sex

### 6. Component Tests (Integration Tests)
**File:** `typescript/app/dnd/components/__tests__/CharacterCardZoom.test.tsx` (new file)

#### CharacterCardZoom Component
- ✅ Display race when provided
- ✅ Display sex when provided
- ✅ Display "n/a" for race when not provided
- ✅ Display "n/a" for sex when not provided
- ✅ Always show CHARACTER DETAILS section
- ✅ Proper styling and layout

### 7. Form Integration Tests
**File:** `typescript/app/dnd/create-character/__tests__/page.test.tsx` (new file)

#### Character Creator Form
- ✅ Race field updates when generated
- ✅ Sex field updates when generated
- ✅ Race field shows "n/a" when not found
- ✅ Sex field shows "n/a" when not found
- ✅ Fields are saved with character
- ✅ Fields are loaded when editing

## Test Implementation Priority

### High Priority (Core Functionality)
1. ✅ Extraction functions (extractRaceFromDescription, extractSexFromDescription, extractNameFromDescription)
2. ✅ PDF export with race/sex
3. ✅ Database conversions with race/sex
4. ✅ Character generation random assignment

### Medium Priority (Integration)
5. ✅ Prompt building with race/sex
6. ✅ CharacterCardZoom display
7. ✅ Form field updates

### Low Priority (Edge Cases)
8. ✅ Error handling
9. ✅ Edge cases (empty strings, special characters)
10. ✅ Performance with large datasets

## Test Data Examples

### Race Extraction Test Cases
```typescript
"A brave Human warrior" → "Human"
"An Elf from the forest" → "Elf"
"A Dwarf blacksmith" → "Dwarf"
"Dark Elf (Drow) mage" → "Dark Elf (Drow)"
"No race mentioned here" → undefined
```

### Sex Extraction Test Cases
```typescript
"A male warrior" → "male"
"The female wizard" → "female"
"A non-binary character" → "other"
"He is a fighter" → "male"
"She wields magic" → "female"
"No gender mentioned" → undefined
```

### Name Extraction Test Cases
```typescript
"Gandalf the Wizard" → "Gandalf"
"Aragorn, a Ranger" → "Aragorn"
"Legolas: skilled archer" → "Legolas"
"The character Frodo..." → "Frodo"
"Human warrior" → undefined (common word)
```

## Mock Data

### Mock Character with Race/Sex
```typescript
const mockCharacterWithRaceSex: DnDClass = {
  name: 'Test Fighter',
  race: 'Human',
  sex: 'male',
  // ... other fields
};
```

### Mock Character without Race/Sex
```typescript
const mockCharacterWithoutRaceSex: DnDClass = {
  name: 'Test Fighter',
  // race and sex undefined
  // ... other fields
};
```

## Notes
- All tests should use Jest
- Mock external dependencies (API calls, file system)
- Test both success and failure cases
- Ensure tests are deterministic (mock random functions)
- Test edge cases (empty strings, null, undefined, "n/a")

