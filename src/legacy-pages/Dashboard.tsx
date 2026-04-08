import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ClipboardList, FileText, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalJobs: 0, applications: 0, interviews: 0, resumes: 0 });
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [jobsRes, appsRes, interviewsRes, resumesRes, profileRes] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "interview"),
        supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
      ]);

      setStats({
        totalJobs: jobsRes.count ?? 0,
        applications: appsRes.count ?? 0,
        interviews: interviewsRes.count ?? 0,
        resumes: resumesRes.count ?? 0,
      });
      if (profileRes.data) setProfile(profileRes.data);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: "Available Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Applications", value: stats.applications, icon: ClipboardList, color: "text-warning", bgColor: "bg-warning/10" },
    { label: "Interviews", value: stats.interviews, icon: TrendingUp, color: "text-success", bgColor: "bg-success/10" },
    { label: "Resumes", value: stats.resumes, icon: FileText, color: "text-primary", bgColor: "bg-primary/10" },
  ];

  const quickActions = [
    { title: "Browse Jobs", description: "Find your next opportunity", icon: Briefcase, href: "/jobs", color: "from-primary/10 to-primary/5" },
    { title: "Upload Resume", description: "AI-powered optimization", icon: FileText, href: "/resume", color: "from-warning/10 to-warning/5" },
    { title: "Track Applications", description: "Manage your pipeline", icon: ClipboardList, href: "/applications", color: "from-success/10 to-success/5" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Welcome back, ${profile.full_name?.split(" ")[0] || "there"}`}
        description="Here's your job search overview at a glance."
        icon={Sparkles}
        gradient={false}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-[100px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <StatCard key={stat.label} {...stat} delay={i * 0.08} />
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.href)}
                  className={`group relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br ${action.color} border border-border/50 hover-lift text-left transition-all`}
                >
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/15">
                    <action.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Pipeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {[
                { label: "Saved", count: stats.applications, color: "bg-secondary" },
                { label: "Applied", count: 0, color: "bg-primary/20" },
                { label: "Interview", count: stats.interviews, color: "bg-success/20" },
              ].map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-2">
                  {i > 0 && <div className="w-8 h-px bg-border" />}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${stage.color} text-xs font-medium`}>
                    <span>{stage.label}</span>
                    <span className="text-muted-foreground">({stage.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}