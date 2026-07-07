alter table public.jobs
  add column if not exists published_at timestamptz,
  add column if not exists expires_at timestamptz;

alter table public.applications
  add column if not exists cover_letter text;

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (status in ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'));

create index if not exists idx_jobs_status_created_at on public.jobs(status, created_at desc);
create index if not exists idx_jobs_remote_type on public.jobs(remote_type);
create index if not exists idx_jobs_employment_type on public.jobs(employment_type);
create index if not exists idx_jobs_required_skills on public.jobs using gin(required_skills);
create index if not exists idx_saved_jobs_candidate_id on public.saved_jobs(candidate_id);

drop policy if exists "recruiters read applications for company jobs" on public.applications;
create policy "recruiters read applications for company jobs"
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    join public.company_members cm on cm.company_id = j.company_id
    where j.id = applications.job_id
      and cm.user_id = (select auth.uid())
  )
);

drop policy if exists "recruiters update applications for company jobs" on public.applications;
create policy "recruiters update applications for company jobs"
on public.applications
for update
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    join public.company_members cm on cm.company_id = j.company_id
    where j.id = applications.job_id
      and cm.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.jobs j
    join public.company_members cm on cm.company_id = j.company_id
    where j.id = applications.job_id
      and cm.user_id = (select auth.uid())
  )
);
