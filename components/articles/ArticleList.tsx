import { createClient } from '@/lib/supabase/server';
import { ArticleCard, type Article } from './ArticleCard';

export async function ArticleList() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*, article_addon_impacts(addon_name, severity), article_reaction_counts(good_count, bad_count)')
    .order('created_at', { ascending: false });

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
    impacts: (row.article_addon_impacts ?? []).map((i: any) => ({ addon_name: i.addon_name, severity: i.severity })),
    reactions: {
      good: Number(row.article_reaction_counts?.good_count || 0),
      bad: Number(row.article_reaction_counts?.bad_count || 0),
    }
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


