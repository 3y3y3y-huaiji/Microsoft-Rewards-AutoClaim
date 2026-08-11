import { describe, it, expect } from 'vitest';
import { toInt, buildSearchQuery, buildSearchUrl, nextDelayMinutes, shouldOpenMore } from './search';
import { SEARCH_LEAD_INS, SEARCH_TOPICS, SEARCH_TAILS } from '../data/searchTerms';

const VOCAB = new Set(
  [...SEARCH_LEAD_INS, ...SEARCH_TOPICS, ...SEARCH_TAILS].flatMap((phrase) => phrase.split(' '))
);

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
  it('builds natural multi-word queries from real words, no random prefix', () => {
    for (let i = 0; i < 300; i++) {
      const q = buildSearchQuery();
      // Real words separated by single spaces, starting with a letter/digit —
      // never a lone random character or gibberish string.
      expect(q).toMatch(/^[\p{L}\p{N}]+( [\p{L}\p{N}]+)+$/u);
      for (const token of q.split(' ')) {
        expect(VOCAB.has(token)).toBe(true);
      }
    }
  });

  it('varies between calls', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(buildSearchQuery());
    expect(seen.size).toBeGreaterThan(20);
  });
});

describe('buildSearchUrl', () => {
  it('url-encodes the query into the Bing search URL', () => {
    expect(buildSearchUrl('best coffee')).toBe(
      'https://www.bing.com/search?q=best%20coffee&qs=n&form=QBLH&sp=-1&pq='
    );
  });
});

describe('nextDelayMinutes', () => {
  it('returns the base timeout in minutes when jitter is zero', () => {
    expect(nextDelayMinutes(60, 0)).toBeCloseTo(1, 5);
  });
  it('floors at 0.1 for very small timeouts', () => {
    expect(nextDelayMinutes(0, 0)).toBe(0.1);
    expect(nextDelayMinutes(1, 0)).toBe(0.1);
  });
  it('spreads the delay ±75% around the base and varies between calls', () => {
    const values = new Set<number>();
    for (let i = 0; i < 300; i++) {
      const v = nextDelayMinutes(60);
      values.add(v);
      // base 60s → [15s, 105s] → [0.25, 1.75] minutes
      expect(v).toBeGreaterThanOrEqual(0.25 - 1e-9);
      expect(v).toBeLessThanOrEqual(1.75 + 1e-9);
    }
    expect(values.size).toBeGreaterThan(50);
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
