import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import type { Row } from "@/lib/database.types";
import { calculateJobPlatformMatch } from "@/lib/job-matching";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const schema = z.object({
  job_id: z.string().uuid().optional(),
  jobId: z.string().uuid().optional()
});

export async function POST(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const payload = schema.parse(await request.json());
    const jobId = payload.job_id ?? payload.jobId;

    if (!jobId) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    const [jobResponse, skillsResponse, experiencesResponse, preferencesResponse, profileResponse, resumeResponse, existingApplicationResponse] = await Promise.all([
      admin.from("jobs").select("*").eq("id", jobId).single(),
      admin.from("skills").select("skill_name").eq("user_id", userId),
      admin.from("experiences").select("job_title,company,bullet_points").eq("user_id", userId),
      admin.from("job_preferences").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("profiles").select("preferred_roles").eq("user_id", userId).maybeSingle(),
      admin.from("resumes").select("parsed_text").eq("user_id", userId).order("created_at", { ascending: false }).maybeSingle(),
      admin.from("applications").select("*").eq("user_id", userId).eq("job_id", jobId).maybeSingle()
    ]);

    const job = unwrapSupabaseResult(jobResponse, "Unable to load job") as Row<"jobs">;
    const skills = (unwrapSupabaseResult(skillsResponse, "Unable to load skills") ?? []) as Array<{ skill_name: string }>;
    const experiences = (unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") ?? []) as Array<{ job_title: string; company: string; bullet_points: string[] }>;
    const preferences = unwrapSupabaseResult(preferencesResponse, "Unable to load preferences") as Row<"job_preferences"> | null;
    const profile = unwrapSupabaseResult(profileResponse, "Unable to load profile") as Pick<Row<"profiles">, "preferred_roles"> | null;
    const resume = unwrapSupabaseResult(resumeResponse, "Unable to load resume") as Pick<Row<"resumes">, "parsed_text"> | null;
    const existingApplication = unwrapSupabaseResult(existingApplicationResponse, "Unable to load application state") as Row<"applications"> | null;

    const matchScore = calculateJobPlatformMatch({
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
    });

    const targetStatus = existingApplication?.status === "applied" ? "applied" : "saved";

    const [jobMatch, application] = await Promise.all([
      unwrapSupabaseResult(
        await admin
          .from("job_matches")
          .upsert({
            user_id: userId,
            job_id: jobId,
            match_score: matchScore,
            status: targetStatus
          }, { onConflict: "user_id,job_id" })
          .select("*")
          .single(),
        "Unable to save job"
      ),
      unwrapSupabaseResult(
        await admin
          .from("applications")
          .upsert({
            user_id: userId,
            job_id: jobId,
            status: targetStatus,
            applied_at: existingApplication?.applied_at ?? null
          }, { onConflict: "user_id,job_id" })
          .select("*")
          .single(),
        "Unable to save job application"
      )
    ]);

    return NextResponse.json({ jobMatch, application });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save job" }, { status: 400 });
  }
}
