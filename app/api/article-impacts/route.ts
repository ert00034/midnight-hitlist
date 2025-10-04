import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/serviceRole';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const bodySchema = z.object({
  article_id: z.string().uuid(),
  addon_name: z.string().min(1),
  severity: z.number().int().min(1).max(5),
});

export async function POST(req: NextRequest) {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const svc = createServiceClient();
  const { error } = await svc.from('article_addon_impacts').upsert({
    article_id: parsed.data.article_id,
    addon_name: parsed.data.addon_name,
    severity: parsed.data.severity,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pub = createClient();
  const { data } = await pub.from('article_addon_impacts')
    .select('addon_name, severity')
    .eq('article_id', parsed.data.article_id);
  return NextResponse.json({ impacts: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const article_id = url.searchParams.get('article_id');
  const addon_name = url.searchParams.get('addon_name');
  if (!article_id || !addon_name) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  const svc = createServiceClient();
  const { error } = await svc.from('article_addon_impacts').delete().eq('article_id', article_id).eq('addon_name', addon_name);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const pub = createClient();
  const { data } = await pub.from('article_addon_impacts').select('addon_name, severity').eq('article_id', article_id);
  return NextResponse.json({ impacts: data ?? [] });
}


