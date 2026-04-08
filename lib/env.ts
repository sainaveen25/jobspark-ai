const readRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Lazy getters — values are only resolved and validated when first accessed
// at request time, NOT during the static build phase. This prevents build
// failures in environments (e.g. Lovable, Vercel) that inject env vars at
// runtime rather than build time.
export const publicEnv = {
  get nextPublicSupabaseUrl() {
    return readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get nextPublicSupabaseAnonKey() {
    return readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
};

export const serverEnv = {
  get supabaseServiceRoleKey() {
    return readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get openAiApiKey() {
    return readRequiredEnv("OPENAI_API_KEY");
  },
  get apifyToken() {
    return readRequiredEnv("APIFY_TOKEN");
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
  get apifyGreenhouseActorId() {
    return process.env.APIFY_GREENHOUSE_ACTOR_ID ?? "";
  },
  get apifyLeverActorId() {
    return process.env.APIFY_LEVER_ACTOR_ID ?? "";
  },
  get apifyWorkdayActorId() {
    return process.env.APIFY_WORKDAY_ACTOR_ID ?? "";
  },
  get openAiModel() {
    return process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  }
};
