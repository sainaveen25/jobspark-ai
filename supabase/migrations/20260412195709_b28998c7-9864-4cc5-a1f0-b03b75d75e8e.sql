
-- =============================================
-- PHASE 1: Enhance existing profiles table
-- =============================================

-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS resume_original_url text,
  ADD COLUMN IF NOT EXISTS resume_filename text,
  ADD COLUMN IF NOT EXISTS resume_raw_text text,
  ADD COLUMN IF NOT EXISTS resume_parsed_at timestamptz,
  ADD COLUMN IF NOT EXISTS preferred_titles text[],
  ADD COLUMN IF NOT EXISTS remote_preference text DEFAULT 'any';

-- =============================================
-- PHASE 2: Enhance existing jobs table
-- =============================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS company_slug text,
  ADD COLUMN IF NOT EXISTS company_logo text,
  ADD COLUMN IF NOT EXISTS is_remote boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS apply_url text,
  ADD COLUMN IF NOT EXISTS apply_method text,
  ADD COLUMN IF NOT EXISTS greenhouse_job_id text,
  ADD COLUMN IF NOT EXISTS lever_posting_id text,
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS salary_min numeric,
  ADD COLUMN IF NOT EXISTS salary_max numeric,
  ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS fetched_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Make source NOT NULL with a default for existing rows
UPDATE public.jobs SET source = 'manual' WHERE source IS NULL;

-- Create unique index on external_id (allow nulls for legacy manual jobs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_external_id ON public.jobs(external_id) WHERE external_id IS NOT NULL;

-- =============================================
-- PHASE 3: Enhance existing applications table
-- =============================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_id uuid,
  ADD COLUMN IF NOT EXISTS ats_score_used integer,
  ADD COLUMN IF NOT EXISTS resume_version text,
  ADD COLUMN IF NOT EXISTS tailored_resume_url text,
  ADD COLUMN IF NOT EXISTS apply_method_used text,
  ADD COLUMN IF NOT EXISTS confirmation_id text,
  ADD COLUMN IF NOT EXISTS confirmation_screenshot text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS cover_letter text,
  ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text;

-- =============================================
-- PHASE 4: Create new tables
-- =============================================

-- Work experience
CREATE TABLE IF NOT EXISTS public.work_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company text,
  title text,
  location text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  achievements text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.work_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own work experience"
  ON public.work_experience FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Education
CREATE TABLE IF NOT EXISTS public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  institution text,
  degree text,
  field_of_study text,
  start_year integer,
  end_year integer,
  gpa text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own education"
  ON public.education FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Job matches (per-user scoring + tailored resumes)
CREATE TABLE IF NOT EXISTS public.job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score integer DEFAULT 0,
  ats_score integer,
  matched_keywords text[],
  missing_keywords text[],
  tailored_resume_text text,
  tailored_resume_url text,
  ats_attempts integer DEFAULT 0,
  ready_to_apply boolean DEFAULT false,
  status text DEFAULT 'new',
  computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, job_id)
);

ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own job matches"
  ON public.job_matches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- PHASE 5: Performance indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON public.jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_matches_user_score ON public.job_matches(user_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_ready ON public.job_matches(user_id, ready_to_apply);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_work_exp_user ON public.work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user ON public.education(user_id);

-- =============================================
-- PHASE 6: Triggers for updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_work_exp_updated_at') THEN
    CREATE TRIGGER trigger_work_exp_updated_at
      BEFORE UPDATE ON public.work_experience
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_education_updated_at') THEN
    CREATE TRIGGER trigger_education_updated_at
      BEFORE UPDATE ON public.education
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_job_matches_updated_at') THEN
    CREATE TRIGGER trigger_job_matches_updated_at
      BEFORE UPDATE ON public.job_matches
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Enable realtime for job_matches and applications
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_matches;
