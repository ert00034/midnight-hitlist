import Link from 'next/link';
import { AddonTag } from '@/components/AddonTag';
import { Favicon } from '@/components/Favicon';
import { ArticleReactions } from './ArticleReactions';

export type Article = {
  id: string;
  url: string;
  title: string;
  summary: string | null;
  favicon: string | null;
  severity: number | null;
  created_at?: string;
  impacts?: { addon_name: string; severity: number }[];
};

export function ArticleCard({ article }: { article: Article }) {
  const severity = article.severity ?? 1;
  return (
    <div className="group rounded-xl bg-slate-900/40 p-5 ring-1 ring-white/10 transition hover:shadow-glow touch-manipulation">
      <div className="flex items-start gap-4 min-w-0">
        <Favicon url={article.url} src={article.favicon || undefined} size={32} className="rounded" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={article.url} target="_blank" rel="noopener noreferrer" className="block text-lg font-medium leading-snug line-clamp-2 break-words focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded" title={article.url}>
              {article.title || article.url}
            </Link>
          </div>
          {article.summary && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{article.summary}</p>
          )}
          {article.impacts && article.impacts.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">Related addons</div>
              <div className="flex flex-wrap gap-2">
              {article.impacts.map((i) => (
                <AddonTag key={i.addon_name} name={i.addon_name} severity={i.severity} />
              ))}
              </div>
            </div>
          )}
        </div>
        <div className="ml-auto shrink-0 self-stretch">
          <ArticleReactions articleId={article.id} />
        </div>
      </div>
    </div>
  );
}


