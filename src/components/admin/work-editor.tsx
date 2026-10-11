"use client";

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { WorkLink, WorkStatus } from "@convex/lib/validators";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowLeft, Check, ExternalLink, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ImportButton, ImportStatus } from "@/components/admin/import-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";
import { t } from "@/lib/i18n/ja";
import { cn } from "@/lib/utils";

type Loaded = NonNullable<FunctionReturnType<typeof api.works.get>>;

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ------------------------------------------------------------ content

function ContentForm({ work, docHighlights }: { work: Doc<"works">; docHighlights: string[] }) {
  const update = useMutation(api.works.update);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(work.title);
  const [subtitle, setSubtitle] = useState(work.subtitle);
  const [tagline, setTagline] = useState(work.tagline);
  const [tags, setTags] = useState(work.tags.join(", "));
  const [highlights, setHighlights] = useState(work.highlights.join("\n"));
  const [status, setStatus] = useState<WorkStatus>(work.status);
  const [links, setLinks] = useState<WorkLink[]>(work.links);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await update({
        id: work._id,
        title,
        subtitle,
        tagline,
        tags: tags.split(/[,、\n]/),
        highlights: highlights.split("\n"),
        status,
        links,
      });
      toast.success("保存しました。");
    } catch (error) {
      toast.error(errorMessage(error, "保存できませんでした。"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>表示する内容</CardTitle>
        <CardDescription>
          作品カードと作品ページの上部に出る内容です。本文は資料から取り込みます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="作品名" htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={60}
              />
            </Field>
            <Field label="副題" htmlFor="subtitle">
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                maxLength={80}
              />
            </Field>
          </div>
          <Field label="紹介文" htmlFor="tagline" hint="作品カードに出る1〜2文。">
            <Textarea
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="技術タグ" htmlFor="tags" hint="カンマ区切り（例: Next.js, Convex）">
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <Field label="状態" htmlFor="status">
              <Select value={status} onValueChange={(value) => setStatus(value as WorkStatus)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(t.status) as WorkStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {t.status[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field
            label="見どころ"
            htmlFor="highlights"
            hint={
              docHighlights.length > 0
                ? "1行に1つ。空のままなら、資料の「技術的に工夫した点」の見出しを使います（入力欄の薄い文字）。"
                : "1行に1つ、6個まで。"
            }
          >
            <Textarea
              id="highlights"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              rows={6}
              placeholder={docHighlights.join("\n")}
            />
          </Field>
          <LinksEditor links={links} onChange={setLinks} />
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              保存する
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function LinksEditor({
  links,
  onChange,
}: {
  links: WorkLink[];
  onChange: (links: WorkLink[]) => void;
}) {
  const edit = (index: number, patch: Partial<WorkLink>) =>
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-sm font-medium">リンク</legend>
      {links.map((link, index) => (
        <div key={index} className="grid grid-cols-[9rem_1fr_auto] gap-2">
          <Input
            aria-label="表示名"
            placeholder="ソースコード"
            value={link.label}
            onChange={(e) => edit(index, { label: e.target.value })}
          />
          <Input
            aria-label="URL"
            placeholder="https://"
            value={link.url}
            onChange={(e) => edit(index, { url: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="このリンクを消す"
            onClick={() => onChange(links.filter((_, i) => i !== index))}
          >
            <X aria-hidden />
          </Button>
        </div>
      ))}
      {links.length < 6 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={() => onChange([...links, { label: "", url: "" }])}
        >
          <Plus aria-hidden />
          リンクを追加
        </Button>
      ) : null}
    </fieldset>
  );
}

// ---------------------------------------------------------- thumbnail

function ThumbnailPicker({ data }: { data: Loaded }) {
  const setThumbnail = useMutation(api.works.setThumbnail);
  const generateUploadUrl = useMutation(api.works.generateUploadUrl);
  const attachUpload = useMutation(api.works.attachUpload);
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const images = data.files.filter((file) => file.role !== "video");

  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("画像は 2MB までにしてください。");
      return;
    }
    setUploading(true);
    try {
      const url = await generateUploadUrl({});
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
      await attachUpload({ workId: data.work._id, storageId, filename: file.name });
      toast.success("サムネイルにしました。");
    } catch (error) {
      toast.error(errorMessage(error, "アップロードできませんでした。"));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>サムネイル</CardTitle>
        <CardDescription>
          作品カードと動画の最初に出る画像です。取り込んだ画像から選ぶか、アップロードします。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            まだ画像がありません。資料を取り込むと選べるようになります。
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((file) => {
              const selected = data.work.thumbnailPath === file.path;
              return (
                <li key={file.path}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    title={file.path}
                    onClick={async () => {
                      try {
                        await setThumbnail({ id: data.work._id, path: file.path });
                      } catch (error) {
                        toast.error(errorMessage(error));
                      }
                    }}
                    className={cn(
                      "relative block aspect-[16/10] w-full overflow-hidden rounded-md border-2 bg-muted transition",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-foreground/30",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.url}
                      alt={file.path}
                      className="size-full object-cover object-top"
                    />
                    {selected ? (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => input.current?.click()}
          >
            {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
            画像をアップロード
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------- source

function SourceForm({ data }: { data: Loaded }) {
  const setSource = useMutation(api.works.setSource);
  const source = data.work.source;
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    repo: source.repo,
    ref: source.ref,
    docPath: source.docPath,
    videoPath: source.videoPath ?? "",
  });
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const changed =
    form.repo !== source.repo ||
    form.ref !== source.ref ||
    form.docPath !== source.docPath ||
    form.videoPath !== (source.videoPath ?? "");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await setSource({
        id: data.work._id,
        source: {
          repo: form.repo,
          ref: form.ref,
          docPath: form.docPath,
          ...(form.videoPath.trim() ? { videoPath: form.videoPath } : {}),
        },
      });
      toast.success("取り込み元を保存しました。反映するには取り込み直してください。");
    } catch (error) {
      toast.error(errorMessage(error, "保存できませんでした。"));
    } finally {
      setBusy(false);
    }
  }

  const docUrl = `https://github.com/${source.repo}/blob/${source.ref}/${source.docPath}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>取り込み元（GitHub）</CardTitle>
        <CardDescription>
          作品説明の本文・画像・動画は、このリポジトリの資料から取り込みます。資料を直したら、ここで取り込み直してください。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/50 p-3">
          <div className="min-w-0">
            <ImportStatus
              run={data.run ? { ...data.run, sourceSha: data.run.sourceSha ?? null } : null}
            />
            {data.doc ? (
              <p className="mt-1 text-xs text-muted-foreground">
                資料のタイトル: {data.doc.docTitle || "（なし）"} ·{" "}
                {data.doc.charCount.toLocaleString()} 文字
              </p>
            ) : null}
          </div>
          <ImportButton workId={data.work._id} run={data.run ?? null} />
        </div>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field label="リポジトリ" htmlFor="repo">
              <Input id="repo" value={form.repo} onChange={set("repo")} required />
            </Field>
            <Field label="ブランチ" htmlFor="ref">
              <Input id="ref" value={form.ref} onChange={set("ref")} required />
            </Field>
          </div>
          <Field
            label="資料のパス"
            htmlFor="docPath"
            hint={
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-4"
              >
                GitHub で今の資料を開く
                <ExternalLink className="size-3" aria-hidden />
              </a>
            }
          >
            <Input id="docPath" value={form.docPath} onChange={set("docPath")} required />
          </Field>
          <Field label="動画のパス（任意）" htmlFor="videoPath">
            <Input id="videoPath" value={form.videoPath} onChange={set("videoPath")} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" disabled={busy || !changed}>
              取り込み元を保存
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------- delete

function DeleteWork({ work }: { work: Doc<"works"> }) {
  const remove = useMutation(api.works.remove);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>作品を削除</CardTitle>
        <CardDescription>
          取り込んだ本文・画像・動画も消えます。GitHub の資料は消えません。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 aria-hidden />
              この作品を削除する
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>「{work.title}」を削除しますか？</DialogTitle>
              <DialogDescription>
                元に戻せません。公開ページからもすぐに消えます。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">やめる</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await remove({ id: work._id });
                    toast.success("削除しました。");
                    router.replace("/admin");
                  } catch (error) {
                    toast.error(errorMessage(error, "削除できませんでした。"));
                    setBusy(false);
                  }
                }}
              >
                削除する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// --------------------------------------------------------------- page

export function WorkEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const data = useQuery(api.works.get, { id: id as Id<"works"> });

  if (data === undefined) {
    return (
      <div className="grid gap-6" aria-hidden>
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (data === null) {
    return (
      <div>
        <p>作品が見つかりません。</p>
        <Button variant="link" asChild className="px-0">
          <Link href="/admin">作品一覧へ戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          作品一覧
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{data.work.title}</h1>
          {data.work.published ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`/works/${data.work.slug}`} target="_blank" rel="noopener noreferrer">
                公開ページを見る
                <ExternalLink aria-hidden />
              </a>
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              非公開（一覧の「公開」で切り替え）
            </span>
          )}
        </div>
      </div>
      {/* Keyed by id: the forms take their starting values once. */}
      <ContentForm
        key={`content-${data.work._id}`}
        work={data.work}
        docHighlights={data.doc?.docHighlights ?? []}
      />
      <ThumbnailPicker data={data} />
      <SourceForm key={`source-${data.work._id}`} data={data} />
      <DeleteWork work={data.work} />
    </div>
  );
}
