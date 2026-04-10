"use client";

// Re-export lovable auth for use in Next.js app/ pages.
// The underlying module is compiled by the Vite tsconfig (tsconfig.app.json).
// We re-export here so the Next.js tsconfig doesn't need to resolve
// @lovable.dev/cloud-auth-js types directly.

export async function signInWithGoogle(redirectUri: string) {
  const { lovable } = await import("@/src/integrations/lovable/index");
  return lovable.auth.signInWithOAuth("google", { redirect_uri: redirectUri });
}
