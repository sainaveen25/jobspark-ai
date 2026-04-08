import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const skillSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1),
  skill_name: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const payload = skillSchema.parse(await request.json());
    const skill = unwrapSupabaseResult(
      await supabase.from("skills").insert({ ...payload, user_id: user.id }).select("*").single(),
      "Unable to add skill"
    );

    return NextResponse.json({ skill });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to add skill" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = z.object({ id: z.string().uuid() }).parse(await request.json());

    unwrapSupabaseResult(await supabase.from("skills").delete().eq("id", id).eq("user_id", user.id), "Unable to remove skill");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to remove skill" }, { status: 400 });
  }
}
