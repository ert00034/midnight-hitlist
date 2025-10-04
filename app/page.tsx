import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  return (
    <div className="pb-16">
      <Navbar />
      <header className="py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Midnight Hitlist</h1>
        <p className="mt-2 text-slate-300">A curated list of Wowhead articles and addons impacted by API/addon changes for the Midnight update.</p>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <Link href="/articles" className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
          <h2 className="text-2xl font-medium">Articles</h2>
          <p className="mt-2 text-slate-400">Browse articles from Wowhead classified by relevance and severity.</p>
        </Link>
        <Link href="/addons" className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
          <h2 className="text-2xl font-medium">Addons</h2>
          <p className="mt-2 text-slate-400">See overall addon impact and severity rollups.</p>
        </Link>
      </section>
    </div>
  );
}


