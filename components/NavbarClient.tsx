"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavbarClientProps = {
  showAdminLink: boolean;
};

export function NavbarClient({ showAdminLink }: NavbarClientProps) {
  const pathname = usePathname() || '/';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const brandBase = "relative z-10 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-lg font-semibold tracking-wide text-slate-100 no-underline ring-1 ring-transparent transition hover:bg-white/5 hover:text-slate-100 hover:no-underline hover:ring-white/15 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:translate-y-px";
  const brandActive = "bg-white/5 ring-white/20 shadow-glow";

  const linkBase = "relative z-10 no-underline hover:no-underline px-2 py-1.5 rounded-md transition ring-1 ring-transparent text-slate-200 hover:text-slate-100 hover:bg-white/5 hover:ring-white/15";
  const linkActive = "text-white bg-white/5 ring-white/20 shadow-glow";

  const ActiveGlow = () => (
    <span className="pointer-events-none absolute -inset-x-3 -inset-y-3 -z-[1] rounded-lg bg-gradient-to-r from-indigo-500/25 via-cyan-400/20 to-indigo-500/25 blur-lg"></span>
  );

  return (
    <div className="relative z-10 mx-auto flex max-w-6xl items-center px-4 overflow-visible">
      <Link
        href="/"
        className={[brandBase, isActive('/') ? brandActive : ''].filter(Boolean).join(' ')}
        aria-label="RIP Addons home"
      >
        <span aria-hidden="true">💀</span>
        <span className="hidden sm:inline">RIP Addons</span>
        {isActive('/') && <ActiveGlow />}
      </Link>
      <div className="ml-4 flex-1 min-w-0">
        <div className="relative flex items-center gap-6 md:justify-end overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch] overscroll-x-contain scrollbar-none pr-6 py-2">
          <Link href="/articles" className={[linkBase, isActive('/articles') ? linkActive : ''].filter(Boolean).join(' ')}>
            Articles
            {isActive('/articles') && <ActiveGlow />}
          </Link>
          <Link href="/addons" prefetch={false} className={[linkBase, isActive('/addons') ? linkActive : ''].filter(Boolean).join(' ')}>
            Addons
            {isActive('/addons') && <ActiveGlow />}
          </Link>
          <Link href="/suggest" className={[linkBase, isActive('/suggest') ? linkActive : ''].filter(Boolean).join(' ')}>
            Suggest
            {isActive('/suggest') && <ActiveGlow />}
          </Link>
          <Link href="/about" className={[linkBase, isActive('/about') ? linkActive : ''].filter(Boolean).join(' ')}>
            About
            {isActive('/about') && <ActiveGlow />}
          </Link>
          {showAdminLink && (
            <Link href="/admin" className={[linkBase, isActive('/admin') ? linkActive : ''].filter(Boolean).join(' ')}>
              Admin
              {isActive('/admin') && <ActiveGlow />}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}


