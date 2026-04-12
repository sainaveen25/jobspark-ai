import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const encoder = new TextEncoder();

export interface ApiTokenPayload {
  sub: string;
  email: string;
  name?: string | null;
}

export function createStatelessSupabaseClient() {
  return createClient<Database>(publicEnv.nextPublicSupabaseUrl, publicEnv.nextPublicSupabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export async function signApiToken(payload: ApiTokenPayload) {
  return new SignJWT({ email: payload.email, name: payload.name ?? null, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(serverEnv.jwtSecret));
}

export async function verifyApiToken(token: string) {
  const { payload } = await jwtVerify(token, encoder.encode(serverEnv.jwtSecret));

  if (!payload.sub || typeof payload.email !== "string") {
    throw new Error("Invalid token payload");
  }

  return {
    userId: payload.sub,
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : null
  };
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim() || null;
}

export async function requireApiUser(request: Request) {
  const token = getBearerToken(request);
  const admin = getSupabaseAdminClient();

  if (token) {
    const user = await verifyApiToken(token);
    return {
      admin,
      userId: user.userId,
      email: user.email,
      name: user.name,
      authType: "jwt" as const
    };
  }

  const { user } = await requireUser();

  return {
    admin,
    userId: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.full_name as string | undefined) ?? null,
    authType: "session" as const
  };
}
