import { createClient } from '@/lib/supabase/server';
import { normalizeSeverity, pickHigherSeverity, type NormalizedSeverity, normalizeSlug } from '@/lib/severity';

export type ImpactedItem = {
  slug: string;
  severity: NormalizedSeverity;
  note?: string;
  link?: string;
};

export type ImpactedFeed = {
  version: string; // YYYY-MM-DD
  items: ImpactedItem[];
};

// Deterministic note/link selection for stable ETags:
// - Note: prefer the longest non-empty note; if equal length, prefer lexicographically smaller.
// - Link: always pick the lexicographically smallest non-empty URL across candidates.
function pickBetterNoteLink(cur: { note?: string; link?: string }, next: { note?: string; link?: string }) {
  const currentNote = String(cur.note || '').trim();
  const nextNote = String(next.note || '').trim();
  let note: string | undefined;
  if (!currentNote) note = nextNote || undefined;
  else if (!nextNote) note = currentNote || undefined;
  else if (nextNote.length > currentNote.length) note = nextNote;
  else if (nextNote.length < currentNote.length) note = currentNote;
  else note = (nextNote < currentNote ? nextNote : currentNote) || undefined;

  const urls = [cur.link, next.link].filter((u): u is string => !!u);
  const link = urls.length ? urls.sort()[0] : undefined;
  return { note, link };
}

export async function buildImpactedFeed(): Promise<ImpactedFeed> {
  const supabase = createClient();

  // Load article impacts joined with articles for potential note/link
  const { data, error } = await supabase
    .from('article_addon_impacts')
    .select('addon_name, severity, articles!inner(id, url, title, summary)');

  if (error) {
    throw new Error(error.message);
  }

  const bySlug = new Map<string, ImpactedItem>();

  for (const row of (data || []) as any[]) {
    const rawName = String(row.addon_name || '').trim();
    if (!rawName) continue;
    const slug = normalizeSlug(rawName);
    if (!slug) continue;

    // Normalize severity from numeric scale 0-5 to requested buckets
    const sev = normalizeSeverity(Number((row as any).severity ?? 0));

    const noteCandidate = (row.articles?.title as string | undefined) || (row.articles?.summary as string | undefined) || undefined;
    const linkCandidate = (row.articles?.url as string | undefined) || undefined;

    const existing = bySlug.get(slug);
    if (!existing) {
      bySlug.set(slug, { slug, severity: sev, note: noteCandidate, link: linkCandidate });
    } else {
      const higher = pickHigherSeverity(existing.severity, sev);
      const chosen = pickBetterNoteLink({ note: existing.note, link: existing.link }, { note: noteCandidate, link: linkCandidate });
      existing.severity = higher;
      existing.note = chosen.note;
      existing.link = chosen.link;
    }
  }

  const items = Array.from(bySlug.values()).sort((a, b) => a.slug.localeCompare(b.slug));
  const version = new Date().toISOString().slice(0, 10);
  return { version, items };
}


