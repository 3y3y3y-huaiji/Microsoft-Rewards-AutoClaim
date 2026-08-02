import { describe, it, expect } from 'vitest';
import { getRndInteger } from './helpers';

describe('getRndInteger', () => {
  it('returns a value within [min, max] inclusive', () => {
    for (let i = 0; i < 200; i++) {
      const n = getRndInteger(5, 10);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('returns exactly the value when min === max', () => {
    expect(getRndInteger(7, 7)).toBe(7);
  });
});
