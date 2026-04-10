declare module "sonner";
declare module "pdf-parse";

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
