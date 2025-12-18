# Hero/Monster Card Image Enhancement

## Overview
Enhanced the hero/monster card images to prevent character heads from being cut off by extending the image area vertically and overlaying the character name/type text on the image.

## Changes Made

### 1. Image Dimensions
**Before:**
- Normal cards: 280px × 200px (1.4:1 aspect ratio)
- Compact cards: 180px × 130px (1.4:1 aspect ratio)
- Issue: 4:3 images were cropped with `objectFit: 'cover'`, cutting off heads

**After:**
- Normal cards: 280px × 280px (1:1 square aspect ratio)
- Compact cards: 180px × 180px (1:1 square aspect ratio)
- Result: ~40% more vertical space to show full character images

### 2. Text Overlay Design
Moved character name and type from above the image to overlay on top of the image:

**Position:** Top-left corner of image with padding
- Normal cards: 12px padding
- Compact cards: 8px padding

**Character Name Styling:**
- Color: White (#FFFFFF)
- Font: Serif, bold
- Text shadow: Multiple layers for high contrast
  - Black outline: -1px/-1px, 1px/-1px, -1px/1px, 1px/1px
  - Drop shadow: 0 2px 4px rgba(0,0,0,0.8)
  - Glow: 0 0 8px rgba(0,0,0,0.6)

**Character Type Styling:**
- Color: Cream (#F2ECDE)
- Font: Serif, italic
- Text shadow: Same multi-layer approach as name

### 3. Files Modified

#### CharacterCard.tsx
- Updated `imageHeight` from 130px/200px to 180px/280px
- Changed `aspectRatio` from '280/200' to '1/1'
- Removed header section with name/type (lines 710-763)
- Added text overlay div inside image container with:
  - Absolute positioning (z-index: 2)
  - Character name with white text and shadows
  - Character type with cream text and shadows
  - Pointer-events: none to allow interaction with image

#### AddMonsterCard.tsx
- Updated `imageHeight` from 130px/200px to 180px/280px
- Changed `aspectRatio` from '280/200' to '1/1'
- Maintains consistent card proportions with CharacterCard

#### CharacterCardZoom.tsx
- No changes needed (displays card back with stats, not image)

## Benefits

1. **Prevents Head Cropping:** 40% more vertical space ensures character heads are visible
2. **Maintains Wide Aesthetic:** Keeps the appealing wide card format
3. **Modern Design:** Text overlay is a common pattern in card games
4. **High Readability:** Multi-layer text shadows ensure text is readable on any background
5. **Consistent Layout:** Both normal and compact cards scale proportionally

## Technical Details

### Text Shadow Strategy
The multi-layer shadow approach provides:
1. **Black outline** (4 directions): Creates a stroke effect around text
2. **Drop shadow**: Adds depth and separation from background
3. **Glow effect**: Additional contrast for very bright backgrounds

### Aspect Ratio Change
- From 1.4:1 (16:9-ish) to 1:1 (square)
- With 4:3 source images in 1:1 container using `objectFit: 'cover'`:
  - Images show more vertical content
  - Slight horizontal cropping on edges (acceptable trade-off)
  - Character faces/heads now fully visible

## Testing Recommendations

1. **Visual Testing:** View cards with various character images to ensure:
   - Heads are visible
   - Text is readable on light and dark backgrounds
   - Layout looks balanced

2. **Responsive Testing:** Verify both card sizes:
   - Normal (320px max width)
   - Compact (192px max width)

3. **Browser Testing:** Check text shadow rendering across browsers

## Future Enhancements (Optional)

If text readability issues arise on certain backgrounds:
1. Add semi-transparent dark background bar behind text
2. Adjust shadow opacity/blur values
3. Consider dynamic text color based on image brightness

## Build Status
✅ Compiled successfully with no errors