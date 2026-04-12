import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const preferencesSchema = z.object({
  desired_role: z.string().trim().nullable().optional(),
  preferred_location: z.string().trim().nullable().optional(),
  salary_range: z.string().trim().nullable().optional(),
  job_type: z.string().trim().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const preferences = unwrapSupabaseResult(
      await admin.from("job_preferences").select("*").eq("user_id", userId).maybeSingle(),
      "Unable to load preferences"
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load preferences" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const payload = preferencesSchema.parse(await request.json());

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
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update preferences" }, { status: 400 });
  }
}
