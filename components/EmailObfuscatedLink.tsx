"use client";

import { useMemo } from 'react';

type Props = {
  className?: string;
};

/**
 * Renders a feedback email link that is lightly obfuscated against simple scrapers.
 * Email comes from NEXT_PUBLIC_FEEDBACK_EMAIL. If missing, renders nothing.
 */
export default function EmailObfuscatedLink({ className }: Props) {
  const email = (process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || '').trim();

  const { displayText, href } = useMemo(() => {
    if (!email || !email.includes('@')) {
      return { displayText: '', href: '' };
    }
    // Split without keeping the raw string contiguous in the source/DOM
    const [localPart, domainPart] = email.split('@');
    const [domain, tld = ''] = domainPart.split('.');

    // Build display text with substitutions to reduce naive scraping
    const display = `${localPart} [at] ${domain} [dot] ${tld}`.trim();

    // Build href at runtime using string concatenation to avoid a plain literal
    const hrefValue = `mailto:${localPart}` + '@' + `${domain}.${tld}`;

    return { displayText: display, href: hrefValue };
  }, [email]);

  if (!href || !displayText) return null;

  return (
    <a
      href={href}
      className={className || "text-sky-300 hover:underline"}
      rel="noopener noreferrer"
    >
      {displayText}
    </a>
  );
}


