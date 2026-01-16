/* eslint-env node */
/* global process */
import { DataAPIClient } from "@datastax/astra-db-ts";
import { config } from "dotenv";
import { resolve } from "path";
import { Character, Ability } from "../../app/battle-arena/lib/types";

// Load environment variables from the root .env file
// Try both root directory and typescript directory
const rootEnvPath = resolve(process.cwd(), '..', '.env');
const localEnvPath = resolve(process.cwd(), '.env');
config({ path: rootEnvPath });
// Also try loading from local directory if root doesn't exist
try {
  config({ path: localEnvPath, override: false });
} catch {
  // Ignore if local .env doesn't exist
}

// Types for database records
export type HeroRecord = {
  _id?: string;
  name: string;
  class?: string; // Character class (e.g., "Fighter", "Wizard", "Rogue") - separate from name
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  meleeDamageDie?: string; // Optional melee weapon damage die
  rangedDamageDie?: string; // Optional ranged weapon damage die
  abilities: Ability[];
  description: string;
  color: string;
  race?: string; // Character race (e.g., "Human", "Elf", "Dwarf") - use "n/a" if not applicable
  sex?: string; // Character sex (e.g., "male", "female", "other") - use "n/a" if not applicable
  monsterId?: string; // Reference to character's image in /cdn/monsters/{monsterId}/
  imageUrl?: string; // Full URL to character's image
  imagePosition?: { offsetX: number; offsetY: number }; // Image positioning data
  imagePrompt?: string; // Prompt used to generate the character's image
  visualDescription?: string; // Visual description from Langflow vision analysis
  searchContext?: string; // Context used when loading (e.g., "Battle Arena", "Pokemon")
  isDefault?: boolean; // Flag to indicate if this hero was loaded from default heroes
  fromOpenRAG?: boolean; // Flag to indicate if this character was loaded from OpenRAG knowledge base
  createdAt: string;
  updatedAt: string;
};

export type MonsterRecord = {
  _id?: string;
  name: string;
  class?: string; // Character class (e.g., "Fighter", "Wizard", "Rogue") - separate from name
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attackBonus: number;
  damageDie: string;
  meleeDamageDie?: string; // Optional melee weapon damage die
  rangedDamageDie?: string; // Optional ranged weapon damage die
  abilities: Ability[];
  description: string;
  color: string;
  race?: string; // Character race (e.g., "Human", "Elf", "Dwarf") - use "n/a" if not applicable
  sex?: string; // Character sex (e.g., "male", "female", "other") - use "n/a" if not applicable
  monsterId?: string; // Reference to character's image in /cdn/monsters/{monsterId}/
  imageUrl?: string; // Full URL to character's image
  imagePosition?: { offsetX: number; offsetY: number }; // Image positioning data
  imagePrompt?: string; // Prompt used to generate the character's image
  visualDescription?: string; // Visual description from Langflow vision analysis
  searchContext?: string; // Context used when loading (e.g., "Battle Arena", "Pokemon")
  isDefault?: boolean; // Flag to indicate if this monster was loaded from default monsters
  fromOpenRAG?: boolean; // Flag to indicate if this character was loaded from OpenRAG knowledge base
  createdAt: string;
  updatedAt: string;
};

// Database client singleton
let astraClient: any = null;
let dbAvailable: boolean | null = null; // null = not checked, true = available, false = unavailable

/**
 * Check if database is configured and available
 */
async function isDatabaseAvailable(): Promise<boolean> {
  // Return cached result if already checked
  if (dbAvailable !== null) {
    return dbAvailable;
  }

  const endpoint = process.env.ASTRA_DB_ENDPOINT;
  const token = process.env.ASTRA_DB_APPLICATION_TOKEN;

  // Check if environment variables are set
  if (!endpoint || !token) {
    console.log("⚠️ Astra DB not configured - using local storage and defaults");
    dbAvailable = false;
    return false;
  }

  // Try to connect
  try {
    console.log("Connecting to Astra DB...");
    const client = new DataAPIClient(token);
    astraClient = client.db(endpoint);
    console.log("✅ Successfully connected to Astra DB");
    dbAvailable = true;
    return true;
  } catch (error) {
    console.warn("⚠️ Failed to connect to Astra DB:", error instanceof Error ? error.message : 'Unknown error');
    console.log("📦 Falling back to local storage and defaults");
    dbAvailable = false;
    return false;
  }
}

async function getAstraClient() {
  if (astraClient === null) {
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      throw new Error('Database not available');
    }
  }
  return astraClient;
}

// Collection getters
async function getHeroesCollection() {
  const client = await getAstraClient();
  return client.collection("heroes");
}

async function getMonstersCollection() {
  const client = await getAstraClient();
  return client.collection("monsters");
}

// Helper to convert Character to HeroRecord
function classToHeroRecord(klass: Character, searchContext?: string): Omit<HeroRecord, '_id' | 'createdAt' | 'updatedAt'> {
  const record: any = {
    name: klass.name,
    class: klass.class,
    hitPoints: klass.hitPoints,
    maxHitPoints: klass.maxHitPoints,
    armorClass: klass.armorClass,
    attackBonus: klass.attackBonus,
    damageDie: klass.damageDie,
    abilities: klass.abilities || [],
    description: klass.description || '',
    color: klass.color || 'bg-slate-900',
    race: klass.race,
    sex: klass.sex,
    isDefault: klass.isDefault, // Preserve default flag
    searchContext,
  };

  // Only include optional fields if they have values
  if ((klass as any).monsterId) record.monsterId = (klass as any).monsterId;
  if ((klass as any).imageUrl) record.imageUrl = (klass as any).imageUrl;
  if ((klass as any).imagePosition) record.imagePosition = (klass as any).imagePosition;
  if ((klass as any).imagePrompt) record.imagePrompt = (klass as any).imagePrompt;
  if ((klass as any).visualDescription) record.visualDescription = (klass as any).visualDescription;
  if ((klass as any).fromOpenRAG) record.fromOpenRAG = (klass as any).fromOpenRAG;

  return record;
}

// Helper to convert Character to MonsterRecord
function classToMonsterRecord(monster: Character, searchContext?: string): Omit<MonsterRecord, '_id' | 'createdAt' | 'updatedAt'> {
  const record: any = {
    name: monster.name,
    class: monster.class,
    hitPoints: monster.hitPoints,
    maxHitPoints: monster.maxHitPoints,
    armorClass: monster.armorClass,
    attackBonus: monster.attackBonus,
    damageDie: monster.damageDie,
    abilities: monster.abilities || [],
    description: monster.description || '',
    color: monster.color || 'bg-slate-900',
    race: monster.race,
    sex: monster.sex,
    isDefault: monster.isDefault, // Preserve default flag
    searchContext,
  };

  // Only include optional fields if they have values
  if ((monster as any).monsterId) record.monsterId = (monster as any).monsterId;
  if ((monster as any).imageUrl) record.imageUrl = (monster as any).imageUrl;
  if ((monster as any).imagePosition) record.imagePosition = (monster as any).imagePosition;
  if ((monster as any).imagePrompt) record.imagePrompt = (monster as any).imagePrompt;
  if ((monster as any).visualDescription) record.visualDescription = (monster as any).visualDescription;
  if ((monster as any).fromOpenRAG) record.fromOpenRAG = (monster as any).fromOpenRAG;

  return record;
}

// Helper to convert HeroRecord to Character
function heroRecordToClass(record: HeroRecord): Character {
  return {
    _id: record._id, // Preserve database ID for reliable identification
    name: record.name,
    class: record.class,
    hitPoints: record.hitPoints,
    maxHitPoints: record.maxHitPoints,
    armorClass: record.armorClass,
    attackBonus: record.attackBonus,
    damageDie: record.damageDie,
    abilities: record.abilities || [],
    description: record.description,
    color: record.color,
    race: record.race,
    sex: record.sex,
    isDefault: record.isDefault, // Preserve default flag
    fromOpenRAG: record.fromOpenRAG, // Preserve OpenRAG flag
    ...(record.monsterId && { monsterId: record.monsterId }), // Preserve image reference
    ...(record.imageUrl && { imageUrl: record.imageUrl }), // Preserve image URL
    ...(record.imagePrompt && { imagePrompt: record.imagePrompt }), // Preserve image prompt
    ...(record.visualDescription && { visualDescription: record.visualDescription }), // Preserve visual description
    ...(record.imagePosition && { imagePosition: record.imagePosition }), // Preserve image position
  };
}

// Helper to convert MonsterRecord to Character
function monsterRecordToClass(record: MonsterRecord): Character {
  return {
    _id: record._id, // Preserve database ID for reliable identification
    name: record.name,
    class: record.class,
    hitPoints: record.hitPoints,
    maxHitPoints: record.maxHitPoints,
    armorClass: record.armorClass,
    attackBonus: record.attackBonus,
    damageDie: record.damageDie,
    abilities: record.abilities || [],
    description: record.description,
    color: record.color,
    race: record.race,
    sex: record.sex,
    isDefault: record.isDefault, // Preserve default flag
    fromOpenRAG: record.fromOpenRAG, // Preserve OpenRAG flag
    ...(record.monsterId && { monsterId: record.monsterId }), // Preserve image reference
    ...(record.imageUrl && { imageUrl: record.imageUrl }), // Preserve image URL
    ...(record.imagePosition && { imagePosition: record.imagePosition }), // Preserve image position
    ...(record.imagePrompt && { imagePrompt: record.imagePrompt }), // Preserve image prompt
    ...(record.visualDescription && { visualDescription: record.visualDescription }), // Preserve visual description
  };
}

// Hero operations
export async function getAllHeroes(): Promise<HeroRecord[]> {
  try {
    // Check if database is available first
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      console.log("getAllHeroes - Database not available, returning empty array");
      return [];
    }

    console.log("getAllHeroes - Fetching heroes collection");
    const collection = await getHeroesCollection();
    
    console.log("getAllHeroes - Finding all records");
    const records = await collection.find().toArray();
    console.log(`getAllHeroes - Found ${records.length} records`);
    
    return records;
  } catch (error) {
    console.error("getAllHeroes - Error:", error);
    console.log("getAllHeroes - Returning empty array due to error");
    return [];
  }
}

export async function getHeroById(id: string): Promise<HeroRecord | null> {
  try {
    console.log(`getHeroById - Finding hero with ID: ${id}`);
    
    const collection = await getHeroesCollection();
    const record = await collection.findOne({ _id: id });
    console.log(`getHeroById - Found record:`, record ? 'yes' : 'no');

    return record || null;
  } catch (error) {
    console.error("getHeroById - Error:", error);
    throw error;
  }
}

export async function getHeroByName(name: string): Promise<HeroRecord | null> {
  try {
    // Try exact match first, then case-insensitive
    console.log(`getHeroByName - Finding hero for ${name}`);
    
    const collection = await getHeroesCollection();
    // Try exact match first
    let record = await collection.findOne({ name: name });
    // If not found, try case-insensitive
    if (!record) {
      const normalizedName = name.toLowerCase();
      record = await collection.findOne({ name: normalizedName });
    }
    console.log(`getHeroByName - Found record:`, record ? 'yes' : 'no');

    return record || null;
  } catch (error) {
    console.error("getHeroByName - Error:", error);
    throw error;
  }
}

export async function upsertHero(hero: Character, searchContext?: string): Promise<any> {
  try {
    // Check if database is available first
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      console.log(`upsertHero - Database not available, skipping save for ${hero.name}`);
      return { acknowledged: false, message: 'Database not available' };
    }

    const normalizedName = hero.name.toLowerCase();
    console.log(`upsertHero - Processing hero ${hero.name}`);

    const collection = await getHeroesCollection();
    
    // Find existing record (try both exact and normalized)
    let existingRecord = await collection.findOne({ name: hero.name });
    if (!existingRecord) {
      existingRecord = await collection.findOne({ name: normalizedName });
    }
    
    const now = new Date().toISOString();
    const heroRecord: HeroRecord = {
      ...classToHeroRecord(hero, searchContext),
      name: hero.name, // Keep original name for display
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
    };

    let result;
    if (existingRecord) {
      // Update existing record
      console.log(`upsertHero - Updating existing record: ${existingRecord._id}`);
      result = await collection.updateOne(
        { _id: existingRecord._id },
        { $set: heroRecord }
      );
    } else {
      // Insert new record
      console.log("upsertHero - Creating new record");
      result = await collection.insertOne(heroRecord);
    }

    console.log("upsertHero - Operation result:", result);
    return result;
  } catch (error) {
    console.error("upsertHero - Error:", error);
    throw error;
  }
}

export async function upsertHeroes(heroes: Character[], searchContext?: string): Promise<void> {
  try {
    console.log(`upsertHeroes - Processing ${heroes.length} heroes`);
    for (const hero of heroes) {
      await upsertHero(hero, searchContext);
    }
    console.log(`upsertHeroes - Successfully processed ${heroes.length} heroes`);
  } catch (error) {
    console.error("upsertHeroes - Error:", error);
    throw error;
  }
}

// Monster operations
export async function getAllMonsters(): Promise<MonsterRecord[]> {
  try {
    // Check if database is available first
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      console.log("getAllMonsters - Database not available, returning empty array");
      return [];
    }

    console.log("getAllMonsters - Fetching monsters collection");
    const collection = await getMonstersCollection();
    
    console.log("getAllMonsters - Finding all records");
    const records = await collection.find().toArray();
    console.log(`getAllMonsters - Found ${records.length} records`);
    
    return records;
  } catch (error) {
    console.error("getAllMonsters - Error:", error);
    console.log("getAllMonsters - Returning empty array due to error");
    return [];
  }
}

export async function getMonsterById(id: string): Promise<MonsterRecord | null> {
  try {
    console.log(`getMonsterById - Finding monster with ID: ${id}`);
    
    const collection = await getMonstersCollection();
    const record = await collection.findOne({ _id: id });
    console.log(`getMonsterById - Found record:`, record ? 'yes' : 'no');

    return record || null;
  } catch (error) {
    console.error("getMonsterById - Error:", error);
    throw error;
  }
}

export async function getMonsterByName(name: string): Promise<MonsterRecord | null> {
  try {
    // Try exact match first, then case-insensitive
    console.log(`getMonsterByName - Finding monster for ${name}`);
    
    const collection = await getMonstersCollection();
    // Try exact match first
    let record = await collection.findOne({ name: name });
    // If not found, try case-insensitive
    if (!record) {
      const normalizedName = name.toLowerCase();
      record = await collection.findOne({ name: normalizedName });
    }
    console.log(`getMonsterByName - Found record:`, record ? 'yes' : 'no');

    return record || null;
  } catch (error) {
    console.error("getMonsterByName - Error:", error);
    throw error;
  }
}

export async function upsertMonster(monster: Character, searchContext?: string): Promise<any> {
  try {
    // Check if database is available first
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      console.log(`upsertMonster - Database not available, skipping save for ${monster.name}`);
      return { acknowledged: false, message: 'Database not available' };
    }

    const normalizedName = monster.name.toLowerCase();
    console.log(`upsertMonster - Processing monster ${monster.name}`);

    const collection = await getMonstersCollection();
    
    // Find existing record (try both exact and normalized)
    let existingRecord = await collection.findOne({ name: monster.name });
    if (!existingRecord) {
      existingRecord = await collection.findOne({ name: normalizedName });
    }
    
    const now = new Date().toISOString();
    const monsterRecord: MonsterRecord = {
      ...classToMonsterRecord(monster, searchContext),
      name: monster.name, // Keep original name for display
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
    };

    let result;
    if (existingRecord) {
      // Update existing record
      console.log(`upsertMonster - Updating existing record: ${existingRecord._id}`);
      result = await collection.updateOne(
        { _id: existingRecord._id },
        { $set: monsterRecord }
      );
    } else {
      // Insert new record
      console.log("upsertMonster - Creating new record");
      result = await collection.insertOne(monsterRecord);
    }

    console.log("upsertMonster - Operation result:", result);
    return result;
  } catch (error) {
    console.error("upsertMonster - Error:", error);
    throw error;
  }
}

export async function upsertMonsters(monsters: Character[], searchContext?: string): Promise<void> {
  try {
    console.log(`upsertMonsters - Processing ${monsters.length} monsters`);
    for (const monster of monsters) {
      await upsertMonster(monster, searchContext);
    }
    console.log(`upsertMonsters - Successfully processed ${monsters.length} monsters`);
  } catch (error) {
    console.error("upsertMonsters - Error:", error);
    throw error;
  }
}

// Delete operations
export async function deleteHero(name: string): Promise<boolean> {
  try {
    console.log(`deleteHero - Deleting hero ${name}`);
    const collection = await getHeroesCollection();
    
    // Try exact match first
    let existingRecord = await collection.findOne({ name: name });
    if (!existingRecord) {
      // Try case-insensitive
      const normalizedName = name.toLowerCase();
      existingRecord = await collection.findOne({ name: normalizedName });
    }
    
    if (!existingRecord) {
      console.log(`deleteHero - Hero ${name} not found`);
      return false;
    }
    
    const result = await collection.deleteOne({ _id: existingRecord._id });
    console.log(`deleteHero - Deleted hero ${name}:`, result.deletedCount > 0);
    return result.deletedCount > 0;
  } catch (error) {
    console.error("deleteHero - Error:", error);
    throw error;
  }
}

export async function deleteMonster(name: string): Promise<boolean> {
  try {
    console.log(`deleteMonster - Deleting monster ${name}`);
    const collection = await getMonstersCollection();
    
    // Try exact match first
    let existingRecord = await collection.findOne({ name: name });
    if (!existingRecord) {
      // Try case-insensitive
      const normalizedName = name.toLowerCase();
      existingRecord = await collection.findOne({ name: normalizedName });
    }
    
    if (!existingRecord) {
      console.log(`deleteMonster - Monster ${name} not found`);
      return false;
    }
    
    const result = await collection.deleteOne({ _id: existingRecord._id });
    console.log(`deleteMonster - Deleted monster ${name}:`, result.deletedCount > 0);
    return result.deletedCount > 0;
  } catch (error) {
    console.error("deleteMonster - Error:", error);
    throw error;
  }
}

// Export helpers for conversion
export { heroRecordToClass, monsterRecordToClass, getAstraClient };

