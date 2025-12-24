/**
 * Utility functions for character image URL generation.
 * Both heroes and monsters use the same CDN path structure.
 *
 * This is the single source of truth for all character image URLs in the application.
 * Use these functions instead of hardcoding image paths.
 */

/**
 * Placeholder image URL for characters without custom images.
 * Used as fallback when character image is not available.
 */
export const PLACEHOLDER_IMAGE_URL = '/cdn/placeholder.png';

/**
 * Generate the image URL for a character (hero or monster).
 * All character images are stored in /cdn/monsters/{id}/ regardless of type.
 *
 * @param monsterId - The unique identifier for the character's image
 * @returns The full image URL or undefined if no monsterId provided
 *
 * @example
 * ```typescript
 * const imageUrl = getCharacterImageUrl('abc123');
 * // Returns: '/cdn/monsters/abc123/280x200.png'
 *
 * const noImage = getCharacterImageUrl(null);
 * // Returns: undefined
 * ```
 */
export function getCharacterImageUrl(
  monsterId: string | null | undefined
): string | undefined {
  if (!monsterId) return undefined;
  return `/cdn/monsters/${monsterId}/280x200.png`;
}

/**
 * Get character image URL with fallback to placeholder.
 * Convenience function that always returns a valid image URL.
 *
 * @param monsterId - The unique identifier for the character's image
 * @returns The character image URL or placeholder if no monsterId provided
 *
 * @example
 * ```typescript
 * const imageUrl = getCharacterImageUrlOrPlaceholder('abc123');
 * // Returns: '/cdn/monsters/abc123/280x200.png'
 *
 * const placeholderUrl = getCharacterImageUrlOrPlaceholder(null);
 * // Returns: '/cdn/placeholder.png'
 * ```
 */
export function getCharacterImageUrlOrPlaceholder(
  monsterId: string | null | undefined
): string {
  return getCharacterImageUrl(monsterId) || PLACEHOLDER_IMAGE_URL;
}

// Made with Bob