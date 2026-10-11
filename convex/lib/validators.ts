import { v, type Infer } from "convex/values";

/** How a work is shown on its card: what state it is in today. */
export const workStatus = v.union(
  v.literal("production"),
  v.literal("public"),
  v.literal("distributed"),
  v.literal("personal"),
  v.literal("archived"),
);
export type WorkStatus = Infer<typeof workStatus>;

/** Where a work's document, its images and its video are imported from. */
export const workSource = v.object({
  /** "owner/name" of a public GitHub repository. */
  repo: v.string(),
  /** Branch, tag or commit. */
  ref: v.string(),
  /** The Markdown document, from the repository root. */
  docPath: v.string(),
  /** The demo video, from the repository root. */
  videoPath: v.optional(v.string()),
});
export type WorkSource = Infer<typeof workSource>;

export const workLink = v.object({ label: v.string(), url: v.string() });
export type WorkLink = Infer<typeof workLink>;

export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
export const REPO = /^[\w.-]+\/[\w.-]+$/;
