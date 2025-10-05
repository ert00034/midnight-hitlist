"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Addon = { addon_name: string; severity: number };

export default function SuggestPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [addons, setAddons] = useState<Addon[]>([{ addon_name: "", severity: 3 }]);
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [addonOptions, setAddonOptions] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabaseBrowser
        .from('article_addon_impacts')
        .select('addon_name');
      if (!mounted) return;
      if (error || !data) return;
      const names = Array.from(new Set((data as any[]).map(r => String(r.addon_name || '').trim()).filter(Boolean)));
      names.sort((a, b) => a.localeCompare(b));
      setAddonOptions(names);
    })();
    return () => { mounted = false; };
  }, []);

  function updateAddon(index: number, patch: Partial<Addon>) {
    setAddons((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function addRow() {
    setAddons((prev) => [...prev, { addon_name: "", severity: 3 }]);
  }

  function removeRow(index: number) {
    setAddons((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const cleaned = addons
        .map((a) => ({ addon_name: a.addon_name.trim(), severity: a.severity }))
        .filter((a) => a.addon_name.length > 0);
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title: title || undefined, notes: notes || undefined, addons: cleaned, website }),
      });
      if (res.ok) {
        setMessage("Thanks! Your suggestion was submitted. If an admin approves your suggestion, it will appear in the list of articles and addons impacted.");
        setUrl("");
        setTitle("");
        setNotes("");
        setAddons([{ addon_name: "", severity: 3 }]);
        setWebsite("");
        // router.refresh(); // not necessary, but keep in case we add SSR info later
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Submission failed. Please try again later.");
      }
    } catch (e) {
      setMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Suggest an article or video</h1>
      <p className="mb-6 text-sm text-white/70">Share links about addons impacted by patch changes. Include which addons and how severe the impact is.</p>
      {message && (
        <div className="mb-4 rounded border border-white/10 bg-white/5 px-4 py-3 text-sm">
          {message}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Honeypot field (hidden visually) */}
        <div className="hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm">URL</label>
          <input
            id="url"
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border border-white/10 bg-[#0b1020] px-3 py-2 outline-none focus:border-cyan-400/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm">Title (optional)</label>
          <input
            id="title"
            type="text"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-white/10 bg-[#0b1020] px-3 py-2 outline-none focus:border-cyan-400/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm">Notes (optional)</label>
          <textarea
            id="notes"
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border border-white/10 bg-[#0b1020] px-3 py-2 outline-none focus:border-cyan-400/50"
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm">Addons and severity</label>
            <button type="button" onClick={addRow} className="rounded bg-cyan-600 px-3 py-1.5 text-sm hover:bg-cyan-500">Add another addon</button>
          </div>
          <div className="space-y-2">
            {addons.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Addon name"
                  value={a.addon_name}
                  onChange={(e) => updateAddon(i, { addon_name: e.target.value })}
                  list="addon-names"
                  className="flex-1 rounded border border-white/10 bg-[#0b1020] px-3 py-2 outline-none focus:border-cyan-400/50"
                />
                <select
                  value={a.severity}
                  onChange={(e) => updateAddon(i, { severity: Number(e.target.value) })}
                  className="w-36 rounded border border-white/10 bg-[#0b1020] px-3 py-2 outline-none focus:border-cyan-400/50"
                >
                  <option value={0}>Safe</option>
                  <option value={1}>Low</option>
                  <option value={2}>Moderate</option>
                  <option value={3}>Notable</option>
                  <option value={4}>High</option>
                  <option value={5}>Critical</option>
                </select>
                {addons.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} className="rounded border border-white/10 px-2 py-1 text-sm hover:bg-white/10">Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit suggestion"}
          </button>
        </div>
      </form>
      <datalist id="addon-names">
        {addonOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      </div>
    </div>
  );
}


