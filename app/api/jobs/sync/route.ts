import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { fetchJobs } from "@/lib/apify";
import type { Row } from "@/lib/database.types";

export async function POST() {
  try {
    await requireUser();
    const jobs = (await fetchJobs()) as Row<"jobs">[];

    return NextResponse.json({ synced: jobs.length, jobs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sync jobs" }, { status: 400 });
  }
}
