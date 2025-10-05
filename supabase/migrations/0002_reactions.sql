-- Article reactions table: one reaction per reactor per article
create table if not exists public.article_reactions (
  article_id uuid references public.articles(id) on delete cascade,
  reactor_id text not null,
  reaction text not null check (reaction in ('good', 'bad')),
  created_at timestamp with time zone default now(),
  primary key (article_id, reactor_id)
);

-- RLS
alter table public.article_reactions enable row level security;

-- Public can read
drop policy if exists "Public read article reactions" on public.article_reactions;
create policy "Public read article reactions" on public.article_reactions for select using (true);

-- Service role can write
drop policy if exists "Service role write article reactions" on public.article_reactions;
create policy "Service role write article reactions" on public.article_reactions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


