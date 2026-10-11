import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { workLink, workSource, workStatus } from "./lib/validators";

export default defineSchema({
  /** The site's one profile row: the handle, a line about its owner, GitHub. */
  siteProfile: defineTable({
    key: v.literal("global"),
    handle: v.string(),
    intro: v.string(),
    githubUrl: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  /** What the site says about each work. Its document lives in workDocs. */
  works: defineTable({
    slug: v.string(),
    title: v.string(),
    subtitle: v.string(),
    tagline: v.string(),
    tags: v.array(v.string()),
    /** Written on the site. When empty, the document's own are shown. */
    highlights: v.array(v.string()),
    status: workStatus,
    published: v.boolean(),
    order: v.number(),
    links: v.array(workLink),
    /** A workFiles path: an imported image or an uploaded one. */
    thumbnailPath: v.optional(v.string()),
    source: workSource,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published_order", ["published", "order"])
    .index("by_order", ["order"]),

  /**
   * A work's imported document, apart from the work so the list of works
   * never carries tens of kilobytes of Markdown it does not show.
   */
  workDocs: defineTable({
    workId: v.id("works"),
    markdown: v.string(),
    docTitle: v.string(),
    docHighlights: v.array(v.string()),
    importedAt: v.number(),
    sourceSha: v.optional(v.string()),
    charCount: v.number(),
  }).index("by_work", ["workId"]),

  /**
   * A file of a work, by the path its document refers to it by
   * ("images/home.png"), so the document is stored exactly as written.
   */
  workFiles: defineTable({
    workId: v.id("works"),
    role: v.union(v.literal("image"), v.literal("video"), v.literal("upload")),
    path: v.string(),
    storageId: v.id("_storage"),
    mime: v.string(),
    bytes: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    importedAt: v.number(),
  })
    .index("by_work", ["workId"])
    .index("by_work_path", ["workId", "path"]),

  /** One import from GitHub, for the admin screen's progress and history. */
  importRuns: defineTable({
    workId: v.id("works"),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    status: v.union(v.literal("running"), v.literal("ok"), v.literal("error")),
    step: v.optional(v.string()),
    message: v.optional(v.string()),
    sourceSha: v.optional(v.string()),
    stats: v.optional(
      v.object({
        images: v.number(),
        imageBytes: v.number(),
        videoBytes: v.number(),
        docChars: v.number(),
      }),
    ),
  }).index("by_work_started", ["workId", "startedAt"]),

  /** What came in through the contact form, kept whether or not mail went out. */
  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    body: v.string(),
    createdAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    resendId: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_createdAt", ["createdAt"]),
});
