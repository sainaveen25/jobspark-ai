"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const sections = [
  { id: "identity", label: "Identity" },
  { id: "preferences", label: "Preferences" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" }
];

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
  const [saving, setSaving] = useState(false);

  const completion = useMemo(() => {
    const checks = [
      profile.full_name,
      profile.phone,
      profile.linkedin,
      profile.github,
      profile.portfolio,
      profile.current_role,
      profile.experience_years,
      profile.preferred_roles?.length,
      profile.preferred_locations?.length,
      profile.visa_status,
      experiences.length,
      skills.length
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
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

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to save profile");
      return;
    }

    toast.success("Profile updated");
  };

  const addExperience = async () => {
    const response = await fetch("/api/profile/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_title: "New role",
        company: "Company",
        location: "",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: null,
        bullet_points: ["Describe your impact using the XYZ format"]
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to add experience");
      return;
    }

    setExperiences((current) => [payload.experience, ...current]);
  };

  const updateExperience = async (experience: ExperienceRecord) => {
    const response = await fetch("/api/profile/experiences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(experience)
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to update experience");
      return;
    }

    setExperiences((current) => current.map((item) => (item.id === experience.id ? payload.experience : item)));
  };

  const removeExperience = async (id: string) => {
    const response = await fetch("/api/profile/experiences", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to remove experience");
      return;
    }

    setExperiences((current) => current.filter((item) => item.id !== id));
  };

  const addSkill = async () => {
    if (!newSkill.skill_name.trim()) {
      return;
    }

    const response = await fetch("/api/profile/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSkill)
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to add skill");
      return;
    }

    setSkills((current) => [...current, payload.skill]);
    setNewSkill((current) => ({ ...current, skill_name: "" }));
  };

  const removeSkill = async (id: string) => {
    const response = await fetch("/api/profile/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to remove skill");
      return;
    }

    setSkills((current) => current.filter((item) => item.id !== id));
  };

  const updateExperienceField = (id: string, patch: Partial<ExperienceRecord>) => {
    setExperiences((current) => current.map((experience) => (experience.id === id ? { ...experience, ...patch } : experience)));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
      <aside className="glass-card sticky top-28 h-fit p-5">
        <Badge className="rounded-full bg-primary/10 px-4 py-1.5 text-primary">Profile strength</Badge>
        <div className="mt-4 text-4xl font-semibold">{completion}%</div>
        <Progress value={completion} className="mt-4 h-2" />
        <nav className="mt-6 space-y-2">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="block rounded-2xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/60 hover:text-foreground">
              {section.label}
            </a>
          ))}
        </nav>
        <Button className="mt-6 w-full rounded-2xl" onClick={saveProfile} disabled={saving}>
          Save profile
        </Button>
      </aside>

      <div className="space-y-6">
        <motion.section id="identity" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-white/30">
            <CardHeader>
              <CardTitle>Identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Input value={profile.full_name ?? ""} onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))} placeholder="Full name" className="rounded-2xl" />
              <Input value={profile.current_role ?? ""} onChange={(event) => setProfile((current) => ({ ...current, current_role: event.target.value }))} placeholder="Current role" className="rounded-2xl" />
              <Input value={profile.phone ?? ""} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" className="rounded-2xl" />
              <Input
                type="number"
                value={profile.experience_years ?? 0}
                onChange={(event) => setProfile((current) => ({ ...current, experience_years: Number(event.target.value) }))}
                placeholder="Years of experience"
                className="rounded-2xl"
              />
              <Input value={profile.linkedin ?? ""} onChange={(event) => setProfile((current) => ({ ...current, linkedin: event.target.value }))} placeholder="LinkedIn URL" className="rounded-2xl" />
              <Input value={profile.github ?? ""} onChange={(event) => setProfile((current) => ({ ...current, github: event.target.value }))} placeholder="GitHub URL" className="rounded-2xl" />
              <Input value={profile.portfolio ?? ""} onChange={(event) => setProfile((current) => ({ ...current, portfolio: event.target.value }))} placeholder="Portfolio URL" className="rounded-2xl md:col-span-2" />
            </CardContent>
          </Card>
        </motion.section>

        <section id="preferences">
          <Card className="glass-card border-white/30">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Textarea
                value={(profile.preferred_roles ?? []).join(", ")}
                onChange={(event) => setProfile((current) => ({ ...current, preferred_roles: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))}
                placeholder="Preferred roles, comma separated"
                className="min-h-[120px] rounded-2xl"
              />
              <Textarea
                value={(profile.preferred_locations ?? []).join(", ")}
                onChange={(event) => setProfile((current) => ({ ...current, preferred_locations: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))}
                placeholder="Preferred locations, comma separated"
                className="min-h-[120px] rounded-2xl"
              />
              <Input value={profile.visa_status ?? ""} onChange={(event) => setProfile((current) => ({ ...current, visa_status: event.target.value }))} placeholder="Visa status" className="rounded-2xl md:col-span-2" />
            </CardContent>
          </Card>
        </section>

        <section id="skills">
          <Card className="glass-card border-white/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Skills</CardTitle>
              <div className="flex gap-2">
                <Input value={newSkill.category} onChange={(event) => setNewSkill((current) => ({ ...current, category: event.target.value }))} className="w-32 rounded-2xl" placeholder="Category" />
                <Input value={newSkill.skill_name} onChange={(event) => setNewSkill((current) => ({ ...current, skill_name: event.target.value }))} className="w-40 rounded-2xl" placeholder="Skill" />
                <Button type="button" variant="outline" className="rounded-2xl" onClick={addSkill}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="secondary" className="rounded-full px-3 py-2">
                  {skill.category}: {skill.skill_name}
                  <button type="button" className="ml-2" onClick={() => removeSkill(skill.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="experience">
          <Card className="glass-card border-white/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Experience</CardTitle>
              <Button type="button" className="rounded-2xl" onClick={addExperience}>
                <Plus className="mr-2 h-4 w-4" />
                Add experience
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.map((experience) => (
                <div key={experience.id} className="rounded-[28px] border bg-background/60 p-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={experience.job_title} onChange={(event) => updateExperienceField(experience.id, { job_title: event.target.value })} onBlur={() => updateExperience(experience)} className="rounded-2xl" placeholder="Job title" />
                    <Input value={experience.company} onChange={(event) => updateExperienceField(experience.id, { company: event.target.value })} onBlur={() => updateExperience(experience)} className="rounded-2xl" placeholder="Company" />
                    <Input value={experience.location ?? ""} onChange={(event) => updateExperienceField(experience.id, { location: event.target.value })} onBlur={() => updateExperience(experience)} className="rounded-2xl" placeholder="Location" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={experience.start_date.slice(0, 10)} onChange={(event) => updateExperienceField(experience.id, { start_date: event.target.value })} onBlur={() => updateExperience(experience)} className="rounded-2xl" />
                      <Input type="date" value={experience.end_date?.slice(0, 10) ?? ""} onChange={(event) => updateExperienceField(experience.id, { end_date: event.target.value || null })} onBlur={() => updateExperience(experience)} className="rounded-2xl" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {experience.bullet_points.map((bullet, index) => (
                      <Textarea
                        key={`${experience.id}-${index}`}
                        value={bullet}
                        onChange={(event) => {
                          const bulletPoints = [...experience.bullet_points];
                          bulletPoints[index] = event.target.value;
                          updateExperienceField(experience.id, { bullet_points: bulletPoints });
                        }}
                        onBlur={() => updateExperience(experience)}
                        className="min-h-[90px] rounded-2xl"
                      />
                    ))}
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-2xl"
                        onClick={() => updateExperienceField(experience.id, { bullet_points: [...experience.bullet_points, ""] })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add bullet
                      </Button>
                      <Button type="button" variant="outline" className="rounded-2xl" onClick={() => removeExperience(experience.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
