"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, X, User, Briefcase, Target, Code, MapPin, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface ProfileRecord {
  full_name: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  current_role: string | null;
  experience_years: number | null;
  preferred_roles: string[] | null;
  preferred_locations: string[] | null;
  visa_status: string | null;
}

interface ExperienceRecord {
  id: string;
  job_title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  bullet_points: string[];
}

interface SkillRecord {
  id: string;
  category: string;
  skill_name: string;
}

export function ProfileEditor({
  initialProfile,
  initialExperiences,
  initialSkills
}: {
  initialProfile: ProfileRecord | null;
  initialExperiences: ExperienceRecord[];
  initialSkills: SkillRecord[];
}) {
  const [profile, setProfile] = useState<ProfileRecord>({
    full_name: initialProfile?.full_name ?? "",
    phone: initialProfile?.phone ?? "",
    linkedin: initialProfile?.linkedin ?? "",
    github: initialProfile?.github ?? "",
    portfolio: initialProfile?.portfolio ?? "",
    current_role: initialProfile?.current_role ?? "",
    experience_years: initialProfile?.experience_years ?? 0,
    preferred_roles: initialProfile?.preferred_roles ?? [],
    preferred_locations: initialProfile?.preferred_locations ?? [],
    visa_status: initialProfile?.visa_status ?? ""
  });
  const [experiences, setExperiences] = useState(initialExperiences);
  const [skills, setSkills] = useState(initialSkills);
  const [newSkill, setNewSkill] = useState({ category: "Core", skill_name: "" });
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const completion = useMemo(() => {
    const checks = [
      profile.full_name, profile.phone, profile.linkedin, profile.github,
      profile.portfolio, profile.current_role, profile.experience_years,
      profile.preferred_roles?.length, profile.preferred_locations?.length,
      profile.visa_status, experiences.length, skills.length
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [experiences.length, profile, skills.length]);

  const saveProfile = async () => {
    setSaving(true);
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) { toast.error(payload.error ?? "Unable to save profile"); return; }
    toast.success("Profile updated");
  };

  const addExperience = async () => {
    const response = await fetch("/api/profile/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_title: "New role", company: "Company", location: "", start_date: new Date().toISOString().slice(0, 10), end_date: null, bullet_points: ["Describe your impact"] })
    });
    const payload = await response.json();
    if (!response.ok) { toast.error(payload.error ?? "Unable to add experience"); return; }
    setExperiences((c) => [payload.experience, ...c]);
  };

  const updateExperience = async (exp: ExperienceRecord) => {
    const response = await fetch("/api/profile/experiences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exp) });
    const payload = await response.json();
    if (!response.ok) { toast.error(payload.error ?? "Unable to update experience"); return; }
    setExperiences((c) => c.map((i) => (i.id === exp.id ? payload.experience : i)));
  };

  const removeExperience = async (id: string) => {
    const response = await fetch("/api/profile/experiences", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { toast.error("Unable to remove experience"); return; }
    setExperiences((c) => c.filter((i) => i.id !== id));
  };

  const addSkill = async () => {
    if (!newSkill.skill_name.trim()) return;
    const response = await fetch("/api/profile/skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSkill) });
    const payload = await response.json();
    if (!response.ok) { toast.error(payload.error ?? "Unable to add skill"); return; }
    setSkills((c) => [...c, payload.skill]);
    setNewSkill((c) => ({ ...c, skill_name: "" }));
  };

  const removeSkill = async (id: string) => {
    const response = await fetch("/api/profile/skills", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { toast.error("Unable to remove skill"); return; }
    setSkills((c) => c.filter((i) => i.id !== id));
  };

  const updateField = (id: string, patch: Partial<ExperienceRecord>) => {
    setExperiences((c) => c.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const addRole = () => {
    const trimmed = newRole.trim();
    if (trimmed && !(profile.preferred_roles ?? []).includes(trimmed)) {
      setProfile((p) => ({ ...p, preferred_roles: [...(p.preferred_roles ?? []), trimmed] }));
      setNewRole("");
    }
  };

  const addLocation = () => {
    const trimmed = newLocation.trim();
    if (trimmed && !(profile.preferred_locations ?? []).includes(trimmed)) {
      setProfile((p) => ({ ...p, preferred_locations: [...(p.preferred_locations ?? []), trimmed] }));
      setNewLocation("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile for better job matching</p>
      </div>

      {/* Completion */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border border-border/60 bg-card/90">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm font-semibold text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            {completion < 100 && <p className="text-xs text-muted-foreground mt-2">Complete your profile for better matches</p>}
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <Input value={profile.full_name ?? ""} onChange={(e) => setProfile((c) => ({ ...c, full_name: e.target.value }))} placeholder="John Doe" className="h-10 bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input value={profile.phone ?? ""} onChange={(e) => setProfile((c) => ({ ...c, phone: e.target.value }))} placeholder="+1 (555) 123-4567" className="h-10 bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">LinkedIn</Label>
              <Input value={profile.linkedin ?? ""} onChange={(e) => setProfile((c) => ({ ...c, linkedin: e.target.value }))} placeholder="linkedin.com/in/..." className="h-10 bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">GitHub</Label>
              <Input value={profile.github ?? ""} onChange={(e) => setProfile((c) => ({ ...c, github: e.target.value }))} placeholder="github.com/..." className="h-10 bg-background/50" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Portfolio</Label>
              <Input value={profile.portfolio ?? ""} onChange={(e) => setProfile((c) => ({ ...c, portfolio: e.target.value }))} placeholder="https://..." className="h-10 bg-background/50" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Professional Info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Briefcase className="w-4 h-4 text-primary" /></div>
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Current Role</Label>
              <Input value={profile.current_role ?? ""} onChange={(e) => setProfile((c) => ({ ...c, current_role: e.target.value }))} placeholder="Software Engineer" className="h-10 bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Years of Experience</Label>
              <Input type="number" value={profile.experience_years ?? 0} onChange={(e) => setProfile((c) => ({ ...c, experience_years: Number(e.target.value) }))} className="h-10 bg-background/50" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Visa Status</Label>
              <Input value={profile.visa_status ?? ""} onChange={(e) => setProfile((c) => ({ ...c, visa_status: e.target.value }))} placeholder="e.g., H1B, Green Card, US Citizen" className="h-10 bg-background/50" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Target Roles (chips) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Target className="w-4 h-4 text-primary" /></div>
              Target Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())} placeholder="Add a role..." className="h-9 bg-background/50 text-sm" />
              <Button variant="outline" size="sm" className="h-9" onClick={addRole}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.preferred_roles ?? []).map((role) => (
                <Badge key={role} variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                  {role}
                  <button onClick={() => setProfile((p) => ({ ...p, preferred_roles: (p.preferred_roles ?? []).filter((r) => r !== role) }))} className="hover:bg-muted rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
              {!(profile.preferred_roles ?? []).length && <p className="text-xs text-muted-foreground/60 py-2">No roles added yet</p>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preferred Locations (chips) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><MapPin className="w-4 h-4 text-primary" /></div>
              Preferred Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())} placeholder="Add a location..." className="h-9 bg-background/50 text-sm" />
              <Button variant="outline" size="sm" className="h-9" onClick={addLocation}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.preferred_locations ?? []).map((loc) => (
                <Badge key={loc} variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                  {loc}
                  <button onClick={() => setProfile((p) => ({ ...p, preferred_locations: (p.preferred_locations ?? []).filter((l) => l !== loc) }))} className="hover:bg-muted rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
              {!(profile.preferred_locations ?? []).length && <p className="text-xs text-muted-foreground/60 py-2">No locations added yet</p>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skills (chips) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Code className="w-4 h-4 text-primary" /></div>
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={newSkill.category} onChange={(e) => setNewSkill((c) => ({ ...c, category: e.target.value }))} className="w-28 h-9 bg-background/50 text-sm" placeholder="Category" />
              <Input value={newSkill.skill_name} onChange={(e) => setNewSkill((c) => ({ ...c, skill_name: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} className="flex-1 h-9 bg-background/50 text-sm" placeholder="Skill name" />
              <Button variant="outline" size="sm" className="h-9" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                  <span className="text-muted-foreground">{skill.category}:</span> {skill.skill_name}
                  <button onClick={() => removeSkill(skill.id)} className="hover:bg-muted rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Experience */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border border-border/60 bg-card/90">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Briefcase className="w-4 h-4 text-primary" /></div>
                Experience
              </CardTitle>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addExperience}><Plus className="w-3.5 h-3.5 mr-1.5" /> Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="rounded-xl border border-border/60 bg-muted/5 p-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={exp.job_title} onChange={(e) => updateField(exp.id, { job_title: e.target.value })} onBlur={() => updateExperience(exp)} placeholder="Job title" className="h-9 bg-background/50 text-sm" />
                  <Input value={exp.company} onChange={(e) => updateField(exp.id, { company: e.target.value })} onBlur={() => updateExperience(exp)} placeholder="Company" className="h-9 bg-background/50 text-sm" />
                  <Input value={exp.location ?? ""} onChange={(e) => updateField(exp.id, { location: e.target.value })} onBlur={() => updateExperience(exp)} placeholder="Location" className="h-9 bg-background/50 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={exp.start_date.slice(0, 10)} onChange={(e) => updateField(exp.id, { start_date: e.target.value })} onBlur={() => updateExperience(exp)} className="h-9 bg-background/50 text-sm" />
                    <Input type="date" value={exp.end_date?.slice(0, 10) ?? ""} onChange={(e) => updateField(exp.id, { end_date: e.target.value || null })} onBlur={() => updateExperience(exp)} className="h-9 bg-background/50 text-sm" />
                  </div>
                </div>
                {exp.bullet_points.map((bullet, idx) => (
                  <Textarea
                    key={`${exp.id}-${idx}`}
                    value={bullet}
                    onChange={(e) => { const bp = [...exp.bullet_points]; bp[idx] = e.target.value; updateField(exp.id, { bullet_points: bp }); }}
                    onBlur={() => updateExperience(exp)}
                    className="min-h-[60px] text-sm bg-background/50"
                    placeholder="Describe your impact..."
                  />
                ))}
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateField(exp.id, { bullet_points: [...exp.bullet_points, ""] })}><Plus className="w-3 h-3 mr-1" /> Add bullet</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-destructive" onClick={() => removeExperience(exp.id)}><Trash2 className="w-3 h-3 mr-1" /> Remove</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save */}
      <Button className="w-full h-11 gradient-primary text-primary-foreground" onClick={saveProfile} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {saving ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  );
}

function Loader2Icon(props: any) { return <div {...props} />; }
