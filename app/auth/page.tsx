"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Briefcase, FileText, KeyRound, Sparkles, Target, Zap } from "lucide-react";

import { lovable } from "@/src/integrations/lovable";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthStep = "login" | "signup" | "mfa";

const features = [
  { icon: Target, title: "Smart Job Matching", desc: "AI finds roles that fit your skills and goals" },
  { icon: FileText, title: "Resume Optimizer", desc: "Tailor your resume for every application" },
  { icon: Zap, title: "Auto-Sync Jobs", desc: "Fresh listings from Greenhouse, Lever & Workday" },
  { icon: Sparkles, title: "Apply Assist", desc: "One-click applications with AI cover letters" },
];

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
  const [googleLoading, setGoogleLoading] = useState(false);

  const nextPath = useMemo(() => searchParams.get("next") ?? "/dashboard", [searchParams]);

  useEffect(() => {
    const forcedStep = searchParams.get("step");
    if (forcedStep === "mfa") setStep("mfa");
  }, [searchParams]);

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
      toast.error(payload.error ?? "Unable to start authenticator setup.");
      return;
    }

    if (payload.alreadyEnabled) {
      toast.success("Authenticator is already enabled.");
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
      if (!response.ok) { toast.error(payload.error ?? "Unable to sign in."); return; }
      if (payload.needsMfaSetup) { setStep("mfa"); await enrollMfa(); return; }
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
        error?: string; message?: string; needsMfaSetup?: boolean; needsEmailVerification?: boolean;
      };
      if (!response.ok) { toast.error(payload.error ?? "Unable to create your account."); return; }
      if (payload.needsEmailVerification) { toast.message(payload.message ?? "Please verify your email before signing in."); setStep("login"); return; }
      if (payload.needsMfaSetup) { setStep("mfa"); toast.success(payload.message ?? "Account created. Complete step 2."); await enrollMfa(); return; }
      toast.success(payload.message ?? "Account created.");
      setStep("login");
    });
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast.error(result.error instanceof Error ? result.error.message : "Google sign-in failed.");
        return;
      }

      if (result.redirected) return;

      toast.success("Welcome!");
      router.push(nextPath);
    } catch {
      toast.error("Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMfaVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mfaFactorId) { toast.error("Start setup first to receive your authenticator QR code."); return; }
    startTransition(async () => {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: mfaFactorId, code: mfaCode })
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) { toast.error(payload.error ?? "Unable to verify MFA code."); return; }
      toast.success(payload.message ?? "MFA setup complete.");
      router.push(nextPath);
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-teal-500/5 px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        {/* Left — Branding */}
        <section className="flex flex-col justify-center space-y-8">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/25">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                JobSpark<span className="text-teal-500">.ai</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              Your AI Career<br />
              <span className="bg-gradient-to-r from-teal-500 to-cyan-400 bg-clip-text text-transparent">
                Operating System
              </span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Automate your job search. Get matched with the right roles, optimize your resume, and apply faster — all powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-colors hover:bg-card/80">
                <f.icon className="mb-2 h-5 w-5 text-teal-500" />
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right — Auth Card */}
        <Card className="border-border/60 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-xl font-semibold">
                {step === "mfa" ? "Set up authenticator" : "Get started"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === "mfa" ? "Scan the QR code with your authenticator app" : "Sign in or create an account to continue"}
              </p>
            </div>

            {step !== "mfa" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl text-sm font-medium"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {googleLoading ? "Connecting..." : "Continue with Google"}
                </Button>

                <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="flex gap-1 rounded-xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setStep("login")}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${step === "login" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("signup")}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${step === "signup" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Sign up
                  </button>
                </div>

                {step === "login" ? (
                  <form className="space-y-3" onSubmit={handleLogin}>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium" htmlFor="login-email">Email</label>
                      <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" placeholder="name@company.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium" htmlFor="login-password">Password</label>
                      <Input id="login-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" placeholder="At least 8 characters" />
                    </div>
                    <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700" disabled={pending}>
                      {pending ? "Signing in..." : "Sign in"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <form className="space-y-3" onSubmit={handleSignup}>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium" htmlFor="signup-name">Full name</label>
                      <Input id="signup-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 rounded-xl" placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium" htmlFor="signup-email">Email</label>
                      <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" placeholder="name@company.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium" htmlFor="signup-password">Password</label>
                      <Input id="signup-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" placeholder="At least 8 characters" />
                    </div>
                    <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700" disabled={pending}>
                      {pending ? "Creating account..." : "Create account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </>
            )}

            {step === "mfa" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-muted/50 p-4">
                  <p className="text-sm font-semibold">Step 2: Configure Authenticator</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scan the QR code with Google Authenticator and enter the 6-digit code.
                  </p>
                </div>

                {qrCode ? (
                  <div className="flex justify-center rounded-xl border border-border/60 bg-white p-4">
                    {qrCode.startsWith("<svg") ? (
                      <div dangerouslySetInnerHTML={{ __html: qrCode }} />
                    ) : (
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="Authenticator QR code" className="h-48 w-48" />
                    )}
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={() => void enrollMfa()}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Start authenticator setup
                  </Button>
                )}

                {secret && (
                  <p className="text-xs text-muted-foreground">
                    Manual secret: <span className="font-mono select-all">{secret}</span>
                  </p>
                )}

                <form className="space-y-3" onSubmit={handleMfaVerify}>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="mfa-code">6-digit code</label>
                    <Input id="mfa-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} className="h-11 rounded-xl" placeholder="123456" />
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700" disabled={pending}>
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
