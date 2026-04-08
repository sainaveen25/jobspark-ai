import "server-only";

import { subHours } from "date-fns";

import { serverEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";
import { slugify } from "@/lib/utils";

export interface NormalizedJob {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  job_url: string | null;
  source: string;
  source_job_id: string | null;
  posted_date: string | null;
  job_key: string;
}

interface ApifyDatasetItem {
  id?: string;
  title?: string;
  positionName?: string;
  company?: string;
  companyName?: string;
  location?: string;
  locations?: string[];
  description?: string;
  descriptionText?: string;
  url?: string;
  applyUrl?: string;
  createdAt?: string;
  datePosted?: string;
  postedAt?: string;
}

const actorConfigs = [
  { actorId: serverEnv.apifyGreenhouseActorId, source: "greenhouse" },
  { actorId: serverEnv.apifyLeverActorId, source: "lever" },
  { actorId: serverEnv.apifyWorkdayActorId, source: "workday" }
].filter((actor) => actor.actorId);

function normalizeJob(item: ApifyDatasetItem, source: string): NormalizedJob | null {
  const title = item.title ?? item.positionName;
  const company = item.company ?? item.companyName;
  const location = item.location ?? item.locations?.[0] ?? null;
  const postedDate = item.postedAt ?? item.datePosted ?? item.createdAt ?? null;

  if (!title || !company) {
    return null;
  }

  return {
    title,
    company,
    location,
    description: item.description ?? item.descriptionText ?? null,
    job_url: item.applyUrl ?? item.url ?? null,
    source,
    source_job_id: item.id ?? null,
    posted_date: postedDate,
    job_key: slugify(`${title}-${company}`)
  };
}

async function runActor(actorId: string, source: string) {
  const safeActorId = actorId.replace(/\//g, "~");
  const response = await fetch(`https://api.apify.com/v2/acts/${safeActorId}/run-sync-get-dataset-items?token=${serverEnv.apifyToken}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      maxItems: 40,
      recentDays: 2
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apify actor ${source} failed with status ${response.status}: ${errorText}`);
  }

  const dataset = (await response.json()) as ApifyDatasetItem[];
  return dataset
    .map((item) => normalizeJob(item, source))
    .filter((job): job is NormalizedJob => Boolean(job));
}

export async function fetchJobs() {
  if (!actorConfigs.length) {
    throw new Error("At least one Apify actor ID must be configured");
  }

  const cutoff = subHours(new Date(), 48).getTime();
  const actorResults = await Promise.allSettled(actorConfigs.map((actor) => runActor(actor.actorId, actor.source)));
  const deduped = new Map<string, NormalizedJob>();
  const failures: string[] = [];

  for (const result of actorResults) {
    if (result.status === "rejected") {
      failures.push(result.reason instanceof Error ? result.reason.message : "Unknown Apify failure");
      continue;
    }

    for (const job of result.value) {
      const postedDate = job.posted_date ? new Date(job.posted_date).getTime() : Date.now();

      if (postedDate < cutoff) {
        continue;
      }

      if (!deduped.has(job.job_key)) {
        deduped.set(job.job_key, job);
      }
    }
  }

  if (!deduped.size && failures.length) {
    throw new Error(failures.join("; "));
  }

  const admin = getSupabaseAdminClient();
  const jobs = Array.from(deduped.values());
  const persistedJobs = unwrapSupabaseResult(
    await admin
      .from("jobs")
      .upsert(jobs, { onConflict: "job_key" })
      .select("*")
      .order("posted_date", { ascending: false }),
    "Unable to store synced jobs"
  );

  return persistedJobs;
}
