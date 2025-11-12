'use client';

import { RigEditor } from '../components/RigEditor';

export default function RigEditorPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Pixel Rig Editor</h1>
      <p className="text-sm opacity-80 mb-4">
        Load an image, draw rectangles for parts, set pivots by Alt+Click inside a part, then export a rig.json. Use
        this to create custom rigs for dynamically generated pixel art characters.
      </p>
      <RigEditor />
    </div>
  );
}

