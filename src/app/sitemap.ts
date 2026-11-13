import { MetadataRoute } from "next";
import { getPublishedProcedures } from "@/lib/data";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  // 1. Static public routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/home`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/procedures`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Dynamic published procedures only (strictly published: true)
  try {
    const procedures = await getPublishedProcedures();
    for (const proc of procedures) {
      if (proc.slug && proc.published) {
        routes.push({
          url: `${siteUrl}/procedures/${proc.slug}`,
          lastModified: proc.updated_at ? new Date(proc.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch {
    // Graceful fallback if database query fails during build
  }

  return routes;
}
