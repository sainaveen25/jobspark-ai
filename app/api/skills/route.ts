import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/api-auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const skillSchema = z.object({
  skill_name: z.string().min(1),
  proficiency_level: z.string().min(1).optional(),
  category: z.string().min(1).optional()
});

export async function GET(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const skills = unwrapSupabaseResult(
      await admin.from("skills").select("*").eq("user_id", userId).order("skill_name"),
      "Unable to load skills"
    );

    return NextResponse.json({ skills });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load skills" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const payload = skillSchema.parse(await request.json());
    const skill = unwrapSupabaseResult(
      await admin
        .from("skills")
        .insert({
          user_id: userId,
          skill_name: payload.skill_name,
          proficiency_level: payload.proficiency_level ?? null,
          category: payload.category ?? "General"
        })
        .select("*")
        .single(),
      "Unable to create skill"
    );

    return NextResponse.json({ skill });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create skill" }, { status: 400 });
  }
}
