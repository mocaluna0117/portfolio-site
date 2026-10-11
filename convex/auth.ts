import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { getIdentity, isAdminEmail } from "./lib/auth";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * Email and password exist only so local development and the end-to-end tests
 * can sign in without a Google OAuth client. Production never sets this.
 */
const allowPasswordAuth = process.env.ALLOW_PASSWORD_AUTH === "true";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    ...(allowPasswordAuth
      ? { emailAndPassword: { enabled: true, requireEmailVerification: false } }
      : {}),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Only the site's owner ever signs in. Refusing the account here
          // means no one else's ever exists, so nothing downstream has to
          // tell an owner from a stranger who merely got a session.
          before: async (user) => {
            if (!isAdminEmail(user.email)) {
              throw new APIError("FORBIDDEN", {
                message: "このサイトにログインできるのは管理者だけです。",
              });
            }
          },
        },
      },
    },
    plugins: [convex({ authConfig })],
  });

/** Who is signed in, for the admin screens' guard. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentity(ctx);
    if (!identity) return null;
    return { email: identity.email ?? null, isAdmin: isAdminEmail(identity.email) };
  },
});
