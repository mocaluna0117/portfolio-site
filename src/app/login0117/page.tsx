import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginCard } from "@/components/auth/login-card";

/**
 * The owner's way in. Linked from nowhere and kept out of search engines
 * (here and by an X-Robots-Tag header in next.config.ts); knowing the address
 * gets no one anywhere, since only the owner's Google account is accepted.
 */
export const metadata: Metadata = {
  title: "ログイン",
  robots: { index: false, follow: false, nocache: true },
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-24">
      {/* The card reads ?error= from the URL, which waits for the request. */}
      <Suspense>
        <LoginCard />
      </Suspense>
    </main>
  );
}
