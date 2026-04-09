import "server-only";

import { subHours } from "date-fns";

import { serverEnv } from "@/lib/env";
import type { Row } from "@/lib/database.types";
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

interface ActorConfig {
  actorId: string;
  source: string;
}

export interface ActorSyncStatus {
  source: string;
  actorId: string;
  ok: boolean;
  synced: number;
  error?: string;
}

export interface JobsSyncResult {
  jobs: Row<"jobs">[];
  statuses: ActorSyncStatus[];
  partial: boolean;
}

const REQUEST_TIMEOUT_MS = 25_000;

const actorConfigs: ActorConfig[] = [
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

function normalizeApifyError(source: string, status: number, body: string) {
  if (status === 401 || status === 403) {
    return `Apify ${source}: invalid APIFY_TOKEN or unauthorized actor access`;
  }

  if (status === 404) {
    return `Apify ${source}: actor not found (check actor ID)`;
  }

  if (status === 429) {
    return `Apify ${source}: rate limited`;
  }

  const condensed = body.slice(0, 180);
  return `Apify ${source}: request failed (${status})${condensed ? ` - ${condensed}` : ""}`;
}

async function runActor(config: ActorConfig): Promise<{ jobs: NormalizedJob[]; status: ActorSyncStatus }> {
  const safeActorId = config.actorId.replace(/\//g, "~");
  const endpoint = new URL(`https://api.apify.com/v2/acts/${safeActorId}/run-sync-get-dataset-items`);
  endpoint.searchParams.set("token", serverEnv.apifyToken);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        maxItems: 40,
        recentDays: 2
      }),
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        jobs: [],
        status: {
          source: config.source,
          actorId: config.actorId,
          ok: false,
          synced: 0,
          error: normalizeApifyError(config.source, response.status, errorText)
        }
      };
    }

    const dataset = (await response.json()) as ApifyDatasetItem[];
    const jobs = dataset
      .map((item) => normalizeJob(item, config.source))
      .filter((job): job is NormalizedJob => Boolean(job));

    return {
      jobs,
      status: {
        source: config.source,
        actorId: config.actorId,
        ok: true,
        synced: jobs.length
      }
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Apify ${config.source}: request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
        : error instanceof Error
          ? `Apify ${config.source}: ${error.message}`
          : `Apify ${config.source}: unknown failure`;

    return {
      jobs: [],
      status: {
        source: config.source,
        actorId: config.actorId,
        ok: false,
        synced: 0,
        error: message
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJobs(): Promise<JobsSyncResult> {
  if (!actorConfigs.length) {
    throw new Error("At least one Apify actor ID must be configured");
  }

  const cutoff = subHours(new Date(), 48).getTime();
  const actorResults = await Promise.all(actorConfigs.map((actor) => runActor(actor)));

  const deduped = new Map<string, NormalizedJob>();
  const statuses: ActorSyncStatus[] = actorResults.map((result) => result.status);

  for (const result of actorResults) {
    if (!result.status.ok) {
      continue;
    }

    for (const job of result.jobs) {
      const parsedPostedDate = job.posted_date ? new Date(job.posted_date).getTime() : Date.now();
      const postedDate = Number.isNaN(parsedPostedDate) ? Date.now() : parsedPostedDate;

      if (postedDate < cutoff) {
        continue;
      }

      if (!deduped.has(job.job_key)) {
        deduped.set(job.job_key, job);
      }
    }
  }

  const hasAnySuccess = statuses.some((status) => status.ok);
  const failedStatuses = statuses.filter((status) => !status.ok);

  if (!hasAnySuccess && failedStatuses.length) {
    throw new Error(failedStatuses.map((status) => status.error).filter(Boolean).join("; "));
  }

  if (!deduped.size) {
    return {
      jobs: [],
      statuses,
      partial: failedStatuses.length > 0
    };
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
  ) as Row<"jobs">[];

  return {
    jobs: persistedJobs,
    statuses,
    partial: failedStatuses.length > 0
  };
}
