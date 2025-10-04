import { getOverallAddonImpacts } from '@/lib/data/overallImpacts';
import Link from 'next/link';

export async function OverallAddonImpact() {
  const impacts = await getOverallAddonImpacts();

  if (!impacts.length) {
    return <div className="text-slate-400">No addon impacts yet.</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {impacts.map((i) => (
        <Link
          key={i.addon_name}
          href={`/addons/${encodeURIComponent(i.addon_name)}`}
          className="flex items-center justify-between rounded-lg bg-slate-900/40 p-4 ring-1 ring-white/10 hover:shadow-glow transition"
        >
          <span className="font-medium">{i.addon_name}</span>
          <span>
            <SeverityLabel severity={i.severity} />
          </span>
        </Link>
      ))}
    </div>
  );
}

function SeverityLabel({ severity }: { severity: number }) {
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


