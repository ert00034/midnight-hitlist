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
  const candidates = useMemo(() => {
    const list: string[] = [];
    const host = hostname || '';
    const root = host ? getRootDomain(host) : '';
    const ddgFor = (h: string) => (h ? `https://icons.duckduckgo.com/ip3/${h}.ico` : '');
    const origin = (() => {
      try { return new URL(url).origin; } catch { return ''; }
    })();

    if (src && src.trim().length > 0) list.push(src);
    if (host) list.push(ddgFor(host));
    if (origin) list.push(`${origin}/favicon.ico`);
    if (root && root !== host) list.push(ddgFor(root));
    return Array.from(new Set(list.filter(Boolean)));
  }, [src, hostname, url]);

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


