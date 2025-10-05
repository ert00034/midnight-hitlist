import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import EmailObfuscatedLink from '@/components/EmailObfuscatedLink';

export default function AboutPage() {
  return (
    <div className="pb-16">
      <Navbar />
      <main className="py-10">
        <h1 className="text-3xl font-semibold">About</h1>
        <p className="mt-2 text-slate-300">
          RIP Addons is a lightweight tracker for World of Warcraft addon impacts from the Midnight API/addon changes.
          It curates Wowhead articles and surfaces addon impact severity so authors and players can quickly assess risk.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
            <h2 className="text-xl font-medium">Feedback</h2>
            <p className="mt-3 text-slate-400">
              Have suggestions or found an issue? Email
              {' '}
              <EmailObfuscatedLink className="whitespace-nowrap text-sky-300 hover:underline" />
            </p>
          </section>

          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
            <h2 className="text-xl font-medium">Links</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="https://github.com/ert00034/midnight-hitlist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:underline"
                >
                  GitHub repository
                </Link>
              </li>
            </ul>
          </section>

          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
            <h2 className="text-xl font-medium">WoW Addon: Check your installed addons</h2>
            <p className="mt-3 text-slate-400">
              Install the in-game addon to scan your installed addons and see which are impacted.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-400">
              <li>
                Get the addon from{' '}
                <Link
                  href="https://github.com/ert00034/rip-addons-addon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:underline"
                >
                  github.com/ert00034/rip-addons-addon
                </Link>.
              </li>
              <li>
                Extract to your WoW folder so you have <code>Interface/AddOns/RipAddons/</code>.
              </li>
              <li>
                In-game, run <code>/ripaddons scan</code> (or use the keybinding: RIP Addons: Toggle).
              </li>
            </ul>
          </section>

          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
            <h2 className="text-xl font-medium">Tech & data</h2>
            <p className="mt-3 text-slate-400">
              Built with Next.js 14, TypeScript, Tailwind, and Supabase. Public read access; admin writes via service role on server routes.
              External links attribute to their sources; we store only metadata and do not copy full content.
            </p>
          </section>

          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition md:col-span-2">
            <h2 className="text-xl font-medium">Attribution & disclaimer</h2>
            <p className="mt-3 text-slate-400">
              This project is unofficial and not affiliated with Blizzard Entertainment. Wowhead content remains the property of its owners;
              links open in new tabs to the original articles.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


