import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "You must be signed in to enroll MFA." }, { status: 401 });
    }

    const { data: factorData, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 400 });
    }

    const existingVerifiedTotp = (factorData?.totp ?? []).find((factor: any) => factor.status === "verified");

    if (existingVerifiedTotp) {
      return NextResponse.json({
        alreadyEnabled: true,
        factorId: existingVerifiedTotp.id
      });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Google Authenticator"
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to enroll MFA" },
      { status: 400 }
    );
  }
}
