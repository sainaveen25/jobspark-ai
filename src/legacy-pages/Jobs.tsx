import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search, MapPin, Building2, Bookmark, ExternalLink, Clock,
  Briefcase, Sparkles, Filter, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, subHours } from "date-fns";
import { SkeletonCard } from "@/components/SkeletonCard";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  job_url: string | null;
  source: string | null;
  description: string | null;
  posted_date: string | null;
  created_at: string;
}

type TimeFilter = "all" | "5h" | "24h";

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (error) toast.error("Failed to load jobs");
      else setJobs(data ?? []);
      setLoading(false);
    };

    const fetchSaved = async () => {
      if (!user) return;
      const { data } = await supabase.from("applications").select("job_id").eq("user_id", user.id);
      if (data) setSavedJobIds(new Set(data.map((a) => a.job_id)));
    };

    fetchJobs();
    fetchSaved();
  }, [user]);

  const locations = useMemo(() => {
    const locs = new Set(jobs.map((j) => j.location).filter(Boolean) as string[]);
    return Array.from(locs).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const now = new Date();
    return jobs.filter((job) => {
      const matchSearch = !search || job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase());
      const matchLocation = locationFilter === "all" || job.location === locationFilter;
      let matchTime = true;
      if (timeFilter !== "all") {
        const hours = timeFilter === "5h" ? 5 : 24;
        const cutoff = subHours(now, hours);
        const jobDate = new Date(job.posted_date || job.created_at);
        matchTime = jobDate >= cutoff;
      }
      return matchSearch && matchLocation && matchTime;
    });
  }, [jobs, search, locationFilter, timeFilter]);

  const latestJobs = useMemo(() => filtered.slice(0, 6), [filtered]);
  const remainingJobs = useMemo(() => filtered.slice(6), [filtered]);

  const saveJob = async (jobId: string) => {
    if (!user) return;
    if (savedJobIds.has(jobId)) {
      await supabase.from("applications").delete().eq("user_id", user.id).eq("job_id", jobId);
      setSavedJobIds((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
      toast.success("Job removed");
    } else {
      const { error } = await supabase.from("applications").insert({ user_id: user.id, job_id: jobId, status: "saved" });
      if (error) toast.error("Failed to save job");
      else {
        setSavedJobIds((prev) => new Set(prev).add(jobId));
        toast.success("Job saved!");
      }
    }
  };

  const JobCard = ({ job, index }: { job: Job; index: number }) => (
    <motion.div
      key={job.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className="group border border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {/* Company icon */}
            <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm leading-tight text-foreground truncate">{job.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                </div>
              </div>

              {job.description && (
                <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
              )}

              <div className="flex items-center flex-wrap gap-1.5 mt-3">
                {job.location && (
                  <Badge variant="outline" className="text-[11px] font-normal gap-1 py-0.5 px-2 border-border/80">
                    <MapPin className="w-3 h-3" /> {job.location}
                  </Badge>
                )}
                {job.posted_date && (
                  <Badge variant="outline" className="text-[11px] font-normal gap-1 py-0.5 px-2 border-border/80">
                    <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                  </Badge>
                )}
                {job.source && (
                  <Badge variant="secondary" className="text-[11px] py-0.5 px-2">{job.source}</Badge>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => saveJob(job.id)}
                className={`h-8 w-8 rounded-lg ${savedJobIds.has(job.id) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"} transition-all`}
              >
                <Bookmark className={`w-4 h-4 ${savedJobIds.has(job.id) ? "fill-current" : ""}`} />
              </Button>
              {job.job_url && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all" asChild>
                  <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-14 skeleton-shimmer rounded-xl" />
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} opportunities available
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="sticky top-14 z-[5] py-3 -mt-3 bg-background/90 backdrop-blur-xl">
        <div className="flex flex-col gap-3">
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
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-1 pb-2">
                  <button
                    onClick={() => setLocationFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      locationFilter === "all"
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                    }`}
                  >
                    All Locations
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocationFilter(loc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        locationFilter === loc
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card className="border border-border/60 bg-card/80">
          <CardContent className="py-16 text-center text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">No jobs found</p>
            <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Latest Jobs Section */}
          {latestJobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Latest Jobs</h2>
                <Badge variant="secondary" className="text-[11px] py-0">{latestJobs.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {latestJobs.map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* All Other Jobs */}
          {remainingJobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">More Opportunities</h2>
                <Badge variant="secondary" className="text-[11px] py-0">{remainingJobs.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {remainingJobs.map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
