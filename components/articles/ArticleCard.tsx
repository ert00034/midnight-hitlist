import Image from 'next/image';
import Link from 'next/link';
import { SeverityPill } from '@/components/SeverityPill';
import { AddonTag } from '@/components/AddonTag';

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
    <div className="group rounded-xl bg-slate-900/40 p-5 ring-1 ring-white/10 transition hover:shadow-glow">
      <div className="flex items-start gap-4">
        {article.favicon ? (
          <Image src={article.favicon} alt="icon" width={32} height={32} className="rounded" />
        ) : (
          <div className="h-8 w-8 rounded bg-slate-700" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <Link href={article.url} target="_blank" className="truncate text-lg font-medium">
              {article.title || article.url}
            </Link>
            <SeverityPill level={severity} />
          </div>
          {article.summary && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{article.summary}</p>
          )}
          {article.impacts && article.impacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {article.impacts.map((i) => (
                <AddonTag key={i.addon_name} name={i.addon_name} severity={i.severity} />
              ))}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}


