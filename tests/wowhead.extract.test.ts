import { describe, it, expect } from 'vitest';
import { extractWowheadNewsLinks } from '@/lib/scrape/wowhead';

describe('extractWowheadNewsLinks', () => {
  it('extracts normalized news links from sample html', () => {
    const html = `
      <a href="/news/some-article-12345">Article</a>
      <a href="https://www.wowhead.com/news/another-article-67890?utm=foo#bar">Other</a>
      <a href="/guides/not-news">Not news</a>
    `;
    const links = extractWowheadNewsLinks(html);
    expect(links.some(l => l.startsWith('https://www.wowhead.com/news/some-article-12345'))).toBe(true);
    expect(links.some(l => l === 'https://www.wowhead.com/news/another-article-67890')).toBe(true);
    expect(links.some(l => l.includes('/guides/'))).toBe(false);
  });

  it('live fetch (optional) finds at least one link', async () => {
    if (!process.env.WOWHEAD_LIVE_TEST) return;
    const res = await fetch('https://www.wowhead.com/news', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const links = extractWowheadNewsLinks(html);
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);
  }, 20000);
});
