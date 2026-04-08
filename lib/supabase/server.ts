import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export async function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(publicEnv.nextPublicSupabaseUrl, publicEnv.nextPublicSupabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components can read auth cookies even when write access is unavailable.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Server Components can read auth cookies even when write access is unavailable.
        }
      }
    }
  }) as any;
}
