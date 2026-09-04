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
      revision: "offline-downloads-v1",
    },
    {
      url: "/downloads/read",
      revision: "offline-reader-v1",
    },
  ],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "zcmimltmpbmmfyohndaz.supabase.co",
      },
    ],
  },
};

export default withSerwist(nextConfig);