import * as cheerio from 'cheerio';

export function extractWowheadNewsLinks(html: string, baseUrl = 'https://www.wowhead.com/news'): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  // Strategy 1: Any anchor under news list patterns
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).toString();
    } catch {
      abs = href;
    }
    if (abs.startsWith('https://www.wowhead.com/news/')) {
      // normalize by stripping query params/fragments
      const url = new URL(abs);
      url.search = '';
      url.hash = '';
      links.add(url.toString());
    }
  });

  return Array.from(links);
}
