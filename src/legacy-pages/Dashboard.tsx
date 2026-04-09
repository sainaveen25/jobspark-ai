import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ClipboardList, FileText, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
    { label: "Available Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-primary" },
    { label: "Applications", value: stats.applications, icon: ClipboardList, color: "text-amber-500" },
    { label: "Interviews", value: stats.interviews, icon: TrendingUp, color: "text-emerald-500" },
    { label: "Resumes", value: stats.resumes, icon: FileText, color: "text-primary" },
  ];

  const quickActions = [
    { title: "Browse Jobs", description: "Find your next opportunity", icon: Briefcase, href: "/jobs" },
    { title: "Upload Resume", description: "AI-powered optimization", icon: FileText, href: "/resume" },
    { title: "Track Applications", description: "Manage your pipeline", icon: ClipboardList, href: "/applications" },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your job search overview</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-[88px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="border border-border/60 bg-card/80 hover:border-primary/20 transition-colors">
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
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.href)}
              className="group flex items-center gap-3.5 p-4 rounded-xl border border-border/60 bg-card/80 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 text-left transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <action.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Pipeline */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Pipeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: "Saved", count: stats.applications, bg: "bg-muted/60" },
                { label: "Applied", count: 0, bg: "bg-primary/10" },
                { label: "Interview", count: stats.interviews, bg: "bg-emerald-500/10" },
              ].map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-2">
                  {i > 0 && <div className="w-6 h-px bg-border" />}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${stage.bg} text-xs font-medium`}>
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
