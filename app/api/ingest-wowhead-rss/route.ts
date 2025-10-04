import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/serviceRole';
import { XMLParser } from 'fast-xml-parser';
import { classifyArticle } from '@/lib/ai/classifier';
import * as cheerio from 'cheerio';
import { extractWowheadNewsLinks } from '@/lib/scrape/wowhead';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const t0 = Date.now();
  const feedUrl = 'https://www.wowhead.com/blue-tracker?rss';
  const res = await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const parsed = parser.parse(xml);
  let items: any[] = [...(parsed?.rss?.channel?.item || [])];

  // Also scrape the Wowhead News page as a practical feed replacement
  try {
    const newsUrl = 'https://www.wowhead.com/news';
    const newsRes = await fetch(newsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const newsHtml = await newsRes.text();
    const links = extractWowheadNewsLinks(newsHtml, newsUrl);
    const newsItems = links.map((link) => ({ link, title: '', description: '' }));
    items = items.concat(newsItems);
  } catch {}
  const svc = createServiceClient();
  const inserted: any[] = [];
  const errors: string[] = [];

  // Options via JSON body: { limit?: number, strictness?: 'low'|'medium'|'high', dryRun?: boolean }
  let limit = 20;
  let strictness: 'low'|'medium'|'high' = 'medium';
  let dryRun = false;
  let concurrency = 5;
  let selected: { url: string; title?: string; summary?: string; severity?: number }[] | undefined;
  try {
    const body = await req.json();
    if (Number.isFinite(body?.limit)) limit = Math.max(1, Math.min(100, Number(body.limit)));
    if (['low','medium','high'].includes(body?.strictness)) strictness = body.strictness;
    if (typeof body?.dryRun === 'boolean') dryRun = body.dryRun;
    if (Number.isFinite(body?.concurrency)) concurrency = Math.max(1, Math.min(10, Number(body.concurrency)));
    if (Array.isArray(body?.selected)) selected = body.selected;
  } catch {}

  const slice = items.slice(0, limit);
  const preview: any[] = [];

  const minSev = strictness === 'high' ? 4 : strictness === 'medium' ? 3 : 1;

  // Helper: concurrency mapper
  async function mapWithConcurrency<T, R>(arr: T[], limit: number, fn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(arr.length) as any;
    let idx = 0;
    const workers: Promise<void>[] = [];
    async function worker() {
      while (true) {
        const current = idx++;
        if (current >= arr.length) return;
        results[current] = await fn(arr[current], current);
      }
    }
    for (let i = 0; i < Math.min(limit, arr.length); i++) workers.push(worker());
    await Promise.all(workers);
    return results;
  }

  // Helper: AI with timeout
  async function classifyWithTimeout(payload: string, ms = 12000) {
    return await Promise.race([
      classifyArticle(payload),
      new Promise((resolve) => setTimeout(() => resolve({ related: false, severity: 1, reason: 'timeout' }), ms))
    ]) as any;
  }

  // Helper: fetch full text with timeout
  async function fetchFullText(url: string, fallback: string, ms = 8000): Promise<string> {
    try {
      const resp = await Promise.race([
        fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('fetch-timeout')), ms)),
      ]) as Response;
      const html = await resp.text();
      const $ = cheerio.load(html);
      const candidates: string[] = [];
      $('article, .news-article, #news-article, #main, .content, .content-block, .post, .post-content').each((_, el) => {
        const text = $(el).text();
        if (text && text.trim().length > 100) candidates.push(text.trim());
      });
      const bodyText = candidates.join('\n\n') || $('meta[name="description"]').attr('content') || fallback || '';
      return bodyText.slice(0, 6000);
    } catch {
      return fallback;
    }
  }

  const t1 = Date.now();
  const classified = await mapWithConcurrency(slice, concurrency, async (it) => {
    const url: string = it?.link;
    const title: string = it?.title || url;
    const description: string = it?.description || '';
    if (!url) return null;
    try {
      const fullText = await fetchFullText(url, description);
      const cls = await classifyWithTimeout(`${title}\n\n${fullText}`);
      const severity = Number(cls?.severity || 1);
      const related = !!cls?.related;
      const include = related && severity >= minSev;
      const reason = String(cls?.reason || (related ? 'below-threshold' : 'not-related'));
      return include ? { url, title, description: fullText, severity, reason } : { url, title, severity, reason, excluded: true } as any;
    } catch (e: any) {
      return { url, title, severity: 1, reason: e?.message || 'error', excluded: true } as any;
    }
  });
  const valid = (classified.filter(Boolean) as any[]);
  let candidates = valid.filter((v) => !v.excluded) as { url: string; title: string; description: string; severity: number; reason?: string }[];
  const rejected = valid.filter((v) => v.excluded).map((r) => ({ url: r.url, title: r.title, severity: r.severity, reason: r.reason })) as { url: string; title: string; severity: number; reason?: string }[];
  const classifyMs = Date.now() - t1;

  // Dedupe NA/EU duplicates: group by normalized title slug; prefer /us/ in URL when present
  function slugifyTitle(t: string, url?: string) {
    const base = (t || '').trim();
    if (base) return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
    // Fallback to last part of URL path
    try {
      const u = new URL(url || '');
      return u.pathname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
    } catch { return Math.random().toString(36).slice(2, 10); }
  }
  const byTitle = new Map<string, { url: string; title: string; description: string; severity: number; reason?: string }>();
  for (const c of candidates) {
    const key = slugifyTitle(c.title, c.url);
    const prev = byTitle.get(key);
    if (!prev) {
      byTitle.set(key, c);
      continue;
    }
    const preferCurrent = /\/blue-tracker\/topic\/us\//.test(c.url) && !/\/blue-tracker\/topic\/us\//.test(prev.url);
    if (preferCurrent) byTitle.set(key, c);
  }
  candidates = Array.from(byTitle.values());

  if (dryRun) {
    const preview = candidates.map((c) => ({ url: c.url, title: c.title, summary: c.description, severity: c.severity, reason: c.reason }));
    return NextResponse.json({ preview, rejected, count: preview.length, errors, timings: { totalMs: Date.now() - t0, classifyMs } });
  }

  const t2 = Date.now();
  const toInsert = Array.isArray(selected) && selected.length
    ? selected.map((s) => ({ url: s.url, title: s.title || '', summary: s.summary || '', severity: Number(s.severity || 1) }))
    : candidates.map((c) => ({ url: c.url, title: c.title, summary: c.description, severity: c.severity }));

  await mapWithConcurrency(toInsert, Math.min(concurrency, 5), async (c) => {
    const { data, error } = await svc
      .from('articles')
      .upsert({ url: c.url, title: c.title, summary: c.summary, favicon: '', severity: c.severity }, { onConflict: 'url' })
      .select('*')
      .single();
    if (error) errors.push(`${c.url}: ${error.message}`);
    else if (data) inserted.push(data);
  });
  const upsertMs = Date.now() - t2;

  try { revalidateTag('overall-impacts'); } catch {}
  return NextResponse.json({ count: inserted.length, articles: inserted, errors, timings: { totalMs: Date.now() - t0, classifyMs, upsertMs } });
}


