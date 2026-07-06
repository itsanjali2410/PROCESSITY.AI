import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the home directory makes
  // Next.js guess wrong otherwise
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
