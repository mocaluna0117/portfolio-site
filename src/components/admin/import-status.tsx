"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export type RunSummary = {
  status: "running" | "ok" | "error";
  step?: string | null;
  message?: string | null;
  startedAt: number;
  finishedAt?: number | null;
  sourceSha?: string | null;
  stats?: { images: number; imageBytes: number; videoBytes: number; docChars: number } | null;
} | null;

const STALE_MS = 15 * 60 * 1000;

export const formatDateTime = (time: number) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(time);

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

export function isRunning(run: RunSummary): boolean {
  return run?.status === "running" && Date.now() - run.startedAt < STALE_MS;
}

/** The latest import of a work, in a line. */
export function ImportStatus({ run, className }: { run: RunSummary; className?: string }) {
  if (!run)
    return <p className={cn("text-xs text-muted-foreground", className)}>まだ取り込んでいません</p>;
  if (isRunning(run)) {
    return (
      <p className={cn("flex items-center gap-1.5 text-xs text-primary", className)}>
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {run.step ?? "取り込んでいます"}
      </p>
    );
  }
  if (run.status === "error" || run.status === "running") {
    return (
      <p className={cn("flex items-start gap-1.5 text-xs text-destructive", className)}>
        <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
        <span className="line-clamp-2">
          {run.status === "running"
            ? "取り込みが途中で止まりました"
            : (run.message ?? "取り込みに失敗しました")}
        </span>
      </p>
    );
  }
  const stats = run.stats;
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
      <span>
        {formatDateTime(run.finishedAt ?? run.startedAt)} に取り込み
        {run.sourceSha ? ` · ${run.sourceSha.slice(0, 7)}` : ""}
        {stats ? ` · 画像 ${stats.images} 枚` : ""}
        {stats?.videoBytes ? ` · 動画 ${megabytes(stats.videoBytes)}` : ""}
      </span>
    </p>
  );
}

export function ImportButton({ workId, run }: { workId: Id<"works">; run: RunSummary }) {
  const start = useMutation(api.importWork.start);
  const [starting, setStarting] = useState(false);
  const running = isRunning(run) || starting;
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={running}
      onClick={async () => {
        setStarting(true);
        try {
          await start({ workId });
        } catch (error) {
          toast.error(errorMessage(error, "取り込みを始められませんでした。"));
        } finally {
          setStarting(false);
        }
      }}
    >
      <RefreshCw className={cn(running && "animate-spin")} aria-hidden />
      GitHub から取り込み直す
    </Button>
  );
}
