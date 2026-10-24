import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boundlessarchive.org"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/editor",
          "/api/",
          "/auth/",
          "/wallet",
          "/profile",
          "/library",
          "/notifications",
          "/shop",
          "/quests",
          "/cultivation",
          "/stories",
          "/downloads",
          "/refer",
          "/search",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
