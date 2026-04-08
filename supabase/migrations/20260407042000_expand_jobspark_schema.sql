alter table public.profiles
  add column if not exists phone text,
  add column if not exists linkedin text,
  add column if not exists github text,
  add column if not exists portfolio text,
  add column if not exists "current_role" text,
  add column if not exists preferred_locations text[];


create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_title text not null,
  company text not null,
  location text,
  start_date date not null,
  end_date date,
  bullet_points jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.experiences enable row level security;

create policy "Users can view their own experiences"
on public.experiences for select
using (auth.uid() = user_id);

create policy "Users can insert their own experiences"
on public.experiences for insert
with check (auth.uid() = user_id);

create policy "Users can update their own experiences"
on public.experiences for update
using (auth.uid() = user_id);

create policy "Users can delete their own experiences"
on public.experiences for delete
using (auth.uid() = user_id);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  skill_name text not null,
  created_at timestamptz not null default now()
);

alter table public.skills enable row level security;

create policy "Users can view their own skills"
on public.skills for select
using (auth.uid() = user_id);

create policy "Users can insert their own skills"
on public.skills for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own skills"
on public.skills for delete
using (auth.uid() = user_id);

alter table public.jobs
  add column if not exists source_job_id text,
  add column if not exists job_key text,
  add column if not exists updated_at timestamptz not null default now();

update public.jobs
set job_key = lower(regexp_replace(title || '-' || company, '[^a-zA-Z0-9]+', '-', 'g'))
where job_key is null;

alter table public.jobs
  alter column job_key set not null;

create unique index if not exists jobs_job_key_key on public.jobs(job_key);

alter table public.resumes
  add column if not exists storage_path text,
  add column if not exists filename text;

drop policy if exists "Users can view their own resumes" on storage.objects;
drop policy if exists "Users can upload their own resumes" on storage.objects;
drop policy if exists "Users can delete their own resumes" on storage.objects;

create policy "Users can upload their own resumes"
on storage.objects for insert
with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own resumes"
on storage.objects for select
using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own resumes"
on storage.objects for delete
using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

drop trigger if exists update_experiences_updated_at on public.experiences;
create trigger update_experiences_updated_at
before update on public.experiences
for each row execute function public.update_updated_at_column();

drop trigger if exists update_jobs_updated_at on public.jobs;
create trigger update_jobs_updated_at
before update on public.jobs
for each row execute function public.update_updated_at_column();
