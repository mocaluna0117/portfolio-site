import { internalMutation } from "./_generated/server";
import { DEFAULT_PROFILE } from "./site";
import { SEED_WORKS } from "./seedData";

/**
 * Creates the starting works and profile where they do not exist yet
 * (`npx convex run seed:run`). Anything already there is left as edited.
 * Importing the documents is a separate step: `importWork:importAll`.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const created: string[] = [];
    const last = await ctx.db.query("works").withIndex("by_order").order("desc").first();
    let order = (last?.order ?? -1) + 1;
    for (const seed of SEED_WORKS) {
      const existing = await ctx.db
        .query("works")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .unique();
      if (existing) continue;
      await ctx.db.insert("works", {
        ...seed,
        highlights: [],
        published: true,
        order: order++,
        createdAt: now,
        updatedAt: now,
      });
      created.push(seed.slug);
    }

    const profile = await ctx.db
      .query("siteProfile")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    if (!profile) {
      await ctx.db.insert("siteProfile", { key: "global", ...DEFAULT_PROFILE, updatedAt: now });
    }
    return { created, profileCreated: !profile };
  },
});
