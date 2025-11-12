'use client';

import { useEffect, useRef } from 'react';
import { Rig, PartName } from '../utils/rigTypes';

interface RigPlayerProps {
  bundleUrl: string;
  expression?: string;
  wind?: number;
  cast?: boolean;
  spellType?: 'attack' | 'heal' | 'neutral';
  width?: number;
  height?: number;
}

export default function RigPlayer({
  bundleUrl,
  expression = 'neutral',
  wind = 0.6,
  cast = false,
  spellType = 'neutral',
  width = 256,
  height = 256,
}: RigPlayerProps) {
  const host = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const pixiRef = useRef<any>(null); // Store PIXI module for cleanup
  const bonesRef = useRef<Record<string, any>>({});
  const rigRef = useRef<Rig | null>(null);
  const animationStateRef = useRef<{ wind: number; cast: boolean; expression: string; spellType: string }>({ 
    wind, 
    cast, 
    expression,
    spellType,
  });

  // Update animation state when props change
  useEffect(() => {
    animationStateRef.current = { wind, cast, expression, spellType };
  }, [wind, cast, expression, spellType]);

  // Initialize PIXI app and load rig (only when bundleUrl, width, or height changes)
  useEffect(() => {
    if (!host.current) return;

    let PIXI: any; // Declare at outer scope for cleanup access
    let app: any;
    let t = 0;

    (async () => {
      try {
        // Dynamically import pixi.js to avoid SSR issues
        const pixiModule = await import('pixi.js');
        PIXI = pixiModule.default || pixiModule;
        pixiRef.current = PIXI; // Store for cleanup

        // Set pixelated rendering (handle different import structures)
        // In pixi.js v8, settings might be in different locations
        try {
          // PixiJS v8: Use string 'nearest' instead of SCALE_MODES.NEAREST
          const nearestMode = 'nearest';
          if (PIXI.settings) {
            PIXI.settings.SCALE_MODE = nearestMode;
          } else if (PIXI.BaseTexture?.defaultOptions) {
            PIXI.BaseTexture.defaultOptions.scaleMode = nearestMode;
          } else if (PIXI.Settings) {
            PIXI.Settings.SCALE_MODE = nearestMode;
          }
        } catch (e) {
          console.warn('Could not set PIXI scale mode:', e);
        }

        // Create PIXI Application - in v8, Application might need to be awaited
        try {
          if (PIXI.Application && typeof PIXI.Application.prototype.init === 'function') {
            // v8 async initialization
            app = new PIXI.Application();
            await app.init({
              width,
              height,
              backgroundAlpha: 0,
              antialias: false,
              resolution: 1,
            });
          } else {
            // v7 or older synchronous initialization
            app = new PIXI.Application({
              width,
              height,
              backgroundAlpha: 0,
              antialias: false,
              resolution: 1,
            });
          }
        } catch (initError) {
          console.error('Failed to initialize PIXI Application:', initError);
          throw new Error(`Failed to create PIXI Application: ${initError}`);
        }

        if (!app) {
          throw new Error('PIXI Application is undefined after creation');
        }

        // Set scale mode on the renderer if available
        if (app.renderer && app.renderer.texture) {
          try {
            app.renderer.texture.defaultOptions = app.renderer.texture.defaultOptions || {};
            app.renderer.texture.defaultOptions.scaleMode = 'nearest';
          } catch (e) {
            // Ignore if not available
          }
        }

        // Get the canvas element - in pixi.js v8 it might be app.canvas or app.view
        const canvasElement = app?.canvas || app?.view || (app?.renderer?.canvas);
        if (!canvasElement) {
          throw new Error('Failed to get canvas element from PIXI Application');
        }

        if (host.current) {
          host.current.appendChild(canvasElement as unknown as Node);
        }
        appRef.current = app;

        // Layered approach: Load full sprite as base, then layer animated parts on top
        let baseSprite: any = null;
        let animatedParts: Record<string, any> = {};
        const loadedTextures: string[] = []; // Track loaded textures for proper cleanup
        
        try {
          // Load the full 256.png image as the base (static background + character)
          const fullImageUrl = `${bundleUrl}/256.png`;
          const fullTexture = await PIXI.Assets.load(fullImageUrl);
          loadedTextures.push(fullImageUrl);
          
          // PixiJS v8: Use 'source' instead of 'baseTexture'
          const textureSource = (fullTexture as any).source || (fullTexture as any).baseTexture;
          if (textureSource) {
            try {
              textureSource.scaleMode = 'nearest';
            } catch (e) {
              // Ignore if scaleMode can't be set
            }
          }
          
          baseSprite = new PIXI.Sprite(fullTexture);
          baseSprite.anchor.set(0.5);
          baseSprite.x = width / 2;
          baseSprite.y = height / 2;
          app.stage.addChild(baseSprite);
          
          // Store base sprite reference
          (app as any)._baseSprite = baseSprite;
        } catch (error) {
          // Base image not available, will use rig parts only
        }
        
        // Now load rig and extract wind-affected parts to layer on top
        try {
          // Load rig.json to get part definitions
          const rigResponse = await fetch(`${bundleUrl}/rig.json`);
          if (!rigResponse.ok) {
            throw new Error(`Failed to load rig: ${rigResponse.statusText}`);
          }
          const rig: Rig = await rigResponse.json();
          rigRef.current = rig;

          // Get expression swaps (use current expression from ref)
          const currentExpression = animationStateRef.current.expression;
          const swaps = rig.expressions?.[currentExpression] ?? {};

          // Create bone containers for positioning animated parts
          const bones: Record<string, any> = {};
          bonesRef.current = bones;
          
          // Get animation config from rig metadata, or use defaults
          const animConfig = rig.meta?.animationConfig;
          const windParts = animConfig?.windParts || ['hatTip', 'beard', 'hair', 'sleeveL', 'sleeveR', 'cape', 'robeL', 'robeR'];
          const weaponParts = ['staffTip', 'swordTip', 'wandTip', 'wingL', 'wingR', 'tail', 'mouth'];
          const allAnimatedParts = [...windParts, ...weaponParts];
          
          for (const b of rig.bones) {
            if (allAnimatedParts.includes(b.name)) {
              const c = new PIXI.Container();
              c.x = b.x ?? 0;
              c.y = b.y ?? 0;
              c.rotation = b.rotation ?? 0;
              bones[b.name] = c;
              // Add to stage (not hierarchy) so they layer on top of base sprite
              app.stage.addChild(c);
            }
          }

          // Load and create sprites for wind-affected parts and weapon parts
          const windPartNames = windParts; // Use from config
          const weaponPartNames = ['staffTip', 'swordTip', 'wandTip', 'wingL', 'wingR', 'tail', 'mouth'];
          const allPartNames = [...windPartNames, ...weaponPartNames];
          for (const partName of allPartNames) {
            const slot = rig.slots.find(s => s.name === partName);
            if (slot) {
              const texName = swaps[slot.name] ?? slot.texture;
              const textureUrl = `${bundleUrl}/${texName}`;

              try {
                const texture = await PIXI.Assets.load(textureUrl);
                loadedTextures.push(textureUrl); // Track for cleanup
                // Set scale mode to nearest for pixelated rendering
                // PixiJS v8: Use 'source' instead of 'baseTexture'
                const textureSource = (texture as any).source || (texture as any).baseTexture;
                if (textureSource) {
                  try {
                    textureSource.scaleMode = 'nearest';
                  } catch (e) {
                    // Ignore if scaleMode can't be set
                  }
                }
                const spr = new PIXI.Sprite(texture);
                
                // Position sprite based on part rect and pivot
                // The pivot point is where the part should rotate around, in image coordinates
                const part = rig.parts?.[partName as PartName];
                let baseX = 0;
                let baseY = 0;
                
                if (part && part.rect && part.pivot) {
                  // Get actual texture dimensions (may be smaller than rect if clamped)
                  const textureWidth = texture.width;
                  const textureHeight = texture.height;
                  
                  // Calculate clamped rect (same logic as in autoRig.ts)
                  const left = Math.max(0, Math.min(part.rect.x, width - 1));
                  const top = Math.max(0, Math.min(part.rect.y, height - 1));
                  
                  // Pivot point in original image coordinates
                  const pivotX = part.rect.x + part.pivot.x;
                  const pivotY = part.rect.y + part.pivot.y;
                  
                  // Pivot point relative to the extracted texture's top-left corner
                  // Account for clamping: if rect was clamped, adjust pivot position
                  const pivotInTextureX = pivotX - left;
                  const pivotInTextureY = pivotY - top;
                  
                  // Clamp pivot to texture bounds (in case it's outside due to clamping)
                  const clampedPivotX = Math.max(0, Math.min(pivotInTextureX, textureWidth));
                  const clampedPivotY = Math.max(0, Math.min(pivotInTextureY, textureHeight));
                  
                  // Set anchor point to match the pivot position within the texture
                  // This way rotation happens around the pivot point
                  spr.anchor.set(
                    clampedPivotX / textureWidth,
                    clampedPivotY / textureHeight
                  );
                  
                  // Position sprite so the pivot point aligns with its position in the original image
                  // Convert from image coordinates to canvas coordinates (relative to center)
                  baseX = pivotX - width / 2;
                  baseY = pivotY - height / 2;
                } else {
                  // Fallback: center anchor if no part info
                  spr.anchor.set(0.5);
                }
                
                // Store base position for animation updates
                (spr as any)._baseX = baseX;
                (spr as any)._baseY = baseY;
                
                // Initial position (will be updated in animation loop)
                spr.x = baseSprite ? baseSprite.x + baseX : width / 2 + baseX;
                spr.y = baseSprite ? baseSprite.y + baseY : height / 2 + baseY;
                
                // Add directly to stage so it layers on top of base sprite
                app.stage.addChild(spr);
                
                animatedParts[partName] = spr;
              } catch (error) {
                console.warn(`Failed to load texture ${textureUrl} for ${partName}:`, error);
              }
            }
          }
          
          // Store animated parts reference
          (app as any)._animatedParts = animatedParts;
        } catch (error) {
          console.warn('Failed to load rig parts, using base sprite only:', error);
        }

        // Animation loop using PIXI ticker
        let tickerFn: (() => void) | null = null;
        const baseSpriteY = height / 2;
        const baseSpriteX = width / 2;
        
        tickerFn = () => {
          if (!app || !app.ticker) return;
          
          t += app.ticker.deltaMS / 1000; // Convert delta to seconds
          const currentState = animationStateRef.current;
          const baseSprite = (app as any)._baseSprite;
          const animatedParts = (app as any)._animatedParts || {};
          const currentBones = bonesRef.current;
          const currentRig = rigRef.current;

          // Layered animation approach: base sprite + animated parts
          if (baseSprite) {
            // Base sprite stays centered (no idle bob)
            baseSprite.x = baseSpriteX;
            baseSprite.y = baseSpriteY;
            
            // Make animated parts follow the base sprite's position
            Object.values(animatedParts).forEach((part: any) => {
              if (part) {
                // Parts are positioned relative to center
                part.x = baseSprite.x + (part._baseX || 0);
                part.y = baseSprite.y + (part._baseY || 0);
              }
            });
            
            // Expression: adjust tint for different emotions (subtle)
            if (currentState.expression === 'happy') {
              baseSprite.tint = 0xffffdd; // Subtle yellow tint
            } else if (currentState.expression === 'angry') {
              baseSprite.tint = 0xffdddd; // Subtle red tint
            } else {
              baseSprite.tint = 0xffffff; // Normal (white = no tint)
            }
            
            // Get animation config once (used for both wind and weapon)
            const animConfig = currentRig?.meta?.animationConfig;
            
            // Wind effects: apply to configured wind-affected parts
            const configuredWindParts = animConfig?.windParts || ['hatTip', 'beard', 'hair', 'sleeveL', 'sleeveR', 'cape', 'robeL', 'robeR'];
            
            if (currentState.wind > 0) {
              const sway = (phase: number, amp: number) =>
                Math.sin(t * 3 + phase) * currentState.wind * amp;
              
              // Apply wind to all configured parts with varying phases and amplitudes
              configuredWindParts.forEach((partName, index) => {
                const part = animatedParts[partName];
                if (part) {
                  // Vary phase and amplitude based on part type and index
                  const phase = (index * 0.3) % (Math.PI * 2);
                  let amp = 0.08; // Default amplitude
                  
                  // Adjust amplitude based on part type
                  if (partName.includes('sleeve') || partName.includes('wing')) {
                    amp = 0.12; // More movement for extremities
                  } else if (partName.includes('cape') || partName.includes('robe')) {
                    amp = 0.1; // Moderate movement for flowing cloth
                  } else if (partName.includes('hair') || partName.includes('beard')) {
                    amp = 0.1; // Moderate movement for hair/beard
                  } else if (partName.includes('tail')) {
                    amp = 0.15; // More movement for tail
                  }
                  
                  part.rotation = sway(phase, amp);
                }
              });
            } else {
              // Reset wind effects when wind is 0
              for (const partName of configuredWindParts) {
                if (animatedParts[partName]) {
                  animatedParts[partName].rotation = 0;
                }
              }
            }
            
            // Weapon glow effect and casting particles
            // Detect weapon from animation config or rig metadata, with fallback
            const weaponPartName = animConfig?.weaponPart || 
                                  currentRig?.meta?.weaponPart || 
                                  'staffTip';
            const weaponPart = animatedParts[weaponPartName] || 
                              animatedParts.staffTip || 
                              animatedParts.swordTip || 
                              animatedParts.wandTip ||
                              animatedParts.wingL ||
                              animatedParts.wingR ||
                              animatedParts.tail ||
                              animatedParts.mouth;
            let weaponGlow = (app as any)._weaponGlow;
            
            if (currentState.cast && weaponPart) {
              // Create or update weapon glow effect
              if (!weaponGlow) {
                weaponGlow = new PIXI.Graphics();
                app.stage.addChild(weaponGlow);
                (app as any)._weaponGlow = weaponGlow;
              }
              
              // Determine glow color based on spell type
              let glowColor = 0x66ccff; // Default blue
              if (currentState.spellType === 'attack') {
                glowColor = 0xff4444; // Red/orange for attacks
              } else if (currentState.spellType === 'heal') {
                glowColor = 0x44ff44; // Green for heals
              }
              
              // Update glow position and animation
              weaponGlow.clear();
              const glowSize = 8 + Math.sin(t * 5) * 2; // Pulsing glow
              const glowAlpha = 0.6 + Math.sin(t * 4) * 0.2; // Pulsing alpha
              
              // Draw glow at weapon tip position (PixiJS v8 API)
              weaponGlow.x = weaponPart.x;
              weaponGlow.y = weaponPart.y;
              weaponGlow.circle(0, 0, glowSize).fill({ color: glowColor, alpha: glowAlpha });
              
              // Add outer glow ring
              weaponGlow.circle(0, 0, glowSize * 1.5).fill({ color: glowColor, alpha: glowAlpha * 0.3 });
              
              // Particle effect - spawn from weapon tip
              let particleContainer = (app as any)._particleContainer;
              if (!particleContainer) {
                particleContainer = new PIXI.Container();
                app.stage.addChild(particleContainer);
                (app as any)._particleContainer = particleContainer;
              }
              // Position container at weapon tip
              particleContainer.x = weaponPart.x;
              particleContainer.y = weaponPart.y;
              spawnSpellSpark(PIXI, app, particleContainer, t, glowColor);
            } else {
              // Remove glow when not casting
              if (weaponGlow) {
                app.stage.removeChild(weaponGlow);
                weaponGlow.destroy();
                (app as any)._weaponGlow = null;
              }
              
              // Clean up particle container when not casting
              const particleContainer = (app as any)._particleContainer;
              if (particleContainer && particleContainer.children) {
                if (particleContainer.children.length === 0) {
                  app.stage.removeChild(particleContainer);
                  particleContainer.destroy({ children: true });
                  (app as any)._particleContainer = null;
                }
              }
            }
          } else if (currentBones && currentRig && Object.keys(currentBones).length > 0) {
            // Rig-based animations (fallback)
            // Head bob (idle animation) - make it more visible
            if (currentBones.head) {
              const baseY = currentRig.bones.find((b) => b.name === 'head')?.y ?? 0;
              currentBones.head.y = baseY + Math.sin(t * 2) * 2; // Increased from 0.4 to 2 for visibility
            }

            // Beard & robe sway (wind effect) - make it more visible
            const sway = (phase: number, amp: number) =>
              Math.sin(t * 3 + phase) * amp * currentState.wind;

            const windParts = ['beard', 'robeL', 'robeR', 'hatTip', 'armL', 'armR']; // Added arms for more visible animation
            for (const partName of windParts) {
              if (currentBones[partName]) {
                currentBones[partName].rotation = sway(0.6, 0.15); // Increased from 0.08 to 0.15
              }
            }

            // Blink animation - make it more visible
            const blink = Math.floor(t * 60) % 180 < 4;
            if (currentBones.eyeL) {
              currentBones.eyeL.scale.y = blink ? 0.1 : 1;
            }
            if (currentBones.eyeR) {
              currentBones.eyeR.scale.y = blink ? 0.1 : 1;
            }

            // Casting particle effect
            if (currentState.cast) {
              spawnSpellSpark(PIXI, app, currentBones['staffTip'] ?? app.stage, t);
            }
          }
        };
        
        // Add ticker
        app.ticker.add(tickerFn);
        
        // Store ticker function reference and loaded textures for cleanup
        (app as any)._tickerFn = tickerFn;
        (app as any)._loadedTextures = loadedTextures;
      } catch (error) {
        console.error('Failed to load rig:', error);
      }
    })();

    return () => {
      if (appRef.current) {
        try {
          // Remove ticker function if it exists
          const tickerFn = (appRef.current as any)._tickerFn;
          if (tickerFn && appRef.current.ticker) {
            appRef.current.ticker.remove(tickerFn);
          }
          
          // Unload textures properly using Assets.unload() instead of destroying
          const loadedTextures = (appRef.current as any)._loadedTextures || [];
          const PIXI = pixiRef.current;
          if (loadedTextures.length > 0 && PIXI?.Assets) {
            // Unload textures asynchronously
            Promise.all(loadedTextures.map((url: string) => 
              PIXI.Assets.unload(url).catch((e: any) => {
                // Ignore errors for textures that may already be unloaded
              })
            )).catch(() => {
              // Ignore errors
            });
          }
          
          // Destroy the app (this will clean up containers, but textures should be unloaded first)
          appRef.current.destroy(true, {
            children: true,
            texture: false, // Don't destroy textures, we unloaded them
            baseTexture: false,
          });
        } catch (e) {
          console.warn('Error destroying PIXI app:', e);
        }
        appRef.current = null;
        bonesRef.current = {};
        rigRef.current = null;
      }
    };
  }, [bundleUrl, width, height]); // Only reinitialize when bundleUrl, width, or height changes

  // Handle expression changes (update textures)
  useEffect(() => {
    if (!appRef.current || !rigRef.current || !bonesRef.current) return;

    const app = appRef.current;
    const rig = rigRef.current;
    const bones = bonesRef.current;
    const swaps = rig.expressions?.[expression] ?? {};

    // Update textures for expression swaps
    // This is a simplified version - in a full implementation, you'd swap textures
    // For now, we'll just note that expression changes require a full reload
    // which is handled by the main effect when bundleUrl changes
  }, [expression, bundleUrl]);

  return (
    <div
      ref={host}
      style={{
        imageRendering: 'pixelated',
        width: width * 2,
        height: height * 2,
        transform: 'scale(2)',
        transformOrigin: 'top left',
        display: 'inline-block',
      }}
      className="rig-player-container"
    />
  );
}

// Spell spark particle effect
function spawnSpellSpark(
  PIXI: any,
  app: any,
  parent: any,
  t: number,
  baseColor: number = 0x66ccff
) {
  // Spawn every 4 frames (15 times per second at 60fps) - more frequent
  if (Math.floor(t * 60) % 4 !== 0) return;

  const g = new PIXI.Graphics();
  // Larger, more visible particles
  const size = 2 + Math.random() * 2;
  // Vary color based on base color (attack = red/orange, heal = green, default = blue)
  const colorVariation = Math.random() * 0x3300;
  const color = baseColor + colorVariation;
  // PixiJS v8 API: use rect().fill() instead of beginFill/drawRect/endFill
  g.rect(-size/2, -size/2, size, size).fill({ color });
  parent.addChild(g);

  // Random starting position around center (smaller spread for better targeting)
  g.x = (Math.random() - 0.5) * 10;
  g.y = (Math.random() - 0.5) * 10;

  let life = 40; // Longer life
  let vy = -0.8 - Math.random() * 0.4; // Faster upward movement
  let vx = (Math.random() - 0.5) * 0.6; // Less horizontal spread for better effect

  const tick = () => {
    life--;
    g.x += vx;
    g.y += vy;
    g.alpha = life / 40;
    
    // Fade out more gradually
    if (life < 10) {
      g.alpha = life / 10;
    }

    if (life <= 0) {
      if (parent && parent.children) {
        parent.removeChild(g);
      }
      g.destroy();
      app.ticker.remove(tick);
    }
  };

  app.ticker.add(tick);
}

