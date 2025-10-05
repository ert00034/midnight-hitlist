-- Aggregated reaction counts per article to reduce read load
create table if not exists public.article_reaction_counts (
  article_id uuid primary key references public.articles(id) on delete cascade,
  good_count integer not null default 0,
  bad_count integer not null default 0,
  updated_at timestamp with time zone default now()
);

-- RLS
alter table public.article_reaction_counts enable row level security;

-- Public can read
drop policy if exists "Public read article reaction counts" on public.article_reaction_counts;
create policy "Public read article reaction counts" on public.article_reaction_counts for select using (true);

-- Service role can write
drop policy if exists "Service role write article reaction counts" on public.article_reaction_counts;
create policy "Service role write article reaction counts" on public.article_reaction_counts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


