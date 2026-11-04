import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  additionalPrecacheEntries: [
    {
      url: "/downloads",
      revision: "offline-downloads-v2",
    },
  ],
});

const nextConfig: NextConfig = {
    images: {
    // Fewer, larger-step image sizes means far fewer image transformations
    formats: ["image/webp"],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [80, 160, 320, 480],

    // Keep optimized images for 31 days (a stable image is not re-processed)
    minimumCacheTTL: 2678400,

    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "zcmimltmpbmmfyohndaz.supabase.co",
      },
    ],
  },
};

export default withSerwist(nextConfig);