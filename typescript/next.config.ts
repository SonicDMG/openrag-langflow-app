import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: Turbopack warnings about file patterns in monsters route are expected
  // These occur because Next.js analyzes dynamic file paths (join(MONSTERS_DIR, monsterId))
  // The warnings don't affect functionality - they're performance notices about build-time analysis
};

export default nextConfig;
