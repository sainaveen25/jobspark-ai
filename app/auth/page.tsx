"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Chrome, KeyRound, ShieldCheck } from "lucide-react";

import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthStep = "login" | "signup" | "mfa";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<AuthStep>(searchParams.get("step") === "mfa" ? "mfa" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [configWarning, setConfigWarning] = useState<string | null>(null);

  const nextPath = useMemo(() => searchParams.get("next") ?? "/dashboard", [searchParams]);

  useEffect(() => {
    const forcedStep = searchParams.get("step");
    if (forcedStep === "mfa") {
      setStep("mfa");
    }
  }, [searchParams]);

  useEffect(() => {
    const loadHealth = async () => {
      const response = await fetch("/api/health/config");
      const payload = (await response.json()) as { warnings?: string[] };
      if (payload.warnings?.length) {
        setConfigWarning(payload.warnings[0]);
      }
    };

    void loadHealth();
  }, []);

  const enrollMfa = async () => {
    const response = await fetch("/api/auth/mfa/enroll", { method: "POST" });
    const payload = (await response.json()) as {
      error?: string;
      factorId?: string;
      qrCode?: string;
      secret?: string;
      alreadyEnabled?: boolean;
    };

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to start Google Authenticator setup.");
      return;
    }

    if (payload.alreadyEnabled) {
      toast.success("Google Authenticator is already enabled.");
      router.push(nextPath);
      return;
    }

    if (!payload.factorId || !payload.qrCode) {
      toast.error("MFA setup response is incomplete.");
      return;
    }

    setMfaFactorId(payload.factorId);
    setQrCode(payload.qrCode);
    setSecret(payload.secret ?? null);
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const payload = (await response.json()) as { error?: string; needsMfaSetup?: boolean };

      if (!response.ok) {
        toast.error(payload.error ?? "Unable to sign in.");
        return;
      }

      if (payload.needsMfaSetup) {
        setStep("mfa");
        await enrollMfa();
        return;
      }

      toast.success("Welcome back.");
      router.push(nextPath);
    });
  };

  const handleSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password })
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        needsMfaSetup?: boolean;
        needsEmailVerification?: boolean;
      };

      if (!response.ok) {
        toast.error(payload.error ?? "Unable to create your account.");
        return;
      }

      if (payload.needsEmailVerification) {
        toast.message(payload.message ?? "Please verify your email before signing in.");
        setStep("login");
        return;
      }

      if (payload.needsMfaSetup) {
        setStep("mfa");
        toast.success(payload.message ?? "Account created. Complete step 2.");
        await enrollMfa();
        return;
      }

      toast.success(payload.message ?? "Account created.");
      setStep("login");
    });
  };

  const handleMfaVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!mfaFactorId) {
      toast.error("Start setup first to receive your authenticator QR code.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: mfaFactorId, code: mfaCode })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        toast.error(payload.error ?? "Unable to verify MFA code.");
        return;
      }

      toast.success(payload.message ?? "MFA setup complete.");
      router.push(nextPath);
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
            Secure sign-in with password, Google, and mandatory authenticator setup.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Use email and password or Google to access JobSpark AI. New accounts complete Google Authenticator in step 2.
          </p>
        </section>

        <Card className="glass-card border-white/30 p-2">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Access your workspace</CardTitle>
            <p className="text-sm text-muted-foreground">Email/password and Google are both supported.</p>
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
              Email and password
              <div className="h-px flex-1 bg-border" />
            </div>

            {configWarning ? (
              <p className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                {configWarning}
              </p>
            ) : null}

            {step !== "mfa" ? (
              <div className="space-y-3">
                <div className="flex gap-2 rounded-2xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setStep("login")}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${step === "login" ? "bg-background" : "text-muted-foreground"}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("signup")}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${step === "signup" ? "bg-background" : "text-muted-foreground"}`}
                  >
                    Signup
                  </button>
                </div>

                {step === "login" ? (
                  <form className="space-y-3" onSubmit={handleLogin}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="login-email">
                        Email
                      </label>
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-12 rounded-2xl"
                        placeholder="name@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="login-password">
                        Password
                      </label>
                      <Input
                        id="login-password"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-12 rounded-2xl"
                        placeholder="At least 8 characters"
                      />
                    </div>
                    <Button type="submit" className="h-12 w-full rounded-2xl" disabled={pending}>
                      Login
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <form className="space-y-3" onSubmit={handleSignup}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="signup-name">
                        Full name
                      </label>
                      <Input
                        id="signup-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="h-12 rounded-2xl"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="signup-email">
                        Email
                      </label>
                      <Input
                        id="signup-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-12 rounded-2xl"
                        placeholder="name@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="signup-password">
                        Password
                      </label>
                      <Input
                        id="signup-password"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-12 rounded-2xl"
                        placeholder="At least 8 characters"
                      />
                    </div>
                    <Button type="submit" className="h-12 w-full rounded-2xl" disabled={pending}>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-sm font-semibold">Step 2: Configure Google Authenticator</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Scan the QR code with Google Authenticator and enter the 6-digit code to finish setup.
                  </p>
                </div>

                {qrCode ? (
                  <div className="rounded-2xl border border-border/60 bg-white p-4">
                    {qrCode.startsWith("<svg") ? (
                      <div dangerouslySetInnerHTML={{ __html: qrCode }} />
                    ) : (
                      <img src={qrCode} alt="Authenticator QR code" className="h-52 w-52" />
                    )}
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="h-12 w-full rounded-2xl" onClick={() => void enrollMfa()}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Start Google Authenticator setup
                  </Button>
                )}

                {secret ? (
                  <p className="text-xs text-muted-foreground">
                    Manual secret: <span className="font-mono">{secret}</span>
                  </p>
                ) : null}

                <form className="space-y-3" onSubmit={handleMfaVerify}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="mfa-code">
                      6-digit code
                    </label>
                    <Input
                      id="mfa-code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={mfaCode}
                      onChange={(event) => setMfaCode(event.target.value)}
                      className="h-12 rounded-2xl"
                      placeholder="123456"
                    />
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-2xl" disabled={pending}>
                    Verify and continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
