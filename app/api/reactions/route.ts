import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceRole';


export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const articleId = url.searchParams.get('articleId');
  const mineOnly = url.searchParams.get('mineOnly') === '1';
  if (!articleId) return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });

  const reactorId = cookies().get('mh_reactor_id')?.value || '';
  if (mineOnly && reactorId) {
    const { data: my, error: myErr } = await supabase
      .from('article_reactions')
      .select('*')
      .eq('article_id', articleId)
      .eq('reactor_id', reactorId)
      .maybeSingle();
    if (myErr) return NextResponse.json({ error: myErr.message }, { status: 500 });
    return NextResponse.json({ mine: (my as any)?.reaction || null });
  }

  // Read from cached counts table to minimize reads
  const { data: row, error: countErr } = await supabase
    .from('article_reaction_counts')
    .select('good_count, bad_count')
    .eq('article_id', articleId)
    .maybeSingle();
  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });

  let mine: string | null = null;
  if (reactorId) {
    const { data: my } = await supabase
      .from('article_reactions')
      .select('*')
      .eq('article_id', articleId)
      .eq('reactor_id', reactorId)
      .maybeSingle();
    mine = (my as any)?.reaction || null;
  }
  if (row) {
    const good = Number((row as any)?.good_count || 0);
    const bad = Number((row as any)?.bad_count || 0);
    return NextResponse.json({ good, bad, mine });
  }

  // Fallback: counts row missing; compute from raw reactions (one-time cost)
  const { data: rowsRaw, error: rawErr } = await supabase
    .from('article_reactions')
    .select('reaction')
    .eq('article_id', articleId);
  if (rawErr) return NextResponse.json({ error: rawErr.message }, { status: 500 });
  const good = (rowsRaw || []).filter((r: any) => r.reaction === 'good').length;
  const bad = (rowsRaw || []).filter((r: any) => r.reaction === 'bad').length;
  return NextResponse.json({ good, bad, mine });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  // Robust body parsing: JSON, form-encoded, or query fallback
  let articleId = '';
  let reaction = '';
  try {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const json = await req.json();
      articleId = String((json as any).articleId || '');
      reaction = String((json as any).reaction || '');
    } else {
      // Try text -> JSON or form-encoded
      const text = await req.text();
      if (text && text.trim().startsWith('{')) {
        try {
          const json = JSON.parse(text);
          articleId = String((json as any).articleId || '');
          reaction = String((json as any).reaction || '');
        } catch {}
      }
      if (!articleId || !reaction) {
        const params = new URLSearchParams(text);
        articleId = articleId || String(params.get('articleId') || '');
        reaction = reaction || String(params.get('reaction') || '');
      }
    }
  } catch {}
  if (!articleId || !reaction) {
    const url = new URL(req.url);
    articleId = articleId || String(url.searchParams.get('articleId') || '');
    reaction = reaction || String(url.searchParams.get('reaction') || '');
  }
  reaction = reaction.toLowerCase();
  if (!articleId || !['good', 'bad', 'none'].includes(reaction)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const jar = cookies();
  const existing = jar.get('mh_reactor_id');
  const reactorId = existing?.value || crypto.randomUUID();
  const shouldSetCookie = !existing;

  if (reaction === 'none') {
    const { error } = await supabase
      .from('article_reactions')
      .delete()
      .eq('article_id', articleId)
      .eq('reactor_id', reactorId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('article_reactions')
      .upsert({ article_id: articleId, reactor_id: reactorId, reaction })
      .eq('article_id', articleId)
      .eq('reactor_id', reactorId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update cached counts row
  const pub = createClient();
  const { data: rows, error } = await pub
    .from('article_reactions')
    .select('reaction')
    .eq('article_id', articleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const good = (rows || []).filter((r: any) => r.reaction === 'good').length;
  const bad = (rows || []).filter((r: any) => r.reaction === 'bad').length;
  const { error: upErr } = await supabase
    .from('article_reaction_counts')
    .upsert({ article_id: articleId, good_count: good, bad_count: bad, updated_at: new Date().toISOString() })
    .eq('article_id', articleId);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const res = NextResponse.json({ good, bad, mine: reaction === 'none' ? null : reaction });
  if (shouldSetCookie) {
    res.cookies.set('mh_reactor_id', reactorId, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  return res;
}


