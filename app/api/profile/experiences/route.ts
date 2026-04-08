import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const experienceSchema = z.object({
  id: z.string().uuid().optional(),
  job_title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  bullet_points: z.array(z.string().min(1)).min(1)
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const payload = experienceSchema.parse(await request.json());

    const experience = unwrapSupabaseResult(
      await supabase
      .from("experiences")
      .insert({ ...payload, user_id: user.id })
      .select("*")
      .single(),
      "Unable to create experience"
    );

    return NextResponse.json({ experience });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create experience" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const payload = experienceSchema.extend({ id: z.string().uuid() }).parse(await request.json());

    const experience = unwrapSupabaseResult(
      await supabase
      .from("experiences")
      .update({
        job_title: payload.job_title,
        company: payload.company,
        location: payload.location,
        start_date: payload.start_date,
        end_date: payload.end_date,
        bullet_points: payload.bullet_points
      })
      .eq("id", payload.id)
      .eq("user_id", user.id)
      .select("*")
      .single(),
      "Unable to update experience"
    );

    return NextResponse.json({ experience });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update experience" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = z.object({ id: z.string().uuid() }).parse(await request.json());

    unwrapSupabaseResult(await supabase.from("experiences").delete().eq("id", id).eq("user_id", user.id), "Unable to remove experience");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to remove experience" }, { status: 400 });
  }
}
