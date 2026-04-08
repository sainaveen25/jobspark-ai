import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import type { Row } from "@/lib/database.types";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const schema = z.object({
  jobId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { jobId } = schema.parse(await request.json());

    const [profileResponse, jobResponse, skillsResponse, experiencesResponse] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("jobs").select("*").eq("id", jobId).single(),
      supabase.from("skills").select("skill_name").eq("user_id", user.id),
      supabase.from("experiences").select("company,job_title").eq("user_id", user.id).order("start_date", { ascending: false }).limit(3)
    ]);

    const profile = unwrapSupabaseResult(profileResponse, "Unable to load profile") as Row<"profiles"> | null;
    const job = unwrapSupabaseResult(jobResponse, "Unable to load job") as Row<"jobs"> | null;
    const skills = (unwrapSupabaseResult(skillsResponse, "Unable to load skills") ?? []) as Row<"skills">[];
    const experiences = (unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") ?? []) as Row<"experiences">[];

    if (!profile || !job) {
      return NextResponse.json({ error: "Profile or job not found" }, { status: 404 });
    }

    return NextResponse.json({
      checklist: [
        `Confirm ${profile.full_name ?? "your"} contact details are up to date`,
        `Tailor your resume to ${job.title} at ${job.company}`,
        `Verify ${job.location ?? "location"} and visa requirements`,
        "Review the application form before submitting"
      ],
      prefill: {
        full_name: profile.full_name,
        phone: profile.phone,
        linkedin: profile.linkedin,
        github: profile.github,
        portfolio: profile.portfolio,
        current_role: profile.current_role,
        skills: skills.map((skill: any) => skill.skill_name),
        recent_experience: experiences.map((experience: any) => `${experience.job_title} at ${experience.company}`)
      },
      jobUrl: job.job_url
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to build apply assist data" }, { status: 400 });
  }
}
