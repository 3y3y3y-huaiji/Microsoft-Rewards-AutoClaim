import { getRndInteger } from '@/entrypoints/utils/helpers';
import { SEARCH_LEAD_INS, SEARCH_TOPICS, SEARCH_TAILS } from '@/entrypoints/data/searchTerms';

const BING_SEARCH_URL = 'https://www.bing.com/search?q=';
const BING_SEARCH_PARAMS = '&qs=n&form=QBLH&sp=-1&pq=';

// parseInt(undefined)/parseInt('abc') is NaN, and `NaN ?? x` keeps NaN
// (?? only catches null/undefined). This guards that original bug.
export function toInt(value: unknown, fallback: number): number {
    const n = parseInt(String(value), 10);
    return Number.isNaN(n) ? fallback : n;
}

function pick<T>(arr: T[]): T {
    return arr[getRndInteger(0, arr.length - 1)];
}

// Build a natural-looking search query from real words — "<lead-in> <topic>" or
// "<topic> <tail>" — so it reads like a normal search (e.g. "best headphones",
// "gardening for beginners") with no random-character prefix or gibberish.
export function buildSearchQuery(): string {
    const topic = pick(SEARCH_TOPICS);
    return getRndInteger(0, 1) === 0
        ? `${pick(SEARCH_LEAD_INS)} ${topic}`
        : `${topic} ${pick(SEARCH_TAILS)}`;
}

export function buildSearchUrl(query: string): string {
    return `${BING_SEARCH_URL}${encodeURIComponent(query)}${BING_SEARCH_PARAMS}`;
}

// Fraction of the configured gap used as a symmetric random spread, so the
// time between searches varies widely (base ±75%) instead of being near-fixed —
// looks less robotic. Averages the user's configured timeout. Chrome/Firefox
// alarms take minutes; floor at 0.1 so the value is never 0 (Chrome still
// clamps sub-minute alarms in packed builds regardless).
const DELAY_JITTER_FRACTION = 0.75;

export function nextDelayMinutes(timeoutSeconds: number, jitterMs?: number): number {
    const baseMs = Math.max(timeoutSeconds, 1) * 1000;
    const spread = Math.round(baseMs * DELAY_JITTER_FRACTION);
    const jitter = jitterMs ?? getRndInteger(-spread, spread);
    return Math.max((baseMs + jitter) / 60000, 0.1);
}

// True while another search tab should open. Opening exactly `searches` tabs
// (fixes the original off-by-one that opened searches + 1).
export function shouldOpenMore(opened: number, searches: number): boolean {
    return opened < searches;
}
