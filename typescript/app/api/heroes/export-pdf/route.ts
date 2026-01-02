import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getAllHeroes } from '../../../../lib/db/astra';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

/**
 * GET - Export all heroes from database to a single PDF file
 * This endpoint fetches all heroes and enriches them with metadata (prompts, settings)
 */
export async function GET() {
  try {
    console.log('[API /heroes/export-pdf] Fetching all heroes for PDF export');
    
    // Fetch all heroes from database
    const allHeroes = await getAllHeroes();
    
    if (allHeroes.length === 0) {
      return NextResponse.json(
        { error: 'No heroes found in database to export.' },
        { status: 404 }
      );
    }
    
    // Enrich heroes with metadata if they have a monsterId
    const enrichedHeroes = await Promise.all(
      allHeroes.map(async (hero) => {
        if (hero.monsterId) {
          try {
            const metadataPath = join(MONSTERS_DIR, hero.monsterId, 'metadata.json');
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
            
            return {
              ...hero,
              imagePrompt: metadata.prompt || undefined,
              imageSetting: metadata.setting || undefined,
              // Use local CDN URL for better PDF embedding
              localImageUrl: `/cdn/monsters/${hero.monsterId}/280x200.png`,
            };
          } catch (error) {
            console.warn(`Could not load metadata for hero ${hero.name} (monsterId: ${hero.monsterId})`);
            return hero;
          }
        }
        return hero;
      })
    );
    
    // Return heroes data for client-side PDF generation
    return NextResponse.json({
      success: true,
      heroes: enrichedHeroes,
      count: enrichedHeroes.length,
    });
  } catch (error) {
    console.error('[API /heroes/export-pdf] Error fetching heroes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch heroes for PDF export' },
      { status: 500 }
    );
  }
}

// Made with Bob