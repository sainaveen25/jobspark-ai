import { Moon, Shield, Sparkles, SunMedium, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { getRedactedSecretState } from "@/lib/env";

export default function SettingsPage() {
  const secrets = getRedactedSecretState();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">App preferences and configuration</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <SunMedium className="w-4 h-4 text-primary" />
              </div>
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Row-level security protects all your data by authenticated owner.</p>
            <Badge variant="secondary">Protected routes enabled</Badge>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Workflow className="w-4 h-4 text-primary" />
              </div>
              Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use the job sync endpoint to refresh pipelines on demand or via cron.</p>
            <Badge variant="outline">POST /api/jobs/sync</Badge>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              AI Stack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Resume optimization uses AI and stores versioned outputs for auditability.</p>
            <Badge variant="secondary">Versioned outputs</Badge>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/90 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Moon className="w-4 h-4 text-primary" />
              </div>
              Integration Secrets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Secrets stay server-side. The app only renders masked previews for verification.</p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1 rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">Git API</span>
                  <Badge variant={secrets.gitApi.configured ? "secondary" : "outline"}>
                    {secrets.gitApi.configured ? "Configured" : "Missing"}
                  </Badge>
                </div>
                <p className="font-mono text-xs">
                  {secrets.gitApi.maskedValue ?? "Not set"}
                </p>
              </div>

              <div className="space-y-1 rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">Apify Token</span>
                  <Badge variant={secrets.apifyToken.configured ? "secondary" : "outline"}>
                    {secrets.apifyToken.configured ? "Configured" : "Missing"}
                  </Badge>
                </div>
                <p className="font-mono text-xs">
                  {secrets.apifyToken.maskedValue ?? "Not set"}
                </p>
              </div>

              <div className="space-y-1 rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">Apify Secret PIN</span>
                  <Badge variant={secrets.apifySecretPin.configured ? "secondary" : "outline"}>
                    {secrets.apifySecretPin.configured ? "Configured" : "Missing"}
                  </Badge>
                </div>
                <p className="font-mono text-xs">
                  {secrets.apifySecretPin.maskedValue ?? "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
