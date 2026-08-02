import { browser } from 'wxt/browser';

// MV3 exposes `browser.action`; MV2 (Firefox) exposes `browser.browserAction`.
export function setBadgeText(text: string): void {
    const api = browser as unknown as { action?: { setBadgeText(d: { text: string }): void }; browserAction?: { setBadgeText(d: { text: string }): void } };
    (api.action ?? api.browserAction)?.setBadgeText({ text });
}
