"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin } from "lucide-react";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "saved" | "applied" | "interview" | "rejected";

interface ApplicationItem {
  id: string;
  status: Status;
  jobs: {
    title: string;
    company: string;
    location: string | null;
  };
}

const statusOrder: Status[] = ["saved", "applied", "interview", "rejected"];

const statusConfig: Record<Status, { dotColor: string; headerBg: string }> = {
  saved: { dotColor: "bg-muted-foreground", headerBg: "bg-muted/40" },
  applied: { dotColor: "bg-primary", headerBg: "bg-primary/5" },
  interview: { dotColor: "bg-emerald-500", headerBg: "bg-emerald-500/5" },
  rejected: { dotColor: "bg-destructive", headerBg: "bg-destructive/5" },
};

export function ApplicationsBoard({ initialApplications }: { initialApplications: ApplicationItem[] }) {
  const [applications, setApplications] = useState(initialApplications);

  const grouped = useMemo(
    () => statusOrder.map((status) => ({ status, items: applications.filter((a) => a.status === status) })),
    [applications]
  );

  const updateStatus = async (id: string, status: Status) => {
    const response = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Unable to update application");
      return;
    }
    setApplications((current) => current.map((item) => (item.id === id ? payload.application : item)));
    toast.success("Status updated");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">{applications.length} total across all stages</p>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {grouped.map(({ status, items }) => {
          const config = statusConfig[status];
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col"
            >
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl ${config.headerBg} border border-b-0 border-border/60`}>
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground capitalize">{status}</span>
                <span className="ml-auto text-[11px] text-muted-foreground font-medium bg-background/60 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="flex-1 space-y-2 p-2 border border-t-0 border-border/60 rounded-b-xl bg-muted/5 min-h-[180px]">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-10 opacity-40">No items</p>
                )}
                {items.map((app, i) => (
                  <motion.div key={app.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                    <Card className="border border-border/60 bg-card/90 group hover:border-primary/20 transition-colors">
                      <CardContent className="p-3 space-y-1.5">
                        <h4 className="text-sm font-semibold leading-tight truncate">{app.jobs.title}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{app.jobs.company}</span>
                        </div>
                        {app.jobs.location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{app.jobs.location}</span>
                          </div>
                        )}
                        <div className="pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value as Status)}
                            className="w-full h-7 rounded-lg border border-input bg-background/50 px-2 text-[11px]"
                          >
                            {statusOrder.map((s) => (
                              <option key={s} value={s} className="capitalize">{s}</option>
                            ))}
                          </select>
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
