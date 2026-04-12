import { NextResponse } from "next/server";
import { z } from "zod";

import { createStatelessSupabaseClient, signApiToken } from "@/lib/api-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const supabase = createStatelessSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password
    });

    if (error || !data.user) {
      throw error ?? new Error("Invalid email or password");
    }

    const admin = getSupabaseAdminClient();
    const profile = unwrapSupabaseResult(
      await admin.from("profiles").select("*").eq("user_id", data.user.id).maybeSingle(),
      "Unable to load profile"
    ) as { full_name?: string | null } | null;

    const token = await signApiToken({
      sub: data.user.id,
      email: payload.email,
      name: (profile?.full_name as string | null | undefined) ?? null
    });

    return NextResponse.json({
      token,
      user: {
        id: data.user.id,
        email: payload.email,
        profile
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to login" }, { status: 400 });
  }
}
