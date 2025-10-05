import { Navbar } from '@/components/Navbar';
import { AdminArticleManager } from '@/components/admin/AdminArticleManager';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

export default function AdminPage() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (process.env.NODE_ENV === 'production' && !isAdmin) {
    const h = headers();
    const url = h.get('x-url') || h.get('referer') || '';
    // Fallback parse for query string if available from referer or custom header
    const keyFromEnv = process.env.ADMIN_ACCESS_KEY || '';
    let hasValidKey = false;
    try {
      const u = new URL(url);
      const key = u.searchParams.get('key') || '';
      hasValidKey = !!keyFromEnv && key === keyFromEnv;
    } catch {
      // ignore parse issues
    }
    if (!hasValidKey) {
      notFound();
    }
  }
  return (
    <div className="pb-16">
      <Navbar />
      <h1 className="mt-8 text-3xl font-semibold">Admin</h1>
      <p className="mt-2 text-slate-300">Add or remove Wowhead article links. AI will suggest relevance.</p>
      <div className="mt-6">{isAdmin ? <AdminArticleManager /> : <AdminLogin />}</div>
    </div>
  );
}


