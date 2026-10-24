import type { MetadataRoute } from "next";
import { createAdminClient } from "@/utils/supabase/admin";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boundlessarchive.org"
).replace(/\/$/, "");

// Rebuilt at most once an hour.
export const revalidate = 3600;

const MAX_CHAPTERS = 5000;

/*
 * Public pages for search engines: stories, authors who allow search, and
 * chapters of stories that aren't copy-protected. Drafts never appear.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/trending`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const admin = createAdminClient();

    const [stories, authors, chapters] = await Promise.all([
      admin
        .from("stories")
        .select("slug, updated_at")
        .neq("status", "Draft")
        .not("slug", "is", null)
        .limit(10000),
      admin
        .from("profiles")
        .select("username, created_at")
        .eq("is_author", true)
        .eq("is_searchable", true)
        .not("username", "is", null)
        .limit(10000),
      admin
        .from("chapters")
        .select("id, updated_at, stories!inner(status, copy_protected)")
        .eq("status", "Published")
        .neq("stories.status", "Draft")
        .not("stories.copy_protected", "is", true)
        .order("updated_at", { ascending: false })
        .limit(MAX_CHAPTERS),
    ]);

    for (const s of stories.data ?? []) {
      entries.push({
        url: `${SITE_URL}/story/${s.slug}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const a of authors.data ?? []) {
      entries.push({
        url: `${SITE_URL}/author/${a.username}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }

    for (const c of chapters.data ?? []) {
      entries.push({
        url: `${SITE_URL}/chapter/${c.id}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch (error) {
    // Serve the static pages rather than failing the whole sitemap.
    console.error("Sitemap query failed:", error);
  }

  return entries;
}
