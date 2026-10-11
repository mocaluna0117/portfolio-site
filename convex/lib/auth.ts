import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";

/** Anything that can say who is calling: a query, mutation or action context. */
type AuthCtx = { auth: { getUserIdentity(): Promise<UserIdentity | null> } };

/**
 * Whether an address is named in the deployment's ADMIN_EMAILS.
 *
 * Read per call, not at module load, so changing the variable takes effect on
 * the next request.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

/**
 * The caller's identity, or null when signed out.
 *
 * Better Auth issues its tokens from this deployment's own site URL, which the
 * platform always provides. A token from any other issuer is refused rather
 * than trusted, so adding a provider later has to extend this on purpose.
 * The variable is absent only under convex-test.
 */
export async function getIdentity(ctx: AuthCtx): Promise<UserIdentity | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const expectedIssuer = process.env.CONVEX_SITE_URL;
  if (expectedIssuer && identity.issuer !== expectedIssuer) return null;
  return identity;
}

/**
 * Every function that changes the site or reads what visitors cannot see
 * calls this first. The email comes from the signed token (the Better Auth
 * Convex plugin puts the user's fields in it), so no lookup is needed.
 */
export async function requireAdmin(ctx: AuthCtx): Promise<UserIdentity> {
  const identity = await getIdentity(ctx);
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "ログインが必要です。" });
  }
  if (!isAdminEmail(identity.email)) {
    throw new ConvexError({ code: "FORBIDDEN", message: "管理者だけが実行できます。" });
  }
  return identity;
}
