import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { fetchJobs } from "@/lib/apify";

export async function POST() {
  try {
    await requireUser();
    const result = await fetchJobs();

    return NextResponse.json({
      synced: result.jobs.length,
      partial: result.partial,
      statuses: result.statuses
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sync jobs" }, { status: 400 });
  }
}
