import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import type { Row } from "@/lib/database.types";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const schema = z.object({
  jobId: z.string().uuid(),
  save: z.boolean()
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { jobId, save } = schema.parse(await request.json());

    const existing = await supabase.from("applications").select("*").eq("job_id", jobId).eq("user_id", user.id).maybeSingle();
    const existingApplication = unwrapSupabaseResult(existing, "Unable to load saved job state") as Row<"applications"> | null;

    if (save) {
      if (existingApplication) {
        if (existingApplication.status !== "saved") {
          return NextResponse.json({ application: existingApplication });
        }
      } else {
        const application = unwrapSupabaseResult(
          await supabase
            .from("applications")
            .insert({ job_id: jobId, user_id: user.id, status: "saved" })
            .select("*")
            .single(),
          "Unable to save job"
        );

        return NextResponse.json({ application });
      }
    } else if (existingApplication?.status === "saved") {
      unwrapSupabaseResult(await supabase.from("applications").delete().eq("id", existingApplication.id), "Unable to remove saved job");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update saved job" }, { status: 400 });
  }
}
