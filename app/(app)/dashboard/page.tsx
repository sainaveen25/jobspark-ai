import { BriefcaseBusiness, ClipboardList, FileText, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

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
    { label: "Live jobs", value: unwrapSupabaseCount(jobs, "Unable to load job count"), icon: BriefcaseBusiness, color: "text-primary" },
    { label: "Applications", value: unwrapSupabaseCount(applications, "Unable to load application count"), icon: ClipboardList, color: "text-amber-500" },
    { label: "Interviews", value: unwrapSupabaseCount(interviews, "Unable to load interview count"), icon: Sparkles, color: "text-emerald-500" },
    { label: "Resumes", value: unwrapSupabaseCount(resumes, "Unable to load resume count"), icon: FileText, color: "text-primary" }
  ];

  const quickActions = [
    { title: "Browse Jobs", description: "Find your next opportunity", icon: BriefcaseBusiness, href: "/dashboard/jobs" },
    { title: "Upload Resume", description: "AI-powered optimization", icon: FileText, href: "/dashboard/resume" },
    { title: "Track Applications", description: "Manage your pipeline", icon: ClipboardList, href: "/dashboard/applications" },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back{profileData?.full_name ? `, ${profileData.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s your job search overview</p>
        {((profileData?.preferred_roles as string[] | null) ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {((profileData?.preferred_roles as string[] | null) ?? []).slice(0, 3).map((role: string) => (
              <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border border-border/60 bg-card/90">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex items-center gap-3.5 p-4 rounded-xl border border-border/60 bg-card/90 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <action.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
