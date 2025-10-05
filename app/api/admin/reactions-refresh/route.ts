import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/serviceRole';

export async function POST() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const svc = createServiceClient();

  // Recompute counts from article_reactions in a single query per article
  const { data: rows, error } = await svc
    .from('article_reactions')
    .select('article_id, reaction');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = new Map<string, { good: number; bad: number }>();
  for (const r of (rows || []) as any[]) {
    const id = String(r.article_id);
    const cur = counts.get(id) || { good: 0, bad: 0 };
    if (r.reaction === 'good') cur.good += 1;
    else if (r.reaction === 'bad') cur.bad += 1;
    counts.set(id, cur);
  }

  const upserts = Array.from(counts.entries()).map(([article_id, c]) => ({
    article_id,
    good_count: c.good,
    bad_count: c.bad,
    updated_at: new Date().toISOString(),
  }));

  // Ensure rows exist for articles with zero reactions
  // Optional: could insert zeros for missing ids, but safe to upsert only non-zero entries

  if (upserts.length) {
    const { error: upErr } = await svc.from('article_reaction_counts').upsert(upserts);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: upserts.length });
}


