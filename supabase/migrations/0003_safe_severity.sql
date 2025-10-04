-- Allow severity level 0 = Safe

alter table if exists public.article_addon_impacts
  drop constraint if exists article_addon_impacts_severity_check;
alter table if exists public.article_addon_impacts
  add constraint article_addon_impacts_severity_check check (severity between 0 and 5);

alter table if exists public.articles
  drop constraint if exists articles_severity_check;
alter table if exists public.articles
  add constraint articles_severity_check check (severity is null or severity between 0 and 5);


