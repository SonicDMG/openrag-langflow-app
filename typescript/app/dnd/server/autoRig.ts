import sharp from 'sharp';
import { Rig, Bone, Slot, Part, PartName } from '../utils/rigTypes';

export interface AutoRigResult {
  rig: Rig;
  partsPngs: Record<string, Buffer>;
}

/**
 * Basic auto-rigging using simple heuristics
 * This is a simplified version - in production you'd use OpenCV or more sophisticated detection
 */
export async function autoRig(png256: Buffer): Promise<AutoRigResult> {
  const { width, height } = await sharp(png256).metadata();
  if (!width || !height) {
    throw new Error('Failed to get image dimensions');
  }

  // For now, use simple heuristics based on image dimensions
  // In a full implementation, you'd use OpenCV WASM or similar for contour detection
  
  // Simple heuristic: assume character is roughly centered and upright
  const centerX = width / 2;
  const centerY = height / 2;

  // Define default part rectangles (these would be detected in a real implementation)
  const parts: Record<PartName, Part> = {
    torso: {
      name: 'torso',
      rect: {
        x: Math.floor(centerX - width * 0.15),
        y: Math.floor(centerY - height * 0.1),
        w: Math.floor(width * 0.3),
        h: Math.floor(height * 0.4),
      },
      pivot: { x: Math.floor(width * 0.15), y: Math.floor(height * 0.2) },
      z: 0,
    },
    head: {
      name: 'head',
      rect: {
        x: Math.floor(centerX - width * 0.12),
        y: Math.floor(centerY - height * 0.35),
        w: Math.floor(width * 0.24),
        h: Math.floor(height * 0.25),
      },
      pivot: { x: Math.floor(width * 0.12), y: Math.floor(height * 0.2) },
      z: 1,
      parent: 'torso',
    },
    eyeL: {
      name: 'eyeL',
      rect: {
        x: Math.floor(centerX - width * 0.08),
        y: Math.floor(centerY - height * 0.25),
        w: Math.floor(width * 0.06),
        h: Math.floor(height * 0.06),
      },
      pivot: { x: Math.floor(width * 0.03), y: Math.floor(height * 0.03) },
      z: 2,
      parent: 'head',
    },
    eyeR: {
      name: 'eyeR',
      rect: {
        x: Math.floor(centerX + width * 0.02),
        y: Math.floor(centerY - height * 0.25),
        w: Math.floor(width * 0.06),
        h: Math.floor(height * 0.06),
      },
      pivot: { x: Math.floor(width * 0.03), y: Math.floor(height * 0.03) },
      z: 2,
      parent: 'head',
    },
    mouth: {
      name: 'mouth',
      rect: {
        x: Math.floor(centerX - width * 0.04),
        y: Math.floor(centerY - height * 0.15),
        w: Math.floor(width * 0.08),
        h: Math.floor(height * 0.04),
      },
      pivot: { x: Math.floor(width * 0.04), y: Math.floor(height * 0.02) },
      z: 2,
      parent: 'head',
    },
    armL: {
      name: 'armL',
      rect: {
        x: Math.floor(centerX - width * 0.2),
        y: Math.floor(centerY - height * 0.05),
        w: Math.floor(width * 0.1),
        h: Math.floor(height * 0.3),
      },
      pivot: { x: Math.floor(width * 0.05), y: Math.floor(height * 0.05) },
      z: 1,
      parent: 'torso',
    },
    armR: {
      name: 'armR',
      rect: {
        x: Math.floor(centerX + width * 0.1),
        y: Math.floor(centerY - height * 0.05),
        w: Math.floor(width * 0.1),
        h: Math.floor(height * 0.3),
      },
      pivot: { x: Math.floor(width * 0.05), y: Math.floor(height * 0.05) },
      z: 1,
      parent: 'torso',
    },
    legL: {
      name: 'legL',
      rect: {
        x: Math.floor(centerX - width * 0.08),
        y: Math.floor(centerY + height * 0.3),
        w: Math.floor(width * 0.08),
        h: Math.floor(height * 0.25),
      },
      pivot: { x: Math.floor(width * 0.04), y: 0 },
      z: 0,
      parent: 'torso',
    },
    legR: {
      name: 'legR',
      rect: {
        x: Math.floor(centerX),
        y: Math.floor(centerY + height * 0.3),
        w: Math.floor(width * 0.08),
        h: Math.floor(height * 0.25),
      },
      pivot: { x: Math.floor(width * 0.04), y: 0 },
      z: 0,
      parent: 'torso',
    },
    // Wind-affected parts - positioned based on typical character layout
    hatTip: {
      name: 'hatTip',
      rect: {
        x: Math.floor(centerX - width * 0.08),
        y: Math.floor(centerY - height * 0.4),
        w: Math.floor(width * 0.16),
        h: Math.floor(height * 0.1),
      },
      pivot: { x: Math.floor(width * 0.08), y: Math.floor(height * 0.05) },
      z: 3,
      parent: 'head',
    },
    beard: {
      name: 'beard',
      rect: {
        x: Math.floor(centerX - width * 0.1),
        y: Math.floor(centerY - height * 0.1),
        w: Math.floor(width * 0.2),
        h: Math.floor(height * 0.15),
      },
      pivot: { x: Math.floor(width * 0.1), y: 0 },
      z: 2,
      parent: 'head',
    },
    robeL: {
      name: 'robeL',
      rect: {
        x: Math.floor(centerX - width * 0.2),
        y: Math.floor(centerY),
        w: Math.floor(width * 0.15),
        h: Math.floor(height * 0.4),
      },
      pivot: { x: Math.floor(width * 0.075), y: 0 },
      z: 1,
      parent: 'torso',
    },
    robeR: {
      name: 'robeR',
      rect: {
        x: Math.floor(centerX + width * 0.05),
        y: Math.floor(centerY),
        w: Math.floor(width * 0.15),
        h: Math.floor(height * 0.4),
      },
      pivot: { x: Math.floor(width * 0.075), y: 0 },
      z: 1,
      parent: 'torso',
    },
    // Wind-affected parts: hair, sleeves, cape
    hair: {
      name: 'hair',
      rect: {
        x: Math.floor(centerX - width * 0.1),
        y: Math.floor(centerY - height * 0.35),
        w: Math.floor(width * 0.2),
        h: Math.floor(height * 0.15),
      },
      pivot: { x: Math.floor(width * 0.1), y: 0 },
      z: 2,
      parent: 'head',
    },
    sleeveL: {
      name: 'sleeveL',
      rect: {
        x: Math.floor(centerX - width * 0.25),
        y: Math.floor(centerY - height * 0.05),
        w: Math.floor(width * 0.12),
        h: Math.floor(height * 0.25),
      },
      pivot: { x: Math.floor(width * 0.06), y: 0 },
      z: 1,
      parent: 'armL',
    },
    sleeveR: {
      name: 'sleeveR',
      rect: {
        x: Math.floor(centerX + width * 0.13),
        y: Math.floor(centerY - height * 0.05),
        w: Math.floor(width * 0.12),
        h: Math.floor(height * 0.25),
      },
      pivot: { x: Math.floor(width * 0.06), y: 0 },
      z: 1,
      parent: 'armR',
    },
    cape: {
      name: 'cape',
      rect: {
        x: Math.floor(centerX - width * 0.15),
        y: Math.floor(centerY - height * 0.1),
        w: Math.floor(width * 0.3),
        h: Math.floor(height * 0.5),
      },
      pivot: { x: Math.floor(width * 0.15), y: 0 },
      z: -1,
      parent: 'torso',
    },
    // Weapon parts - try multiple common positions
    staffTip: {
      name: 'staffTip',
      rect: {
        x: Math.floor(centerX + width * 0.15),
        y: Math.floor(centerY - height * 0.2),
        w: Math.floor(width * 0.08),
        h: Math.floor(height * 0.08),
      },
      pivot: { x: 0, y: Math.floor(height * 0.04) },
      z: 4,
      parent: 'armR',
    },
    swordTip: {
      name: 'swordTip',
      rect: {
        x: Math.floor(centerX + width * 0.12),
        y: Math.floor(centerY - height * 0.15),
        w: Math.floor(width * 0.06),
        h: Math.floor(height * 0.12),
      },
      pivot: { x: 0, y: Math.floor(height * 0.06) },
      z: 4,
      parent: 'armR',
    },
    wandTip: {
      name: 'wandTip',
      rect: {
        x: Math.floor(centerX + width * 0.14),
        y: Math.floor(centerY - height * 0.25),
        w: Math.floor(width * 0.04),
        h: Math.floor(height * 0.06),
      },
      pivot: { x: 0, y: Math.floor(height * 0.03) },
      z: 4,
      parent: 'armR',
    },
  };

  // Build bones hierarchy
  const bones: Bone[] = [
    { name: 'root' },
    { name: 'torso', parent: 'root', x: 0, y: 0 },
    { name: 'head', parent: 'torso' },
    { name: 'eyeL', parent: 'head' },
    { name: 'eyeR', parent: 'head' },
    { name: 'mouth', parent: 'head' },
    { name: 'armL', parent: 'torso' },
    { name: 'armR', parent: 'torso' },
    { name: 'legL', parent: 'torso' },
    { name: 'legR', parent: 'torso' },
    // Wind-affected bones
    { name: 'hatTip', parent: 'head' },
    { name: 'beard', parent: 'head' },
    { name: 'hair', parent: 'head' },
    { name: 'sleeveL', parent: 'armL' },
    { name: 'sleeveR', parent: 'armR' },
    { name: 'cape', parent: 'torso' },
    { name: 'robeL', parent: 'torso' },
    { name: 'robeR', parent: 'torso' },
    // Weapon bones
    { name: 'staffTip', parent: 'armR' },
    { name: 'swordTip', parent: 'armR' },
    { name: 'wandTip', parent: 'armR' },
  ];
  
  // Detect weapon location by checking which weapon parts have significant content
  // This is a simple heuristic - in a full implementation, you'd use image analysis
  const weaponParts = ['staffTip', 'swordTip', 'wandTip'];
  let detectedWeapon: string | null = null;
  let weaponPosition: { x: number; y: number } | null = null;
  
  // For now, default to staffTip, but this could be enhanced with image analysis
  // to detect which weapon is actually present
  detectedWeapon = 'staffTip'; // Default assumption
  const weaponPart = parts[detectedWeapon as PartName];
  if (weaponPart && weaponPart.rect && weaponPart.pivot) {
    weaponPosition = {
      x: weaponPart.rect.x + weaponPart.pivot.x,
      y: weaponPart.rect.y + weaponPart.pivot.y,
    };
  }

  // Build slots from parts
  const slots: Slot[] = Object.values(parts)
    .filter((p) => p.rect !== null)
    .map((p) => ({
      name: p.name,
      bone: p.parent || 'root',
      texture: `${p.name}.png`,
      z: p.z,
    }));

  // Extract part images
  const partsPngs: Record<string, Buffer> = {};
  for (const [name, part] of Object.entries(parts)) {
    if (part.rect) {
      // Clamp rectangle to image bounds
      const left = Math.max(0, Math.min(part.rect.x, width - 1));
      const top = Math.max(0, Math.min(part.rect.y, height - 1));
      const right = Math.min(width, part.rect.x + part.rect.w);
      const bottom = Math.min(height, part.rect.y + part.rect.h);
      const extractWidth = Math.max(1, right - left);
      const extractHeight = Math.max(1, bottom - top);

      // Only extract if we have valid dimensions
      if (extractWidth > 0 && extractHeight > 0 && left < width && top < height) {
        try {
          const partImage = await sharp(png256)
            .extract({
              left,
              top,
              width: extractWidth,
              height: extractHeight,
            })
            .png()
            .toBuffer();
          partsPngs[name] = partImage;
        } catch (error) {
          console.warn(`Failed to extract part ${name}:`, error);
          // Create a small transparent placeholder if extraction fails
          partsPngs[name] = await sharp({
            create: {
              width: Math.max(1, extractWidth),
              height: Math.max(1, extractHeight),
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
          })
            .png()
            .toBuffer();
        }
      } else {
        console.warn(`Invalid rect for part ${name}, creating placeholder`);
        // Create a small transparent placeholder
        partsPngs[name] = await sharp({
          create: {
            width: Math.max(1, part.rect.w),
            height: Math.max(1, part.rect.h),
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .png()
          .toBuffer();
      }
    }
  }

  const rig: Rig = {
    meta: {
      imageW: width,
      imageH: height,
      weaponPart: detectedWeapon || undefined,
      weaponPosition: weaponPosition || undefined,
    },
    bones,
    slots,
    parts,
    expressions: {
      neutral: {},
      happy: { mouth: 'mouth_smile.png' },
      angry: { mouth: 'mouth_grit.png' },
    },
  };

  return { rig, partsPngs };
}

