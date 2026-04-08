import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  return <AppShell userEmail={session.user.email ?? "Signed in"}>{children}</AppShell>;
}
