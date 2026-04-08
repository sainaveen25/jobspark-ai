import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ClipboardList, FileText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalJobs: 0, applications: 0, interviews: 0, resumes: 0 });
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });

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
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: "Available Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-primary" },
    { label: "Applications", value: stats.applications, icon: ClipboardList, color: "text-warning" },
    { label: "Interviews", value: stats.interviews, icon: TrendingUp, color: "text-success" },
    { label: "Resumes", value: stats.resumes, icon: FileText, color: "text-primary" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome back, <span className="text-gradient">{profile.full_name?.split(" ")[0] || "there"}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here's your job search overview</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="/jobs" className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors text-center">
              <Briefcase className="w-6 h-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">Browse Jobs</span>
            </a>
            <a href="/resume" className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors text-center">
              <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">Upload Resume</span>
            </a>
            <a href="/applications" className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors text-center">
              <ClipboardList className="w-6 h-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">Track Applications</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
