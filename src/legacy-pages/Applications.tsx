import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, MapPin, ExternalLink, Trash2, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { SkeletonRow } from "@/components/SkeletonCard";

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

const statusConfig: Record<string, { label: string; dotColor: string; headerBg: string }> = {
  saved: { label: "Saved", dotColor: "bg-muted-foreground", headerBg: "bg-muted/40" },
  applied: { label: "Applied", dotColor: "bg-primary", headerBg: "bg-primary/5" },
  interview: { label: "Interview", dotColor: "bg-emerald-500", headerBg: "bg-emerald-500/5" },
  rejected: { label: "Rejected", dotColor: "bg-destructive", headerBg: "bg-destructive/5" },
};

const statuses = ["saved", "applied", "interview", "rejected"] as const;

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("applications")
      .select("*, jobs(title, company, location, job_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load applications");
    else setApplications((data as unknown as ApplicationWithJob[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void fetchApplications(); }, [fetchApplications]);

  const updateStatus = async (appId: string, status: string) => {
    const update: Record<string, unknown> = { status };
    if (status === "applied") update.applied_at = new Date().toISOString();
    const { error } = await supabase.from("applications").update(update).eq("id", appId);
    if (error) toast.error("Failed to update");
    else {
      toast.success(`Status updated to ${status}`);
      void fetchApplications();
    }
  };

  const deleteApp = async (appId: string) => {
    const { error } = await supabase.from("applications").delete().eq("id", appId);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Removed");
      void fetchApplications();
    }
  };

  const getByStatus = (status: string) => applications.filter((a) => a.status === status);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="h-14 skeleton-shimmer rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <SkeletonRow className="h-10" />
              <SkeletonRow className="h-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">{applications.length} total across all stages</p>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((status) => {
          const config = statusConfig[status];
          const items = getByStatus(status);

          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col"
            >
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl ${config.headerBg} border border-b-0 border-border/60`}>
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{config.label}</span>
                <span className="ml-auto text-[11px] text-muted-foreground font-medium bg-background/60 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 space-y-2 p-2 border border-t-0 border-border/60 rounded-b-xl bg-muted/5 min-h-[180px]">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-10 opacity-40">No items</p>
                )}
                {items.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="border border-border/60 bg-card/90 group hover:border-primary/20 transition-colors">
                      <CardContent className="p-3 space-y-1.5">
                        <h4 className="text-sm font-semibold leading-tight truncate text-foreground">
                          {app.jobs?.title ?? "Unknown Job"}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{app.jobs?.company ?? "Unknown"}</span>
                        </div>
                        {app.jobs?.location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{app.jobs.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Select value={app.status} onValueChange={(val) => updateStatus(app.id, val)}>
                            <SelectTrigger className="h-7 text-[11px] flex-1 bg-background/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {app.jobs?.job_url && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
                              <a href={app.jobs.job_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteApp(app.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
