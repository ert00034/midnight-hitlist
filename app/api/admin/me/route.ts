import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  return NextResponse.json({ isAdmin });
}


