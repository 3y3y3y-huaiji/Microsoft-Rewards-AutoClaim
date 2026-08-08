// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toSearchProgress } from './progress';

describe('toSearchProgress', () => {
  it('reports the fraction completed as a percentage', () => {
    expect(toSearchProgress(2, 5)).toEqual({ completed: 2, total: 5, percent: 40 });
  });

  it('reports 0% before the first search', () => {
    expect(toSearchProgress(0, 5)).toEqual({ completed: 0, total: 5, percent: 0 });
  });

  it('reports 100% when every search has run', () => {
    expect(toSearchProgress(5, 5)).toEqual({ completed: 5, total: 5, percent: 100 });
  });

  it('clamps a completed count that overshoots the total', () => {
    // The user can lower "number of searches" mid-run, leaving a stored count
    // above the new total — the bar must not overflow its track.
    expect(toSearchProgress(9, 5)).toEqual({ completed: 5, total: 5, percent: 100 });
  });

  it('clamps a negative completed count to zero', () => {
    expect(toSearchProgress(-3, 5)).toEqual({ completed: 0, total: 5, percent: 0 });
  });

  it('treats a zero or missing total as one so it never divides by zero', () => {
    expect(toSearchProgress(0, 0)).toEqual({ completed: 0, total: 1, percent: 0 });
  });

  it('falls back to zero for non-numeric input', () => {
    expect(toSearchProgress(Number.NaN, Number.NaN)).toEqual({ completed: 0, total: 1, percent: 0 });
  });
});
