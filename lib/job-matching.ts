import type { Row } from "@/lib/database.types";
import { calculateMatchScore } from "@/lib/match-score";

export function calculateJobPlatformMatch(input: {
  job: Row<"jobs">;
  skills: string[];
  preferredRoles: string[];
  preferredLocation?: string | null;
  desiredRole?: string | null;
  experienceText: string[];
  resumeText?: string | null;
}) {
  const baseScore = calculateMatchScore({
    jobDescription: [input.job.title, input.job.description ?? "", input.job.company].join(" "),
    profileSkills: input.skills,
    preferredRoles: [input.desiredRole, ...input.preferredRoles].filter((value): value is string => Boolean(value)),
    experienceText: input.experienceText,
    resumeText: input.resumeText ?? undefined
  });

  let bonus = 0;

  if (input.preferredLocation && input.job.location?.toLowerCase().includes(input.preferredLocation.toLowerCase())) {
    bonus += 10;
  }

  if (input.desiredRole && input.job.title.toLowerCase().includes(input.desiredRole.toLowerCase())) {
    bonus += 10;
  }

  return Math.max(0, Math.min(100, baseScore + bonus));
}
