import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
    inlineCss: true,
    optimizePackageImports: ["lucide-react", "zod", "three", "framer-motion"],
  },
  transpilePackages: ["three"],
  devIndicators: false,
};

export default nextConfig;
