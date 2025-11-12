'use client';

// Rig Editor Component - Based on reference implementation
// Allows creating and editing rigs for pixel art characters

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Rig, Part, PartName, Rect, Pivot } from '../utils/rigTypes';

// Default parts configuration
const DEFAULT_PARTS: Part[] = [
  { name: 'torso', rect: null, pivot: null, z: 0 },
  { name: 'head', rect: null, pivot: null, z: 1, parent: 'torso' },
  { name: 'eyeL', rect: null, pivot: null, z: 2, parent: 'head' },
  { name: 'eyeR', rect: null, pivot: null, z: 2, parent: 'head' },
  { name: 'mouth', rect: null, pivot: null, z: 2, parent: 'head' },
  { name: 'armL', rect: null, pivot: null, z: 1, parent: 'torso' },
  { name: 'armR', rect: null, pivot: null, z: 1, parent: 'torso' },
  { name: 'wingL', rect: null, pivot: null, z: -1, parent: 'torso' },
  { name: 'wingR', rect: null, pivot: null, z: -1, parent: 'torso' },
  { name: 'legL', rect: null, pivot: null, z: 0, parent: 'torso' },
  { name: 'legR', rect: null, pivot: null, z: 0, parent: 'torso' },
  { name: 'tail', rect: null, pivot: null, z: -2, parent: 'torso' },
];

const COLORS: Record<PartName, string> = {
  torso: '#4ade80',
  head: '#60a5fa',
  eyeL: '#f472b6',
  eyeR: '#f472b6',
  mouth: '#f59e0b',
  armL: '#a78bfa',
  armR: '#a78bfa',
  wingL: '#22d3ee',
  wingR: '#22d3ee',
  legL: '#34d399',
  legR: '#34d399',
  tail: '#f43f5e',
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function rectFromPoints(ax: number, ay: number, bx: number, by: number): Rect {
  const x = Math.min(ax, bx);
  const y = Math.min(ay, by);
  const w = Math.abs(bx - ax);
  const h = Math.abs(by - ay);
  return { x, y, w, h };
}

function strokeRectPx(ctx: CanvasRenderingContext2D, r: Rect, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(r.x) + 0.5, Math.round(r.y) + 0.5, Math.round(r.w), Math.round(r.h));
  ctx.restore();
}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function useImage(url?: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.src = url;
  }, [url]);
  return img;
}

export function RigEditor() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selected, setSelected] = useState<PartName>('torso');
  const [parts, setParts] = useState<Record<PartName, Part>>(
    () => Object.fromEntries(DEFAULT_PARTS.map((p) => [p.name, p])) as Record<PartName, Part>
  );

  const img = useImage(imageUrl);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  // Fit canvas to image size
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const w = img?.width ?? 512;
    const h = img?.height ?? 512;
    c.width = w;
    c.height = h;
  }, [img]);

  // Draw loop
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, c.width, c.height);

    // Image
    if (img) ctx.drawImage(img, 0, 0);

    // Overlays
    Object.values(parts).forEach((p) => {
      if (!p.rect) return;
      strokeRectPx(ctx, p.rect, COLORS[p.name]);
      if (p.pivot) {
        fillCircle(ctx, p.rect.x + p.pivot.x, p.rect.y + p.pivot.y, 3, COLORS[p.name]);
      }
    });

    // Hover crosshair
    if (hover) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(hover.x + 0.5, 0);
      ctx.lineTo(hover.x + 0.5, c.height);
      ctx.moveTo(0, hover.y + 0.5);
      ctx.lineTo(c.width, hover.y + 0.5);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }, [img, parts, hover]);

  function onPointerDown(e: React.PointerEvent) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    setDragStart({ x, y });
  }

  function onPointerMove(e: React.PointerEvent) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    setHover({ x, y });

    if (!dragStart) return;
    setParts((prev) => {
      const p = { ...prev[selected] };
      p.rect = rectFromPoints(dragStart.x, dragStart.y, x, y);
      return { ...prev, [selected]: p };
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    if (e.altKey) {
      // Alt+Click to set pivot inside selected part
      setParts((prev) => {
        const p = { ...prev[selected] };
        if (p.rect) {
          p.pivot = {
            x: clamp(x - p.rect.x, 0, p.rect.w),
            y: clamp(y - p.rect.y, 0, p.rect.h),
          };
        }
        return { ...prev, [selected]: p };
      });
    }

    setDragStart(null);
  }

  function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImageUrl(url);
  }

  function exportRig() {
    if (!img) return;
    const rig: Rig = {
      meta: { sourceImage: imageUrl, imageW: img.width, imageH: img.height },
      bones: [
        { name: 'root' },
        { name: 'torso', parent: 'root', x: 0, y: 0 },
        { name: 'head', parent: 'torso' },
        { name: 'eyeL', parent: 'head' },
        { name: 'eyeR', parent: 'head' },
        { name: 'mouth', parent: 'head' },
        { name: 'armL', parent: 'torso' },
        { name: 'armR', parent: 'torso' },
        { name: 'wingL', parent: 'torso' },
        { name: 'wingR', parent: 'torso' },
        { name: 'legL', parent: 'torso' },
        { name: 'legR', parent: 'torso' },
        { name: 'tail', parent: 'torso' },
      ],
      slots: Object.values(parts)
        .filter((p) => p.rect)
        .map((p) => ({ name: p.name, bone: p.parent || 'root', texture: `${p.name}.png`, z: p.z ?? 0 })),
      parts,
      expressions: {
        neutral: { mouth: 'mouth_neutral.png' },
        happy: { mouth: 'mouth_smile.png' },
        angry: { mouth: 'mouth_grit.png' },
      },
    };

    const blob = new Blob([JSON.stringify(rig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rig.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <input type="file" accept="image/*" onChange={handleFile} className="block" />
          <button
            onClick={exportRig}
            disabled={!img}
            className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
          >
            Export rig.json
          </button>
          <span className="text-xs opacity-70">Tip: Alt+Click inside a part to set its pivot.</span>
        </div>
        <div className="border rounded overflow-hidden" style={{ imageRendering: 'pixelated' }}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="touch-none select-none"
          />
        </div>
      </div>

      <aside className="border rounded p-3 space-y-3 h-fit">
        <h2 className="font-medium">Parts</h2>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(parts) as PartName[]).map((name) => (
            <button
              key={name}
              onClick={() => setSelected(name)}
              className={`px-2 py-1 rounded border text-left ${
                selected === name ? 'bg-zinc-800 text-white' : 'bg-zinc-100'
              }`}
              style={{ borderColor: COLORS[name] }}
            >
              <div className="text-xs">{name}</div>
              <div className="text-[10px] opacity-70">
                {parts[name].rect ? `${parts[name].rect!.w}×${parts[name].rect!.h}` : 'unset'}
              </div>
            </button>
          ))}
        </div>

        <div className="text-sm">
          <div className="font-medium mb-1">Selected: {selected}</div>
          <p className="opacity-80 mb-1">Drag on canvas to set the {selected} rectangle.</p>
          <p className="opacity-80">Alt+Click inside the rectangle to set its pivot.</p>
        </div>

        <div className="text-xs opacity-70">
          <p className="mb-1">Recommended flow:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Load image (PNG with transparent bg if possible).</li>
            <li>Manually draw parts (torso, arms, wings, legs, tail).</li>
            <li>Set pivots (Alt+Click) where rotations should occur (e.g., shoulder, jaw).</li>
            <li>Export rig.json for use in the game.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

