import type { PostgrestError } from "@supabase/supabase-js";

type SupabaseResult<T> = {
  data: T;
  error: PostgrestError | null;
  count?: number | null;
};

const toError = (context: string, error: PostgrestError | null) => {
  if (!error) {
    return null;
  }

  return new Error(`${context}: ${error.message}`);
};

export function unwrapSupabaseResult<T>(result: SupabaseResult<T>, context: string): T {
  const error = toError(context, result.error);

  if (error) {
    throw error;
  }

  return result.data;
}

export function unwrapSupabaseCount(result: SupabaseResult<unknown>, context: string): number {
  const error = toError(context, result.error);

  if (error) {
    throw error;
  }

  return result.count ?? 0;
}
