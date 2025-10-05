import Link from 'next/link';
import EmailObfuscatedLink from '@/components/EmailObfuscatedLink';
import { PageTitle } from '@/components/PageTitle';

export default function AboutPage() {
  return (
    <div className="pb-16">
      <main className="py-10">
        <PageTitle title="About" />
        <p className="mt-2 text-slate-300">
          RIP Addons is a lightweight tracker for World of Warcraft addon impacts from the Midnight API/addon changes.
          It curates Wowhead articles and surfaces addon impact severity so authors and players can quickly assess risk.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
            <h2 className="text-xl font-medium">Feedback</h2>
            <p className="mt-3 text-slate-400">
              Have suggestions or found an issue for this website or the addon? Email
              {' '}
              <EmailObfuscatedLink className="whitespace-nowrap text-sky-300" />
            </p>
          </section>

          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
            <h2 className="text-xl font-medium">Links</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <li>
                <Link
                  href="https://github.com/ert00034/midnight-hitlist"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub repository"
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900/40 px-4 py-2 text-slate-200 ring-1 ring-white/10 shadow-sm transition hover:bg-slate-900/60 hover:text-white hover:ring-midnight-400/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midnight-400/60"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.082-.73.082-.73 1.205.086 1.84 1.237 1.84 1.237 1.07 1.833 2.807 1.304 3.492.997.108-.776.42-1.305.763-1.606-2.665-.304-5.467-1.333-5.467-5.93 0-1.31.468-2.38 1.236-3.22-.123-.303-.536-1.523.116-3.176 0 0 1.008-.323 3.301 1.23.957-.266 1.985-.399 3.005-.404 1.02.005 2.048.138 3.006.404 2.292-1.553 3.298-1.23 3.298-1.23.653 1.653.24 2.873.118 3.176.77.84 1.234 1.91 1.234 3.22 0 4.61-2.807 5.624-5.48 5.922.431.37.816 1.104.816 2.224 0 1.604-.015 2.896-.015 3.286 0 .32.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.63-5.37-12-12-12z"
                    />
                  </svg>
                  <span>Contribute on GitHub</span>
                </Link>
              </li>
              <li>
                <Link
                  href="https://buymeacoffee.com/ripaddons"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Support on Buy Me a Coffee"
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900/40 px-4 py-2 text-slate-200 ring-1 ring-white/10 shadow-sm transition hover:bg-slate-900/60 hover:text-white hover:ring-midnight-400/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midnight-400/60"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4 7a1 1 0 011-1h11a3 3 0 110 6h-.382A5.002 5.002 0 0113 17H8a5.002 5.002 0 01-2.618-5H5a1 1 0 01-1-1V7zm13 0v4h1a2 2 0 000-4h-1zM4 18.5A1.5 1.5 0 015.5 17h9a1.5 1.5 0 010 3h-9A1.5 1.5 0 014 18.5z"
                    />
                  </svg>
                  <span>Buy Me a Coffee</span>
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
                In-game, run <code>/ripaddons</code> to print to chat or <code>/ripaddons show</code> to open a window.
              </li>
            </ul>
          </section>

          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition">
            <h2 className="text-xl font-medium">Tech & data</h2>
            <p className="mt-3 text-slate-400">
              Built with Next.js 14, TypeScript, Tailwind, and Supabase.
              External links attribute to their sources; we store only metadata and do not copy full content.
            </p>
          </section>

          <section className="rounded-xl bg-slate-900/40 p-6 ring-1 ring-white/10 hover:shadow-glow transition md:col-span-2">
            <h2 className="text-xl font-medium">Attribution & disclaimer</h2>
            <p className="mt-3 text-slate-400">
              This project is unofficial and not affiliated with Blizzard Entertainment. Wowhead and other content remains the property of their owners;
              links open in new tabs to the original content.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


