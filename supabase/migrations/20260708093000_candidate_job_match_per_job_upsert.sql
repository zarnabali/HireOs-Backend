alter table public.candidate_job_matches
add column if not exists updated_at timestamptz not null default now();

with ranked_matches as (
  select
    id,
    row_number() over (
      partition by candidate_id, job_id
      order by created_at desc, id desc
    ) as duplicate_rank
  from public.candidate_job_matches
  where candidate_id is not null
    and job_id is not null
)
delete from public.candidate_job_matches match_row
using ranked_matches
where match_row.id = ranked_matches.id
  and ranked_matches.duplicate_rank > 1;

create unique index if not exists idx_candidate_job_matches_candidate_job
on public.candidate_job_matches(candidate_id, job_id);
