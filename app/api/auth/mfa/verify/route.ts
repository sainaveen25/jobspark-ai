import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  factorId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit code")
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const payload = schema.parse(await request.json());

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "You must be signed in to verify MFA." }, { status: 401 });
  }

  const challenge = await supabase.auth.mfa.challenge({ factorId: payload.factorId });
  if (challenge.error || !challenge.data) {
    return NextResponse.json({ error: challenge.error?.message ?? "Unable to create MFA challenge" }, { status: 400 });
  }

  const verify = await supabase.auth.mfa.verify({
    factorId: payload.factorId,
    challengeId: challenge.data.id,
    code: payload.code
  });

  if (verify.error) {
    return NextResponse.json({ error: verify.error.message }, { status: 400 });
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...(user.user_metadata ?? {}),
      mfa_setup_complete: true
    }
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Google Authenticator setup complete." });
}
