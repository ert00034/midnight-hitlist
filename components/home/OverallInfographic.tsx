import { createClient } from '@/lib/supabase/server';

let cachedSvg: string | null = null;
let cachedAt = 0;

export async function OverallInfographic() {
  const now = Date.now();
  if (!cachedSvg || now - cachedAt > 5 * 60 * 1000) {
    const supabase = createClient();
    const { data, error } = await supabase.from('article_addon_impacts').select('severity');
    if (error) {
      return <div className="mt-4 text-slate-400">Failed to load infographic.</div>;
    }
    const counts = { low: 0, medium: 0, high: 0, dead: 0 } as Record<string, number>;
    for (const r of data || []) {
      const sev = Number((r as any).severity || 1);
      if (sev <= 2) counts.low++;
      else if (sev === 3) counts.medium++;
      else if (sev === 4) counts.high++;
      else counts.dead++;
    }
    const total = counts.low + counts.medium + counts.high + counts.dead;
    const bar = (label: string, value: number, color: string, y: number) => {
      const width = total ? Math.max(2, (value / total) * 260) : 2;
      return `<g><text x="10" y="${y - 8}" fill="#cbd5e1" font-size="12" font-family="ui-sans-serif">${label} (${value})</text><rect x="10" y="${y}" rx="4" ry="4" width="${width}" height="14" fill="${color}" /></g>`;
    };
    cachedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="140" viewBox="0 0 300 140" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0b1020" />
  <text x="10" y="20" fill="#e2e8f0" font-size="14" font-family="ui-sans-serif">Overall Addon Impact</text>
  ${bar('Low', counts.low, '#fde047', 40)}
  ${bar('Medium', counts.medium, '#f59e0b', 70)}
  ${bar('High', counts.high, '#f97316', 100)}
  ${bar('Dead', counts.dead, '#ef4444', 130)}
</svg>`;
    cachedAt = now;
  }
  return (
    <div className="rounded-xl bg-slate-900/40 p-4 ring-1 ring-white/10">
      <div className="text-sm text-slate-300 mb-2">Updated every 5 minutes</div>
      <div dangerouslySetInnerHTML={{ __html: cachedSvg! }} />
    </div>
  );
}


