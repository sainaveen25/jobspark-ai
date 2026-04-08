import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["saved", "applied", "interview", "rejected"])
});

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const applications = unwrapSupabaseResult(
      await supabase
      .from("applications")
      .select("*, jobs(*)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
      "Unable to load applications"
    );

    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load applications" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const payload = updateSchema.parse(await request.json());

    const application = unwrapSupabaseResult(
      await supabase
      .from("applications")
      .update({
        status: payload.status,
        applied_at: payload.status === "applied" ? new Date().toISOString() : null
      })
      .eq("id", payload.id)
      .eq("user_id", user.id)
      .select("*, jobs(*)")
      .single(),
      "Unable to update application"
    );

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update application" }, { status: 400 });
  }
}
