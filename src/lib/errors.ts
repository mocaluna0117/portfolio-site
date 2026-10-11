import { ConvexError } from "convex/values";

/** What to tell the owner when a Convex call fails. */
export function errorMessage(error: unknown, fallback = "うまくいきませんでした。"): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: unknown } | string;
    if (typeof data === "string") return data;
    if (typeof data?.message === "string") return data.message;
  }
  if (error instanceof Error && error.message) return `${fallback}（${error.message}）`;
  return fallback;
}
