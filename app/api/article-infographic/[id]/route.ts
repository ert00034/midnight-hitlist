import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = params.id;
  const { data, error } = await supabase
    .from('article_addon_impacts')
    .select('severity')
    .eq('article_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const counts = { low: 0, medium: 0, high: 0, dead: 0 };
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

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="140" viewBox="0 0 300 140" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0b1020" />
  <text x="10" y="20" fill="#e2e8f0" font-size="14" font-family="ui-sans-serif">Addon Impact Summary</text>
  ${bar('Low', counts.low, '#fde047', 40)}
  ${bar('Medium', counts.medium, '#f59e0b', 70)}
  ${bar('High', counts.high, '#f97316', 100)}
  ${bar('Dead', counts.dead, '#ef4444', 130)}
</svg>`;
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}


