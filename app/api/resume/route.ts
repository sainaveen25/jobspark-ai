import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import type { Row } from "@/lib/database.types";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

export async function GET(request: Request) {
  try {
    const { admin, userId } = await requireApiUser(request);
    const resume = unwrapSupabaseResult(
      await admin.from("resumes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).maybeSingle(),
      "Unable to load resume"
    ) as Row<"resumes"> | null;

    let signedUrl: string | null = null;

    if (resume?.storage_path) {
      const { data, error } = await admin.storage.from("resumes").createSignedUrl(resume.storage_path, 60 * 60);
      if (!error) {
        signedUrl = data.signedUrl;
      }
    }

    return NextResponse.json({
      resume,
      signedUrl
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load resume" }, { status: 400 });
  }
}
