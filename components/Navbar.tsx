import Link from 'next/link';
import { cookies } from 'next/headers';

export function Navbar() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  const showAdminLink = process.env.NODE_ENV !== 'production' || isAdmin;
  return (
    <nav className="sticky top-0 z-50 mb-4 relative">
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 border-b border-white/10 bg-[#0b1020]/70 backdrop-blur"></div>
      <div className="relative z-10 mx-auto flex max-w-6xl items-center px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-lg font-semibold tracking-wide text-slate-100 no-underline ring-1 ring-transparent transition hover:bg-white/5 hover:text-slate-100 hover:no-underline hover:ring-white/15 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:translate-y-px"
        >
          <span aria-hidden="true">💀</span>
          <span>RIP Addons</span>
        </Link>
        <div className="ml-4 flex-1 min-w-0">
          <div className="flex items-center gap-6 md:justify-end overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch]">
            <Link href="/articles" className="no-underline hover:no-underline">Articles</Link>
            <Link href="/addons" prefetch={false} className="no-underline hover:no-underline">Addons</Link>
            <Link href="/suggest" className="no-underline hover:no-underline">Suggest</Link>
            <Link href="/about" className="no-underline hover:no-underline">About</Link>
            {showAdminLink && (
              <Link href="/admin" className="no-underline hover:no-underline">Admin</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


