"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, signInWithGoogle } from "@/lib/auth/client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

/**
 * Email and password, for development and the end-to-end tests only: shown
 * when NEXT_PUBLIC_DEV_PASSWORD_LOGIN is set, and refused by Convex anyway
 * unless that deployment sets ALLOW_PASSWORD_AUTH. Production sets neither.
 */
function DevPasswordForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const signedIn = await authClient.signIn.email({ email, password });
    if (signedIn.error) {
      const signedUp = await authClient.signUp.email({ email, password, name: email });
      if (signedUp.error) {
        setError(signedUp.error.message ?? "ログインできませんでした。");
        setBusy(false);
        return;
      }
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 border-t pt-6">
      <p className="text-xs text-muted-foreground">開発用（本番には表示されません）</p>
      <div className="grid gap-1.5">
        <Label htmlFor="dev-email">メールアドレス</Label>
        <Input
          id="dev-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="dev-password">パスワード</Label>
        <Input
          id="dev-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" variant="secondary" disabled={busy}>
        メールアドレスでログイン
      </Button>
    </form>
  );
}

export function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
      ? "このアカウントではログインできません。管理者だけがログインできます。"
      : null,
  );

  // Already signed in: straight on to the admin screens.
  useEffect(() => {
    if (session) router.replace("/admin");
  }, [session, router]);

  async function google() {
    setStarting(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("ログインを始められませんでした。時間をおいてもう一度お試しください。");
      setStarting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">管理者ログイン</CardTitle>
        <CardDescription>サイトの管理者だけが使うページです。</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          className="w-full"
          variant="outline"
          size="lg"
          onClick={google}
          disabled={starting || isPending || !!session}
        >
          {starting || session ? <Loader2 className="animate-spin" aria-hidden /> : <GoogleMark />}
          Google でログイン
        </Button>
        {process.env.NEXT_PUBLIC_DEV_PASSWORD_LOGIN === "true" ? (
          <DevPasswordForm onDone={() => router.replace("/admin")} />
        ) : null}
      </CardContent>
    </Card>
  );
}
