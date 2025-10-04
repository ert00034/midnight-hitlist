import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let incomingPassword: string | undefined;
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await req.json();
      incomingPassword = body?.password;
    } catch {
      // fall through
    }
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const form = await req.formData();
      incomingPassword = String(form.get('password') || '');
    } catch {
      // fall through
    }
  }

  if (!incomingPassword) {
    // final fallback: query param (dev convenience)
    incomingPassword = new URL(req.url).searchParams.get('password') || undefined;
  }

  if (!incomingPassword || incomingPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('mh_admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
  });
  return res;
}


