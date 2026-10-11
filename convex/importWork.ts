import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  type ActionCtx,
  type MutationCtx,
} from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { pngDimensions } from "./lib/png";
import { parseForbidden, resolveRelative, transformDoc } from "./lib/transformDoc";
import type { WorkSource } from "./lib/validators";
import { scheduleRevalidate } from "./revalidate";

const KB = 1024;
const MB = 1024 * KB;
const MAX_DOC_BYTES = 512 * KB;
const MAX_IMAGE_BYTES = 3 * MB;
/** Ball Split's demo is 16 MB; the free plan's storage is 1 GB in all. */
const MAX_VIDEO_BYTES = 30 * MB;
/** A run older than this that never finished is taken to have died. */
const STALE_RUN_MS = 15 * 60 * 1000;
const RUNS_KEPT = 10;
const PARALLEL_DOWNLOADS = 4;

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/**
 * raw.githubusercontent.com serves most files as octet-stream, so the type is
 * taken from the name instead.
 */
function mimeOf(path: string): string | null {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? null;
}

function rawUrl(source: WorkSource, path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${source.repo}/${encodeURIComponent(source.ref)}/${encoded}`;
}

async function download(url: string, maxBytes: number, what: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${what}を取得できませんでした（HTTP ${response.status}）: ${url}`);
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maxBytes)
    throw new Error(`${what}が大きすぎます（${Math.ceil(declared / MB)}MB）`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new Error(`${what}が大きすぎます（${Math.ceil(bytes.byteLength / MB)}MB）`);
  }
  return bytes;
}

/** The commit the ref points at now, for the admin screen. Never fatal. */
async function currentSha(source: WorkSource): Promise<string | undefined> {
  try {
    const headers: Record<string, string> = { accept: "application/vnd.github.sha" };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(
      `https://api.github.com/repos/${source.repo}/commits/${encodeURIComponent(source.ref)}`,
      { headers },
    );
    if (!response.ok) return undefined;
    const sha = (await response.text()).trim();
    return /^[0-9a-f]{40}$/.test(sha) ? sha : undefined;
  } catch {
    return undefined;
  }
}

// ------------------------------------------------------------- starting

async function beginRun(ctx: MutationCtx, workId: Id<"works">): Promise<Id<"importRuns">> {
  const work = await ctx.db.get(workId);
  if (!work) throw new ConvexError({ code: "NOT_FOUND", message: "作品が見つかりません。" });
  const latest = await ctx.db
    .query("importRuns")
    .withIndex("by_work_started", (q) => q.eq("workId", workId))
    .order("desc")
    .first();
  if (latest?.status === "running" && Date.now() - latest.startedAt < STALE_RUN_MS) {
    throw new ConvexError({ code: "BUSY", message: "この作品は取り込みの途中です。" });
  }
  const runId = await ctx.db.insert("importRuns", {
    workId,
    startedAt: Date.now(),
    status: "running",
    step: "開始を待っています",
  });
  await ctx.scheduler.runAfter(0, internal.importWork.run, { workId, runId });
  return runId;
}

/**
 * Imports a work's document, images and video from GitHub again. Returns at
 * once; the run's progress is in importRuns, which the admin screen watches.
 */
export const start = mutation({
  args: { workId: v.id("works") },
  handler: async (ctx, { workId }) => {
    await requireAdmin(ctx);
    return await beginRun(ctx, workId);
  },
});

/** Every work, each in an action of its own (`npx convex run importWork:importAll`). */
export const importAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const works = await ctx.db.query("works").withIndex("by_order").collect();
    for (const work of works) await beginRun(ctx, work._id);
    return works.length;
  },
});

// -------------------------------------------------------------- running

export const sourceOf = internalQuery({
  args: { workId: v.id("works") },
  handler: async (ctx, { workId }) => (await ctx.db.get(workId))?.source ?? null,
});

export const progress = internalMutation({
  args: { runId: v.id("importRuns"), step: v.string() },
  handler: async (ctx, { runId, step }) => {
    const run = await ctx.db.get(runId);
    if (run?.status === "running") await ctx.db.patch(runId, { step });
  },
});

export const fail = internalMutation({
  args: { runId: v.id("importRuns"), message: v.string() },
  handler: async (ctx, { runId, message }) => {
    const run = await ctx.db.get(runId);
    if (run?.status !== "running") return;
    await ctx.db.patch(runId, {
      status: "error",
      step: undefined,
      message: message.slice(0, 1000),
      finishedAt: Date.now(),
    });
  },
});

const importedFile = v.object({
  role: v.union(v.literal("image"), v.literal("video")),
  path: v.string(),
  storageId: v.id("_storage"),
  mime: v.string(),
  bytes: v.number(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
});

/**
 * Swaps in what a run fetched, all at once: until this runs, the site keeps
 * showing the previous import whole.
 */
export const commit = internalMutation({
  args: {
    workId: v.id("works"),
    runId: v.id("importRuns"),
    markdown: v.string(),
    docTitle: v.string(),
    docHighlights: v.array(v.string()),
    sourceSha: v.optional(v.string()),
    files: v.array(importedFile),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    const work = await ctx.db.get(args.workId);
    if (!run || run.status !== "running" || !work) {
      // Superseded or deleted meanwhile: what was fetched is not needed.
      for (const file of args.files) await ctx.storage.delete(file.storageId);
      return;
    }
    const now = Date.now();

    const old = await ctx.db
      .query("workFiles")
      .withIndex("by_work", (q) => q.eq("workId", args.workId))
      .collect();
    for (const file of old) {
      if (file.role === "upload") continue;
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }
    for (const file of args.files) {
      await ctx.db.insert("workFiles", { workId: args.workId, ...file, importedAt: now });
    }

    const docValues = {
      markdown: args.markdown,
      docTitle: args.docTitle,
      docHighlights: args.docHighlights,
      importedAt: now,
      sourceSha: args.sourceSha,
      charCount: args.markdown.length,
    };
    const doc = await ctx.db
      .query("workDocs")
      .withIndex("by_work", (q) => q.eq("workId", args.workId))
      .unique();
    if (doc) await ctx.db.patch(doc._id, docValues);
    else await ctx.db.insert("workDocs", { workId: args.workId, ...docValues });

    // The thumbnail stays as chosen while its file is still there; otherwise
    // it becomes the document's first image.
    const kept = new Set([
      ...old.filter((file) => file.role === "upload").map((file) => file.path),
      ...args.files.filter((file) => file.role === "image").map((file) => file.path),
    ]);
    if (!work.thumbnailPath || !kept.has(work.thumbnailPath)) {
      const first = args.files.find((file) => file.role === "image");
      await ctx.db.patch(args.workId, { thumbnailPath: first?.path });
    }

    const images = args.files.filter((file) => file.role === "image");
    await ctx.db.patch(args.runId, {
      status: "ok",
      step: undefined,
      finishedAt: now,
      sourceSha: args.sourceSha,
      stats: {
        images: images.length,
        imageBytes: images.reduce((sum, file) => sum + file.bytes, 0),
        videoBytes: args.files.find((file) => file.role === "video")?.bytes ?? 0,
        docChars: args.markdown.length,
      },
    });

    const runs = await ctx.db
      .query("importRuns")
      .withIndex("by_work_started", (q) => q.eq("workId", args.workId))
      .order("desc")
      .collect();
    for (const stale of runs.slice(RUNS_KEPT)) await ctx.db.delete(stale._id);

    if (work.published) await scheduleRevalidate(ctx);
  },
});

export const run = internalAction({
  args: { workId: v.id("works"), runId: v.id("importRuns") },
  handler: async (ctx, { workId, runId }) => {
    const stored: Id<"_storage">[] = [];
    try {
      await performImport(ctx, workId, runId, stored);
    } catch (error) {
      for (const storageId of stored) await ctx.storage.delete(storageId).catch(() => {});
      const message = error instanceof Error ? error.message : String(error);
      await ctx.runMutation(internal.importWork.fail, { runId, message });
    }
  },
});

async function performImport(
  ctx: ActionCtx,
  workId: Id<"works">,
  runId: Id<"importRuns">,
  stored: Id<"_storage">[],
): Promise<void> {
  const step = (text: string) =>
    ctx.runMutation(internal.importWork.progress, { runId, step: text });
  const source = await ctx.runQuery(internal.importWork.sourceOf, { workId });
  if (!source) throw new Error("作品が見つかりません。");

  await step("資料を取得しています");
  const [docBytes, sourceSha] = await Promise.all([
    download(rawUrl(source, source.docPath), MAX_DOC_BYTES, "資料"),
    currentSha(source),
  ]);
  const doc = transformDoc(
    new TextDecoder().decode(docBytes),
    parseForbidden(process.env.IMPORT_FORBIDDEN_STRINGS),
  );

  const files: {
    role: "image" | "video";
    path: string;
    storageId: Id<"_storage">;
    mime: string;
    bytes: number;
    width?: number;
    height?: number;
  }[] = [];

  const keep = async (role: "image" | "video", ref: string, repoPath: string, max: number) => {
    const mime = mimeOf(repoPath);
    if (!mime || !mime.startsWith(`${role}/`)) {
      throw new Error(`対応していない形式です: ${repoPath}`);
    }
    const bytes = await download(rawUrl(source, repoPath), max, role === "image" ? "画像" : "動画");
    const storageId = await ctx.storage.store(new Blob([bytes as BlobPart], { type: mime }));
    stored.push(storageId);
    const size = mime === "image/png" ? pngDimensions(bytes) : null;
    files.push({ role, path: ref, storageId, mime, bytes: bytes.byteLength, ...(size ?? {}) });
  };

  const refs = doc.imageRefs;
  for (let i = 0; i < refs.length; i += PARALLEL_DOWNLOADS) {
    await step(`画像を取得しています（${i}/${refs.length}）`);
    await Promise.all(
      refs.slice(i, i + PARALLEL_DOWNLOADS).map((ref) => {
        const repoPath = resolveRelative(source.docPath, ref);
        if (!repoPath) throw new Error(`リポジトリの外を指す画像です: ${ref}`);
        return keep("image", ref, repoPath, MAX_IMAGE_BYTES);
      }),
    );
  }
  // Keep document order, which the downloads in parallel did not.
  files.sort((a, b) => refs.indexOf(a.path) - refs.indexOf(b.path));

  if (source.videoPath) {
    await step("動画を取得しています");
    await keep("video", source.videoPath, source.videoPath, MAX_VIDEO_BYTES);
  }

  await step("保存しています");
  await ctx.runMutation(internal.importWork.commit, {
    workId,
    runId,
    markdown: doc.markdown,
    docTitle: doc.docTitle,
    docHighlights: doc.docHighlights,
    sourceSha,
    files,
  });
}
