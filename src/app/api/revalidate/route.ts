import { revalidateTag } from "next/cache";
import { PORTFOLIO_TAG } from "@/lib/data";

/**
 * Called by Convex (convex/revalidate.ts) whenever what visitors see has
 * changed. The secret is shared between the two; without it, anyone could
 * make every page render afresh, which costs nothing but work.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("authorization");
  if (!secret || given !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  // Not served stale: the next visitor waits for the new page instead.
  revalidateTag(PORTFOLIO_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
