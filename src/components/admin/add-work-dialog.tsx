"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";

function Field({
  id,
  label,
  hint,
  ...input
}: { id: string; label: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...input} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** A new work starts unpublished; it is filled in on its edit page. */
export function AddWorkDialog() {
  const router = useRouter();
  const create = useMutation(api.works.create);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    repo: "mocaluna0117/",
    ref: "main",
    docPath: "docs/portfolio/PORTFOLIO.md",
    videoPath: "",
  });
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const id = await create({
        slug: form.slug,
        title: form.title,
        source: {
          repo: form.repo,
          ref: form.ref,
          docPath: form.docPath,
          ...(form.videoPath.trim() ? { videoPath: form.videoPath } : {}),
        },
      });
      setOpen(false);
      toast.success("作品を追加しました。続けて「GitHub から取り込み直す」を押してください。");
      router.push(`/admin/works/${id}`);
    } catch (error) {
      toast.error(errorMessage(error, "追加できませんでした。"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden />
          作品を追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>作品を追加</DialogTitle>
            <DialogDescription>
              追加した作品は非公開で作られます。内容を確かめてから公開してください。
            </DialogDescription>
          </DialogHeader>
          <div className="my-6 grid gap-4">
            <Field
              id="new-slug"
              label="URL 名"
              hint="英小文字・数字・ハイフン。/works/○○ になり、あとから変えられません。"
              value={form.slug}
              onChange={set("slug")}
              required
            />
            <Field
              id="new-title"
              label="作品名"
              value={form.title}
              onChange={set("title")}
              required
            />
            <Field
              id="new-repo"
              label="リポジトリ"
              hint="owner/name の形。公開リポジトリだけ取り込めます。"
              value={form.repo}
              onChange={set("repo")}
              required
            />
            <div className="grid grid-cols-[8rem_1fr] gap-3">
              <Field
                id="new-ref"
                label="ブランチ"
                value={form.ref}
                onChange={set("ref")}
                required
              />
              <Field
                id="new-doc"
                label="資料のパス"
                value={form.docPath}
                onChange={set("docPath")}
                required
              />
            </div>
            <Field
              id="new-video"
              label="動画のパス（任意）"
              placeholder="docs/portfolio/xxx-demo.mp4"
              value={form.videoPath}
              onChange={set("videoPath")}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              追加する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
