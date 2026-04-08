import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, MapPin, ExternalLink, Trash2, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
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

const statusConfig: Record<string, { label: string; dot: string; badge: string; header: string }> = {
  saved: { label: "Saved", dot: "bg-muted-foreground", badge: "bg-secondary text-secondary-foreground", header: "border-muted-foreground/30" },
  applied: { label: "Applied", dot: "bg-primary", badge: "bg-primary/10 text-primary", header: "border-primary/30" },
  interview: { label: "Interview", dot: "bg-success", badge: "bg-success/10 text-success", header: "border-success/30" },
  rejected: { label: "Rejected", dot: "bg-destructive", badge: "bg-destructive/10 text-destructive", header: "border-destructive/30" },
};

const statuses = ["saved", "applied", "interview", "rejected"] as const;

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

  const getByStatus = (status: string) => applications.filter((a) => a.status === status);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="h-16 skeleton-shimmer rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <SkeletonRow className="h-10" />
              <SkeletonRow className="h-24" />
              <SkeletonRow className="h-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Applications"
        description="Track your job applications across all stages"
        icon={ClipboardList}
        badge={`${applications.length} total`}
      />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((status) => {
          const config = statusConfig[status];
          const items = getByStatus(status);

          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col"
            >
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-b-2 ${config.header} bg-muted/30`}>
                <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                <span className="text-sm font-semibold capitalize">{config.label}</span>
                <span className="ml-auto text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 space-y-2 p-2 bg-muted/10 rounded-b-xl min-h-[200px]">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8 opacity-50">No items</p>
                )}
                {items.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="glass-card group">
                      <CardContent className="p-3 space-y-2">
                        <h4 className="text-sm font-semibold leading-tight truncate">
                          {app.jobs?.title ?? "Unknown Job"}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{app.jobs?.company ?? "Unknown"}</span>
                        </div>
                        {app.jobs?.location && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{app.jobs.location}</span>
                          </div>
                        )}

                        {/* Actions — visible on hover */}
                        <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Select value={app.status} onValueChange={(val) => updateStatus(app.id, val)}>
                            <SelectTrigger className="h-7 text-xs flex-1">
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