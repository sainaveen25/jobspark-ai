import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { requiresMfaSetup } from "@/lib/mfa";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  if (requiresMfaSetup(user)) {
    redirect("/auth?step=mfa&next=/dashboard");
  }

  return <AppShell userEmail={user.email ?? "Signed in"}>{children}</AppShell>;
}
