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

  const displayText = useMemo(() => {
    if (!email || !email.includes('@')) return '';
    const [localPart, domainPart] = email.split('@');
    const [domain, tld = ''] = domainPart.split('.');
    return `${localPart} [at] ${domain} [dot] ${tld}`.trim();
  }, [email]);

  if (!displayText) return null;

  return (
    <span className={className || "text-sky-300 hover:underline"}>{displayText}</span>
  );
}


