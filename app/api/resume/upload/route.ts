import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { extractResumeText } from "@/lib/resume";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false
    });

    if (uploadError) {
      throw uploadError;
    }

    const parsedText = await extractResumeText(buffer);
    const resume = unwrapSupabaseResult(
      await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_url: null,
          storage_path: storagePath,
          filename: file.name,
          parsed_text: parsedText
        })
        .select("*")
        .single(),
      "Unable to save uploaded resume"
    );

    return NextResponse.json({ resume });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload resume" }, { status: 400 });
  }
}
