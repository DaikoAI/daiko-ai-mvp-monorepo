import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["http://localhost:3000"],
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
