import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
    inlineCss: true,
    optimizePackageImports: [
      "lucide-react",
      "zod",
      "three",
      "@react-three/drei",
      "@react-three/fiber",
    ],
  },
  transpilePackages: ["three"],
  devIndicators: false,
};

export default nextConfig;
