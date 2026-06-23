import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "zcmimltmpbmmfyohndaz.supabase.co",
      },
    ],
  },
};

export default nextConfig;