import "server-only";

import { serverEnv } from "@/lib/env";

const SYSTEM_PROMPT = `You are an AI Resume Tailoring Engine.

STRICT RULES:
- Extract all technologies from job description
- Include all in Experience section
- Do not fabricate experience
- Use exact keywords
- Use XYZ bullet format
- Maintain ATS format

Return optimized resume only`;

export async function optimizeResume(resumeText: string, jobDescription: string) {
  if (!resumeText.trim()) {
    throw new Error("Resume text is required for optimization");
  }

  if (!jobDescription.trim()) {
    throw new Error("Job description is required for optimization");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.openAiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: serverEnv.openAiModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nOptimize the resume.`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed with status ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI did not return optimized resume content");
  }

  return content;
}
