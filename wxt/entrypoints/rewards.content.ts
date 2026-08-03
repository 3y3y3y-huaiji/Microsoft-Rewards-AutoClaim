import { defineContentScript } from '#imports';
import { browser } from 'wxt/browser';
import { getRndInteger, wait } from '@/entrypoints/utils/helpers';
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
    // Click each daily-set card so the dashboard's own handler registers the
    // activity — that click is what credits the points; opening the raw href
    // does not. Each click opens the search in a new tab, which the background
    // auto-closes. Signal done so the dashboard closes only after every card
    // has been clicked.
    for (const anchor of anchors) {
        anchor.click();
        await wait(1000 + getRndInteger(0, 1000));
    }
    browser.runtime.sendMessage({ action: 'dailyDone' }).catch(() => {});
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
