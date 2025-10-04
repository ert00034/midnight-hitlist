import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 -mx-4 mb-4 border-b border-white/10 bg-[#0b1020]/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-wide">
          rip addons
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/articles">Articles</Link>
          <Link href="/addons">Addons</Link>
          <Link href="/about">About</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </nav>
  );
}


