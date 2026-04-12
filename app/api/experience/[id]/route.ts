import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().nullable().optional(),
  description: z.string().min(1)
});

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const { id } = paramsSchema.parse(context.params);
    const payload = experienceSchema.parse(await request.json());
    const descriptionLines = payload.description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const experience = unwrapSupabaseResult(
      await admin
        .from("experiences")
        .update({
          company: payload.company,
          job_title: payload.role,
          start_date: payload.start_date,
          end_date: payload.end_date ?? null,
          description: payload.description,
          bullet_points: descriptionLines.length ? descriptionLines : [payload.description]
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Unable to update experience"
    );

    return NextResponse.json({ experience });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update experience" }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const { id } = paramsSchema.parse(context.params);

    unwrapSupabaseResult(
      await admin.from("experiences").delete().eq("id", id).eq("user_id", userId),
      "Unable to delete experience"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete experience" }, { status: 400 });
  }
}
