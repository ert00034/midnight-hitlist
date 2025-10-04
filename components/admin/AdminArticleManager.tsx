'use client';

import { useEffect, useState } from 'react';

type Article = {
  id: string;
  url: string;
  title: string | null;
  severity: number | null;
  impacts?: { addon_name: string; severity: number }[];
};

export function AdminArticleManager() {
  const [url, setUrl] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [rssLimit, setRssLimit] = useState(20);
  const [rssStrictness, setRssStrictness] = useState<'low'|'medium'|'high'>('low');
  const [rssPreview, setRssPreview] = useState<any[] | null>(null);
  const [rssRejected, setRssRejected] = useState<any[] | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [subs, setSubs] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [showReviewed, setShowReviewed] = useState(false);

  const isTrustedUrl = (url: string): boolean => {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      if (host === 'youtu.be') return true;
      if (host === 'forums.blizzard.com' || host.endsWith('.forums.blizzard.com')) return true;
      if (host === 'reddit.com' || host.endsWith('.reddit.com')) return true;
      if (host === 'wowhead.com' || host.endsWith('.wowhead.com')) return true;
      if (host === 'youtube.com' || host.endsWith('.youtube.com')) return true;
      return false;
    } catch { return false; }
  };

  const handleUrlClick = (e: any, url: string) => {
    if (!isTrustedUrl(url)) {
      e.preventDefault();
      if (confirm(`are you sure you want to visit ${url}`)) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    fetch('/api/articles').then(async (r) => {
      const data = await r.json();
      if (mounted) {
        setArticles(data.articles ?? []);
        setLoading(false);
      }
    });
    // fetch submissions for admins
    (async () => {
      setSubsLoading(true);
      const r = await fetch('/api/submissions');
      const data = await r.json();
      if (mounted) setSubs(Array.isArray(data.submissions) ? data.submissions : []);
      setSubsLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const add = async () => {
    if (!url.trim()) return;
    setBusy(true);
    const r = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await r.json();
    setArticles((prev) => [data.article, ...prev]);
    setUrl('');
    setBusy(false);
  };

  const remove = async (id: string) => {
    setBusy(true);
    await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setBusy(false);
  };

  const addImpact = async (articleId: string, addon_name: string, severity: number) => {
    setBusy(true);
    const r = await fetch('/api/article-impacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: articleId, addon_name, severity })
    });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) {
      setStatusMsg(`Add impact failed${data?.error ? ': ' + data.error : ''}`);
      setBusy(false);
      return;
    }
    setArticles((prev) => prev.map((a) => a.id === articleId ? { ...a, impacts: data.impacts } : a));
    // force cache revalidation for addons aggregate
    try { await fetch('/api/admin/revalidate-impacts', { method: 'POST' }); } catch {}
    setBusy(false);
  };

  const removeImpact = async (articleId: string, addon_name: string) => {
    setBusy(true);
    const r = await fetch(`/api/article-impacts?article_id=${articleId}&addon_name=${encodeURIComponent(addon_name)}`, { method: 'DELETE' });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) {
      setStatusMsg(`Remove impact failed${data?.error ? ': ' + data.error : ''}`);
      setBusy(false);
      return;
    }
    setArticles((prev) => prev.map((a) => a.id === articleId ? { ...a, impacts: data.impacts } : a));
    try { await fetch('/api/admin/revalidate-impacts', { method: 'POST' }); } catch {}
    setBusy(false);
  };

  const getSuggestions = async () => {
    setBusy(true);
    const r = await fetch('/api/suggest-articles');
    const data = await r.json();
    setSuggestions(data.suggestions ?? []);
    setBusy(false);
  };


  const ingestRss = async () => {
    setBusy(true);
    const r = await fetch('/api/ingest-wowhead-rss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: rssLimit, strictness: rssStrictness, dryRun: true })
    });
    const data = await r.json();
    if (Array.isArray(data.preview)) {
      setRssPreview(data.preview);
      setRssRejected(Array.isArray(data.rejected) ? data.rejected : null);
      const init: Record<string, boolean> = {};
      data.preview.forEach((p: any) => { init[p.url] = true; });
      setSelectedMap(init);
      setStatusMsg(`Preview: ${data.preview.length} candidate(s). Click Confirm to insert.`);
    } else if (data?.error) {
      setStatusMsg(`RSS ingest error: ${data.error}`);
    } else {
      setStatusMsg('RSS preview returned no candidates.');
    }
    setBusy(false);
  };

  const confirmRss = async () => {
    if (!rssPreview || rssPreview.length === 0) return;
    if (!confirm(`Insert ${rssPreview.length} article(s)?`)) return;
    setBusy(true);
    const selected = (rssPreview || []).filter((p) => selectedMap[p.url]).map((p) => ({ url: p.url, title: p.title, summary: p.summary, severity: p.severity }));
    const r = await fetch('/api/ingest-wowhead-rss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: rssLimit, strictness: rssStrictness, dryRun: false, selected })
    });
    const data = await r.json();
    if (Array.isArray(data.articles)) {
      setArticles((prev) => [...data.articles, ...prev]);
      setStatusMsg(`Inserted ${data.count ?? data.articles.length} article(s).`);
      setRssPreview(null);
      setRssRejected(null);
      setSelectedMap({});
    } else if (data?.error) {
      setStatusMsg(`RSS ingest error: ${data.error}`);
    }
    setBusy(false);
  };

  const clearAll = async () => {
    if (!confirm('Delete all articles? This cannot be undone.')) return;
    setBusy(true);
    const r = await fetch('/api/admin/clear', { method: 'POST' });
    const data = await r.json();
    setArticles([]);
    setStatusMsg(`Deleted ${data.count ?? 0} article(s).`);
    setBusy(false);
  };

  const reviewSubmission = async (id: string, action: 'approve'|'discard') => {
    setBusy(true);
    const r = await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    const ok = r.ok;
    // Refresh lists
    const s = await fetch('/api/submissions').then((x)=>x.json()).catch(()=>({ submissions: [] }));
    setSubs(Array.isArray(s.submissions) ? s.submissions : []);
    if (ok && action === 'approve') {
      const arts = await fetch('/api/articles').then((x)=>x.json()).catch(()=>({ articles: [] }));
      setArticles(Array.isArray(arts.articles) ? arts.articles : []);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-900/40 p-4 ring-1 ring-white/10">
        <label className="block text-sm text-slate-300">Wowhead Article URL</label>
        <div className="mt-2 flex gap-3">
          <input
            className="w-1/2 rounded bg-slate-800 px-3 py-2 text-slate-100 ring-1 ring-white/10 focus:outline-none focus:ring-sky-400"
            placeholder="https://www.wowhead.com/news/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={add} disabled={busy} className="rounded bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400 disabled:opacity-50">Add</button>
          <button onClick={getSuggestions} disabled={busy} className="rounded bg-purple-500 px-4 py-2 font-medium text-white hover:bg-purple-400 disabled:opacity-50">Suggest</button>
          <div className="flex items-center gap-2">
            <input type="number" className="w-20 rounded bg-slate-800 px-2 py-1 text-sm ring-1 ring-white/10" value={rssLimit} onChange={(e) => setRssLimit(Number(e.target.value) || 1)} />
            <div className="flex flex-col">
              <label className="text-xs text-slate-400">Strictness</label>
              <select className="rounded bg-slate-800 px-2 py-1 text-sm ring-1 ring-white/10" value={rssStrictness} onChange={(e) => setRssStrictness(e.target.value as any)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button onClick={ingestRss} disabled={busy} className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Preview RSS</button>
            <button onClick={async ()=>{ setBusy(true); await fetch('/api/admin/revalidate-impacts', { method: 'POST' }); setBusy(false); }} disabled={busy} className="rounded bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">Refresh Addons</button>
            {rssPreview && rssPreview.length > 0 && (
              <button onClick={confirmRss} disabled={busy} className="rounded bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50">Confirm Insert</button>
            )}
          </div>
          <button onClick={clearAll} disabled={busy} className="rounded bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50">Delete All</button>
        </div>
        {statusMsg && <div className="mt-2 text-sm text-sky-300">{statusMsg}</div>}
        {rssPreview && (
          <div className="mt-3 max-h-48 overflow-auto rounded bg-slate-900/50 p-3 text-sm ring-1 ring-white/10">
            <div className="mb-2 flex items-center gap-2">
              <button onClick={() => {
                const all: Record<string, boolean> = {}; (rssPreview||[]).forEach((p:any)=>all[p.url]=false); setSelectedMap(all);
              }} className="rounded bg-slate-800 px-2 py-1 text-xs ring-1 ring-white/10">Uncheck all</button>
            </div>
            {rssPreview.map((p) => (
              <label key={p.url} className="flex items-center gap-2 truncate text-slate-300">
                <input type="checkbox" checked={!!selectedMap[p.url]} onChange={(e) => setSelectedMap((m) => ({ ...m, [p.url]: e.target.checked }))} />
                <span className="truncate">{p.title}</span>
                <span className="text-slate-500">({p.severity})</span>
              </label>
            ))}
          </div>
        )}
        {rssRejected && (
          <div className="mt-2">
            <button onClick={() => setShowRejected((v) => !v)} className="text-xs text-slate-300 underline">{showRejected ? 'Hide' : 'Show'} disqualified results</button>
            {showRejected && (
              <div className="mt-2 max-h-40 overflow-auto rounded bg-slate-900/50 p-3 text-xs ring-1 ring-white/10">
                {rssRejected.map((p) => (
                  <div key={p.url} className="truncate text-slate-400">{p.title} <span className="text-slate-500">({p.severity})</span> — {p.reason}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium">Articles</h3>
        {loading ? (
          <div className="mt-3 text-slate-400">Loading...</div>
        ) : (
          <ul className="mt-3 space-y-3">
            {articles.map((a) => (
              <li key={a.id} className="space-y-3 rounded bg-slate-900/40 p-3 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium truncate max-w-[28ch]" title={a.title ?? a.url}>{a.title ?? a.url}</div>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" onClick={(e)=>handleUrlClick(e, a.url)} className="text-sm text-slate-400 underline-offset-2 hover:underline truncate max-w-[32ch] inline-block align-top" title={a.url}>{a.url}</a>
                  </div>
                  <button onClick={() => remove(a.id)} disabled={busy} className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50">Delete</button>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span>Addon impacts</span>
                    <SuggestImpactsButton articleId={a.id} onApply={(rows) => rows.forEach((r:any)=>addImpact(a.id, r.addon_name, r.severity))} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(!a.impacts || a.impacts.length === 0) && (
                      <div className="text-xs text-slate-400">No impacts yet.</div>
                    )}
                    {(a.impacts ?? []).map((i) => (
                      <button key={i.addon_name} onClick={() => removeImpact(a.id, i.addon_name)} className="group inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs ring-1 ring-white/10">
                        {i.addon_name}
                        <span className="rounded bg-slate-700 px-1 text-[10px]">{i.severity}</span>
                        <span className="text-slate-400 group-hover:text-red-400">×</span>
                      </button>
                    ))}
                  </div>
                  <ImpactAdder onAdd={(name, sev) => addImpact(a.id, name, sev)} />
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Submissions</h3>
            <button onClick={() => setShowReviewed((v) => !v)} className="rounded bg-slate-800 px-2 py-1 text-xs ring-1 ring-white/10 hover:bg-slate-700">
              {showReviewed ? 'Hide reviewed' : 'Show reviewed'}
            </button>
          </div>
          {subsLoading ? (
            <div className="mt-3 text-slate-400">Loading...</div>
          ) : subs.length === 0 ? (
            <div className="mt-3 text-slate-400">No submissions.</div>
          ) : (
            <ul className="mt-3 space-y-3">
              {(showReviewed ? subs : subs.filter((s:any)=>s.status !== 'reviewed')).map((s) => (
                <li key={s.id} className="space-y-2 rounded bg-slate-900/40 p-3 ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium truncate max-w-[28ch]" title={s.title || s.url}>{s.title ?? s.url}</div>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={(e)=>handleUrlClick(e, s.url)} className="text-sm text-slate-400 underline-offset-2 hover:underline truncate max-w-[32ch] inline-block align-top" title={s.url}>{s.url}</a>
                    </div>
                    <div className="text-xs">
                      <span className="rounded bg-slate-800 px-2 py-0.5 ring-1 ring-white/10">{s.status}</span>
                    </div>
                  </div>
                  {s.notes && <div className="text-sm text-slate-300">{s.notes}</div>}
                  <div className="flex flex-wrap items-center gap-2">
                    {(s.addons || []).map((i:any) => (
                      <span key={i.addon_name} className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs ring-1 ring-white/10">
                        {i.addon_name}
                        <span className="rounded bg-slate-700 px-1 text-[10px]">{i.severity}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => reviewSubmission(s.id, 'approve')} disabled={busy || s.status !== 'pending'} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500 disabled:opacity-50">Approve</button>
                    <button onClick={() => reviewSubmission(s.id, 'discard')} disabled={busy || s.status !== 'pending'} className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500 disabled:opacity-50">Discard</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium">AI Suggestions</h3>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s, idx) => (
              <li key={idx} className="flex items-center justify-between rounded bg-slate-900/40 p-3 ring-1 ring-white/10">
                <div>
                  <div className="font-medium">{s.title ?? s.url}</div>
                  <div className="text-sm text-slate-400">{s.url}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ImpactAdder({ onAdd }: { onAdd: (name: string, severity: number) => void }) {
  const [name, setName] = useState('');
  const [sev, setSev] = useState(3);
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/overall-impacts');
        const data = await r.json();
        if (!mounted) return;
        const rawNames: string[] = Array.isArray(data.impacts)
          ? (data.impacts as any[])
              .map((x: any) => String(x.addon_name || '').trim())
              .filter((s: string) => s.length > 0)
          : [];
        const names: string[] = Array.from(new Set<string>(rawNames));
        names.sort((a: string, b: string) => a.localeCompare(b));
        setOptions(names);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        placeholder="Addon name"
        className="w-48 rounded bg-slate-800 px-2 py-1 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-sky-400"
        value={name}
        onChange={(e) => setName(e.target.value)}
        list="admin-addon-names"
      />
      <datalist id="admin-addon-names">
        {options.map((n) => <option key={n} value={n} />)}
      </datalist>
      <select
        className="rounded bg-slate-800 px-2 py-1 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-sky-400"
        value={sev}
        onChange={(e) => setSev(Number(e.target.value))}
      >
        <option value={0}>Safe</option>
        <option value={1}>Low</option>
        <option value={2}>Moderate</option>
        <option value={3}>Notable</option>
        <option value={4}>High</option>
        <option value={5}>Critical</option>
      </select>
      <button
        className="rounded bg-sky-600 px-2 py-1 text-sm text-white hover:bg-sky-500"
        onClick={() => name && onAdd(name, sev)}
      >Add impact</button>
    </div>
  );
}

function SuggestImpactsButton({ articleId, onApply }: { articleId: string; onApply: (rows: { addon_name: string; severity: number }[]) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ addon_name: string; category: string; severity: number }[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const fetchSuggestions = async () => {
    setLoading(true);
    const r = await fetch(`/api/article-impacts/suggest?article_id=${articleId}`);
    const data = await r.json();
    const rows = Array.isArray(data.suggestions) ? data.suggestions : [];
    setItems(rows);
    const init: Record<string, boolean> = {};
    rows.forEach((x: any) => { init[x.addon_name] = true; });
    setSelected(init);
    setLoading(false);
  };

  const apply = () => {
    const rows = items.filter((x) => selected[x.addon_name]).map((x) => ({ addon_name: x.addon_name, severity: x.severity }));
    onApply(rows);
    setOpen(false);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button onClick={() => { setOpen((v) => !v); if (!open) fetchSuggestions(); }} className="rounded bg-slate-800 px-2 py-1 text-xs ring-1 ring-white/10">Suggest</button>
      {open && (
        <div className="absolute z-10 mt-2 max-h-64 w-96 overflow-auto rounded-lg bg-slate-900 p-3 text-xs ring-1 ring-white/10">
          {loading ? (
            <div className="text-slate-400">Loading suggestions...</div>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2">
                <button onClick={() => { const all: Record<string, boolean> = {}; items.forEach((i)=>all[i.addon_name]=false); setSelected(all); }} className="rounded bg-slate-800 px-2 py-1 ring-1 ring-white/10">Uncheck all</button>
                <button onClick={() => apply()} className="rounded bg-sky-600 px-2 py-1 text-white">Apply</button>
              </div>
              {items.map((it) => (
                <label key={it.addon_name} className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={!!selected[it.addon_name]} onChange={(e) => setSelected((m)=>({ ...m, [it.addon_name]: e.target.checked }))} />
                  <span className="min-w-28 truncate font-medium">{it.addon_name}</span>
                  <span className="rounded bg-slate-800 px-1 ring-1 ring-white/10">{it.category}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}


