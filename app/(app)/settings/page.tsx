import { Shield, Sparkles, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Security posture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Supabase RLS protects user profile, resume, and application records by authenticated owner.</p>
          <Badge variant="secondary">Protected routes enabled</Badge>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Workflow className="h-5 w-5 text-primary" />
            Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Use the job sync endpoint to refresh Greenhouse, Lever, and Workday pipelines on demand or via cron.</p>
          <Badge variant="outline">POST /api/jobs/sync</Badge>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI stack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Resume optimization runs through the OpenAI chat completions API and stores versioned outputs for auditability.</p>
          <Badge variant="secondary">Versioned resume outputs</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
