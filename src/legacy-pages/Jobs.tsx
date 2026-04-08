import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, MapPin, Building2, Bookmark, ExternalLink, Clock, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
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

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

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
    return jobs.filter((job) => {
      const matchSearch = !search || job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase());
      const matchLocation = locationFilter === "all" || job.location === locationFilter;
      return matchSearch && matchLocation;
    });
  }, [jobs, search, locationFilter]);

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

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="h-16 skeleton-shimmer rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-[180px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Jobs"
          description="Browse and save job opportunities"
          icon={Briefcase}
          badge={`${filtered.length} found`}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sticky top-14 z-[5] py-3 -mt-3 bg-background/80 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs or companies..." className="pl-10 bg-background/50" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-background/50">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">No jobs found</p>
            <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job, i) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
              <Card className="glass-card hover-lift group h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => saveJob(job.id)}
                        className={`h-8 w-8 ${savedJobIds.has(job.id) ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"} transition-all`}
                      >
                        <Bookmark className={`w-4 h-4 ${savedJobIds.has(job.id) ? "fill-current" : ""}`} />
                      </Button>
                      {job.job_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" asChild>
                          <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-base leading-tight mb-1">{job.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{job.company}</p>

                  {job.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">{job.description}</p>
                  )}

                  <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                    {job.location && (
                      <Badge variant="outline" className="text-xs font-normal gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </Badge>
                    )}
                    {job.posted_date && (
                      <Badge variant="outline" className="text-xs font-normal gap-1">
                        <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                      </Badge>
                    )}
                    {job.source && (
                      <Badge variant="secondary" className="text-xs">{job.source}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}