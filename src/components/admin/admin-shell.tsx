"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "作品" },
  { href: "/admin/profile", label: "プロフィール" },
  { href: "/admin/messages", label: "お問い合わせ" },
] as const;

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      <LogOut aria-hidden />
      ログアウト
    </Button>
  );
}

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname.startsWith("/admin/works")
      : pathname.startsWith(href);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6">
          <span className="mr-2 text-sm font-bold">管理</span>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(active(item.href) && "bg-muted text-foreground")}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                サイトを見る
                <ExternalLink aria-hidden />
              </a>
            </Button>
            <ThemeToggle />
            <span className="hidden text-xs text-muted-foreground lg:inline">{email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* The server knows the session already; the browser's Convex client
            fetches its own token after the page loads. Until it has one, the
            screens' queries would run signed out and be refused. */}
        <AuthLoading>
          <div className="grid gap-3" aria-hidden>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </AuthLoading>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>
          <p className="text-muted-foreground">
            ログインの有効期限が切れました。
            <a href="/login0117" className="text-primary underline underline-offset-4">
              もう一度ログイン
            </a>
            してください。
          </p>
        </Unauthenticated>
      </main>
    </div>
  );
}
