import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceRole';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { classifyArticle } from '@/lib/ai/classifier';
import { cookies } from 'next/headers';

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
  return NextResponse.json({ articles });
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
  const icon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';
  const favicon = icon.startsWith('http') ? icon : new URL(icon || '/favicon.ico', url).toString();

  // AI classify relevance and severity
  let severity: number | null = null;
  try {
    const cls = await classifyArticle(`${title}\n\n${description}`);
    severity = cls.related ? cls.severity : 1;
  } catch {}

  const { data, error } = await supabase.from('articles').insert({ url, title, summary: description, favicon, severity }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  return NextResponse.json({ ok: true });
}


