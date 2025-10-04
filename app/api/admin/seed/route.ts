import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/serviceRole';

export async function POST() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const svc = createServiceClient();
  const url = `https://www.wowhead.com/news/test-${Date.now()}`;
  const { data, error } = await svc
    .from('articles')
    .upsert({ url, title: 'Test Article', summary: 'Seeded row', favicon: '', severity: 1 }, { onConflict: 'url' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try { revalidateTag('overall-impacts'); } catch {}
  return NextResponse.json({ article: data });
}


