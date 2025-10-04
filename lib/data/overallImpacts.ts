import { createStaticClient } from '@/lib/supabase/static';
import { unstable_cache } from 'next/cache';

export type AddonImpact = {
  addon_name: string;
  severity: number;
};

async function fetchOverallAddonImpacts(): Promise<AddonImpact[]> {
  const supabase = createStaticClient();
  const { data: rows, error } = await supabase
    .from('article_addon_impacts')
    .select('addon_name, severity');

  if (error || !rows) return [];

  const addonToSeverities = new Map<string, number[]>();
  for (const r of rows as any[]) {
    const name = String(r.addon_name || '').trim();
    if (!name) continue;
    const list = addonToSeverities.get(name) ?? [];
    // Preserve 0 (Safe). Use 0 when missing instead of 1.
    list.push(Number((r as any).severity ?? 0));
    addonToSeverities.set(name, list);
  }

  const impacts: AddonImpact[] = Array.from(addonToSeverities.entries()).map(([addon_name, severities]) => ({
    addon_name,
    severity: severities.reduce((a, b) => a + b, 0) / Math.max(1, severities.length),
  }));

  // Sort by severity desc, then name
  impacts.sort((a, b) => (b.severity - a.severity) || a.addon_name.localeCompare(b.addon_name));
  return impacts;
}

export const getOverallAddonImpacts = unstable_cache(
  async () => {
    return await fetchOverallAddonImpacts();
  },
  ['overall-impacts'],
  { tags: ['overall-impacts'] }
);


