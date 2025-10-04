import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';
import { ArticleCard, type Article } from '@/components/articles/ArticleCard';
import Link from 'next/link';

export default async function AddonDetailPage({ params }: { params: { name: string } }) {
  const addonName = decodeURIComponent(params.name);
  const supabase = createClient();

  const { data, error } = await supabase
    .from('articles')
    .select('*, article_addon_impacts!inner(addon_name, severity)')
    .eq('article_addon_impacts.addon_name', addonName)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="pb-16">
        <Navbar />
        <div className="mt-8 text-red-300">Failed to load addon details.</div>
      </div>
    );
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
  })) as Article[];

  const severityValues = articles.flatMap((a) => (a.impacts || []).filter((i) => i.addon_name === addonName).map((i) => i.severity));
  const avgSeverity = severityValues.length
    ? severityValues.reduce((a, b) => a + b, 0) / severityValues.length
    : null;

  return (
    <div className="pb-16">
      <Navbar />
      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Addon: {addonName}</h1>
        <Link href="/addons" className="text-sky-300 hover:underline">All Addons</Link>
      </div>
      {avgSeverity !== null && (
        <div className="mt-2 text-slate-300">Average severity: {avgSeverity.toFixed(1)}</div>
      )}
      <div className="mt-6">
        {!articles.length ? (
          <div className="text-slate-400">No related articles found.</div>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


