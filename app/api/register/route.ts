import { NextResponse } from "next/server";
import { z } from "zod";

import { signApiToken } from "@/lib/api-auth";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  location: z.string().trim().optional(),
  work_auth: z.string().trim().optional()
});

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const admin = getSupabaseAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.name
      }
    });

    if (error || !data.user) {
      throw error ?? new Error("Unable to create user");
    }

    const profileCompletion = calculateProfileCompletion({
      profile: {
        full_name: payload.name,
        location: payload.location ?? null,
        work_auth: payload.work_auth ?? null
      },
      hasResume: false,
      skillsCount: 0,
      experienceCount: 0,
      preferences: null
    });

    const profile = unwrapSupabaseResult(
      await admin
        .from("profiles")
        .upsert({
          user_id: data.user.id,
          full_name: payload.name,
          location: payload.location ?? null,
          work_auth: payload.work_auth ?? null,
          profile_completion: profileCompletion
        }, { onConflict: "user_id" })
        .select("*")
        .single(),
      "Unable to create profile"
    );

    const token = await signApiToken({
      sub: data.user.id,
      email: payload.email,
      name: payload.name
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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to register" }, { status: 400 });
  }
}
