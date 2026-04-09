"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ExternalLink, MapPin, RefreshCw, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface JobRecord {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  job_url: string | null;
  source: string | null;
  posted_date: string | null;
  matchScore: number;
}

interface ApplicationRecord {
  id: string;
  job_id: string;
  status: "saved" | "applied" | "interview" | "rejected";
}

interface ApplyAssistState {
  checklist: string[];
  prefill: Record<string, string | string[] | null>;
  jobUrl: string | null;
}

interface SyncStatus {
  source: string;
  actorId: string;
  ok: boolean;
  synced: number;
  error?: string;
}

export function JobsBoard({
  initialJobs,
  initialApplications,
  initialError,
  visaStatus,
  preferredLocations
}: {
  initialJobs: JobRecord[];
  initialApplications: ApplicationRecord[];
  initialError?: string | null;
  visaStatus: string | null;
  preferredLocations: string[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [applications, setApplications] = useState(initialApplications);
  const [loadError, setLoadError] = useState<string | null>(initialError ?? null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [visaFilter, setVisaFilter] = useState("all");
  const [syncing, startSync] = useTransition();
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [configWarning, setConfigWarning] = useState<string | null>(null);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [assistState, setAssistState] = useState<ApplyAssistState | null>(null);

  useEffect(() => {
    const loadHealth = async () => {
      const response = await fetch("/api/health/config");
      const payload = (await response.json()) as { warnings?: string[] };
      if (payload.warnings?.length) {
        setConfigWarning(payload.warnings[0]);
      }
    };

    void loadHealth();
  }, []);

  const locations = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.location).filter(Boolean) as string[])).sort(),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || job.title.toLowerCase().includes(roleFilter.toLowerCase());
      const matchesLocation = locationFilter === "all" || job.location === locationFilter;
      const matchesVisa =
        visaFilter === "all" ||
        (visaFilter === "preferred" && Boolean(visaStatus)) ||
        (visaFilter === "not-needed" && !visaStatus);

      return matchesSearch && matchesRole && matchesLocation && matchesVisa;
    });
  }, [jobs, locationFilter, roleFilter, search, visaFilter, visaStatus]);

  const applicationMap = useMemo(() => new Map(applications.map((application) => [application.job_id, application])), [applications]);

  const handleSync = () => {
    startSync(async () => {
      const response = await fetch("/api/jobs/sync", { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        setLoadError(payload.error ?? "Unable to sync jobs");
        toast.error(payload.error ?? "Unable to sync jobs");
        return;
      }

      setSyncStatuses(payload.statuses ?? []);

      const jobsResponse = await fetch("/api/jobs");
      const jobsPayload = await jobsResponse.json();

      if (!jobsResponse.ok) {
        setLoadError(jobsPayload.error ?? "Jobs synced, but refreshing the dashboard failed");
        toast.error(jobsPayload.error ?? "Jobs synced, but refreshing the dashboard failed");
        return;
      }

      setJobs(jobsPayload.jobs ?? []);
      setApplications(jobsPayload.applications ?? []);
      setLoadError(null);
      if (payload.partial) {
        toast.message(`Synced ${payload.synced ?? 0} jobs with partial source failures`);
      } else {
        toast.success(`Synced ${payload.synced ?? 0} jobs`);
      }
    });
  };

  const toggleSave = async (jobId: string, currentlySaved: boolean) => {
    setSavingJobId(jobId);
    const response = await fetch("/api/jobs/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, save: !currentlySaved })
    });
    const payload = await response.json();
    setSavingJobId(null);

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to update saved job");
      return;
    }

    if (currentlySaved) {
      setApplications((current) => current.filter((item) => !(item.job_id === jobId && item.status === "saved")));
      toast.success("Removed from saved jobs");
      return;
    }

    if (payload.application) {
      setApplications((current) => [...current.filter((item) => item.job_id !== jobId), payload.application]);
    }

    toast.success("Saved job to your tracker");
  };

  const openApplyAssist = async (jobId: string) => {
    const response = await fetch("/api/jobs/apply-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId })
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to prepare apply assist");
      return;
    }

    setAssistState(payload);
  };

  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Badge className="rounded-full bg-primary/10 px-4 py-1.5 text-primary">Live pipeline</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Discover high-signal roles.</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Search across aggregated roles, see match scoring instantly, and prep every application with profile-aware
              guidance before you open the employer portal.
            </p>
          </div>
          <Button onClick={handleSync} disabled={syncing} className="rounded-2xl">
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Refresh job feeds
          </Button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_repeat(3,minmax(0,0.7fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles or companies" className="h-12 rounded-2xl pl-11" />
          </div>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-12 rounded-2xl border border-input bg-background px-4 text-sm">
            <option value="all">All roles</option>
            <option value="engineer">Engineering</option>
            <option value="product">Product</option>
            <option value="design">Design</option>
          </select>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="h-12 rounded-2xl border border-input bg-background px-4 text-sm">
            <option value="all">All locations</option>
            {preferredLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
            {locations.filter((location) => !preferredLocations.includes(location)).map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <select value={visaFilter} onChange={(event) => setVisaFilter(event.target.value)} className="h-12 rounded-2xl border border-input bg-background px-4 text-sm">
            <option value="all">All visa profiles</option>
            <option value="preferred">Need visa support</option>
            <option value="not-needed">No visa support needed</option>
          </select>
        </div>

        {loadError ? (
          <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        <p className="mt-4 rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
          Jobs load instantly from your database cache. Use Refresh job feeds to fetch the latest sources in the background.
        </p>

        {configWarning ? (
          <p className="mt-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {configWarning}
          </p>
        ) : null}

        {syncStatuses.length ? (
          <div className="mt-3 rounded-2xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Latest sync status</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {syncStatuses.map((status) => (
                <Badge
                  key={`${status.source}-${status.actorId}`}
                  variant={status.ok ? "outline" : "secondary"}
                  className={status.ok ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300" : "text-destructive"}
                  title={status.error}
                >
                  {status.source}: {status.ok ? `${status.synced} jobs` : "failed"}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {!filteredJobs.length ? (
          <Card className="glass-card border-white/30 md:col-span-2 2xl:col-span-3">
            <CardContent className="flex min-h-48 items-center justify-center p-8 text-center text-muted-foreground">
              {syncing ? "Refreshing jobs..." : "No jobs match the current filters yet."}
            </CardContent>
          </Card>
        ) : null}
        {filteredJobs.map((job, index) => {
          const application = applicationMap.get(job.id);
          const saved = application?.status === "saved";

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.24) }}
            >
              <Card className="glass-card h-full border-white/30 transition-transform duration-200 hover:-translate-y-1">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
                      <h3 className="mt-2 text-xl font-semibold leading-tight">{job.title}</h3>
                    </div>
                    <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      {job.matchScore}%
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {job.location ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-3 py-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    ) : null}
                    {job.posted_date ? (
                      <span className="rounded-full bg-background/60 px-3 py-1">
                        {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                      </span>
                    ) : null}
                    {job.source ? <Badge variant="outline">{job.source}</Badge> : null}
                  </div>
                  <p className="mt-4 max-h-24 overflow-hidden text-sm leading-6 text-muted-foreground">{job.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button
                      variant={saved ? "secondary" : "outline"}
                      className="rounded-2xl"
                      disabled={savingJobId === job.id}
                      onClick={() => toggleSave(job.id, saved)}
                    >
                      <Star className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />
                      {saved ? "Saved" : "Save"}
                    </Button>
                    <Button className="rounded-2xl" onClick={() => openApplyAssist(job.id)}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Apply assist
                    </Button>
                    {job.job_url ? (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
                      >
                        Open listing
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <Dialog open={Boolean(assistState)} onOpenChange={(open: boolean) => (!open ? setAssistState(null) : null)}>
        <DialogContent className="max-w-2xl rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Apply assist mode</DialogTitle>
          </DialogHeader>
          {assistState ? (
            <div className="space-y-5">
              <div className="rounded-3xl bg-muted/50 p-5">
                <p className="text-sm font-medium">Checklist</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {assistState.checklist.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(assistState.prefill).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{key.replaceAll("_", " ")}</p>
                    <p className="mt-2 text-sm">
                      {Array.isArray(value) ? value.join(", ") : value || "Not provided"}
                    </p>
                  </div>
                ))}
              </div>
              {assistState.jobUrl ? (
                <a
                  href={assistState.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Open employer application
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
