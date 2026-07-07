create extension if not exists pgcrypto;
create extension if not exists vector;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('candidate', 'recruiter', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  size_range text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'recruiter', 'viewer')),
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  headline text,
  summary text,
  location text,
  open_to_remote boolean not null default false,
  desired_role text,
  desired_salary_min integer,
  desired_salary_max integer,
  portfolio_url text,
  github_url text,
  linkedin_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruiter_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  title text,
  phone text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text not null,
  department text,
  location text,
  remote_type text not null default 'onsite' check (remote_type in ('onsite', 'hybrid', 'remote')),
  employment_type text not null default 'full_time' check (employment_type in ('full_time', 'part_time', 'contract', 'internship')),
  seniority text check (seniority in ('intern', 'junior', 'mid', 'senior', 'lead', 'principal')),
  min_salary integer,
  max_salary integer,
  currency char(3) not null default 'USD',
  required_skills text[] not null default '{}',
  nice_to_have_skills text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'open', 'paused', 'closed')),
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  document_type text not null default 'resume' check (document_type in ('resume', 'cover_letter', 'offer_letter', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  extraction_type text not null default 'resume',
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  ai_response jsonb not null default '{}'::jsonb,
  confidence numeric(5,4),
  warnings text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  structured_data jsonb not null default '{}'::jsonb,
  raw_text text,
  is_primary boolean not null default false,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.users(id) on delete cascade,
  source_resume_id uuid references public.resumes(id) on delete set null,
  title text not null,
  structured_data jsonb not null default '{}'::jsonb,
  target_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_scores (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  target_role text,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  breakdown jsonb not null default '{}'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  status text not null default 'applied' check (status in ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  source text,
  recruiter_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, candidate_id)
);

create table if not exists public.candidate_job_scores (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  candidate_id uuid references public.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  score numeric(5,2),
  matched_requirements jsonb not null default '[]'::jsonb,
  missing_requirements jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric(5,4),
  warnings text[] not null default '{}',
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_job_matches (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  job_id uuid references public.jobs(id) on delete cascade,
  score numeric(5,2),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(candidate_id, job_id)
);

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  candidate_id uuid references public.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  question text not null,
  question_type text not null default 'technical',
  difficulty text not null default 'medium',
  rubric jsonb not null default '{}'::jsonb,
  expected_signals text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.mock_interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  status text not null default 'active',
  final_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mock_interview_messages (
  id uuid primary key default gen_random_uuid(),
  mock_interview_id uuid not null references public.mock_interviews(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_interview_evaluations (
  id uuid primary key default gen_random_uuid(),
  mock_interview_id uuid references public.mock_interviews(id) on delete cascade,
  question_id uuid references public.interview_questions(id) on delete set null,
  answer_text text,
  evaluation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  conversation_type text not null check (conversation_type in ('candidate_career', 'recruiter_hiring')),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_refresh_tokens_user_id on public.refresh_tokens(user_id);
create index if not exists idx_company_members_user_id on public.company_members(user_id);
create index if not exists idx_jobs_company_status on public.jobs(company_id, status);
create index if not exists idx_applications_job_id on public.applications(job_id);
create index if not exists idx_applications_candidate_id on public.applications(candidate_id);
create index if not exists idx_resumes_candidate_id on public.resumes(candidate_id);
create index if not exists idx_documents_owner_user_id on public.documents(owner_user_id);
create index if not exists idx_conversations_owner_user_id on public.conversations(owner_user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
drop trigger if exists set_candidate_profiles_updated_at on public.candidate_profiles;
create trigger set_candidate_profiles_updated_at before update on public.candidate_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_recruiter_profiles_updated_at on public.recruiter_profiles;
create trigger set_recruiter_profiles_updated_at before update on public.recruiter_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at before update on public.applications for each row execute function public.set_updated_at();
drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at before update on public.resumes for each row execute function public.set_updated_at();
drop trigger if exists set_mock_interviews_updated_at on public.mock_interviews;
create trigger set_mock_interviews_updated_at before update on public.mock_interviews for each row execute function public.set_updated_at();
drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.refresh_tokens enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.recruiter_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;
alter table public.resume_scores enable row level security;
alter table public.applications enable row level security;
alter table public.candidate_job_scores enable row level security;
alter table public.candidate_job_matches enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.interview_questions enable row level security;
alter table public.mock_interviews enable row level security;
alter table public.mock_interview_messages enable row level security;
alter table public.mock_interview_evaluations enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.skills enable row level security;
alter table public.audit_logs enable row level security;

create policy "users can read own user row" on public.users for select to authenticated using ((select auth.uid()) = id);
create policy "users can update own user row" on public.users for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "company members can read companies" on public.companies for select to authenticated using (
  exists (select 1 from public.company_members cm where cm.company_id = id and cm.user_id = (select auth.uid()))
);
create policy "authenticated users can create companies" on public.companies for insert to authenticated with check (true);
create policy "company admins can update companies" on public.companies for update to authenticated using (
  exists (select 1 from public.company_members cm where cm.company_id = id and cm.user_id = (select auth.uid()) and cm.role in ('owner', 'admin'))
) with check (
  exists (select 1 from public.company_members cm where cm.company_id = id and cm.user_id = (select auth.uid()) and cm.role in ('owner', 'admin'))
);

create policy "users can read own memberships" on public.company_members for select to authenticated using (user_id = (select auth.uid()));
create policy "users can insert own first membership" on public.company_members for insert to authenticated with check (user_id = (select auth.uid()));

create policy "candidates own profile" on public.candidate_profiles for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "recruiters own profile" on public.recruiter_profiles for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "open jobs are readable" on public.jobs for select to authenticated using (status = 'open');
create policy "company members manage jobs" on public.jobs for all to authenticated using (
  exists (select 1 from public.company_members cm where cm.company_id = jobs.company_id and cm.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.company_members cm where cm.company_id = jobs.company_id and cm.user_id = (select auth.uid()))
);

create policy "users own documents" on public.documents for all to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy "users read own resumes" on public.resumes for all to authenticated using (candidate_id = (select auth.uid())) with check (candidate_id = (select auth.uid()));
create policy "users read own resume versions" on public.resume_versions for all to authenticated using (candidate_id = (select auth.uid())) with check (candidate_id = (select auth.uid()));

create policy "candidates manage own applications" on public.applications for all to authenticated using (candidate_id = (select auth.uid())) with check (candidate_id = (select auth.uid()));
create policy "candidates manage saved jobs" on public.saved_jobs for all to authenticated using (candidate_id = (select auth.uid())) with check (candidate_id = (select auth.uid()));
create policy "users read own notifications" on public.notifications for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "users manage own conversations" on public.conversations for all to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy "users read conversation messages through owner" on public.conversation_messages for select to authenticated using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.owner_user_id = (select auth.uid()))
);
create policy "users insert conversation messages through owner" on public.conversation_messages for insert to authenticated with check (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.owner_user_id = (select auth.uid()))
);

create policy "skills are readable" on public.skills for select to authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
