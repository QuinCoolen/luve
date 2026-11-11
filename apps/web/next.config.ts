import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output is only needed for the Docker image (apps/web/Dockerfile
  // sets NEXT_STANDALONE=1). Locally on Windows it would fail: copying pnpm's
  // symlinked node_modules needs symlink rights.
  ...(process.env.NEXT_STANDALONE === "1"
    ? {
        output: "standalone" as const,
        // Trace files from the monorepo root so workspace deps are included.
        outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
      }
    : {}),
  // The app is browsed through the Traefik gateway (localhost:8000) in dev.
  allowedDevOrigins: ["localhost:8000", "127.0.0.1:8000"],
};

export default nextConfig;
