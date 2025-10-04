import { NextResponse } from 'next/server';
import { classifyArticle } from '@/lib/ai/classifier';
import { cookies } from 'next/headers';

// In a real implementation we'd crawl/search Wowhead. For safety, accept a small curated set
// or return empty if not configured.
const curatedCandidates: { url: string; title: string }[] = [
  { url: 'https://www.wowhead.com/news', title: 'Wowhead News' },
];

export async function GET() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ suggestions: [] }, { status: 401 });
  try {
    const results = await Promise.all(
      curatedCandidates.map(async (c) => {
        const cls = await classifyArticle(`${c.title} ${c.url}`);
        if (!cls.related) return null;
        return { ...c, severity: cls.severity };
      })
    );
    const suggestions = results.filter(Boolean);
    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json({ suggestions: [] });
  }
}


