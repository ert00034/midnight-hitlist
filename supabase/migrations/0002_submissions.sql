-- Submissions tables for public suggestions

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text,
  notes text,
  ip_hash text,
  user_agent text,
  status text default 'pending', -- pending|reviewed|discarded
  created_at timestamp with time zone default now()
);

create table if not exists public.submission_addon_impacts (
  submission_id uuid references public.submissions(id) on delete cascade,
  addon_name text not null,
  severity int not null check (severity between 1 and 5),
  primary key (submission_id, addon_name)
);

-- RLS
alter table public.submissions enable row level security;
alter table public.submission_addon_impacts enable row level security;

-- Only service role can read/write by default
drop policy if exists "Service role write submissions" on public.submissions;
create policy "Service role write submissions" on public.submissions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role write submission impacts" on public.submission_addon_impacts;
create policy "Service role write submission impacts" on public.submission_addon_impacts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Helpful index for rate limiting lookups
create index if not exists submissions_ip_hash_created_at_idx on public.submissions (ip_hash, created_at desc);


