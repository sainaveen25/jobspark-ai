const readRequiredEnv = (key: string, value = process.env[key]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const publicEnv = {
  nextPublicSupabaseUrl: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  nextPublicSupabaseAnonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
};

export const serverEnv = {
  supabaseServiceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  openAiApiKey: readRequiredEnv("OPENAI_API_KEY"),
  apifyToken: readRequiredEnv("APIFY_TOKEN"),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apifyGreenhouseActorId: process.env.APIFY_GREENHOUSE_ACTOR_ID ?? "",
  apifyLeverActorId: process.env.APIFY_LEVER_ACTOR_ID ?? "",
  apifyWorkdayActorId: process.env.APIFY_WORKDAY_ACTOR_ID ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
};
