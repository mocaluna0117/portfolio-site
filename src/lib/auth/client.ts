"use client";

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [convexClient()],
});

/** Throws when the sign-in cannot start; the client otherwise only returns it. */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: "/admin",
    errorCallbackURL: "/login0117",
  });
  if (error) throw new Error(error.message ?? `sign-in refused (${error.status})`);
}
