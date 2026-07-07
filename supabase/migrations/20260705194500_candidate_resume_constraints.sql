create unique index if not exists idx_resumes_one_primary_per_candidate
on public.resumes(candidate_id)
where is_primary = true;
