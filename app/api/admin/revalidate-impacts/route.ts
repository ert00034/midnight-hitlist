import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/serviceRole';

export async function POST() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // Refresh reaction counts as part of impacts revalidation
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/reactions-refresh`, { method: 'POST', cache: 'no-store' });
    } catch {}
    revalidateTag('overall-impacts');
  } catch {}
  return NextResponse.json({ ok: true });
}


