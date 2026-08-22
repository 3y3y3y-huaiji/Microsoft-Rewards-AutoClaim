// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room reimplementation per docs/rewrite/spec.md §4.
// Preserved external names: buildSearchQuery / buildSearchUrl / toInt / nextDelayMinutes
// Internal logic, identifiers and comments are freshly authored.

import { getRndInteger } from '@/entrypoints/utils/helpers';
import { SEARCH_LEAD_INS, SEARCH_TAILS, SEARCH_TOPICS } from '@/entrypoints/data/searchTerms';

const BING_BASE = 'https://www.bing.com/search?q=';
const BING_SUFFIX = '&qs=n&form=QBLH&sp=-1&pq=';

// Robust integer parsing: `parseInt("abc")` and `parseInt(undefined)` yield NaN,
// and `NaN ?? fallback` does NOT fall back (only null/undefined do). Explicit
// NaN check restores the intended fallback.
export function toInt(raw: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function sample<T>(items: T[]): T {
  const idx = getRndInteger(0, items.length - 1);
  return items[idx] as T;
}

// Human-like query: either "<leadIn> <topic>" or "<topic> <tail>".
export function buildSearchQuery(): string {
  const topic = sample(SEARCH_TOPICS);
  const coin = getRndInteger(0, 1);
  if (coin === 0) {
    const lead = sample(SEARCH_LEAD_INS);
    return `${lead} ${topic}`;
  }
  const tail = sample(SEARCH_TAILS);
  return `${topic} ${tail}`;
}

export function buildSearchUrl(query: string): string {
  return `${BING_BASE}${encodeURIComponent(query)}${BING_SUFFIX}`;
}

// Spec §4.3 — symmetric ±75% jitter around timeout, floored at 0.1 min.
// Chrome clamps sub-minute alarms to 1 min in packed builds; we keep 0.1 for
// correctness in tests (fake timers) and accept the clamp in production.
const JITTER_RATIO = 0.75;

export function nextDelayMinutes(timeoutSeconds: number, forcedJitterMs?: number): number {
  const base = Math.max(timeoutSeconds, 1) * 1000;
  const spread = Math.round(base * JITTER_RATIO);
  const jitter = forcedJitterMs !== undefined ? forcedJitterMs : getRndInteger(-spread, spread);
  const minutes = (base + jitter) / 60_000;
  return Math.max(minutes, 0.1);
}

// Exact-count helper: run opens precisely `searches` tabs (fixes prior off-by-one).
export function shouldOpenMore(opened: number, total: number): boolean {
  return opened < total;
}
