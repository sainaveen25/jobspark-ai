import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = (await createServerSupabaseClient()) as any;
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}
