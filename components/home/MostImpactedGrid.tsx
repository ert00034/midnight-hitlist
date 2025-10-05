import { getOverallAddonImpacts } from '@/lib/data/overallImpacts';
import Link from 'next/link';

export async function MostImpactedGrid() {
  const impacts = await getOverallAddonImpacts();
  const top = (impacts || []).slice(0, 12);

  if (!top.length) {
    return <div className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 text-slate-400">No addon impacts yet.</div>;
  }

  return (
    <div className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10">
      <div className="text-sm text-slate-300 mb-3">Most impacted addons</div>
      <div className="max-h-[260px] overflow-y-auto pr-1 py-1" style={{ scrollbarGutter: 'stable both-edges' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2" aria-label="Most impacted addons">
          {top.map((i) => (
            <Link
              key={i.addon_name}
              href={`/addons/${encodeURIComponent(i.addon_name)}`}
              className="group flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 ring-1 ring-white/10 transition hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 no-underline hover:no-underline"
            >
              <span className="truncate pr-3 font-medium text-cyan-300 group-hover:text-cyan-200">{i.addon_name}</span>
              <SeverityBadge severity={i.severity} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: number }) {
  const sev = Number(severity || 0);
  const label = sev === 0 ? 'safe' : sev >= 4.5 ? 'critical' : sev >= 3.5 ? 'high' : sev >= 2.5 ? 'notable' : sev >= 1.5 ? 'moderate' : 'low';
  const cls = label === 'safe'
    ? 'bg-green-500 text-white'
    : label === 'low'
    ? 'bg-yellow-200 text-slate-900'
    : label === 'moderate'
    ? 'bg-yellow-300 text-slate-900'
    : label === 'notable'
    ? 'bg-orange-400 text-white'
    : label === 'high'
    ? 'bg-orange-500 text-white'
    : 'bg-red-500 text-white';
  const text = label.charAt(0).toUpperCase() + label.slice(1);
  return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{text}</span>;
}


