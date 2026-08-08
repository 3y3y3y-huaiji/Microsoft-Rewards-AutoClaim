import { browser } from 'wxt/browser';

// Matches the popup's accent colour so the counter badge reads as part of the
// extension rather than an error marker (the browser default is red).
const BADGE_COLOR = '#2282ad';

interface BadgeApi {
    setBadgeText(details: { text: string }): void;
    setBadgeBackgroundColor?(details: { color: string }): void;
}

// MV3 exposes `browser.action`; MV2 (Firefox) exposes `browser.browserAction`.
function badgeApi(): BadgeApi | undefined {
    const api = browser as unknown as { action?: BadgeApi; browserAction?: BadgeApi };
    return api.action ?? api.browserAction;
}

export function setBadgeText(text: string): void {
    badgeApi()?.setBadgeText({ text });
}

// The toolbar icon shows how many of today's searches have run. A badge only
// fits ~4 characters, so it carries the completed count alone; the popup spells
// out the full "3/5".
export function setSearchCountBadge(completed: number): void {
    const api = badgeApi();
    if (!api) return;
    api.setBadgeBackgroundColor?.({ color: BADGE_COLOR });
    api.setBadgeText({ text: String(completed) });
}

export function clearBadge(): void {
    setBadgeText('');
}
