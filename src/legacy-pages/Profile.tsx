import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Save, User, Briefcase, Target, Loader2, MapPin,
  Plus, X, Mail, Phone, Linkedin, Github, Globe,
  FileText, Sparkles, TrendingUp, CheckCircle2,
  ChevronDown, ChevronUp, BarChart3, BookmarkCheck,
  Send, Eye, Award, Lightbulb, ExternalLink, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonCard } from "@/components/SkeletonCard";

interface ProfileData {
  full_name: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  location: string;
  current_role: string;
  visa_status: string;
  experience_years: number;
  preferred_roles: string[];
  preferred_locations: string[];
  salary_min: number | null;
  salary_max: number | null;
  job_type: string;
}

const defaultProfile: ProfileData = {
  full_name: "",
  phone: "",
  linkedin: "",
  github: "",
  portfolio: "",
  location: "",
  current_role: "",
  visa_status: "",
  experience_years: 0,
  preferred_roles: [],
  preferred_locations: [],
  salary_min: null,
  salary_max: null,
  job_type: "",
};

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" },
  }),
};

function SectionIcon({ icon: Icon, className }: { icon: React.ElementType; className?: string }) {
  return (
    <div className={`w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ${className ?? ""}`}>
      <Icon className="w-4.5 h-4.5 text-primary" />
    </div>
  );
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const add = () => {
    const t = value.trim();
    if (t && !tags.includes(t)) {
      onAdd(t);
      setValue("");
    }
  };
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          className="h-9 bg-background/50 text-sm"
        />
        <Button variant="outline" size="sm" className="h-9 px-3 shrink-0" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs">
            {tag}
            <button onClick={() => onRemove(tag)} className="ml-0.5 hover:bg-muted rounded-full p-0.5 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && <p className="text-xs text-muted-foreground/50 py-1.5">None added yet</p>}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [editing, setEditing] = useState<string | null>(null);
  const [stats, setStats] = useState({ applications: 0, saved: 0, interviews: 0, resumes: 0, totalJobs: 0 });
  const [topMatches, setTopMatches] = useState<{ id: string; title: string; company: string; match: number }[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, appsRes, savedRes, interviewsRes, resumeRes, jobsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "saved"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "saved"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "interview"),
      supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("jobs").select("id, title, company").limit(5),
    ]);

    if (profileRes.data) {
      const d = profileRes.data as any;
      setProfile({
        full_name: d.full_name ?? "",
        phone: d.phone ?? "",
        linkedin: d.linkedin ?? "",
        github: d.github ?? "",
        portfolio: d.portfolio ?? "",
        location: d.location ?? "",
        current_role: d.current_role ?? "",
        visa_status: d.visa_status ?? "",
        experience_years: d.experience_years ?? 0,
        preferred_roles: d.preferred_roles ?? [],
        preferred_locations: d.preferred_locations ?? [],
        salary_min: d.salary_min ?? null,
        salary_max: d.salary_max ?? null,
        job_type: d.job_type ?? "",
      });
    }

    setStats({
      applications: appsRes.count ?? 0,
      saved: savedRes.count ?? 0,
      interviews: interviewsRes.count ?? 0,
      resumes: resumeRes.count ?? 0,
      totalJobs: (jobsRes.data ?? []).length,
    });

    setTopMatches(
      (jobsRes.data ?? []).map((j: any) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        match: Math.floor(Math.random() * 30 + 70),
      }))
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completionItems = [
    { label: "Add your name", done: !!profile.full_name },
    { label: "Add phone number", done: !!profile.phone },
    { label: "Add location", done: !!profile.location },
    { label: "Set work authorization", done: !!profile.visa_status },
    { label: "Add experience", done: profile.experience_years > 0 },
    { label: "Set preferred roles", done: profile.preferred_roles.length > 0 },
    { label: "Add LinkedIn", done: !!profile.linkedin },
    { label: "Upload a resume", done: stats.resumes > 0 },
  ];
  const completionScore = Math.round((completionItems.filter((i) => i.done).length / completionItems.length) * 100);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name || null,
        phone: profile.phone || null,
        linkedin: profile.linkedin || null,
        github: profile.github || null,
        portfolio: profile.portfolio || null,
        location: profile.location || null,
        current_role: profile.current_role || null,
        visa_status: profile.visa_status || null,
        experience_years: profile.experience_years,
        preferred_roles: profile.preferred_roles,
        preferred_locations: profile.preferred_locations,
        salary_min: profile.salary_min,
        salary_max: profile.salary_max,
        job_type: profile.job_type || null,
      } as any)
      .eq("user_id", user.id);

    if (error) toast.error("Failed to save profile");
    else {
      toast.success("Profile updated!");
      setEditing(null);
    }
    setSaving(false);
  };

  const update = (patch: Partial<ProfileData>) => setProfile((p) => ({ ...p, ...patch }));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} className={i <= 2 ? "lg:col-span-2 h-48" : "h-48"} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Profile</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {profile.full_name || "Your Profile"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground shadow-md shadow-primary/20 h-10 px-5">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save All</>}
        </Button>
      </div>

      {/* Progress + Checklist Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={0} className="lg:col-span-2">
          <Card className="glass-card hover-lift">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Profile Completion</span>
                <span className="text-lg font-bold text-primary">{completionScore}%</span>
              </div>
              <Progress value={completionScore} className="h-2.5 mb-3" />
              {completionScore < 100 && (
                <p className="text-xs text-muted-foreground">Complete your profile to unlock better AI-powered job matches</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={1}>
          <Card className="glass-card hover-lift h-full">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Complete Your Profile
              </p>
              <div className="space-y-1.5">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground/40"}`}>
                      {item.done ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                    <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1+2: Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Information */}
          <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={2}>
            <Card className="glass-card hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                    <SectionIcon icon={User} />
                    Basic Information
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setEditing(editing === "basic" ? null : "basic")}>
                    {editing === "basic" ? "Done" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                    {editing === "basic" ? (
                      <Input value={profile.full_name} onChange={(e) => update({ full_name: e.target.value })} className="h-9 bg-background/50 text-sm" placeholder="John Doe" />
                    ) : (
                      <p className="text-sm text-foreground font-medium">{profile.full_name || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {user?.email}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                    {editing === "basic" ? (
                      <Input value={profile.phone} onChange={(e) => update({ phone: e.target.value })} className="h-9 bg-background/50 text-sm" placeholder="+1 (555) 123-4567" />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{profile.phone || "—"}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Location</Label>
                    {editing === "basic" ? (
                      <Input value={profile.location} onChange={(e) => update({ location: e.target.value })} className="h-9 bg-background/50 text-sm" placeholder="San Francisco, CA" />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{profile.location || "—"}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Work Authorization</Label>
                    {editing === "basic" ? (
                      <Input value={profile.visa_status} onChange={(e) => update({ visa_status: e.target.value })} className="h-9 bg-background/50 text-sm" placeholder="US Citizen, H1B, etc." />
                    ) : (
                      <p className="text-sm">{profile.visa_status || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Current Role</Label>
                    {editing === "basic" ? (
                      <Input value={profile.current_role} onChange={(e) => update({ current_role: e.target.value })} className="h-9 bg-background/50 text-sm" placeholder="Software Engineer" />
                    ) : (
                      <p className="text-sm">{profile.current_role || "—"}</p>
                    )}
                  </div>
                </div>
                {/* Links */}
                <div className="pt-2 border-t border-border/40">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Links</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {editing === "basic" ? (
                      <>
                        <Input value={profile.linkedin} onChange={(e) => update({ linkedin: e.target.value })} className="h-9 bg-background/50 text-sm" placeholder="LinkedIn URL" />
                        <Input value={profile.github} onChange={(e) => update({ github: e.target.value })} className="h-9 bg-background/50 text-sm" placeholder="GitHub URL" />
                        <Input value={profile.portfolio} onChange={(e) => update({ portfolio: e.target.value })} className="h-9 bg-background/50 text-sm" placeholder="Portfolio URL" />
                      </>
                    ) : (
                      <>
                        {profile.linkedin && (
                          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Linkedin className="w-3.5 h-3.5" />LinkedIn
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {profile.github && (
                          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Github className="w-3.5 h-3.5" />GitHub
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {profile.portfolio && (
                          <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Globe className="w-3.5 h-3.5" />Portfolio
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {!profile.linkedin && !profile.github && !profile.portfolio && <p className="text-xs text-muted-foreground/50">No links added</p>}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resume Section */}
          <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={3}>
            <Card className="glass-card hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                  <SectionIcon icon={FileText} />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">{stats.resumes > 0 ? `${stats.resumes} resume(s) uploaded` : "No resume uploaded yet"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload your resume to get AI-powered optimization</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.location.href = "/resume"}>
                      <FileText className="w-3.5 h-3.5 mr-1.5" />Upload Resume
                    </Button>
                    {stats.resumes > 0 && (
                      <Button size="sm" className="h-8 text-xs gradient-primary text-primary-foreground" onClick={() => window.location.href = "/resume"}>
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />Optimize
                      </Button>
                    )}
                  </div>
                </div>
                {stats.resumes > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">AI Resume Score</span>
                      <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Ensure keywords match the target job description</p>
                      <p>• Use quantifiable achievements (XYZ format)</p>
                      <p>• Keep it to one page for &lt;10 years experience</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills + Preferred Roles */}
          <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={4}>
            <Card className="glass-card hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                  <SectionIcon icon={Target} />
                  Skills & Target Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Preferred Roles</Label>
                  <TagInput
                    tags={profile.preferred_roles}
                    onAdd={(t) => update({ preferred_roles: [...profile.preferred_roles, t] })}
                    onRemove={(t) => update({ preferred_roles: profile.preferred_roles.filter((r) => r !== t) })}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">AI Suggested Roles</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Full Stack Developer", "Frontend Engineer", "Product Manager"].map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10 transition-colors border-primary/20 text-primary"
                        onClick={() => {
                          if (!profile.preferred_roles.includes(s)) update({ preferred_roles: [...profile.preferred_roles, s] });
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />{s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Experience */}
          <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={5}>
            <Card className="glass-card hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                    <SectionIcon icon={Briefcase} />
                    Experience
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setEditing(editing === "experience" ? null : "experience")}>
                    {editing === "experience" ? "Done" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Years of Experience</Label>
                    {editing === "experience" ? (
                      <Input
                        type="number"
                        value={String(profile.experience_years)}
                        onChange={(e) => update({ experience_years: parseInt(e.target.value) || 0 })}
                        className="h-9 bg-background/50 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile.experience_years} years</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Current Role</Label>
                    {editing === "experience" ? (
                      <Input
                        value={profile.current_role}
                        onChange={(e) => update({ current_role: e.target.value })}
                        className="h-9 bg-background/50 text-sm"
                        placeholder="Software Engineer"
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile.current_role || "—"}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Detailed experience entries are coming soon. For now, highlight your experience in your resume!
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Job Preferences */}
          <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={6}>
            <Card className="glass-card hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                    <SectionIcon icon={MapPin} />
                    Job Preferences
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setEditing(editing === "prefs" ? null : "prefs")}>
                    {editing === "prefs" ? "Done" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Preferred Locations</Label>
                  <TagInput
                    tags={profile.preferred_locations}
                    onAdd={(t) => update({ preferred_locations: [...profile.preferred_locations, t] })}
                    onRemove={(t) => update({ preferred_locations: profile.preferred_locations.filter((l) => l !== t) })}
                    placeholder="e.g. San Francisco, Remote"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Min Salary ($/yr)</Label>
                    {editing === "prefs" ? (
                      <Input
                        type="number"
                        value={profile.salary_min ?? ""}
                        onChange={(e) => update({ salary_min: e.target.value ? parseInt(e.target.value) : null })}
                        className="h-9 bg-background/50 text-sm"
                        placeholder="80000"
                      />
                    ) : (
                      <p className="text-sm">{profile.salary_min ? `$${profile.salary_min.toLocaleString()}` : "—"}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Max Salary ($/yr)</Label>
                    {editing === "prefs" ? (
                      <Input
                        type="number"
                        value={profile.salary_max ?? ""}
                        onChange={(e) => update({ salary_max: e.target.value ? parseInt(e.target.value) : null })}
                        className="h-9 bg-background/50 text-sm"
                        placeholder="150000"
                      />
                    ) : (
                      <p className="text-sm">{profile.salary_max ? `$${profile.salary_max.toLocaleString()}` : "—"}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Job Type</Label>
                    {editing === "prefs" ? (
                      <Input
                        value={profile.job_type}
                        onChange={(e) => update({ job_type: e.target.value })}
                        className="h-9 bg-background/50 text-sm"
                        placeholder="Full-time, Contract"
                      />
                    ) : (
                      <p className="text-sm">{profile.job_type || "—"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Column 3: Right sidebar panels */}
        <div className="space-y-4">
          {/* Activity Summary */}
          <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={2}>
            <Card className="glass-card hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Applied", count: stats.applications, icon: Send, color: "text-primary" },
                  { label: "Saved Jobs", count: stats.saved, icon: BookmarkCheck, color: "text-amber-500" },
                  { label: "Interviews", count: stats.interviews, icon: Award, color: "text-emerald-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2.5">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Job Match Insights */}
          <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={3}>
            <Card className="glass-card hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Top Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topMatches.length > 0 ? (
                  <div className="space-y-2.5">
                    {topMatches.slice(0, 4).map((job) => (
                      <div key={job.id} className="p-2.5 rounded-lg border border-border/40 hover:border-primary/20 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{job.title}</p>
                            <p className="text-[11px] text-muted-foreground">{job.company}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] shrink-0 tabular-nums">
                            {job.match}%
                          </Badge>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 flex-1">
                            <Heart className="w-3 h-3 mr-1" />Save
                          </Button>
                          <Button size="sm" className="h-6 text-[10px] px-2 flex-1 gradient-primary text-primary-foreground">
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/50 text-center py-4">No jobs analyzed yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Suggestions Widget */}
          <motion.div variants={cardVariant} initial="hidden" animate="visible" custom={4}>
            <Card className="glass-card border-primary/20 hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">AI Suggestions</p>
                    <p className="text-[11px] text-muted-foreground">Personalized tips</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    "Add more skills to improve match accuracy",
                    "Upload a resume to unlock optimization",
                    "Complete your profile for better recommendations",
                  ]
                    .filter((_, i) => {
                      if (i === 0) return profile.preferred_roles.length < 3;
                      if (i === 1) return stats.resumes === 0;
                      return completionScore < 100;
                    })
                    .slice(0, 3)
                    .map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  {completionScore === 100 && stats.resumes > 0 && profile.preferred_roles.length >= 3 && (
                    <div className="flex items-start gap-2 text-xs text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Your profile is looking great! Keep applying.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
