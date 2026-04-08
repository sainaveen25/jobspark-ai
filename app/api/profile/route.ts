import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
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
  current_role: optionalText,
  experience_years: z.number().int().min(0).nullable(),
  preferred_roles: z.array(z.string()).default([]),
  preferred_locations: z.array(z.string()).default([]),
  visa_status: optionalText
});

export async function GET() {
  try {
    const { supabase, user } = await requireUser();

    const [profileResponse, experiencesResponse, skillsResponse] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("experiences").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
      supabase.from("skills").select("*").eq("user_id", user.id).order("category").order("skill_name")
    ]);

    const profile = unwrapSupabaseResult(profileResponse, "Unable to load profile");
    const experiences = unwrapSupabaseResult(experiencesResponse, "Unable to load experiences");
    const skills = unwrapSupabaseResult(skillsResponse, "Unable to load skills");

    return NextResponse.json({
      profile,
      experiences,
      skills
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load profile" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const payload = profileSchema.parse(await request.json());

    const profile = unwrapSupabaseResult(
      await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", user.id)
      .select("*")
      .single(),
      "Unable to update profile"
    );

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update profile" }, { status: 400 });
  }
}
