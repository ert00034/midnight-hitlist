import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

export async function POST() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    revalidateTag('overall-impacts');
  } catch {}
  return NextResponse.json({ ok: true });
}


