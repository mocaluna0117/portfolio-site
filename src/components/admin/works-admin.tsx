"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ExternalLink, GripVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AddWorkDialog } from "@/components/admin/add-work-dialog";
import { ImportButton, ImportStatus } from "@/components/admin/import-status";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Row = FunctionReturnType<typeof api.works.listAll>[number];

function WorkRow({ work }: { work: Row }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: work.id,
  });
  const setPublished = useMutation(api.works.setPublished).withOptimisticUpdate((store, args) => {
    const rows = store.getQuery(api.works.listAll, {});
    if (rows) {
      store.setQuery(
        api.works.listAll,
        {},
        rows.map((row) => (row.id === args.id ? { ...row, published: args.published } : row)),
      );
    }
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3 sm:flex-nowrap sm:p-4",
        isDragging && "relative z-10 shadow-lg",
      )}
    >
      <button
        type="button"
        className="-mx-1 cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`${work.title} を並べ替える`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="relative hidden aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-md border bg-muted sm:block">
        {work.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.thumbnail.url} alt="" className="size-full object-cover object-top" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold">{work.title}</p>
          <StatusBadge status={work.status} />
        </div>
        <p className="text-xs text-muted-foreground">/works/{work.slug}</p>
        <ImportStatus run={work.run} className="mt-1.5" />
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <div className="mr-2 flex items-center gap-2">
          <Switch
            id={`published-${work.id}`}
            checked={work.published}
            onCheckedChange={async (published) => {
              try {
                await setPublished({ id: work.id, published });
              } catch (error) {
                toast.error(errorMessage(error));
              }
            }}
          />
          <Label htmlFor={`published-${work.id}`} className="text-sm whitespace-nowrap">
            公開
          </Label>
        </div>
        <ImportButton workId={work.id} run={work.run} />
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/works/${work.id}`}>
            <Pencil aria-hidden />
            編集
          </Link>
        </Button>
        {work.published ? (
          <Button variant="ghost" size="icon-sm" asChild>
            <a
              href={`/works/${work.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="公開ページを開く"
            >
              <ExternalLink aria-hidden />
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function WorksAdmin() {
  const works = useQuery(api.works.listAll, {});
  const reorder = useMutation(api.works.reorder).withOptimisticUpdate((store, { ids }) => {
    const rows = store.getQuery(api.works.listAll, {});
    if (!rows) return;
    const byId = new Map(rows.map((row) => [row.id, row]));
    store.setQuery(
      api.works.listAll,
      {},
      ids.map((id) => byId.get(id)).filter((row): row is Row => row !== undefined),
    );
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!works || !over || active.id === over.id) return;
    const ids = works.map((work) => work.id);
    const moved = arrayMove(
      ids,
      ids.indexOf(active.id as Id<"works">),
      ids.indexOf(over.id as Id<"works">),
    );
    try {
      await reorder({ ids: moved });
    } catch (error) {
      toast.error(errorMessage(error, "並べ替えを保存できませんでした。"));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">作品</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ドラッグで並べ替えると、公開ページの並び順も変わります。本文・画像・動画は各リポジトリの資料から取り込みます。
          </p>
        </div>
        <AddWorkDialog />
      </div>

      {works === undefined ? (
        <div className="mt-8 grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : works.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          まだ作品がありません。「作品を追加」から追加してください。
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={works.map((work) => work.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="mt-8 grid gap-3">
              {works.map((work) => (
                <WorkRow key={work.id} work={work} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
