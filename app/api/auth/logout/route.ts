import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/auth", request.url), { status: 302 });
  } catch {
    return NextResponse.redirect(new URL("/auth?error=Unable%20to%20sign%20out", request.url), { status: 302 });
  }
}
