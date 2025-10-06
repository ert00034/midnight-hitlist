import Link from 'next/link';
import { cookies } from 'next/headers';
import { NavbarClient } from './NavbarClient';

export function Navbar() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  const showAdminLink = process.env.NODE_ENV !== 'production' || isAdmin;
  return (
    <nav className="fixed top-0 inset-x-0 z-50 overflow-visible isolate">
      <div className="pointer-events-none absolute inset-0 border-b border-white/10 bg-[#0b1020]/70 backdrop-blur z-0"></div>
      {/* Right fade hint for horizontal scroll */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0b1020] to-transparent z-0"></div>
      <NavbarClient showAdminLink={showAdminLink} />
    </nav>
  );
}


