"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ExternalLink, MapPin, RefreshCw, Search, Star, Sparkles, Filter, ChevronDown, Clock, Building2 } from "lucide-react";
import { formatDistanceToNow, subHours } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
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

type TimeFilter = "all" | "5h" | "24h";

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
  const [locationFilter, setLocationFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [syncing, startSync] = useTransition();
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [assistState, setAssistState] = useState<ApplyAssistState | null>(null);

  const locations = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.location).filter(Boolean) as string[])).sort(),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const now = new Date();
    return jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase());
      const matchesLocation = locationFilter === "all" || job.location === locationFilter;
      let matchesTime = true;
      if (timeFilter !== "all") {
        const hours = timeFilter === "5h" ? 5 : 24;
        const cutoff = subHours(now, hours);
        const jobDate = new Date(job.posted_date || "");
        matchesTime = jobDate >= cutoff;
      }
      return matchesSearch && matchesLocation && matchesTime;
    });
  }, [jobs, locationFilter, search, timeFilter]);

  const latestJobs = useMemo(() => filteredJobs.slice(0, 6), [filteredJobs]);
  const remainingJobs = useMemo(() => filteredJobs.slice(6), [filteredJobs]);

  const applicationMap = useMemo(() => new Map(applications.map((a) => [a.job_id, a])), [applications]);

  const handleSync = () => {
    startSync(async () => {
      const response = await fetch("/api/jobs/sync", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        setLoadError(payload.error ?? "Unable to sync jobs");
        toast.error(payload.error ?? "Unable to sync jobs");
        return;
      }
      const jobsResponse = await fetch("/api/jobs");
      const jobsPayload = await jobsResponse.json();
      if (!jobsResponse.ok) {
        setLoadError(jobsPayload.error ?? "Jobs synced, but refresh failed");
        toast.error(jobsPayload.error ?? "Refresh failed");
        return;
      }
      setJobs(jobsPayload.jobs ?? []);
      setApplications(jobsPayload.applications ?? []);
      setLoadError(null);
      toast.success(`Synced ${payload.synced ?? 0} jobs`);
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
      setApplications((c) => c.filter((i) => !(i.job_id === jobId && i.status === "saved")));
      toast.success("Removed from saved jobs");
    } else {
      if (payload.application) {
        setApplications((c) => [...c.filter((i) => i.job_id !== jobId), payload.application]);
      }
      toast.success("Saved to tracker");
    }
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

  const JobCard = ({ job, index }: { job: JobRecord; index: number }) => {
    const application = applicationMap.get(job.id);
    const saved = application?.status === "saved";

    return (
      <motion.div
        key={job.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.25) }}
      >
        <Card className="group border border-border/60 bg-card/90 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm leading-tight text-foreground">{job.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                  </div>
                  <Badge variant="secondary" className="text-[11px] shrink-0 gap-1">
                    <Sparkles className="w-3 h-3" />
                    {job.matchScore}%
                  </Badge>
                </div>
                {job.description && (
                  <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
                )}
                <div className="flex items-center flex-wrap gap-1.5 mt-3">
                  {job.location && (
                    <Badge variant="outline" className="text-[11px] font-normal gap-1 py-0.5 px-2">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </Badge>
                  )}
                  {job.posted_date && (
                    <Badge variant="outline" className="text-[11px] font-normal gap-1 py-0.5 px-2">
                      <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                    </Badge>
                  )}
                  {job.source && (
                    <Badge variant="secondary" className="text-[11px] py-0.5 px-2">{job.source}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                  <Button
                    variant={saved ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                    disabled={savingJobId === job.id}
                    onClick={() => toggleSave(job.id, saved)}
                  >
                    <Star className={`w-3.5 h-3.5 mr-1.5 ${saved ? "fill-current" : ""}`} />
                    {saved ? "Saved" : "Save"}
                  </Button>
                  <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => openApplyAssist(job.id)}>
                    Apply assist
                  </Button>
                  {job.job_url && (
                    <a href={job.job_url} target="_blank" rel="noreferrer" className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredJobs.length} opportunities available</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="h-9 rounded-lg">
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          Refresh feeds
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="sticky top-12 z-[5] py-3 -mt-3 bg-background/95 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs or companies..."
                className="pl-10 h-10 bg-card/80 border-border/60"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`h-10 gap-2 px-3 ${showFilters ? "bg-primary/5 border-primary/30 text-primary" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {/* Time filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { value: "all" as TimeFilter, label: "All time" },
              { value: "5h" as TimeFilter, label: "Last 5 hours" },
              { value: "24h" as TimeFilter, label: "Last 24 hours" },
            ]).map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeFilter(t.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  timeFilter === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-2 pt-1 pb-2">
                  <button onClick={() => setLocationFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${locationFilter === "all" ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"}`}>
                    All Locations
                  </button>
                  {[...preferredLocations, ...locations.filter((l) => !preferredLocations.includes(l))].map((loc) => (
                    <button key={loc} onClick={() => setLocationFilter(loc)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${locationFilter === loc ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"}`}>
                      {loc}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loadError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{loadError}</p>
      )}

      {/* Jobs list */}
      {!filteredJobs.length ? (
        <Card className="border border-border/60 bg-card/90">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No jobs found</p>
            <p className="text-sm mt-1">Try adjusting your filters or refresh feeds</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {latestJobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Latest Jobs</h2>
                <Badge variant="secondary" className="text-[11px] py-0">{latestJobs.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {latestJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
              </div>
            </div>
          )}
          {remainingJobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">More Opportunities</h2>
                <Badge variant="secondary" className="text-[11px] py-0">{remainingJobs.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {remainingJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply Assist Dialog */}
      <Dialog open={Boolean(assistState)} onOpenChange={(open: boolean) => (!open ? setAssistState(null) : null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Apply Assist</DialogTitle>
          </DialogHeader>
          {assistState ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-sm font-medium">Checklist</p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {assistState.checklist.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(assistState.prefill).map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-border/60 bg-card/80 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{key.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-sm">{Array.isArray(value) ? value.join(", ") : value || "Not provided"}</p>
                  </div>
                ))}
              </div>
              {assistState.jobUrl && (
                <a href={assistState.jobUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Open employer application
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
