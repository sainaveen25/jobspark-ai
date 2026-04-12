import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import type { Row } from "@/lib/database.types";
import { analyzeResumeText } from "@/lib/resume-analysis";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const schema = z.object({
  resumeId: z.string().uuid().optional()
});

export async function POST(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const { resumeId } = schema.parse(await request.json().catch(() => ({})));

    const [resumeResponse, skillsResponse, experiencesResponse, preferencesResponse] = await Promise.all([
      resumeId
        ? admin.from("resumes").select("*").eq("id", resumeId).eq("user_id", userId).single()
        : admin.from("resumes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single(),
      admin.from("skills").select("skill_name").eq("user_id", userId),
      admin.from("experiences").select("company,job_title").eq("user_id", userId).order("start_date", { ascending: false }),
      admin.from("job_preferences").select("desired_role").eq("user_id", userId).maybeSingle()
    ]);

    const resume = unwrapSupabaseResult(resumeResponse, "Unable to load resume") as Row<"resumes"> | null;
    const skills = (unwrapSupabaseResult(skillsResponse, "Unable to load skills") ?? []) as Array<{ skill_name: string }>;
    const experiences = (unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") ?? []) as Array<{ company: string; job_title: string }>;
    const preferences = unwrapSupabaseResult(preferencesResponse, "Unable to load preferences") as { desired_role?: string | null } | null;

    if (!resume?.parsed_text) {
      return NextResponse.json({ error: "Resume text is missing" }, { status: 400 });
    }

    const analysis = analyzeResumeText({
      resumeText: resume.parsed_text,
      skills: skills.map((skill) => skill.skill_name),
      experiences: experiences.map((experience) => ({ company: experience.company, role: experience.job_title })),
      desiredRole: preferences?.desired_role ?? null
    });

    const updatedResume = unwrapSupabaseResult(
      await admin
        .from("resumes")
        .update({
          parsed_data: analysis.parsedData,
          resume_score: analysis.resumeScore,
          suggestions: analysis.suggestions,
          analyzed_at: new Date().toISOString()
        })
        .eq("id", resume.id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Unable to analyze resume"
    );

    return NextResponse.json({
      resume: updatedResume,
      resumeScore: analysis.resumeScore,
      suggestions: analysis.suggestions
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to analyze resume" }, { status: 400 });
  }
}
