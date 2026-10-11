import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";

/** The home page and every published work; the admin screens never appear. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const works = await getPublishedSlugs();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...works.map((work) => ({
      url: `${base}/works/${work.slug}`,
      lastModified: new Date(work.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
