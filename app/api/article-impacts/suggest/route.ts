import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { suggestAddonImpactsFromText } from '@/lib/ai/impacts';
import * as cheerio from 'cheerio';

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

export async function GET(req: NextRequest) {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const article_id = new URL(req.url).searchParams.get('article_id');
  if (!article_id) return NextResponse.json({ error: 'Missing article_id' }, { status: 400 });

  const supabase = createClient();
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, url, title, summary')
    .eq('id', article_id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const fullText = await fetchFullText(article.url, article.summary || '');
  // Try multiple prompts to increase recall
  let suggestions = await suggestAddonImpactsFromText(`${article.title || ''}\n\n${fullText}`);
  if (!suggestions || suggestions.length === 0) {
    // fallback to title+summary only
    suggestions = await suggestAddonImpactsFromText(`${article.title || ''}\n\n${article.summary || ''}`);
  }

  const mapped = suggestions.map((s) => {
    const cat = (s.category || 'Low').toLowerCase();
    const catMap: Record<string, number> = { low: 2, medium: 3, high: 4, dead: 5, disabled: 5 };
    const severity = catMap[cat] ?? s.severity ?? 3;
    const outCategory = cat === 'dead' ? 'disabled' : cat; // normalize label
    return { addon_name: s.addon_name, category: outCategory, severity };
  });
  return NextResponse.json({ suggestions: mapped });
}


