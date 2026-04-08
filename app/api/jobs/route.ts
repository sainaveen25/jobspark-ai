import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const [jobsResponse, applicationsResponse] = await Promise.all([
      supabase.from("jobs").select("*").order("posted_date", { ascending: false }).limit(100),
      supabase.from("applications").select("job_id,status").eq("user_id", user.id)
    ]);

    const jobs = unwrapSupabaseResult(jobsResponse, "Unable to load jobs");
    const applications = unwrapSupabaseResult(applicationsResponse, "Unable to load applications");

    return NextResponse.json({
      jobs,
      applications
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load jobs" }, { status: 400 });
  }
}
