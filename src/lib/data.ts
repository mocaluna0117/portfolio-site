import "server-only";
import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";

/**
 * The tag on everything the public pages read from Convex. Convex asks the
 * site to drop it whenever what visitors see changes (convex/revalidate.ts,
 * src/app/api/revalidate/route.ts), so the pages are served from the cache
 * and are never more than a moment out of date.
 */
export const PORTFOLIO_TAG = "portfolio";

/**
 * A day is only the fallback: an edit reaches visitors through the tag, at
 * once. This bounds how long a missed notice could leave a page stale.
 */
function cached() {
  cacheLife("days");
  cacheTag(PORTFOLIO_TAG);
}

export async function getProfile() {
  "use cache";
  cached();
  return await fetchQuery(api.site.profile, {});
}

export async function getWorks() {
  "use cache";
  cached();
  return await fetchQuery(api.works.listPublished, {});
}

export async function getWork(slug: string) {
  "use cache";
  cached();
  return await fetchQuery(api.works.getBySlug, { slug });
}

export async function getPublishedSlugs() {
  "use cache";
  cached();
  return await fetchQuery(api.works.listPublishedSlugs, {});
}

export type Work = NonNullable<Awaited<ReturnType<typeof getWork>>>;
export type WorkCard = Awaited<ReturnType<typeof getWorks>>[number];
