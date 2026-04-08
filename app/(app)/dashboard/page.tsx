import { BriefcaseBusiness, ClipboardList, FileText, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Row } from "@/lib/database.types";
import { unwrapSupabaseCount, unwrapSupabaseResult } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [jobs, applications, interviews, resumes, profile] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "interview"),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("profiles").select("full_name,current_role,preferred_roles").eq("user_id", user.id).single()
  ]);

  const profileData = unwrapSupabaseResult(profile, "Unable to load dashboard profile") as Row<"profiles"> | null;

  const statCards = [
    { label: "Live jobs", value: unwrapSupabaseCount(jobs, "Unable to load job count"), icon: BriefcaseBusiness },
    { label: "Tracked applications", value: unwrapSupabaseCount(applications, "Unable to load application count"), icon: ClipboardList },
    { label: "Interview loops", value: unwrapSupabaseCount(interviews, "Unable to load interview count"), icon: Sparkles },
    { label: "Resume versions", value: unwrapSupabaseCount(resumes, "Unable to load resume count"), icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <section className="glass-card p-8">
        <Badge className="rounded-full bg-teal-500/10 px-4 py-1.5 text-teal-700 dark:text-teal-300">Overview</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Welcome back{profileData?.full_name ? `, ${profileData.full_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">
          Your pipeline is organized around profile-aware job matching, ATS-safe resume optimization, and a cleaner path
          from discovery to interview.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {profileData?.current_role ? <Badge variant="secondary">{profileData.current_role}</Badge> : null}
          {(profileData?.preferred_roles ?? []).slice(0, 3).map((role: string) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="glass-card border-white/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
