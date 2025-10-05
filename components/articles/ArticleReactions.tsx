'use client';

import { useEffect, useState, useTransition } from 'react';

type Mine = 'good' | 'bad' | null;

export function ArticleReactions({ articleId }: { articleId: string }) {
  const [good, setGood] = useState(0);
  const [bad, setBad] = useState(0);
  const [mine, setMine] = useState<Mine>(null);
  const [justVoted, setJustVoted] = useState<Mine>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reactions?articleId=${encodeURIComponent(articleId)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && !json.error) {
          setGood(Number(json.good || 0));
          setBad(Number(json.bad || 0));
          setMine((json.mine as Mine) ?? null);
        }
      } catch {}
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  function applyOptimistic(nextMine: Mine) {
    setGood((g) => g + (nextMine === 'good' ? 1 : 0) - (mine === 'good' ? 1 : 0));
    setBad((b) => b + (nextMine === 'bad' ? 1 : 0) - (mine === 'bad' ? 1 : 0));
    setMine(nextMine);
  }

  function vote(next: 'good' | 'bad') {
    if (isPending) return;
    const nextMine: Mine = mine === next ? null : next; // toggle off if clicking the same
    applyOptimistic(nextMine);
    setJustVoted(nextMine);
    startTransition(async () => {
      try {
        const res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId, reaction: nextMine ?? 'none' }),
        });
        const json = await res.json();
        if (json && !json.error) {
          setGood(Number(json.good || 0));
          setBad(Number(json.bad || 0));
          setMine((json.mine as Mine) ?? null);
        }
      } catch {
        // On error, refetch to settle to server truth
        try {
          const res = await fetch(`/api/reactions?articleId=${encodeURIComponent(articleId)}`, { cache: 'no-store' });
          const json = await res.json();
          setGood(Number(json.good || 0));
          setBad(Number(json.bad || 0));
          setMine((json.mine as Mine) ?? null);
        } catch {}
      } finally {
        // brief highlight
        setTimeout(() => setJustVoted(null), 400);
      }
    });
  }

  const baseBtn =
    'w-full select-none rounded-md px-2.5 py-1.5 ring-1 ring-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 hover:shadow-glow active:scale-[0.98]';

  const selectedStyles = 'ring-2 ring-indigo-400/40 shadow-glow';

  function tintClass(kind: 'good' | 'bad', count: number): string {
    // Tiered tints that intensify as counts grow
    if (!count || count <= 0) return 'bg-slate-800/60 hover:bg-slate-800 text-slate-200';
    const goodTiers = [
      'bg-emerald-900/30 hover:bg-emerald-900/40 text-slate-200',
      'bg-emerald-900/40 hover:bg-emerald-900/50 text-slate-200',
      'bg-emerald-900/50 hover:bg-emerald-900/60 text-slate-200',
      'bg-emerald-900/60 hover:bg-emerald-900/70 text-slate-200',
    ];
    const badTiers = [
      'bg-rose-900/30 hover:bg-rose-900/40 text-slate-200',
      'bg-rose-900/40 hover:bg-rose-900/50 text-slate-200',
      'bg-rose-900/50 hover:bg-rose-900/60 text-slate-200',
      'bg-rose-900/60 hover:bg-rose-900/70 text-slate-200',
    ];
    const idx = count >= 11 ? 3 : count >= 6 ? 2 : count >= 3 ? 1 : 0;
    return kind === 'good' ? goodTiers[idx] : badTiers[idx];
  }

  return (
    <div className="flex w-24 sm:w-28 flex-col gap-2 text-sm h-full justify-center">
      <button
        aria-pressed={mine === 'good'}
        onClick={() => vote('good')}
        className={[
          baseBtn,
          'min-h-[36px] sm:min-h-[44px] flex-1',
          tintClass('good', good),
          mine === 'good' ? selectedStyles : '',
          justVoted === 'good' ? 'animate-pulse' : '',
        ].join(' ')}
      >
        <span className="inline-flex items-center justify-center gap-1.5">
          <span aria-hidden="true" className="text-2xl sm:text-3xl leading-none">🙂</span>
          {loading ? (
            <span className="h-5 sm:h-6 w-8 sm:w-10 rounded bg-white/10 animate-pulse" />
          ) : (
            <span className="tabular-nums text-slate-200 text-base sm:text-lg">{good}</span>
          )}
        </span>
      </button>
      <button
        aria-pressed={mine === 'bad'}
        onClick={() => vote('bad')}
        className={[
          baseBtn,
          'min-h-[36px] sm:min-h-[44px] flex-1',
          tintClass('bad', bad),
          mine === 'bad' ? selectedStyles : '',
          justVoted === 'bad' ? 'animate-pulse' : '',
        ].join(' ')}
      >
        <span className="inline-flex items-center justify-center gap-1.5">
          <span aria-hidden="true" className="text-2xl sm:text-3xl leading-none">☹️</span>
          {loading ? (
            <span className="h-5 sm:h-6 w-8 sm:w-10 rounded bg-white/10 animate-pulse" />
          ) : (
            <span className="tabular-nums text-slate-200 text-base sm:text-lg">{bad}</span>
          )}
        </span>
      </button>
    </div>
  );
}


