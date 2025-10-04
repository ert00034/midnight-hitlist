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

  useEffect(() => {
    let mounted = true;
    fetch('/api/articles').then(async (r) => {
      const data = await r.json();
      if (mounted) {
        setArticles(data.articles ?? []);
        setLoading(false);
      }
    });
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
    const data = await r.json();
    setArticles((prev) => prev.map((a) => a.id === articleId ? { ...a, impacts: data.impacts } : a));
    setBusy(false);
  };

  const removeImpact = async (articleId: string, addon_name: string) => {
    setBusy(true);
    const r = await fetch(`/api/article-impacts?article_id=${articleId}&addon_name=${encodeURIComponent(addon_name)}`, { method: 'DELETE' });
    const data = await r.json();
    setArticles((prev) => prev.map((a) => a.id === articleId ? { ...a, impacts: data.impacts } : a));
    setBusy(false);
  };

  const getSuggestions = async () => {
    setBusy(true);
    const r = await fetch('/api/suggest-articles');
    const data = await r.json();
    setSuggestions(data.suggestions ?? []);
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-900/40 p-4 ring-1 ring-white/10">
        <label className="block text-sm text-slate-300">Wowhead Article URL</label>
        <div className="mt-2 flex gap-3">
          <input
            className="w-full rounded bg-slate-800 px-3 py-2 text-slate-100 ring-1 ring-white/10 focus:outline-none focus:ring-sky-400"
            placeholder="https://www.wowhead.com/news/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={add} disabled={busy} className="rounded bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-400 disabled:opacity-50">Add</button>
          <button onClick={getSuggestions} disabled={busy} className="rounded bg-purple-500 px-4 py-2 font-medium text-white hover:bg-purple-400 disabled:opacity-50">Suggest</button>
        </div>
      </div>

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
                    <div className="font-medium">{a.title ?? a.url}</div>
                    <div className="text-sm text-slate-400">{a.url}</div>
                  </div>
                  <button onClick={() => remove(a.id)} disabled={busy} className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50">Delete</button>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Addon impacts</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
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
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        placeholder="Addon name"
        className="w-48 rounded bg-slate-800 px-2 py-1 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-sky-400"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="rounded bg-slate-800 px-2 py-1 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-sky-400"
        value={sev}
        onChange={(e) => setSev(Number(e.target.value))}
      >
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <button
        className="rounded bg-sky-600 px-2 py-1 text-sm text-white hover:bg-sky-500"
        onClick={() => name && onAdd(name, sev)}
      >Add impact</button>
    </div>
  );
}


