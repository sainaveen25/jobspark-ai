import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          full_name: body.fullName,
          mfa_required: true,
          mfa_setup_complete: false
        }
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.session) {
      return NextResponse.json({
        message: "Account created. Confirm your email first, then sign in to complete Google Authenticator setup.",
        needsEmailVerification: true
      });
    }

    return NextResponse.json({
      message: "Account created. Continue to Google Authenticator setup.",
      needsMfaSetup: true
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sign up" }, { status: 400 });
  }
}
