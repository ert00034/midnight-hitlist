import Link from 'next/link';
import { MostImpactedGrid } from '@/components/home/MostImpactedGrid';
import { PageTitle } from '@/components/PageTitle';

export default function HomePage() {
  return (
    <div className="pb-16">
      <header className="py-10">
        <PageTitle title="RIP Addons" subtitle={
          (
            <>
              Information here is from the community on addons impacted by the changes to World of Warcrafting coming in the Midnight expansion.
              <br />
              Please <Link href="/suggest" className="underline">suggest a link</Link> if you have something to share!
            </>
          ) as any
        } />
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <Link href="/articles" className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
          <h2 className="text-2xl font-medium">Articles</h2>
          <p className="mt-2 text-slate-400">Browse articles from the community, classified by relevance and severity.</p>
        </Link>
        <Link href="/addons" className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
          <h2 className="text-2xl font-medium">Addons</h2>
          <p className="mt-2 text-slate-400">See overall addon impact and severity rollups.</p>
        </Link>
      </section>
      <div className="mt-8">
        <MostImpactedGrid />
      </div>
    </div>
  );
}


