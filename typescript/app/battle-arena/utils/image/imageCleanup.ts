/**
 * Utility functions for managing character image cleanup
 * Handles deletion of old character images when new ones are created
 */

/**
 * Safely delete an old character image from the CDN
 * 
 * @param oldMonsterId - The monsterId of the image to delete
 * @returns Promise<boolean> - true if deletion successful, false otherwise
 */
export async function deleteOldCharacterImage(
  oldMonsterId: string | null | undefined
): Promise<boolean> {
  if (!oldMonsterId) {
    console.log('[imageCleanup] No monsterId provided, skipping deletion');
    return false;
  }
  
  try {
    console.log(`[imageCleanup] Attempting to delete old image: ${oldMonsterId}`);
    
    const response = await fetch('/api/monsters', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ monsterId: oldMonsterId })
    });
    
    if (response.ok) {
      console.log(`[imageCleanup] ✅ Successfully deleted old image: ${oldMonsterId}`);
      return true;
    } else {
      const data = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn(`[imageCleanup] ⚠️ Failed to delete image ${oldMonsterId}:`, data.error);
      return false;
    }
  } catch (error) {
    console.warn(`[imageCleanup] ⚠️ Error deleting old image ${oldMonsterId}:`, error);
    return false;
  }
}

/**
 * Fetch the current monsterId for a character from the database
 * 
 * @param characterId - The database _id of the character
 * @param characterType - Whether this is a 'hero' or 'monster'
 * @returns Promise<string | null> - The monsterId if found, null otherwise
 */
export async function fetchCharacterMonsterId(
  characterId: string,
  characterType: 'hero' | 'monster'
): Promise<string | null> {
  try {
    const endpoint = characterType === 'hero' ? '/api/heroes' : '/api/monsters-db';
    console.log(`[imageCleanup] Fetching monsterId for ${characterType} ${characterId}`);
    
    const response = await fetch(`${endpoint}?id=${encodeURIComponent(characterId)}`);
    
    if (!response.ok) {
      console.warn(`[imageCleanup] Failed to fetch character ${characterId}`);
      return null;
    }
    
    const data = await response.json();
    const character = characterType === 'hero' ? data.hero : data.monster;
    const monsterId = (character as any)?.monsterId || null;
    
    console.log(`[imageCleanup] Found monsterId for ${characterId}:`, monsterId || 'none');
    return monsterId;
  } catch (error) {
    console.warn(`[imageCleanup] Error fetching character monsterId:`, error);
    return null;
  }
}

/**
 * Clean up old image when a new one is created for an existing character
 * 
 * @param characterId - The database _id of the character (if editing)
 * @param characterType - Whether this is a 'hero' or 'monster'
 * @param newMonsterId - The monsterId of the newly created image
 * @returns Promise<boolean> - true if cleanup successful or not needed, false on error
 */
export async function cleanupOldImageOnUpdate(
  characterId: string | null,
  characterType: 'hero' | 'monster',
  newMonsterId: string
): Promise<boolean> {
  // If not editing an existing character, no cleanup needed
  if (!characterId) {
    console.log('[imageCleanup] New character, no cleanup needed');
    return true;
  }
  
  try {
    // Fetch the old monsterId from the database
    const oldMonsterId = await fetchCharacterMonsterId(characterId, characterType);
    
    // If no old image or same as new, no cleanup needed
    if (!oldMonsterId || oldMonsterId === newMonsterId) {
      console.log('[imageCleanup] No old image to clean up or same image');
      return true;
    }
    
    // Delete the old image
    return await deleteOldCharacterImage(oldMonsterId);
  } catch (error) {
    console.error('[imageCleanup] Error during cleanup:', error);
    return false;
  }
}

// Made with Bob
