import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // typedRoutes: true,
    viewTransition: true,
    // ppr: "incremental",
    reactCompiler: true,
    // useCache: true,
    staleTimes: {
      dynamic: 60 * 5, // 5 minutes = batch update interval
    },
    // optimizePackageImports: ["solana-agent-kit"],
  },
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

const withSerwist = withSerwistInit({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(nextConfig);
