"use client";

import { FormEvent, useState, useTransition } from "react";
import { ArrowRight, Chrome, Mail, ShieldCheck } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const handleEmailLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        toast.error(payload.error ?? "Unable to send sign-in link.");
        return;
      }

      toast.success(payload.message ?? "Check your inbox for the secure sign-in link.");
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-card panel-grid relative overflow-hidden p-8 md:p-12">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400" />
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI Career Operating System
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Build a sharper profile, discover better roles, and tailor every resume with precision.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            JobSpark AI combines profile intelligence, live job ingestion, ATS-safe resume optimization, and a
            recruiter-ready application tracker in one polished workflow.
          </p>
        </section>

        <Card className="glass-card border-white/30 p-2">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Access your workspace</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use Google for the fastest setup or fall back to email magic links.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action="/api/auth/google" method="post">
              <Button type="submit" className="h-12 w-full rounded-2xl text-base">
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
            </form>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              Email fallback
              <div className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-3" onSubmit={handleEmailLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl pl-11"
                    placeholder="name@company.com"
                  />
                </div>
              </div>
              <Button type="submit" variant="outline" className="h-12 w-full rounded-2xl" disabled={pending}>
                Send secure magic link
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
