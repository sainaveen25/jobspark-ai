
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS github text,
  ADD COLUMN IF NOT EXISTS portfolio text,
  ADD COLUMN IF NOT EXISTS "location" text,
  ADD COLUMN IF NOT EXISTS "current_role" text,
  ADD COLUMN IF NOT EXISTS preferred_locations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS salary_min integer,
  ADD COLUMN IF NOT EXISTS salary_max integer,
  ADD COLUMN IF NOT EXISTS job_type text;
