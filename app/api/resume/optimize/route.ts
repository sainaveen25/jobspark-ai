import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import type { Row } from "@/lib/database.types";
import { calculateMatchScore } from "@/lib/match-score";
import { optimizeResume } from "@/lib/openai";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const schema = z.object({
  resumeId: z.string().uuid(),
  jobId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { resumeId, jobId } = schema.parse(await request.json());

    const [resumeResponse, jobResponse, profileResponse, skillsResponse, experiencesResponse] = await Promise.all([
      supabase.from("resumes").select("*").eq("id", resumeId).eq("user_id", user.id).single(),
      supabase.from("jobs").select("*").eq("id", jobId).single(),
      supabase.from("profiles").select("preferred_roles").eq("user_id", user.id).single(),
      supabase.from("skills").select("skill_name").eq("user_id", user.id),
      supabase.from("experiences").select("job_title,company,bullet_points").eq("user_id", user.id)
    ]);

    const resume = unwrapSupabaseResult(resumeResponse, "Unable to load resume") as Row<"resumes"> | null;
    const job = unwrapSupabaseResult(jobResponse, "Unable to load job") as Row<"jobs"> | null;
    const profile = unwrapSupabaseResult(profileResponse, "Unable to load profile") as Row<"profiles"> | null;
    const skills = (unwrapSupabaseResult(skillsResponse, "Unable to load skills") ?? []) as Row<"skills">[];
    const experiences = (unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") ?? []) as Row<"experiences">[];

    if (!resume?.parsed_text || !job?.description) {
      return NextResponse.json({ error: "Resume text or job description is missing" }, { status: 400 });
    }

    const optimizedText = await optimizeResume(resume.parsed_text, job.description);
    const matchScore = calculateMatchScore({
      jobDescription: job.description,
      profileSkills: skills.map((skill: any) => skill.skill_name),
      preferredRoles: profile?.preferred_roles ?? [],
      experienceText: experiences.flatMap((experience: any) => [
        experience.job_title,
        experience.company,
        ...((experience.bullet_points as string[]) ?? [])
      ]),
      resumeText: optimizedText
    });

    const version = unwrapSupabaseResult(
      await supabase
        .from("resume_versions")
        .insert({
          resume_id: resumeId,
          job_id: jobId,
          optimized_text: optimizedText,
          match_score: matchScore
        })
        .select("*")
        .single(),
      "Unable to save optimized resume"
    );

    return NextResponse.json({ version, optimizedText, matchScore });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to optimize resume" }, { status: 400 });
  }
}
