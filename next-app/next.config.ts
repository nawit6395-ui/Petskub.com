import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Point Turbopack at the monorepo root so it can resolve shared/* modules
    // and reuse the root-level node_modules while still importing from next-app.
    root: path.join(__dirname, ".."),
  },
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
