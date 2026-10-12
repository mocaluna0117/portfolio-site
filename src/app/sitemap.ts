import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublishedSlugs } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";

/**
 * The home page and every published work; the admin screens never appear.
 *
 * Made on each request rather than prerendered: on Vercel the prerendered
 * sitemap kept its build-time contents after the "portfolio" tag was
 * revalidated (and after revalidatePath too), while the pages beside it were
 * rendered afresh. Only crawlers ask for it, and the list itself still comes
 * from the tagged cache, so this costs next to nothing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
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
