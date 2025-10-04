import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
      headers: {
        get: (name: string) => headers().get(name) ?? undefined,
      },
    }
  );
}


