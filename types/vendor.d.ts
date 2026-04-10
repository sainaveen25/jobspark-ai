declare module "sonner";
declare module "pdf-parse";

declare module "@lovable.dev/cloud-auth-js" {
  export function createLovableAuth(): {
    signInWithOAuth(
      provider: string,
      opts?: { redirect_uri?: string; extraParams?: Record<string, string> }
    ): Promise<{
      redirected?: boolean;
      error?: Error | null;
      tokens?: { access_token: string; refresh_token: string };
    }>;
  };
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
