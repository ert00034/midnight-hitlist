import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  // Aggregate by addon name across article_addon_impacts join table if exists; for now stub from articles
  const { data: rows, error } = await supabase
    .from('article_addon_impacts')
    .select('addon_name, severity');

  if (error) {
    // fallback: empty
    return NextResponse.json({ impacts: [] });
  }

  const agg = new Map<string, number[]>();
  for (const r of rows as any[]) {
    const list = agg.get(r.addon_name) ?? [];
    // Preserve 0 (Safe). Use 0 as fallback only if null/undefined.
    list.push(Number((r as any).severity ?? 0));
    agg.set(r.addon_name, list);
  }
  const impacts = Array.from(agg.entries()).map(([addon_name, severities]) => ({
    addon_name,
    severity: severities.reduce((a, b) => a + b, 0) / Math.max(1, severities.length)
  }));
  return NextResponse.json({ impacts });
}


