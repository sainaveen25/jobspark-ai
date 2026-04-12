alter table public.profiles
  add column if not exists work_auth text,
  add column if not exists profile_completion integer not null default 0;

alter table public.skills
  add column if not exists proficiency_level text;

alter table public.experiences
  add column if not exists description text;

alter table public.resumes
  add column if not exists parsed_data jsonb not null default '{}'::jsonb,
  add column if not exists resume_score integer not null default 0,
  add column if not exists suggestions jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists analyzed_at timestamptz;

create table if not exists public.job_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  desired_role text,
  preferred_location text,
  salary_range text,
  job_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  match_score integer not null default 0 check (match_score >= 0 and match_score <= 100),
  status text not null default 'saved' check (status in ('saved', 'applied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, job_id)
);

alter table public.job_preferences enable row level security;
alter table public.job_matches enable row level security;

drop policy if exists "Users can view their own job preferences" on public.job_preferences;
create policy "Users can view their own job preferences"
on public.job_preferences for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own job preferences" on public.job_preferences;
create policy "Users can insert their own job preferences"
on public.job_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own job preferences" on public.job_preferences;
create policy "Users can update their own job preferences"
on public.job_preferences for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own job preferences" on public.job_preferences;
create policy "Users can delete their own job preferences"
on public.job_preferences for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view their own job matches" on public.job_matches;
create policy "Users can view their own job matches"
on public.job_matches for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own job matches" on public.job_matches;
create policy "Users can insert their own job matches"
on public.job_matches for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own job matches" on public.job_matches;
create policy "Users can update their own job matches"
on public.job_matches for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own job matches" on public.job_matches;
create policy "Users can delete their own job matches"
on public.job_matches for delete
using (auth.uid() = user_id);

drop trigger if exists update_resumes_updated_at on public.resumes;
create trigger update_resumes_updated_at
before update on public.resumes
for each row execute function public.update_updated_at_column();

drop trigger if exists update_job_preferences_updated_at on public.job_preferences;
create trigger update_job_preferences_updated_at
before update on public.job_preferences
for each row execute function public.update_updated_at_column();

drop trigger if exists update_job_matches_updated_at on public.job_matches;
create trigger update_job_matches_updated_at
before update on public.job_matches
for each row execute function public.update_updated_at_column();
