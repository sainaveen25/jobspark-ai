import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { analyzeResumeText } from "@/lib/resume-analysis";
import { extractResumeText } from "@/lib/resume";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    const [skillsResponse, experiencesResponse, preferencesResponse] = await Promise.all([
      admin.from("skills").select("skill_name").eq("user_id", userId),
      admin.from("experiences").select("company,job_title").eq("user_id", userId).order("start_date", { ascending: false }),
      admin.from("job_preferences").select("desired_role").eq("user_id", userId).maybeSingle()
    ]);

    const skills = (unwrapSupabaseResult(skillsResponse, "Unable to load skills") ?? []) as Array<{ skill_name: string }>;
    const experiences = (unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") ?? []) as Array<{ company: string; job_title: string }>;
    const preferences = unwrapSupabaseResult(preferencesResponse, "Unable to load preferences") as { desired_role?: string | null } | null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: uploadError } = await admin.storage.from("resumes").upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false
    });

    if (uploadError) {
      throw uploadError;
    }

    const parsedText = await extractResumeText(buffer);
    const analysis = analyzeResumeText({
      resumeText: parsedText,
      skills: skills.map((skill) => skill.skill_name),
      experiences: experiences.map((experience) => ({ company: experience.company, role: experience.job_title })),
      desiredRole: preferences?.desired_role ?? null
    });

    const resume = unwrapSupabaseResult(
      await admin
        .from("resumes")
        .insert({
          user_id: userId,
          file_url: null,
          storage_path: storagePath,
          filename: file.name,
          parsed_text: parsedText,
          parsed_data: analysis.parsedData,
          resume_score: analysis.resumeScore,
          suggestions: analysis.suggestions,
          analyzed_at: new Date().toISOString()
        })
        .select("*")
        .single(),
      "Unable to save uploaded resume"
    );

    return NextResponse.json({ resume });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload resume" }, { status: 400 });
  }
}
