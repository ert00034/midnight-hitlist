import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceRole';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { classifyArticle } from '@/lib/ai/classifier';
import { cookies } from 'next/headers';
import { suggestAddonImpactsFromText } from '@/lib/ai/impacts';
import { summarizeArticleText } from '@/lib/ai/summarizer';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*, article_addon_impacts(addon_name, severity)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const articles = (data ?? []).map((row: any) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    summary: row.summary,
    favicon: row.favicon,
    severity: row.severity,
    created_at: row.created_at,
    impacts: (row.article_addon_impacts ?? []).map((i: any) => ({ addon_name: i.addon_name, severity: i.severity }))
  }));
  return NextResponse.json({ articles, count: articles.length });
}

const bodySchema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest) {
  // use service client for writes to bypass RLS for admin actions
  const supabase = createServiceClient();
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  const url = parsed.data.url;

  // fetch page metadata
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || url;
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
  function ddgIcon(u: string): string {
    try { const host = new URL(u).hostname; return `https://icons.duckduckgo.com/ip3/${host}.ico`; } catch { return ''; }
  }
  function parseSizeVal(sizes: string | undefined | null): number {
    if (!sizes) return 0;
    const m = String(sizes).match(/(\d{2,4})x(\d{2,4})/);
    if (!m) return 0;
    const a = parseInt(m[1] || '0', 10);
    const b = parseInt(m[2] || '0', 10);
    return Math.max(a || 0, b || 0);
  }
  function scoreIcon(rel: string, type: string | undefined, size: number): number {
    const r = (rel || '').toLowerCase();
    const t = (type || '').toLowerCase();
    let score = 0;
    if (r.includes('shortcut')) score += 2;
    if (r.includes('icon')) score += 2;
    if (r.includes('apple-touch')) score += 1;
    if (t.includes('png')) score += 2;
    if (t.includes('x-icon') || t.includes('ico') || t.includes('vnd.microsoft.icon')) score += 2;
    if (t.includes('svg')) score += 0; // avoid preferring svg due to rendering variability
    // prefer reasonable sizes (close to 32-64)
    if (size >= 24 && size <= 128) score += 1;
    if (size >= 32 && size <= 64) score += 1;
    return score * 1000 + Math.min(512, size); // tie-break by size
  }
  const linkEls = $('link[rel]').toArray();
  const iconLinks = linkEls
    .map((el) => {
      const rel = String($(el).attr('rel') || '');
      if (!/icon/i.test(rel)) return null;
      const href = String($(el).attr('href') || '').trim();
      if (!href) return null;
      const type = $(el).attr('type');
      const sizes = $(el).attr('sizes');
      const sizeVal = parseSizeVal(typeof sizes === 'string' ? sizes : undefined);
      const abs = href.startsWith('http') ? href : new URL(href, url).toString();
      return { abs, rel, type: type ? String(type) : '', size: sizeVal, score: scoreIcon(rel, type as any, sizeVal) };
    })
    .filter(Boolean) as { abs: string; rel: string; type: string; size: number; score: number }[];
  iconLinks.sort((a, b) => b.score - a.score);
  const pickedIcon = iconLinks.length ? iconLinks[0].abs : '';
  const favicon = pickedIcon || ddgIcon(url) || new URL('/favicon.ico', url).toString();

  // AI classify relevance and severity
  let severity: number | null = null;
  let summaryText: string | null = null;
  try {
    const cls = await classifyArticle(`${title}\n\n${description}`);
    severity = cls.related ? cls.severity : 1;
  } catch {}

  try {
    summaryText = await summarizeArticleText(`${title}\n\n${description}`);
  } catch {}

  const { data, error } = await supabase.from('articles').insert({ url, title, summary: summaryText || description, favicon, severity }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Suggest addon impacts (best-effort)
  try {
    const suggestions = await suggestAddonImpactsFromText(`${title}\n\n${description}`);
    if (suggestions.length) {
      const rows = suggestions.map((s) => ({ article_id: data.id, addon_name: s.addon_name, severity: s.severity }));
      await supabase.from('article_addon_impacts').upsert(rows);
    }
  } catch {}
  // Invalidate cached overall impacts after adding an article
  try { revalidateTag('overall-impacts'); } catch {}
  return NextResponse.json({ article: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServiceClient();
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try { revalidateTag('overall-impacts'); } catch {}
  return NextResponse.json({ ok: true });
}


