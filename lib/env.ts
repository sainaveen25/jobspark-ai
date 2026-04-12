const readRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const readOptionalEnv = (key: string): string | null => {
  const value = process.env[key];
  return value ? value : null;
};

const readFirstOptionalEnv = (...keys: string[]): string | null => {
  for (const key of keys) {
    const value = readOptionalEnv(key);
    if (value) {
      return value;
    }
  }

  return null;
};

export const maskSecret = (value: string | null, visibleChars = 4): string | null => {
  if (!value) {
    return null;
  }

  if (value.length <= visibleChars * 2) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, visibleChars)}${"*".repeat(Math.max(8, value.length - visibleChars * 2))}${value.slice(-visibleChars)}`;
};

// Lazy getters - values are only resolved and validated when first accessed
// at request time, NOT during the static build phase. This prevents build
// failures in environments that inject env vars at runtime rather than build time.
export const publicEnv = {
  get nextPublicSupabaseUrl() {
    return readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get nextPublicSupabaseAnonKey() {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const legacyPublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (anonKey) {
      return anonKey;
    }

    if (legacyPublishableKey) {
      return legacyPublishableKey;
    }

    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
};

export const serverEnv = {
  get supabaseServiceRoleKey() {
    return readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get jwtSecret() {
    return readRequiredEnv("JWT_SECRET");
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

export function getConfigHealth() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(readOptionalEnv("NEXT_PUBLIC_SUPABASE_URL")),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(
      readOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? readOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    ),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(readOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"))
  };

  const optional = {
    JWT_SECRET: Boolean(readOptionalEnv("JWT_SECRET")),
    OPENAI_API_KEY: Boolean(readOptionalEnv("OPENAI_API_KEY")),
    APIFY_TOKEN: Boolean(readOptionalEnv("APIFY_TOKEN")),
    APIFY_GREENHOUSE_ACTOR_ID: Boolean(readOptionalEnv("APIFY_GREENHOUSE_ACTOR_ID")),
    APIFY_LEVER_ACTOR_ID: Boolean(readOptionalEnv("APIFY_LEVER_ACTOR_ID")),
    APIFY_WORKDAY_ACTOR_ID: Boolean(readOptionalEnv("APIFY_WORKDAY_ACTOR_ID"))
  };

  const warnings: string[] = [];

  if (!readOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") && readOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")) {
    warnings.push("Using legacy NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Rename it to NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (!optional.APIFY_TOKEN) {
    warnings.push("APIFY_TOKEN is missing. Job sync is disabled until this is configured.");
  }

  if (!optional.JWT_SECRET) {
    warnings.push("JWT_SECRET is missing. Bearer-token profile APIs are disabled until this is configured.");
  }

  if (
    optional.APIFY_TOKEN &&
    !optional.APIFY_GREENHOUSE_ACTOR_ID &&
    !optional.APIFY_LEVER_ACTOR_ID &&
    !optional.APIFY_WORKDAY_ACTOR_ID
  ) {
    warnings.push("APIFY_TOKEN is set but no APIFY actor IDs are configured.");
  }

  warnings.push("If any API keys were exposed in source control, rotate them before production use.");

  return {
    ok: Object.values(required).every(Boolean),
    required,
    optional,
    warnings
  };
}

export function getRedactedSecretState() {
  const gitApiSecret =
    readFirstOptionalEnv("GITHUB_TOKEN", "GITHUB_API_KEY", "GIT_API_KEY");
  const apifySecretPin =
    readFirstOptionalEnv("APIFY_SECRET_PIN", "APPIFY_SECRET_PIN");
  const apifyToken = readOptionalEnv("APIFY_TOKEN");

  return {
    gitApi: {
      configured: Boolean(gitApiSecret),
      maskedValue: maskSecret(gitApiSecret)
    },
    apifyToken: {
      configured: Boolean(apifyToken),
      maskedValue: maskSecret(apifyToken)
    },
    apifySecretPin: {
      configured: Boolean(apifySecretPin),
      maskedValue: maskSecret(apifySecretPin)
    }
  };
}
