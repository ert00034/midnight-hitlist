'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function ArticleToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const recommendedOnly = params.get('recommended') !== '0';

  const toggle = () => {
    const next = new URLSearchParams(params.toString());
    if (recommendedOnly) {
      next.set('recommended', '0');
    } else {
      next.set('recommended', '1');
    }
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="text-sm text-slate-300">
        Showing: {recommendedOnly ? 'Recommended' : 'All'}
      </div>
      <button
        onClick={toggle}
        className="shrink-0 rounded bg-slate-800 px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-slate-700"
      >
        {recommendedOnly ? 'Show All' : 'Show Recommended'}
      </button>
    </div>
  );
}


