import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import type { Row } from "@/lib/database.types";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const optionalText = z.string().transform((value) => value.trim() || null);
const optionalUrl = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => !value || /^https?:\/\//.test(value), "URL must start with http:// or https://")
  .transform((value) => value || null);

const profileSchema = z.object({
  full_name: z.string().min(1),
  phone: optionalText,
  linkedin: optionalUrl,
  github: optionalUrl,
  portfolio: optionalUrl,
  location: optionalText,
  current_role: optionalText,
  experience_years: z.number().int().min(0).nullable(),
  preferred_roles: z.array(z.string()).default([]),
  preferred_locations: z.array(z.string()).default([]),
  visa_status: optionalText,
  work_auth: optionalText,
  desired_role: optionalText.optional(),
  preferred_location: optionalText.optional(),
  salary_range: optionalText.optional(),
  job_type: optionalText.optional()
});

export async function GET(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);

    const [profileResponse, experiencesResponse, skillsResponse, preferencesResponse, resumeResponse] = await Promise.all([
      admin.from("profiles").select("*").eq("user_id", userId).single(),
      admin.from("experiences").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
      admin.from("skills").select("*").eq("user_id", userId).order("category").order("skill_name"),
      admin.from("job_preferences").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("resumes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).maybeSingle()
    ]);

    const profile = unwrapSupabaseResult(profileResponse, "Unable to load profile") as Row<"profiles">;
    const experiences = unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") as Row<"experiences">[];
    const skills = unwrapSupabaseResult(skillsResponse, "Unable to load skills") as Row<"skills">[];
    const preferences = unwrapSupabaseResult(preferencesResponse, "Unable to load preferences") as Row<"job_preferences"> | null;
    const resume = unwrapSupabaseResult(resumeResponse, "Unable to load resume") as Row<"resumes"> | null;
    const profileCompletion = calculateProfileCompletion({
      profile,
      hasResume: Boolean(resume),
      skillsCount: skills.length,
      experienceCount: experiences.length,
      preferences
    });

    return NextResponse.json({
      profile,
      experiences,
      skills,
      preferences,
      resume,
      profileCompletion
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load profile" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const payload = profileSchema.parse(await request.json());

    const preferences = unwrapSupabaseResult(
      await admin
        .from("job_preferences")
        .upsert({
          user_id: userId,
          desired_role: payload.desired_role ?? null,
          preferred_location: payload.preferred_location ?? null,
          salary_range: payload.salary_range ?? null,
          job_type: payload.job_type ?? null
        }, { onConflict: "user_id" })
        .select("*")
        .single(),
      "Unable to update preferences"
    ) as Row<"job_preferences">;

    const [skillsResponse, experiencesResponse, resumeResponse] = await Promise.all([
      admin.from("skills").select("id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("experiences").select("id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("resumes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).maybeSingle()
    ]);

    const resume = unwrapSupabaseResult(resumeResponse, "Unable to load resume") as Row<"resumes"> | null;
    const profileCompletion = calculateProfileCompletion({
      profile: payload,
      hasResume: Boolean(resume),
      skillsCount: skillsResponse.count ?? 0,
      experienceCount: experiencesResponse.count ?? 0,
      preferences
    });

    const profile = unwrapSupabaseResult(
      await admin
      .from("profiles")
      .update({
        full_name: payload.full_name,
        phone: payload.phone,
        linkedin: payload.linkedin,
        github: payload.github,
        portfolio: payload.portfolio,
        location: payload.location,
        current_role: payload.current_role,
        experience_years: payload.experience_years,
        preferred_roles: payload.preferred_roles,
        preferred_locations: payload.preferred_locations,
        visa_status: payload.visa_status,
        work_auth: payload.work_auth,
        job_type: payload.job_type ?? null,
        profile_completion: profileCompletion
      })
      .eq("user_id", userId)
      .select("*")
      .single(),
      "Unable to update profile"
    );

    return NextResponse.json({ profile, preferences, profileCompletion });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update profile" }, { status: 400 });
  }
}
