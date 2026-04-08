import { ResumeStudio } from "@/components/app/resume-studio";
import type { Row } from "@/lib/database.types";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [resumesResponse, jobsResponse] = await Promise.all([
    supabase.from("resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("jobs").select("id,title,company").order("posted_date", { ascending: false }).limit(40)
  ]);

  const resumes = (unwrapSupabaseResult(resumesResponse, "Unable to load resumes") ?? []) as Row<"resumes">[];
  const jobs = (unwrapSupabaseResult(jobsResponse, "Unable to load jobs") ?? []) as Pick<Row<"jobs">, "id" | "title" | "company">[];
  const resumeIds = resumes.map((resume: any) => resume.id);
  const versionsResponse = resumeIds.length
    ? await supabase.from("resume_versions").select("*, jobs(title,company)").in("resume_id", resumeIds).order("created_at", { ascending: false }).limit(10)
    : { data: [] };
  const versions = ("error" in versionsResponse ? unwrapSupabaseResult(versionsResponse, "Unable to load resume versions") : versionsResponse.data) ?? [];

  return (
    <ResumeStudio
      initialResumes={resumes}
      availableJobs={jobs}
      versions={(versions as never[]) ?? []}
    />
  );
}
