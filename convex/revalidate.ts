import { internal } from "./_generated/api";
import { internalAction, type MutationCtx } from "./_generated/server";

/**
 * Tells the Next.js site its cached pages are out of date.
 *
 * The public pages are served from Next.js's cache (`"use cache"`, tag
 * "portfolio") and only change when this is called, so every mutation that
 * changes what visitors see schedules it. Going through Convex rather than the
 * admin screen means a change made any other way (an import started from the
 * command line, a fix in the dashboard) is published too.
 *
 * SITE_URL is the same variable Better Auth reads; REVALIDATE_SECRET is shared
 * with the site. Without them (a test, a fresh deployment) this does nothing.
 */
export const site = internalAction({
  args: {},
  handler: async () => {
    const siteUrl = process.env.SITE_URL;
    const secret = process.env.REVALIDATE_SECRET;
    if (!siteUrl || !secret) return;
    try {
      const response = await fetch(new URL("/api/revalidate", siteUrl), {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
      });
      if (!response.ok) console.warn(`revalidate: the site answered ${response.status}`);
    } catch (error) {
      console.warn("revalidate: the site could not be reached", error);
    }
  },
});

export async function scheduleRevalidate(ctx: MutationCtx): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.revalidate.site, {});
}
