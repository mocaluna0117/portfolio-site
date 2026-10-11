import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  /** However many people write, mail stays within the free plan. */
  contactGlobal: { kind: "fixed window", rate: 30, period: HOUR },
  /** One sender, a few messages an hour. */
  contactSender: { kind: "token bucket", rate: 3, period: HOUR, capacity: 3 },
});

const LIMITS = { name: 80, email: 200, body: 2000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const invalid = (message: string) => new ConvexError({ code: "INVALID", message });

/** Cloudflare Turnstile's answer for the token the widget gave the browser. */
async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret)
    throw new ConvexError({ code: "CONFIG", message: "問い合わせフォームは準備中です。" });
  const body = new URLSearchParams({ secret, response: token });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

/**
 * A message from the contact form. Checked here, not in the page, since
 * anyone can call a Convex function directly: the Turnstile token proves a
 * person filled the form, the limits keep anyone from flooding the inbox, and
 * the message is kept before mail is tried, so a failed send loses nothing.
 */
export const submit = action({
  args: {
    name: v.string(),
    email: v.string(),
    body: v.string(),
    turnstileToken: v.string(),
    /** A field people never see; a bot that fills it is thanked and ignored. */
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.website) return { ok: true };
    const name = args.name.trim();
    const email = args.email.trim();
    const body = args.body.trim();
    if (!name || name.length > LIMITS.name) throw invalid("お名前は80文字までで入力してください。");
    if (!EMAIL.test(email) || email.length > LIMITS.email) {
      throw invalid("メールアドレスを確かめてください。");
    }
    if (!body || body.length > LIMITS.body) throw invalid("本文は2000文字までで入力してください。");
    if (!(await verifyTurnstile(args.turnstileToken))) {
      throw invalid(
        "確認がうまくいきませんでした。ページを読み込み直して、もう一度お試しください。",
      );
    }

    const id = await ctx.runMutation(internal.contact.reserve, { name, email, body });

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !to) {
      await ctx.runMutation(internal.contact.markFailed, {
        id,
        error: "メール送信の設定がありません",
      });
      return { ok: true };
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
          to: [to],
          reply_to: email,
          subject: `【ポートフォリオ】${name} さんからのお問い合わせ`,
          text: `${name} <${email}>\n\n${body}\n`,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!response.ok) throw new Error(result.message ?? `HTTP ${response.status}`);
      await ctx.runMutation(internal.contact.markSent, { id, resendId: result.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await ctx.runMutation(internal.contact.markFailed, { id, error: message.slice(0, 500) });
    }
    // Kept either way; the owner sees it in the admin screen.
    return { ok: true };
  },
});

export const reserve = internalMutation({
  args: { name: v.string(), email: v.string(), body: v.string() },
  handler: async (ctx, { name, email, body }) => {
    const sender = await rateLimiter.limit(ctx, "contactSender", { key: email.toLowerCase() });
    const all = sender.ok ? await rateLimiter.limit(ctx, "contactGlobal") : sender;
    if (!all.ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        message:
          "短い間に何度も送られたため、受け付けを止めています。時間をおいてもう一度お試しください。",
      });
    }
    return await ctx.db.insert("contactMessages", {
      name,
      email,
      body,
      createdAt: Date.now(),
      status: "pending",
    });
  },
});

export const markSent = internalMutation({
  args: { id: v.id("contactMessages"), resendId: v.optional(v.string()) },
  handler: async (ctx, { id, resendId }) => {
    await ctx.db.patch(id, { status: "sent", resendId });
  },
});

export const markFailed = internalMutation({
  args: { id: v.id("contactMessages"), error: v.string() },
  handler: async (ctx, { id, error }) => {
    await ctx.db.patch(id, { status: "failed", error });
  },
});

/** The newest messages, for the admin screen. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("contactMessages").withIndex("by_createdAt").order("desc").take(100);
  },
});
