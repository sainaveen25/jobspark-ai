"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-lg text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
