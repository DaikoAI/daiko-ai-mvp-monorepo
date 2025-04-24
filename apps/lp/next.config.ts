import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
    optimizePackageImports: ["three"],
  },
  transpilePackages: ["three"],
  devIndicators: false,
};

export default nextConfig;
