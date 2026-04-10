import nextDynamic from "next/dynamic";

import { unwrapSupabaseResult } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ApplicationsBoard = nextDynamic(
  () => import("@/components/app/applications-board").then((mod) => mod.ApplicationsBoard),
  {
    loading: () => <div className="h-40 animate-pulse rounded-xl bg-muted/70" />
  }
);

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const data = unwrapSupabaseResult(
    await supabase
      .from("applications")
      .select("*, jobs(*)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    "Unable to load applications"
  );

  return <ApplicationsBoard initialApplications={(data as never[]) ?? []} />;
}

