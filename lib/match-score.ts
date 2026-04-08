const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .filter((token) => token.length > 1);

const countOverlap = (left: Set<string>, right: Set<string>) => {
  let matches = 0;

  for (const item of left) {
    if (right.has(item)) {
      matches += 1;
    }
  }

  return matches;
};

export interface MatchScoreInput {
  jobDescription: string;
  profileSkills: string[];
  preferredRoles: string[];
  experienceText: string[];
  resumeText?: string;
}

export function calculateMatchScore(input: MatchScoreInput) {
  const jobTokens = new Set(tokenize(input.jobDescription));
  const skillsTokens = new Set(tokenize(input.profileSkills.join(" ")));
  const roleTokens = new Set(tokenize(input.preferredRoles.join(" ")));
  const experienceTokens = new Set(tokenize(input.experienceText.join(" ")));
  const resumeTokens = new Set(tokenize(input.resumeText ?? ""));

  const keywordScore = Math.min(40, Math.round((countOverlap(jobTokens, resumeTokens) / Math.max(jobTokens.size, 1)) * 40));
  const skillScore = Math.min(35, Math.round((countOverlap(jobTokens, skillsTokens) / Math.max(jobTokens.size, 1)) * 35));
  const relevanceScore = Math.min(
    25,
    Math.round(
      ((countOverlap(jobTokens, experienceTokens) + countOverlap(jobTokens, roleTokens)) /
        Math.max(jobTokens.size, 1)) *
        25,
    ),
  );

  return Math.max(0, Math.min(100, keywordScore + skillScore + relevanceScore));
}
