import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/serviceRole';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import crypto from 'crypto';

const addonSchema = z.object({
  addon_name: z.string().min(1).max(120),
  severity: z.number().int().min(0).max(5),
});

const bodySchema = z.object({
  url: z.string().url().max(2048),
  title: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  addons: z.array(addonSchema).min(1).max(25),
  // Honeypot: bots may fill this
  website: z.string().optional(),
});

function sanitizeText(input: string | undefined | null, maxLen: number): string | null {
  if (!input) return null;
  let s = String(input);
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  s = s.replace(/[<>]/g, '');
  s = s.slice(0, maxLen);
  return s.trim() || null;
}

function sanitizeAddonName(input: string): string {
  let s = String(input);
  s = s.replace(/[\x00-\x1F<>]/g, '');
  // collapse whitespace
  s = s.replace(/\s+/g, ' ');
  return s.trim().slice(0, 120);
}

function safeHttpUrl(input: string): string {
  const trimmed = String(input || '').trim();
  let u: URL;
  try { u = new URL(trimmed); } catch { throw new Error('Invalid URL'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Unsupported URL protocol');
  return u.toString();
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  // fallback to user-agent hash anchor
  return 'unknown';
}

function hashIp(ip: string, ua: string | null): string {
  const pepper = process.env.SUBMISSION_IP_PEPPER || 'mh_pepper';
  return crypto.createHash('sha256').update(`${ip}|${ua || ''}|${pepper}`).digest('hex');
}

export async function POST(req: NextRequest) {
  const svc = createServiceClient();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Honeypot: if present and non-empty, drop
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  // Basic normalization
  let url: string;
  try { url = safeHttpUrl(parsed.data.url); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }
  const title = sanitizeText(parsed.data.title, 200);
  const notes = sanitizeText(parsed.data.notes, 1000);
  const addons = parsed.data.addons.map((a) => ({
    addon_name: sanitizeAddonName(a.addon_name),
    severity: Math.max(1, Math.min(5, a.severity | 0)),
  })).filter((a) => a.addon_name.length > 0);

  const isAdmin = cookies().get('mh_admin')?.value === '1';

  // Simple anti-spam per IP hash
  const ua = req.headers.get('user-agent');
  const ip = getClientIp(req);
  const ipHash = hashIp(ip, ua);

  const now = Date.now();
  const fifteenMinAgo = new Date(now - 15 * 60 * 1000).toISOString();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  if (!isAdmin) {
    // 3 per 15 minutes
    const recent = await svc
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gt('created_at', fifteenMinAgo);
    if ((recent.count || 0) >= 3) {
      return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
    }

    // 20 per day safeguard
    const daily = await svc
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gt('created_at', dayAgo);
    if ((daily.count || 0) >= 20) {
      return NextResponse.json({ error: 'Daily submission limit reached.' }, { status: 429 });
    }
  }

  // Insert submission
  const { data: submission, error: subErr } = await svc
    .from('submissions')
    .insert({ url, title, notes, ip_hash: ipHash, user_agent: ua || null, status: 'pending' })
    .select('id')
    .single();
  if (subErr || !submission) {
    return NextResponse.json({ error: subErr?.message || 'Failed to save' }, { status: 500 });
  }

  // Insert impacts
  const rows = addons.map((a) => ({ submission_id: submission.id, addon_name: a.addon_name, severity: a.severity }));
  const { error: impErr } = await svc.from('submission_addon_impacts').insert(rows);
  if (impErr) {
    // Do not expose details; keep simple
    return NextResponse.json({ error: 'Saved, but failed to record addons' }, { status: 202 });
  }

  // Admin auto-approval: immediately promote to article and mark reviewed
  if (isAdmin) {
    function ddgIcon(u: string): string | null {
      try { const host = new URL(u).hostname; return `https://icons.duckduckgo.com/ip3/${host}.ico`; } catch { return null; }
    }
    const fallbackFavicon = ddgIcon(url);
    const { data: art, error: artErr } = await svc
      .from('articles')
      .insert({ url, title, summary: notes, favicon: fallbackFavicon, severity: 2 })
      .select('id')
      .single();
    if (artErr || !art) {
      return NextResponse.json({ error: artErr?.message || 'Failed to create article' }, { status: 500 });
    }
    const articleImpacts = addons.map((a) => ({ article_id: art.id, addon_name: a.addon_name, severity: a.severity }));
    if (articleImpacts.length) {
      const { error: impErr2 } = await svc.from('article_addon_impacts').upsert(articleImpacts);
      if (impErr2) return NextResponse.json({ error: impErr2.message }, { status: 500 });
    }
    await svc.from('submissions').update({ status: 'reviewed' }).eq('id', submission.id);
    try { revalidateTag('overall-impacts'); } catch {}
    return NextResponse.json({ ok: true, article_id: art.id, autoApproved: true });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('submissions')
    .select('id, url, title, notes, created_at, status, submission_addon_impacts(addon_name, severity)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const submissions = (data || []).map((s: any) => ({
    id: s.id,
    url: s.url,
    title: s.title,
    notes: s.notes,
    created_at: s.created_at,
    status: s.status,
    addons: (s.submission_addon_impacts || []).map((i: any) => ({ addon_name: i.addon_name, severity: i.severity })),
  }));
  return NextResponse.json({ submissions });
}

const reviewSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve', 'discard']),
});

export async function PATCH(req: NextRequest) {
  const isAdmin = cookies().get('mh_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const svc = createServiceClient();
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { id, action } = parsed.data;

  if (action === 'discard') {
    const { error } = await svc.from('submissions').update({ status: 'discarded' }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // approve: create article and impacts
  const { data: sub, error: subErr } = await svc
    .from('submissions')
    .select('id, url, title, notes, submission_addon_impacts(addon_name, severity)')
    .eq('id', id)
    .single();
  if (subErr || !sub) return NextResponse.json({ error: subErr?.message || 'Not found' }, { status: 404 });

  // Create article (minimal) using existing POST logic assumptions
  // Re-sanitize when promoting to article
  const safeTitle = sanitizeText(sub.title, 200);
  const safeSummary = sanitizeText(sub.notes, 1000);
  const safeUrl = safeHttpUrl(sub.url);
  function ddgIcon(u: string): string | null {
    try { const host = new URL(u).hostname; return `https://icons.duckduckgo.com/ip3/${host}.ico`; } catch { return null; }
  }
  const fallbackFavicon = ddgIcon(safeUrl);
  const { data: art, error: artErr } = await svc
    .from('articles')
    .insert({ url: safeUrl, title: safeTitle, summary: safeSummary, favicon: fallbackFavicon, severity: 2 })
    .select('id')
    .single();
  if (artErr || !art) return NextResponse.json({ error: artErr?.message || 'Failed to create article' }, { status: 500 });

  const rows = (sub.submission_addon_impacts || []).map((i: any) => ({ article_id: art.id, addon_name: i.addon_name, severity: i.severity }));
  if (rows.length) {
    const { error: impErr } = await svc.from('article_addon_impacts').upsert(rows);
    if (impErr) return NextResponse.json({ error: impErr.message }, { status: 500 });
  }

  await svc.from('submissions').update({ status: 'reviewed' }).eq('id', id);
  try { revalidateTag('overall-impacts'); } catch {}
  return NextResponse.json({ ok: true, article_id: art.id });
}


