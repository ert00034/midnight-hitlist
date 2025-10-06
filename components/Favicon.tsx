'use client';

import { useMemo, useState, useCallback } from 'react';

type Props = {
  url: string;
  src?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

function getHostname(inputUrl: string): string | null {
  try {
    const u = new URL(inputUrl);
    return u.hostname;
  } catch {
    return null;
  }
}

function getRootDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  // naive root domain extraction (ok for common TLDs we use here)
  return parts.slice(-2).join('.');
}

export function Favicon({ url, src, size = 32, className, alt = 'icon' }: Props) {
  const hostname = useMemo(() => getHostname(url), [url]);
  const forcedFallback = useMemo(() => {
    const host = hostname || '';
    // Force our generic gray arrow icon for any mmo-champion.com link
    if (/(^|\.)mmo-champion\.com$/i.test(host)) {
      // public asset path; kept generic to avoid importing svg directly
      return '/icons/arrow-gray-32.png';
    }
    return '';
  }, [hostname]);
  const candidates = useMemo(() => {
    const list: string[] = [];
    const host = hostname || '';
    const root = host ? getRootDomain(host) : '';
    const ddgFor = (h: string) => (h ? `https://icons.duckduckgo.com/ip3/${h}.ico` : '');
    const preferredPx = Math.max(16, Math.min(64, size));
    const googleFor = (h: string) => (h ? `https://www.google.com/s2/favicons?sz=${preferredPx}&domain=${h}` : '');
    const origin = (() => {
      try { return new URL(url).origin; } catch { return ''; }
    })();

    if (forcedFallback) list.push(forcedFallback);
    if (src && src.trim().length > 0) list.push(src);
    if (host) list.push(ddgFor(host));
    if (host) list.push(googleFor(host));
    if (origin) list.push(`${origin}/favicon.ico`);
    if (root && root !== host) list.push(ddgFor(root));
    if (root && root !== host) list.push(googleFor(root));
    return Array.from(new Set(list.filter(Boolean)));
  }, [src, hostname, url, size, forcedFallback]);

  const [index, setIndex] = useState(0);
  const current = candidates[index] || undefined;

  const handleError = useCallback(() => {
    setIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
  }, [candidates.length]);

  if (!current) {
    return <div style={{ width: size, height: size }} className="rounded bg-slate-700" />;
  }

  return (
    <img
      src={current}
      alt={alt}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}


