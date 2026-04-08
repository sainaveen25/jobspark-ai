import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, MapPin, Building2, Bookmark, ExternalLink, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

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
      <div className="space-y-4 max-w-4xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Jobs</h1>
        <p className="text-muted-foreground mt-1">Browse and save job opportunities</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs or companies..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-48">
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
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No jobs found</p>
            <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job, i) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass-card hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-lg truncate">{job.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" /> {job.company}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                        )}
                        {job.posted_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        {job.source && <Badge variant="secondary" className="text-xs">{job.source}</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => saveJob(job.id)} className={savedJobIds.has(job.id) ? "text-primary" : "text-muted-foreground"}>
                        <Bookmark className={`w-5 h-5 ${savedJobIds.has(job.id) ? "fill-current" : ""}`} />
                      </Button>
                      {job.job_url && (
                        <Button variant="outline" size="icon" asChild>
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
          ))}
        </div>
      )}
    </div>
  );
}
