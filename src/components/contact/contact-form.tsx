"use client";

import { api } from "@convex/_generated/api";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useAction } from "convex/react";
import { Loader2, Send } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";
import { t } from "@/lib/i18n/ja";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const EMPTY = { name: "", email: "", body: "", website: "" };

export function ContactForm() {
  const submit = useAction(api.contact.submit);
  const turnstile = useRef<TurnstileInstance>(null);
  const [form, setForm] = useState(EMPTY);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const c = t.contact;

  if (!SITE_KEY) return <p className="text-muted-foreground">{c.unavailable}</p>;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      toast.error(c.waitForCheck);
      return;
    }
    setBusy(true);
    try {
      await submit({ ...form, turnstileToken: token });
      setForm(EMPTY);
      setSent(true);
    } catch (error) {
      toast.error(errorMessage(error, c.failed));
    } finally {
      // A token is good for one check only.
      setToken(null);
      turnstile.current?.reset();
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-xl border bg-accent/50 p-6">
        <p className="font-bold">{c.thanksTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.thanksBody}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
          {c.another}
        </Button>
      </div>
    );
  }

  const set =
    (key: keyof typeof EMPTY) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="contact-name">{c.name}</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
            required
            maxLength={80}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contact-email">{c.email}</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            required
            maxLength={200}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="contact-body">{c.body}</Label>
        <Textarea
          id="contact-body"
          rows={6}
          value={form.body}
          onChange={set("body")}
          required
          maxLength={2000}
        />
        <p className="text-right text-xs text-muted-foreground">{form.body.length} / 2000</p>
      </div>
      {/* Hidden from people; a bot that fills it in is ignored. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={set("website")}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Turnstile
          ref={turnstile}
          siteKey={SITE_KEY}
          options={{ language: "ja", theme: "auto", size: "normal" }}
          onSuccess={setToken}
          onExpire={() => setToken(null)}
          onError={() => setToken(null)}
        />
        <Button type="submit" size="lg" disabled={busy || !token}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          {c.send}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{c.privacy}</p>
    </form>
  );
}
