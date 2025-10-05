import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceRole';


export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const articleId = url.searchParams.get('articleId');
  if (!articleId) return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });

  const reactorId = cookies().get('mh_reactor_id')?.value || '';

  const [{ data: counts, error: countErr }, { data: my, error: myErr }] = await Promise.all([
    supabase
      .from('article_reactions')
      .select('reaction', { count: 'exact', head: false })
      .eq('article_id', articleId),
    reactorId
      ? supabase
          .from('article_reactions')
          .select('*')
          .eq('article_id', articleId)
          .eq('reactor_id', reactorId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
  ]);

  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });
  const good = (counts || []).filter((r: any) => r.reaction === 'good').length;
  const bad = (counts || []).filter((r: any) => r.reaction === 'bad').length;
  return NextResponse.json({ good, bad, mine: my?.reaction || null });
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

  // Return updated counts and mine
  const { data: rows, error } = await createClient()
    .from('article_reactions')
    .select('reaction')
    .eq('article_id', articleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const good = (rows || []).filter((r: any) => r.reaction === 'good').length;
  const bad = (rows || []).filter((r: any) => r.reaction === 'bad').length;
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


