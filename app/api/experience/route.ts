import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().nullable().optional(),
  description: z.string().min(1)
});

export async function GET(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const experience = unwrapSupabaseResult(
      await admin.from("experiences").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
      "Unable to load experience"
    );

    return NextResponse.json({ experience });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load experience" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const payload = experienceSchema.parse(await request.json());
    const descriptionLines = payload.description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const experience = unwrapSupabaseResult(
      await admin
        .from("experiences")
        .insert({
          user_id: userId,
          company: payload.company,
          job_title: payload.role,
          start_date: payload.start_date,
          end_date: payload.end_date ?? null,
          description: payload.description,
          bullet_points: descriptionLines.length ? descriptionLines : [payload.description],
          location: null
        })
        .select("*")
        .single(),
      "Unable to create experience"
    );

    return NextResponse.json({ experience });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create experience" }, { status: 400 });
  }
}
