import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export type FileView = {
  path: string;
  role: Doc<"workFiles">["role"];
  url: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
};

export async function fileView(ctx: QueryCtx, file: Doc<"workFiles">): Promise<FileView | null> {
  const url = await ctx.storage.getUrl(file.storageId);
  if (!url) return null;
  return {
    path: file.path,
    role: file.role,
    url,
    mime: file.mime,
    bytes: file.bytes,
    width: file.width ?? null,
    height: file.height ?? null,
  };
}

export async function findFile(
  ctx: QueryCtx,
  workId: Id<"works">,
  path: string | undefined,
): Promise<Doc<"workFiles"> | null> {
  if (!path) return null;
  return await ctx.db
    .query("workFiles")
    .withIndex("by_work_path", (q) => q.eq("workId", workId).eq("path", path))
    .first();
}

export async function filesOf(ctx: QueryCtx, workId: Id<"works">): Promise<Doc<"workFiles">[]> {
  return await ctx.db
    .query("workFiles")
    .withIndex("by_work", (q) => q.eq("workId", workId))
    .collect();
}
