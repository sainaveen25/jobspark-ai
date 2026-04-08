import { ProfileEditor } from "@/components/app/profile-editor";
import type { Row } from "@/lib/database.types";
import { unwrapSupabaseResult } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileResponse, experiencesResponse, skillsResponse] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("experiences").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    supabase.from("skills").select("*").eq("user_id", user.id).order("category").order("skill_name")
  ]);

  return (
    <ProfileEditor
      initialProfile={unwrapSupabaseResult(profileResponse, "Unable to load profile")}
      initialExperiences={((unwrapSupabaseResult(experiencesResponse, "Unable to load experiences") ?? []) as Row<"experiences">[]).map((experience) => ({
        ...experience,
        bullet_points: Array.isArray(experience.bullet_points) ? (experience.bullet_points as string[]) : []
      }))}
      initialSkills={(unwrapSupabaseResult(skillsResponse, "Unable to load skills") ?? []) as Row<"skills">[]}
    />
  );
}
