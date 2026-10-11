"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";

function Form({ initial }: { initial: { handle: string; intro: string; githubUrl: string } }) {
  const update = useMutation(api.site.updateProfile);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await update(form);
      toast.success("保存しました。");
    } catch (error) {
      toast.error(errorMessage(error, "保存できませんでした。"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="handle">名前（ハンドルネーム）</Label>
        <Input
          id="handle"
          value={form.handle}
          onChange={(e) => setForm({ ...form, handle: e.target.value })}
          required
          maxLength={40}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="intro">一言の紹介</Label>
        <Textarea
          id="intro"
          rows={4}
          value={form.intro}
          onChange={(e) => setForm({ ...form, intro: e.target.value })}
          maxLength={400}
        />
        <p className="text-xs text-muted-foreground">
          トップページの名前の下に出ます。{form.intro.length} / 400 文字
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="github">GitHub</Label>
        <Input
          id="github"
          value={form.githubUrl}
          onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
          保存する
        </Button>
      </div>
    </form>
  );
}

export function ProfileForm() {
  const profile = useQuery(api.site.profile, {});
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">プロフィール</h1>
      <Card>
        <CardHeader>
          <CardTitle>自己紹介</CardTitle>
          <CardDescription>サイトに載せるのは、名前・一言の紹介・GitHub だけです。</CardDescription>
        </CardHeader>
        <CardContent>
          {profile === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Form
              initial={{
                handle: profile.handle,
                intro: profile.intro,
                githubUrl: profile.githubUrl,
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
