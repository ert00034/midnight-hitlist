import { Navbar } from '@/components/Navbar';
import { AdminArticleManager } from '@/components/admin/AdminArticleManager';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { cookies } from 'next/headers';

export default function AdminPage() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  return (
    <div className="pb-16">
      <Navbar />
      <h1 className="mt-8 text-3xl font-semibold">Admin</h1>
      <p className="mt-2 text-slate-300">Add or remove Wowhead article links. AI will suggest relevance.</p>
      <div className="mt-6">{isAdmin ? <AdminArticleManager /> : <AdminLogin />}</div>
    </div>
  );
}


