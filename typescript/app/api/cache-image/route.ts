import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const MONSTERS_DIR = join(process.cwd(), 'public', 'cdn', 'monsters');

/**
 * API endpoint to cache an Everart image to local CDN
 * POST /api/cache-image
 * Body: { monsterId: string, imageUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { monsterId, imageUrl } = await request.json();

    if (!monsterId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing monsterId or imageUrl' },
        { status: 400 }
      );
    }

    console.log(`[cache-image] Caching image for monster ${monsterId} from ${imageUrl}`);

    // Fetch the image from Everart
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Create monster directory
    const monsterDir = join(MONSTERS_DIR, monsterId);
    await fs.mkdir(monsterDir, { recursive: true });

    // Generate the 280x200 image (the one used by cards)
    const png280x200 = await sharp(imageBuffer)
      .resize(280, 200, {
        kernel: sharp.kernel.nearest,
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();

    // Save the image
    await fs.writeFile(join(monsterDir, '280x200.png'), png280x200);

    // Create minimal metadata.json file so /api/monsters can read it
    const metadata = {
      monsterId,
      imageUrl,
      hasCutout: false,
      cachedAt: new Date().toISOString(),
      source: 'everart-cache'
    };
    await fs.writeFile(join(monsterDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    console.log(`[cache-image] Successfully cached image for monster ${monsterId}`);

    return NextResponse.json({
      success: true,
      message: 'Image cached successfully',
      monsterId,
      localUrl: `/cdn/monsters/${monsterId}/280x200.png`
    });
  } catch (error) {
    console.error('[cache-image] Error caching image:', error);
    return NextResponse.json(
      { error: 'Failed to cache image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Made with Bob
