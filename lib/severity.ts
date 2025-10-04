export type NormalizedSeverity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

const labelToNormalized: Record<string, NormalizedSeverity> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  moderate: 'medium',
  notable: 'high',
  low: 'low',
  safe: 'low',
  unknown: 'unknown',
  red: 'critical',
  orange: 'high',
  yellow: 'medium',
  green: 'low',
};

export function normalizeSeverity(input: string | number | null | undefined): NormalizedSeverity {
  if (typeof input === 'number' && Number.isFinite(input)) {
    const n = Math.max(0, Math.min(5, Math.round(input)));
    if (n >= 5) return 'critical';
    if (n === 4 || n === 3) return 'high';
    if (n === 2) return 'medium';
    if (n <= 1) return 'low';
  }
  const key = String(input || '').trim().toLowerCase();
  if (!key) return 'unknown';
  return labelToNormalized[key] ?? 'unknown';
}

const severityRank: Record<NormalizedSeverity, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function rankSeverity(level: NormalizedSeverity): number {
  return severityRank[level] ?? 0;
}

export function pickHigherSeverity(a: NormalizedSeverity, b: NormalizedSeverity): NormalizedSeverity {
  return severityRank[a] >= severityRank[b] ? a : b;
}

export function normalizeSlug(value: string): string {
  return (value || '').toLowerCase().replace(/[^0-9a-z]/g, '');
}


