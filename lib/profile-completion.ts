interface ProfileCompletionInput {
  profile: {
    full_name?: string | null;
    location?: string | null;
    work_auth?: string | null;
    current_role?: string | null;
    linkedin?: string | null;
    github?: string | null;
    preferred_roles?: string[] | null;
    preferred_locations?: string[] | null;
  } | null;
  hasResume: boolean;
  skillsCount: number;
  experienceCount: number;
  preferences: {
    desired_role?: string | null;
    preferred_location?: string | null;
    salary_range?: string | null;
    job_type?: string | null;
  } | null;
}

export function calculateProfileCompletion(input: ProfileCompletionInput) {
  let score = 0;
  const profile = input.profile;

  if (profile?.full_name) score += 12;
  if (profile?.location) score += 10;
  if (profile?.work_auth) score += 8;
  if (profile?.current_role) score += 10;
  if (profile?.linkedin || profile?.github) score += 10;
  if ((profile?.preferred_roles?.length ?? 0) > 0) score += 8;
  if ((profile?.preferred_locations?.length ?? 0) > 0) score += 7;
  if (input.hasResume) score += 15;
  if (input.skillsCount >= 3) score += 10;
  else if (input.skillsCount > 0) score += 5;
  if (input.experienceCount >= 1) score += 10;

  if (input.preferences?.desired_role) score += 4;
  if (input.preferences?.preferred_location) score += 2;
  if (input.preferences?.salary_range) score += 2;
  if (input.preferences?.job_type) score += 2;

  return Math.max(0, Math.min(100, score));
}
