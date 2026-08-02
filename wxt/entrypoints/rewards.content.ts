import { defineContentScript } from '#imports';
import { browser } from 'wxt/browser';
import { matchDailyAnchors } from '@/entrypoints/utils/dailyAnchors';
import { oncePerPageRun } from '@/entrypoints/utils/oncePerPageRun';

export default defineContentScript({
    matches: ['https://rewards.bing.com/*'],
    main() {
        if (!oncePerPageRun('_marContentScriptInjected')) return;
        browser.runtime.onMessage.addListener((request: { action?: string }) => {
            if (request.action === 'openDaily') void openDailySets();
        });
    },
});

async function openDailySets(): Promise<void> {
    const anchors = await waitForDailyAnchors();
    // The content script can't open/close tabs, so hand the daily-set link URLs
    // to the background, which opens each in its own tab and closes it after a
    // few seconds. This also lets the background close the dashboard tab now.
    const links = anchors.map((anchor) => anchor.href);
    browser.runtime.sendMessage({ action: 'openDailyLinks', data: links }).catch(() => {});
}

// Resolve as soon as the daily-set anchors appear (they render async).
function waitForDailyAnchors(): Promise<HTMLAnchorElement[]> {
    return new Promise((resolve) => {
        function check(observer: MutationObserver): void {
            const anchors = matchDailyAnchors(document);
            if (anchors.length > 0) {
                observer.disconnect();
                resolve(anchors);
            }
        }
        const observer = new MutationObserver(() => check(observer));
        observer.observe(document.body, { childList: true, subtree: true });
        check(observer);
    });
}
