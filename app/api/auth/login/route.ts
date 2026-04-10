import { NextResponse } from "next/server";
import { z } from "zod";

import { requiresMfaSetup } from "@/lib/mfa";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Login successful.",
      needsMfaSetup: requiresMfaSetup(data.user)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sign in" }, { status: 400 });
  }
}
