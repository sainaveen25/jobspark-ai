import type { Json } from "@/lib/database.types";

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

export function extractResumeKeywords(text: string) {
  const keywords = Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/g)
        .filter((token) => token.length >= 3)
    )
  );

  return keywords.slice(0, 25);
}

export function analyzeResumeText(input: {
  resumeText: string;
  skills: string[];
  experiences: Array<{ company: string; role: string }>;
  desiredRole?: string | null;
}) {
  const resumeText = normalizeWhitespace(input.resumeText);
  const lower = resumeText.toLowerCase();
  const suggestions: string[] = [];
  let score = 45;

  if (resumeText.length >= 600) score += 10;
  else suggestions.push("Add more measurable details to your resume.");

  if (input.skills.length >= 5) score += 15;
  else suggestions.push("Add at least 5 relevant skills to improve matching.");

  if (input.experiences.length >= 2) score += 10;
  else suggestions.push("Add more work experience entries with impact-focused bullets.");

  if (input.desiredRole && lower.includes(input.desiredRole.toLowerCase())) score += 10;
  else if (input.desiredRole) suggestions.push(`Mention your target role (${input.desiredRole}) in your summary or experience.`);

  if (!/\d/.test(resumeText)) {
    suggestions.push("Include numbers or metrics to show impact.");
  } else {
    score += 5;
  }

  return {
    resumeScore: Math.max(0, Math.min(100, score)),
    suggestions,
    parsedData: {
      summary: resumeText.slice(0, 280),
      keywords: extractResumeKeywords(resumeText),
      experienceHighlights: input.experiences.map((experience) => `${experience.role} at ${experience.company}`),
      skills: input.skills
    } satisfies Json
  };
}
