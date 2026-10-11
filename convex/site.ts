import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { scheduleRevalidate } from "./revalidate";

/** What the site says until the profile is written in the admin screen. */
export const DEFAULT_PROFILE = {
  handle: "もかるな",
  intro: "Web アプリを中心に、企画から設計・実装・運用までを一人で手がけています。",
  githubUrl: "https://github.com/mocaluna0117",
};

export async function getProfile(ctx: QueryCtx) {
  const row = await ctx.db
    .query("siteProfile")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .unique();
  return {
    handle: row?.handle ?? DEFAULT_PROFILE.handle,
    intro: row?.intro ?? DEFAULT_PROFILE.intro,
    githubUrl: row?.githubUrl ?? DEFAULT_PROFILE.githubUrl,
    updatedAt: row?.updatedAt ?? null,
  };
}

export const profile = query({ args: {}, handler: (ctx) => getProfile(ctx) });

export const updateProfile = mutation({
  args: { handle: v.string(), intro: v.string(), githubUrl: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const handle = args.handle.trim();
    const intro = args.intro.trim();
    const githubUrl = args.githubUrl.trim();
    if (!handle || handle.length > 40) {
      throw new ConvexError({ code: "INVALID", message: "名前は1〜40文字で入力してください。" });
    }
    if (intro.length > 400) {
      throw new ConvexError({ code: "INVALID", message: "紹介文は400文字までです。" });
    }
    if (!/^https:\/\/github\.com\/[\w.-]+\/?$/.test(githubUrl)) {
      throw new ConvexError({
        code: "INVALID",
        message: "GitHub の URL は https://github.com/<ユーザー名> の形で入力してください。",
      });
    }
    const row = await ctx.db
      .query("siteProfile")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    const values = { handle, intro, githubUrl, updatedAt: Date.now() };
    if (row) await ctx.db.patch(row._id, values);
    else await ctx.db.insert("siteProfile", { key: "global", ...values });
    await scheduleRevalidate(ctx);
  },
});
