"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import type { ComponentProps, ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth/client";

// better-auth's client type has moved on from the one this provider names;
// at runtime it is the same client with the Convex plugin.
type ProviderAuthClient = ComponentProps<typeof ConvexBetterAuthProvider>["authClient"];

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  verbose: false,
});

/**
 * The public pages are rendered on the server from the cache; only the
 * contact form and the admin screens talk to Convex from the browser. The
 * token is fetched on the client, so the root layout reads no cookie and
 * stays part of every page's static shell.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient as unknown as ProviderAuthClient}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </ThemeProvider>
    </ConvexBetterAuthProvider>
  );
}
