-- extensions
create extension if not exists pgcrypto;

-- Articles table
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text,
  summary text,
  favicon text,
  severity int check (severity between 1 and 5),
  created_at timestamp with time zone default now()
);

-- Addons table
create table if not exists public.addons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Article to Addon impacts
create table if not exists public.article_addon_impacts (
  article_id uuid references public.articles(id) on delete cascade,
  addon_name text not null,
  severity int not null check (severity between 1 and 5),
  primary key (article_id, addon_name)
);

-- RLS
alter table public.articles enable row level security;
alter table public.addons enable row level security;
alter table public.article_addon_impacts enable row level security;

-- Public can read
drop policy if exists "Public read articles" on public.articles;
create policy "Public read articles" on public.articles for select using (true);
drop policy if exists "Public read impacts" on public.article_addon_impacts;
create policy "Public read impacts" on public.article_addon_impacts for select using (true);
drop policy if exists "Public read addons" on public.addons;
create policy "Public read addons" on public.addons for select using (true);

-- Admin service role (via Supabase service_key) can write
drop policy if exists "Service role write articles" on public.articles;
create policy "Service role write articles" on public.articles
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "Service role write impacts" on public.article_addon_impacts;
create policy "Service role write impacts" on public.article_addon_impacts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "Service role write addons" on public.addons;
create policy "Service role write addons" on public.addons
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


