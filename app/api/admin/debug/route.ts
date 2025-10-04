import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  let tablesOk = false;
  let dbError: string | undefined;
  try {
    const supabase = createClient();
    const { error } = await supabase.from('articles').select('id', { count: 'estimated', head: true });
    tablesOk = !error;
    if (error) dbError = error.message;
  } catch (e: any) {
    dbError = e?.message || 'unknown error';
  }

  return NextResponse.json({ hasUrl, hasAnon, hasService, tablesOk, dbError });
}


