import { describe, it, expect } from 'vitest';
import { toInt, buildSearchQuery, buildSearchUrl, nextDelayMinutes, shouldOpenMore } from './search';

describe('toInt', () => {
  it('parses integer strings', () => {
    expect(toInt('5', 9)).toBe(5);
  });
  it('falls back on NaN / null / undefined (the parseInt ?? bug)', () => {
    expect(toInt('abc', 9)).toBe(9);
    expect(toInt(undefined, 9)).toBe(9);
    expect(toInt(null, 9)).toBe(9);
  });
  it('passes through numbers', () => {
    expect(toInt(7, 9)).toBe(7);
  });
});

describe('buildSearchQuery', () => {
  const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];

  it('produces 3-5 space-separated words in words mode', () => {
    for (let i = 0; i < 100; i++) {
      const q = buildSearchQuery(true, words);
      const tokens = q.trim().split(/\s+/);
      expect(tokens.length).toBeGreaterThanOrEqual(3);
      expect(tokens.length).toBeLessThanOrEqual(5);
    }
  });

  it('produces a single alphanumeric token in letters mode', () => {
    for (let i = 0; i < 100; i++) {
      const q = buildSearchQuery(false, words);
      expect(q).toMatch(/^[a-z0-9]+$/);
      expect(q).not.toContain(' ');
    }
  });
});

describe('buildSearchUrl', () => {
  it('wraps the query with the Bing search URL and params', () => {
    expect(buildSearchUrl('xhello')).toBe(
      'https://www.bing.com/search?q=xhello&qs=n&form=QBLH&sp=-1&pq='
    );
  });
});

describe('nextDelayMinutes', () => {
  it('computes (timeout-1)s in minutes with jitter', () => {
    expect(nextDelayMinutes(60, 0)).toBeCloseTo(59000 / 60000, 5);
  });
  it('floors at 0.1 for very small timeouts', () => {
    expect(nextDelayMinutes(0, 0)).toBe(0.1);
    expect(nextDelayMinutes(1, 0)).toBe(0.1);
  });
});

describe('shouldOpenMore', () => {
  it('is true while fewer than `searches` tabs have opened', () => {
    expect(shouldOpenMore(1, 12)).toBe(true);
  });
  it('is false once `searches` tabs have opened (exact-count fix)', () => {
    expect(shouldOpenMore(12, 12)).toBe(false);
    expect(shouldOpenMore(1, 1)).toBe(false);
  });
});
