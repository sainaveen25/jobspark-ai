import nextDynamic from "next/dynamic";

import type { Row } from "@/lib/database.types";
import { calculateMatchScore } from "@/lib/match-score";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const JobsBoard = nextDynamic(
  () => import("@/components/app/jobs-board").then((mod) => mod.JobsBoard),
  {
    loading: () => <div className="h-40 animate-pulse rounded-xl bg-muted/70" />
  }
);

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [jobsResponse, applicationsResponse, profileResponse, skillsResponse, experiencesResponse, resumesResponse] =
    await Promise.all([
      supabase.from("jobs").select("*").order("created_at", { ascending: false }).order("posted_date", { ascending: false }).limit(60),
      supabase.from("applications").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("preferred_roles,preferred_locations").eq("user_id", user.id).single(),
      supabase.from("skills").select("skill_name").eq("user_id", user.id),
      supabase.from("experiences").select("job_title,company,bullet_points").eq("user_id", user.id),
      supabase.from("resumes").select("parsed_text").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);

  const jobsData = (unwrapSupabaseResult(jobsResponse, "Unable to load jobs") ?? []) as Row<"jobs">[];
  const applications = (unwrapSupabaseResult(applicationsResponse, "Unable to load applications") ?? []) as Row<"applications">[];
  const profile = unwrapSupabaseResult(profileResponse, "Unable to load profile") as Row<"profiles"> | null;
  const skills = (unwrapSupabaseResult(skillsResponse, "Unable to load skills") ?? []) as Row<"skills">[];
  const experiences = (unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") ?? []) as Row<"experiences">[];
  const resume = unwrapSupabaseResult(resumesResponse, "Unable to load resume") as Row<"resumes"> | null;

  const jobs = jobsData.map((job: any) => ({
    ...job,
    matchScore: calculateMatchScore({
      jobDescription: job.description ?? [job.title, job.company, job.location].filter(Boolean).join(" "),
      profileSkills: skills.map((skill: any) => skill.skill_name),
      preferredRoles: profile?.preferred_roles ?? [],
      experienceText: experiences.flatMap((experience: any) => [
        experience.job_title,
        experience.company,
        ...((experience.bullet_points as string[]) ?? [])
      ]),
      resumeText: resume?.parsed_text ?? ""
    })
  }));

  return (
    <JobsBoard
      initialJobs={jobs}
      initialApplications={applications}
      preferredLocations={profile?.preferred_locations ?? []}
      initialError={null}
    />
  );
}

