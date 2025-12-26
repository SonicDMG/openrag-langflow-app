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
 * Generate the local CDN image URL for a character (hero or monster).
 * All character images are cached in /cdn/monsters/{id}/ for fast loading.
 *
 * @param monsterId - The unique identifier for the character's image
 * @returns The local CDN image URL or undefined if no monsterId provided
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
 * Get character image URLs with smart fallback strategy.
 * Returns both primary (local CDN) and fallback (Everart) URLs separately.
 * This allows the UI to try local first, then fall back to Everart if local fails.
 *
 * @param monsterId - The unique identifier for the character's image (for local CDN)
 * @param everartUrl - The Everart cloud URL (fallback for cross-machine sharing)
 * @returns Object with primaryUrl and fallbackUrl, or both undefined if neither provided
 *
 * @example
 * ```typescript
 * const { primaryUrl, fallbackUrl } = getCharacterImageUrls('abc123', 'https://everart.ai/image.png');
 * // Returns: { primaryUrl: '/cdn/monsters/abc123/280x200.png', fallbackUrl: 'https://everart.ai/image.png' }
 *
 * // Only Everart URL available (character from another machine)
 * const { primaryUrl, fallbackUrl } = getCharacterImageUrls(null, 'https://everart.ai/image.png');
 * // Returns: { primaryUrl: undefined, fallbackUrl: 'https://everart.ai/image.png' }
 * ```
 */
export function getCharacterImageUrls(
  monsterId: string | null | undefined,
  everartUrl: string | null | undefined
): { primaryUrl: string | undefined; fallbackUrl: string | undefined } {
  return {
    primaryUrl: monsterId ? getCharacterImageUrl(monsterId) : undefined,
    fallbackUrl: everartUrl || undefined,
  };
}

/**
 * Get character image URL with smart fallback strategy.
 * Priority: Local CDN (fast) > Everart cloud URL (sharing) > undefined
 *
 * @deprecated Use getCharacterImageUrls() instead for better fallback handling in UI
 *
 * @param monsterId - The unique identifier for the character's image (for local CDN)
 * @param everartUrl - The Everart cloud URL (fallback for cross-machine sharing)
 * @returns The best available image URL or undefined if neither provided
 */
export function getCharacterImageUrlWithFallback(
  monsterId: string | null | undefined,
  everartUrl: string | null | undefined
): string | undefined {
  // Priority 1: Try local CDN first (fast, cached)
  if (monsterId) {
    return getCharacterImageUrl(monsterId);
  }
  
  // Priority 2: Fall back to Everart cloud URL (for sharing across machines)
  if (everartUrl) {
    return everartUrl;
  }
  
  return undefined;
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