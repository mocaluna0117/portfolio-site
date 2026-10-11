import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AdminShell, SignOutButton } from "@/components/admin/admin-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth/server";

/**
 * The admin screens wait for the session on every request and are used by
 * one person: not worth shaping for instant navigation.
 */
export const instant = false;

export const metadata: Metadata = {
  title: { default: "管理", template: "%s · 管理" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Checked on the server before anything is shown. Each Convex function the
 * screens call checks again on its own (requireAdmin), so this guard is for
 * the owner's convenience, not the site's safety.
 */
async function AdminGate({ children }: { children: ReactNode }) {
  if (!(await isAuthenticated())) redirect("/login0117");
  const me = await fetchAuthQuery(api.auth.me, {});
  if (!me?.isAdmin) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>このアカウントでは管理できません</CardTitle>
            <CardDescription>
              {me?.email ? `${me.email} は管理者として登録されていません。` : null}
            </CardDescription>
          </CardHeader>
          <div className="px-6">
            <SignOutButton />
          </div>
        </Card>
      </main>
    );
  }
  return <AdminShell email={me.email ?? ""}>{children}</AdminShell>;
}

function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6" aria-hidden>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-8 h-24 w-full" />
      <Skeleton className="mt-3 h-24 w-full" />
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    // Reading the session waits for the request.
    <Suspense fallback={<AdminLoading />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
