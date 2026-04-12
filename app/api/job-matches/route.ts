import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import type { Row } from "@/lib/database.types";
import { calculateJobPlatformMatch } from "@/lib/job-matching";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

export async function GET(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const { searchParams } = new URL(request.url);
    const hours = Number(searchParams.get("hours") ?? "24");

    const [jobsResponse, skillsResponse, experiencesResponse, preferencesResponse, profileResponse, resumeResponse, savedResponse] = await Promise.all([
      admin.from("jobs").select("*").order("posted_date", { ascending: false }).order("created_at", { ascending: false }).limit(100),
      admin.from("skills").select("skill_name").eq("user_id", userId),
      admin.from("experiences").select("job_title,company,bullet_points").eq("user_id", userId),
      admin.from("job_preferences").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("profiles").select("preferred_roles").eq("user_id", userId).maybeSingle(),
      admin.from("resumes").select("parsed_text").eq("user_id", userId).order("created_at", { ascending: false }).maybeSingle(),
      admin.from("job_matches").select("job_id,status").eq("user_id", userId)
    ]);

    const jobs = (unwrapSupabaseResult(jobsResponse, "Unable to load jobs") ?? []) as Row<"jobs">[];
    const skills = (unwrapSupabaseResult(skillsResponse, "Unable to load skills") ?? []) as Array<{ skill_name: string }>;
    const experiences = (unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") ?? []) as Array<{ job_title: string; company: string; bullet_points: string[] }>;
    const preferences = unwrapSupabaseResult(preferencesResponse, "Unable to load preferences") as Row<"job_preferences"> | null;
    const profile = unwrapSupabaseResult(profileResponse, "Unable to load profile") as Pick<Row<"profiles">, "preferred_roles"> | null;
    const resume = unwrapSupabaseResult(resumeResponse, "Unable to load resume") as Pick<Row<"resumes">, "parsed_text"> | null;
    const existingMatches = (unwrapSupabaseResult(savedResponse, "Unable to load match state") ?? []) as Array<{ job_id: string; status: "saved" | "applied" }>;

    const cutoff = Number.isFinite(hours) ? Date.now() - hours * 60 * 60 * 1000 : null;
    const matchState = new Map(existingMatches.map((match) => [match.job_id, match.status]));

    const matches = jobs
      .filter((job) => {
        if (!cutoff || !job.posted_date) {
          return true;
        }

        const posted = new Date(job.posted_date).getTime();
        return !Number.isNaN(posted) && posted >= cutoff;
      })
      .map((job) => ({
        job,
        match_score: calculateJobPlatformMatch({
          job,
          skills: skills.map((skill) => skill.skill_name),
          preferredRoles: profile?.preferred_roles ?? [],
          preferredLocation: preferences?.preferred_location ?? null,
          desiredRole: preferences?.desired_role ?? null,
          experienceText: experiences.flatMap((experience) => [
            experience.job_title,
            experience.company,
            ...((experience.bullet_points ?? []) as string[])
          ]),
          resumeText: resume?.parsed_text ?? null
        }),
        status: matchState.get(job.id) ?? null
      }))
      .sort((left, right) => right.match_score - left.match_score)
      .slice(0, 50);

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load job matches" }, { status: 400 });
  }
}
