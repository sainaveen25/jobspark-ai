"use client";

import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export function ApplicationsBoard({ initialApplications }: { initialApplications: ApplicationItem[] }) {
  const [applications, setApplications] = useState(initialApplications);

  const grouped = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        items: applications.filter((application) => application.status === status)
      })),
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
    toast.success("Application status updated");
  };

  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <Badge className="rounded-full bg-primary/10 px-4 py-1.5 text-primary">Tracker</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Keep the pipeline honest.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review your funnel in a kanban view and update statuses from the detailed table without leaving the page.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {grouped.map((group) => (
          <Card key={group.status} className="glass-card min-h-[280px] border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base capitalize">
                {group.status}
                <Badge variant="secondary">{group.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map((application) => (
                <div key={application.id} className="rounded-2xl border bg-background/70 p-4">
                  <p className="font-medium">{application.jobs.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{application.jobs.company}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="glass-card border-white/30">
        <CardHeader>
          <CardTitle>Application detail table</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{application.jobs.title}</TableCell>
                  <TableCell>{application.jobs.company}</TableCell>
                  <TableCell>{application.jobs.location ?? "Remote / flexible"}</TableCell>
                  <TableCell>
                    <select
                      value={application.status}
                      onChange={(event) => updateStatus(application.id, event.target.value as Status)}
                      className="w-[180px] rounded-2xl border border-input bg-background px-4 py-2"
                    >
                      {statusOrder.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
