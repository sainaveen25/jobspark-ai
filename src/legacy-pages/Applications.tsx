import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, MapPin, ExternalLink, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApplicationWithJob {
  id: string;
  status: string;
  applied_at: string | null;
  created_at: string;
  job_id: string;
  jobs: {
    title: string;
    company: string;
    location: string | null;
    job_url: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  saved: "bg-secondary text-secondary-foreground",
  applied: "bg-primary/10 text-primary",
  interview: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("applications")
      .select("*, jobs(title, company, location, job_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load applications");
    else setApplications((data as unknown as ApplicationWithJob[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, [user]);

  const updateStatus = async (appId: string, status: string) => {
    const update: Record<string, unknown> = { status };
    if (status === "applied") update.applied_at = new Date().toISOString();
    const { error } = await supabase.from("applications").update(update).eq("id", appId);
    if (error) toast.error("Failed to update");
    else {
      toast.success(`Status updated to ${status}`);
      fetchApplications();
    }
  };

  const deleteApp = async (appId: string) => {
    const { error } = await supabase.from("applications").delete().eq("id", appId);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Removed");
      fetchApplications();
    }
  };

  const statuses = ["saved", "applied", "interview", "rejected"] as const;

  if (loading) {
    return <div className="space-y-4 max-w-4xl">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Applications</h1>
        <p className="text-muted-foreground mt-1">Track your job applications</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          {statuses.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s} ({applications.filter((a) => a.status === s).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {["all", ...statuses].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
            {applications
              .filter((a) => tab === "all" || a.status === tab)
              .map((app, i) => (
                <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold truncate">{app.jobs?.title ?? "Unknown Job"}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {app.jobs?.company ?? "Unknown"}</span>
                            {app.jobs?.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {app.jobs.location}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[app.status]}>{app.status}</Badge>
                          <Select value={app.status} onValueChange={(val) => updateStatus(app.id, val)}>
                            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {app.jobs?.job_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                              <a href={app.jobs.job_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteApp(app.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            {applications.filter((a) => tab === "all" || a.status === tab).length === 0 && (
              <Card className="glass-card"><CardContent className="py-8 text-center text-muted-foreground">No applications in this category</CardContent></Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
