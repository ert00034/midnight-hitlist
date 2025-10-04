import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { data } = await supabase
    .from('article_addon_impacts')
    .select('addon_name', { distinct: true });

  const addonNames = Array.from(new Set((data || []).map((row: any) => row.addon_name).filter(Boolean)));
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/articles`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/addons`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const addonRoutes: MetadataRoute.Sitemap = addonNames.map((name: string) => ({
    url: `${baseUrl}/addons/${encodeURIComponent(name)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...addonRoutes];
}


