import { describe, it, expect } from 'vitest';
import { normalizeSeverity, normalizeSlug } from '@/lib/severity';

describe('severity normalization', () => {
  it('maps labels and colors correctly', () => {
    expect(normalizeSeverity('red')).toBe('critical');
    expect(normalizeSeverity('orange')).toBe('high');
    expect(normalizeSeverity('yellow')).toBe('medium');
    expect(normalizeSeverity('green')).toBe('low');
    expect(normalizeSeverity('unknown')).toBe('unknown');
  });
  it('maps numeric levels to buckets', () => {
    expect(normalizeSeverity(5)).toBe('critical');
    expect(normalizeSeverity(4)).toBe('high');
    expect(normalizeSeverity(3)).toBe('high');
    expect(normalizeSeverity(2)).toBe('medium');
    expect(normalizeSeverity(1)).toBe('low');
    expect(normalizeSeverity(0)).toBe('low');
  });
});

describe('slug normalization', () => {
  it('lowercases and removes non-alphanumerics', () => {
    expect(normalizeSlug('DBM-Core')).toBe('dbmcore');
    expect(normalizeSlug('WeakAuras')).toBe('weakauras');
    expect(normalizeSlug('!Details-DamageMeter')).toBe('detailsdamagemeter');
  });
});


