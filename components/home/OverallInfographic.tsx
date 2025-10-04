import { createClient } from '@/lib/supabase/server';

let cachedSvg: string | null = null;
let cachedAt = 0;
let cachedAddons: { name: string; avg: number }[] = [];

export async function OverallInfographic() {
  const now = Date.now();
  if (!cachedSvg || now - cachedAt > 5 * 60 * 1000) {
    const supabase = createClient();
    const { data, error } = await supabase.from('article_addon_impacts').select('addon_name, severity');
    if (error) {
      return <div className="mt-4 text-slate-400">Failed to load infographic.</div>;
    }
    const counts = { low: 0, medium: 0, high: 0, dead: 0 } as Record<string, number>;
    const agg = new Map<string, number[]>();
    for (const r of data || []) {
      const sev = Number((r as any).severity || 1);
      if (sev <= 2) counts.low++;
      else if (sev === 3) counts.medium++;
      else if (sev === 4) counts.high++;
      else counts.dead++;
      const name = String((r as any).addon_name || '').trim();
      if (name) {
        const arr = agg.get(name) || [];
        arr.push(sev);
        agg.set(name, arr);
      }
    }
    const total = counts.low + counts.medium + counts.high + counts.dead;
    const bar = (label: string, value: number, color: string, y: number) => {
      const width = total ? Math.max(2, (value / total) * 320) : 2;
      return `<g><text x="10" y="${y - 10}" fill="#cbd5e1" font-size="12" font-family="ui-sans-serif">${label} (${value})</text><rect x="10" y="${y}" rx="4" ry="4" width="${width}" height="16" fill="${color}" /></g>`;
    };
    cachedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="360" height="180" viewBox="0 0 360 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0b1020" />
  <text x="10" y="24" fill="#e2e8f0" font-size="14" font-family="ui-sans-serif">Overall Addon Impact</text>
  ${bar('Low', counts.low, '#fde047', 60)}
  ${bar('Medium', counts.medium, '#f59e0b', 95)}
  ${bar('High', counts.high, '#f97316', 130)}
  ${bar('Disabled', counts.dead, '#ef4444', 165)}
</svg>`;
    cachedAddons = Array.from(agg.entries()).map(([name, arr]) => ({ name, avg: arr.reduce((a, b) => a + b, 0) / arr.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 12);
    cachedAt = now;
  }
  const category = (avg: number) => avg <= 2 ? 'low' : avg >= 5 ? 'disabled' : avg >= 4 ? 'high' : 'medium';
  const badge = (avg: number) => {
    const c = category(avg);
    const cls = c === 'low' ? 'bg-yellow-200 text-slate-900' : c === 'medium' ? 'bg-orange-400 text-white' : c === 'high' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white';
    const label = c.charAt(0).toUpperCase() + c.slice(1);
    return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
  };
  return (
    <div className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10">
      <div className="text-sm text-slate-300 mb-4">Updated every 5 minutes</div>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div className="p-2" dangerouslySetInnerHTML={{ __html: cachedSvg! }} />
        <div className="max-h-[180px] overflow-auto">
          <div className="text-sm text-slate-300 mb-3">Top addons (overall)</div>
          <ul className="space-y-1.5">
            {cachedAddons.map((a) => (
              <li key={a.name} className="flex items-center justify-between">
                <span className="truncate pr-2">{a.name}</span>
                {badge(a.avg)}
              </li>
            ))}
            {cachedAddons.length === 0 && (
              <li className="text-sm text-slate-400">No addon impacts yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}


