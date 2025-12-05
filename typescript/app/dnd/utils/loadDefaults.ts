import { promises as fs } from 'fs';
import { join } from 'path';
import { DnDClass } from '../types';

/**
 * Load default heroes from JSON file
 * This function reads the heroes.json file from the characters/default_heroes directory
 */
export async function loadDefaultHeroes(): Promise<DnDClass[]> {
  try {
    const heroesPath = join(process.cwd(), '..', 'characters', 'default_heroes', 'heroes.json');
    const heroesData = await fs.readFile(heroesPath, 'utf-8');
    const parsed = JSON.parse(heroesData);
    
    if (!parsed.heroes || !Array.isArray(parsed.heroes)) {
      throw new Error('Invalid heroes.json format: missing heroes array');
    }
    
    return parsed.heroes as DnDClass[];
  } catch (error) {
    console.error('Error loading default heroes from JSON:', error);
    throw new Error(`Failed to load default heroes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load default monsters from JSON file
 * This function reads the monsters.json file from the characters/default_monsters directory
 */
export async function loadDefaultMonsters(): Promise<DnDClass[]> {
  try {
    const monstersPath = join(process.cwd(), '..', 'characters', 'default_monsters', 'monsters.json');
    const monstersData = await fs.readFile(monstersPath, 'utf-8');
    const parsed = JSON.parse(monstersData);
    
    if (!parsed.monsters || !Array.isArray(parsed.monsters)) {
      throw new Error('Invalid monsters.json format: missing monsters array');
    }
    
    return parsed.monsters as DnDClass[];
  } catch (error) {
    console.error('Error loading default monsters from JSON:', error);
    throw new Error(`Failed to load default monsters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Synchronously load default heroes from JSON file (for use in constants.ts)
 * Note: This should only be used during build time or in server-side contexts
 */
export function loadDefaultHeroesSync(): DnDClass[] {
  try {
    const heroesPath = join(process.cwd(), '..', 'characters', 'default_heroes', 'heroes.json');
    const heroesData = require('fs').readFileSync(heroesPath, 'utf-8');
    const parsed = JSON.parse(heroesData);
    
    if (!parsed.heroes || !Array.isArray(parsed.heroes)) {
      throw new Error('Invalid heroes.json format: missing heroes array');
    }
    
    return parsed.heroes as DnDClass[];
  } catch (error) {
    console.error('Error loading default heroes from JSON (sync):', error);
    // Return empty array as fallback to prevent build failures
    return [];
  }
}

/**
 * Synchronously load default monsters from JSON file (for use in constants.ts)
 * Note: This should only be used during build time or in server-side contexts
 */
export function loadDefaultMonstersSync(): DnDClass[] {
  try {
    const monstersPath = join(process.cwd(), '..', 'characters', 'default_monsters', 'monsters.json');
    const monstersData = require('fs').readFileSync(monstersPath, 'utf-8');
    const parsed = JSON.parse(monstersData);
    
    if (!parsed.monsters || !Array.isArray(parsed.monsters)) {
      throw new Error('Invalid monsters.json format: missing monsters array');
    }
    
    return parsed.monsters as DnDClass[];
  } catch (error) {
    console.error('Error loading default monsters from JSON (sync):', error);
    // Return empty array as fallback to prevent build failures
    return [];
  }
}

// Made with Bob
