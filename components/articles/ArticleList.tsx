import { createClient } from '@/lib/supabase/server';
import { ArticleCard, type Article } from './ArticleCard';
import { headers } from 'next/headers';

export async function ArticleList() {
  const supabase = createClient();
  const h = headers();
  const recommendedOnly = (h.get('x-invoke-path') || '') === '' ? true : true;
  // Read query param from header URL (App Router limitation workaround)
  const url = h.get('referer') || '';
  const qs = url.split('?')[1] || '';
  const params = new URLSearchParams(qs);
  const showAll = params.get('recommended') === '0';
  let query = supabase
    .from('articles')
    .select('*, article_addon_impacts(addon_name, severity)')
    .order('created_at', { ascending: false });
  if (!showAll) {
    query = query.not('severity', 'is', null).gte('severity', 2);
  }
  const { data, error } = await query;

  if (error) {
    return <div className="mt-6 text-red-300">Failed to load articles.</div>;
  }

  const articles = (data ?? []).map((row: any) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    summary: row.summary,
    favicon: row.favicon,
    severity: row.severity,
    created_at: row.created_at,
    impacts: (row.article_addon_impacts ?? []).map((i: any) => ({ addon_name: i.addon_name, severity: i.severity }))
  })) as Article[];
  if (!articles.length) {
    return <div className="mt-6 text-slate-400">No articles added yet.</div>;
  }

  return (
    <div className="mt-6 grid gap-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}


