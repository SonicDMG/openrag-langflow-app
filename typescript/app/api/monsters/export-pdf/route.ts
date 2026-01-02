import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getAllMonsters } from '../../../../lib/db/astra';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

/**
 * GET - Export all monsters from database to a single PDF file
 * This endpoint fetches all monsters and enriches them with metadata (prompts, settings)
 */
export async function GET() {
  try {
    console.log('[API /monsters/export-pdf] Fetching all monsters for PDF export');
    
    // Fetch all monsters from database
    const allMonsters = await getAllMonsters();
    
    if (allMonsters.length === 0) {
      return NextResponse.json(
        { error: 'No monsters found in database to export.' },
        { status: 404 }
      );
    }
    
    // Enrich monsters with metadata if they have a monsterId
    const enrichedMonsters = await Promise.all(
      allMonsters.map(async (monster) => {
        if (monster.monsterId) {
          try {
            const metadataPath = join(MONSTERS_DIR, monster.monsterId, 'metadata.json');
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
            
            return {
              ...monster,
              imagePrompt: metadata.prompt || undefined,
              imageSetting: metadata.setting || undefined,
              // Use local CDN URL for better PDF embedding
              localImageUrl: `/cdn/monsters/${monster.monsterId}/280x200.png`,
            };
          } catch (error) {
            console.warn(`Could not load metadata for monster ${monster.name} (monsterId: ${monster.monsterId})`);
            return monster;
          }
        }
        return monster;
      })
    );
    
    // Return monsters data for client-side PDF generation
    return NextResponse.json({
      success: true,
      monsters: enrichedMonsters,
      count: enrichedMonsters.length,
    });
  } catch (error) {
    console.error('[API /monsters/export-pdf] Error fetching monsters:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch monsters for PDF export' },
      { status: 500 }
    );
  }
}

// Made with Bob