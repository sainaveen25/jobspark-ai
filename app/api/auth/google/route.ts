import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const callbackUrl = `${serverEnv.appUrl}/api/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl
    }
  });

  if (error || !data.url) {
    return NextResponse.json({ error: error?.message ?? "Unable to initiate Google login" }, { status: 500 });
  }

  return NextResponse.redirect(data.url, { status: 302 });
}
