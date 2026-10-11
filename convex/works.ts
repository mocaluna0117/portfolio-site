import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { fileView, filesOf, findFile, type FileView } from "./lib/files";
import { REPO, SLUG, workLink, workSource, workStatus, type WorkLink } from "./lib/validators";
import { scheduleRevalidate } from "./revalidate";

const invalid = (message: string) => new ConvexError({ code: "INVALID", message });

async function thumbnailOf(ctx: QueryCtx, work: Doc<"works">): Promise<FileView | null> {
  const file = await findFile(ctx, work._id, work.thumbnailPath);
  return file ? await fileView(ctx, file) : null;
}

async function docOf(ctx: QueryCtx, workId: Id<"works">) {
  return await ctx.db
    .query("workDocs")
    .withIndex("by_work", (q) => q.eq("workId", workId))
    .unique();
}

async function latestRun(ctx: QueryCtx, workId: Id<"works">) {
  return await ctx.db
    .query("importRuns")
    .withIndex("by_work_started", (q) => q.eq("workId", workId))
    .order("desc")
    .first();
}

function card(work: Doc<"works">, thumbnail: FileView | null) {
  return {
    slug: work.slug,
    title: work.title,
    subtitle: work.subtitle,
    tagline: work.tagline,
    tags: work.tags,
    status: work.status,
    thumbnail: thumbnail && {
      url: thumbnail.url,
      width: thumbnail.width,
      height: thumbnail.height,
    },
  };
}

// ---------------------------------------------------------------- public

/** The published works, in the order set in the admin screen. */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const works = await ctx.db
      .query("works")
      .withIndex("by_published_order", (q) => q.eq("published", true))
      .collect();
    return await Promise.all(works.map(async (work) => card(work, await thumbnailOf(ctx, work))));
  },
});

export const listPublishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    const works = await ctx.db
      .query("works")
      .withIndex("by_published_order", (q) => q.eq("published", true))
      .collect();
    return works.map((work) => ({ slug: work.slug, updatedAt: work.updatedAt }));
  },
});

/** One published work with its document, its images and its video. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const work = await ctx.db
      .query("works")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!work || !work.published) return null;
    const doc = await docOf(ctx, work._id);
    const files = (
      await Promise.all((await filesOf(ctx, work._id)).map((f) => fileView(ctx, f)))
    ).filter((file): file is FileView => file !== null);
    const video = files.find((file) => file.role === "video") ?? null;
    return {
      ...card(work, files.find((file) => file.path === work.thumbnailPath) ?? null),
      links: work.links,
      highlights: work.highlights.length > 0 ? work.highlights : (doc?.docHighlights ?? []),
      video: video && { url: video.url, mime: video.mime },
      images: files
        .filter((file) => file.role === "image")
        .map(({ path, url, width, height }) => ({ path, url, width, height })),
      doc: doc && { markdown: doc.markdown, importedAt: doc.importedAt, sourceSha: doc.sourceSha },
      sourceUrl: `https://github.com/${work.source.repo}/blob/${work.source.ref}/${work.source.docPath}`,
      updatedAt: Math.max(work.updatedAt, doc?.importedAt ?? 0),
    };
  },
});

// ---------------------------------------------------------------- admin

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const works = await ctx.db.query("works").withIndex("by_order").collect();
    return await Promise.all(
      works.map(async (work) => {
        const [thumbnail, doc, run] = await Promise.all([
          thumbnailOf(ctx, work),
          docOf(ctx, work._id),
          latestRun(ctx, work._id),
        ]);
        return {
          id: work._id,
          published: work.published,
          ...card(work, thumbnail),
          importedAt: doc?.importedAt ?? null,
          sourceSha: doc?.sourceSha ?? null,
          run: run && {
            status: run.status,
            step: run.step ?? null,
            message: run.message ?? null,
            startedAt: run.startedAt,
            finishedAt: run.finishedAt ?? null,
            sourceSha: run.sourceSha ?? null,
            stats: run.stats ?? null,
          },
        };
      }),
    );
  },
});

export const get = query({
  args: { id: v.id("works") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const work = await ctx.db.get(id);
    if (!work) return null;
    const [doc, run, files] = await Promise.all([
      docOf(ctx, id),
      latestRun(ctx, id),
      filesOf(ctx, id),
    ]);
    const views = (await Promise.all(files.map((f) => fileView(ctx, f)))).filter(
      (file): file is FileView => file !== null,
    );
    return {
      work,
      files: views,
      doc: doc && {
        docTitle: doc.docTitle,
        docHighlights: doc.docHighlights,
        importedAt: doc.importedAt,
        sourceSha: doc.sourceSha ?? null,
        charCount: doc.charCount,
      },
      run,
    };
  },
});

// ------------------------------------------------------------ validation

function cleanText(value: string, label: string, max: number, required = false): string {
  const text = value.trim();
  if (required && !text) throw invalid(`${label}を入力してください。`);
  if (text.length > max) throw invalid(`${label}は${max}文字までです。`);
  return text;
}

function cleanList(values: string[], label: string, maxItems: number, maxLength: number) {
  const list = values.map((value) => value.trim()).filter(Boolean);
  if (list.length > maxItems) throw invalid(`${label}は${maxItems}個までです。`);
  for (const item of list) {
    if (item.length > maxLength) throw invalid(`${label}は1つ${maxLength}文字までです。`);
  }
  return [...new Set(list)];
}

function cleanLinks(links: WorkLink[]): WorkLink[] {
  if (links.length > 6) throw invalid("リンクは6個までです。");
  return links
    .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
    .filter((link) => link.label || link.url)
    .map((link) => {
      if (!link.label || link.label.length > 30) {
        throw invalid("リンクの表示名は1〜30文字で入力してください。");
      }
      if (!/^https?:\/\/[^\s]+$/.test(link.url) || link.url.length > 500) {
        throw invalid(`「${link.label}」の URL が正しくありません。`);
      }
      return link;
    });
}

function cleanSource(source: Doc<"works">["source"]): Doc<"works">["source"] {
  const repo = source.repo.trim();
  const ref = source.ref.trim();
  const docPath = source.docPath.trim().replace(/^\/+/, "");
  const videoPath = source.videoPath?.trim().replace(/^\/+/, "") || undefined;
  if (!REPO.test(repo)) throw invalid("リポジトリは owner/name の形で入力してください。");
  if (!ref || /\s/.test(ref)) throw invalid("ブランチ名を入力してください。");
  if (!docPath.toLowerCase().endsWith(".md"))
    throw invalid("資料は .md のファイルを指定してください。");
  if (videoPath && !/\.(mp4|webm|mov)$/i.test(videoPath)) {
    throw invalid("動画は .mp4 / .webm / .mov のファイルを指定してください。");
  }
  return { repo, ref, docPath, ...(videoPath ? { videoPath } : {}) };
}

async function mustGet(ctx: MutationCtx, id: Id<"works">) {
  const work = await ctx.db.get(id);
  if (!work) throw new ConvexError({ code: "NOT_FOUND", message: "作品が見つかりません。" });
  return work;
}

// -------------------------------------------------------------- mutations

export const create = mutation({
  args: { slug: v.string(), title: v.string(), source: workSource },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const slug = args.slug.trim();
    if (!SLUG.test(slug)) {
      throw invalid("URL 名は英小文字・数字・ハイフンで、40文字までで入力してください。");
    }
    const taken = await ctx.db
      .query("works")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (taken) throw invalid("その URL 名はすでに使われています。");
    const last = await ctx.db.query("works").withIndex("by_order").order("desc").first();
    const now = Date.now();
    return await ctx.db.insert("works", {
      slug,
      title: cleanText(args.title, "作品名", 60, true),
      subtitle: "",
      tagline: "",
      tags: [],
      highlights: [],
      status: "personal",
      published: false,
      order: (last?.order ?? -1) + 1,
      links: [],
      source: cleanSource(args.source),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("works"),
    title: v.string(),
    subtitle: v.string(),
    tagline: v.string(),
    tags: v.array(v.string()),
    highlights: v.array(v.string()),
    status: workStatus,
    links: v.array(workLink),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const work = await mustGet(ctx, args.id);
    await ctx.db.patch(work._id, {
      title: cleanText(args.title, "作品名", 60, true),
      subtitle: cleanText(args.subtitle, "副題", 80),
      tagline: cleanText(args.tagline, "紹介文", 200),
      tags: cleanList(args.tags, "技術タグ", 12, 30),
      highlights: cleanList(args.highlights, "見どころ", 6, 120),
      status: args.status,
      links: cleanLinks(args.links),
      updatedAt: Date.now(),
    });
    if (work.published) await scheduleRevalidate(ctx);
  },
});

export const setSource = mutation({
  args: { id: v.id("works"), source: workSource },
  handler: async (ctx, { id, source }) => {
    await requireAdmin(ctx);
    await mustGet(ctx, id);
    await ctx.db.patch(id, { source: cleanSource(source), updatedAt: Date.now() });
  },
});

export const setPublished = mutation({
  args: { id: v.id("works"), published: v.boolean() },
  handler: async (ctx, { id, published }) => {
    await requireAdmin(ctx);
    const work = await mustGet(ctx, id);
    if (work.published === published) return;
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
    await scheduleRevalidate(ctx);
  },
});

/** Puts the works in the given order; any not named keep their place after. */
export const reorder = mutation({
  args: { ids: v.array(v.id("works")) },
  handler: async (ctx, { ids }) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("works").withIndex("by_order").collect();
    const named = new Set(ids);
    const ordered = [
      ...ids.map((id) => all.find((work) => work._id === id)).filter((w) => w !== undefined),
      ...all.filter((work) => !named.has(work._id)),
    ];
    for (const [index, work] of ordered.entries()) {
      if (work.order !== index) await ctx.db.patch(work._id, { order: index });
    }
    await scheduleRevalidate(ctx);
  },
});

export const setThumbnail = mutation({
  args: { id: v.id("works"), path: v.string() },
  handler: async (ctx, { id, path }) => {
    await requireAdmin(ctx);
    const work = await mustGet(ctx, id);
    const file = await findFile(ctx, id, path);
    if (!file || file.role === "video") throw invalid("その画像はこの作品にありません。");
    await ctx.db.patch(id, { thumbnailPath: path, updatedAt: Date.now() });
    if (work.published) await scheduleRevalidate(ctx);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** Keeps an uploaded image as a work's thumbnail. */
export const attachUpload = mutation({
  args: { workId: v.id("works"), storageId: v.id("_storage"), filename: v.string() },
  handler: async (ctx, { workId, storageId, filename }) => {
    await requireAdmin(ctx);
    const work = await mustGet(ctx, workId);
    // What the storage recorded, not what the browser said it sent.
    const meta = await ctx.db.system.get(storageId);
    const mime = meta?.contentType ?? "";
    if (!meta || !/^image\/(png|jpeg|webp|gif)$/.test(mime) || meta.size > MAX_UPLOAD_BYTES) {
      await ctx.storage.delete(storageId);
      throw invalid("画像は PNG・JPEG・WebP・GIF で、2MB までにしてください。");
    }
    const safeName = filename.replace(/[^\w.-]+/g, "_").slice(-60) || "image";
    const path = `uploads/${Date.now()}-${safeName}`;
    await ctx.db.insert("workFiles", {
      workId,
      role: "upload",
      path,
      storageId,
      mime,
      bytes: meta.size,
      importedAt: Date.now(),
    });
    await ctx.db.patch(workId, { thumbnailPath: path, updatedAt: Date.now() });
    if (work.published) await scheduleRevalidate(ctx);
    return path;
  },
});

/** Deletes a work and everything stored for it. */
export const remove = mutation({
  args: { id: v.id("works") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const work = await mustGet(ctx, id);
    for (const file of await filesOf(ctx, id)) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }
    const doc = await docOf(ctx, id);
    if (doc) await ctx.db.delete(doc._id);
    const runs = await ctx.db
      .query("importRuns")
      .withIndex("by_work_started", (q) => q.eq("workId", id))
      .collect();
    for (const run of runs) await ctx.db.delete(run._id);
    await ctx.db.delete(id);
    if (work.published) await scheduleRevalidate(ctx);
  },
});
