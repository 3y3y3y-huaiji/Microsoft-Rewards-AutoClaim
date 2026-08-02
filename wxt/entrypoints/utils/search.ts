import { getRndInteger } from '@/entrypoints/utils/helpers';

const BING_SEARCH_URL = 'https://www.bing.com/search?q=';
const BING_SEARCH_PARAMS = '&qs=n&form=QBLH&sp=-1&pq=';

// parseInt(undefined)/parseInt('abc') is NaN, and `NaN ?? x` keeps NaN
// (?? only catches null/undefined). This guards that original bug.
export function toInt(value: unknown, fallback: number): number {
    const n = parseInt(String(value), 10);
    return Number.isNaN(n) ? fallback : n;
}

export function buildSearchQuery(useWords: boolean, words: string[]): string {
    let body = '';
    if (useWords) {
        const count = getRndInteger(3, 5);
        for (let i = 0; i < count; i++) {
            body += `${words[getRndInteger(0, words.length - 1)]} `;
        }
    } else {
        body = Math.random().toString(36).substring(2, getRndInteger(5, 8));
    }
    const prefix = Math.random().toString(36).substring(2, 3);
    return `${prefix}${body}`;
}

export function buildSearchUrl(query: string): string {
    return `${BING_SEARCH_URL}${query}${BING_SEARCH_PARAMS}`;
}

// Chrome/Firefox alarms accept minutes; floor at 0.1 so the value is never 0.
// (Chrome still clamps sub-minute alarms in packed builds regardless.)
export function nextDelayMinutes(timeoutSeconds: number, jitterMs: number = getRndInteger(0, 2000)): number {
    const t = Math.max(timeoutSeconds, 1);
    return Math.max(((t - 1) * 1000 + jitterMs) / 60000, 0.1);
}

// True while another search tab should open. Opening exactly `searches` tabs
// (fixes the original off-by-one that opened searches + 1).
export function shouldOpenMore(opened: number, searches: number): boolean {
    return opened < searches;
}
