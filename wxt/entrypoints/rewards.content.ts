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
    for (const link of anchors) {
        link.click();
        await wait(1000 + getRndInteger(0, 1000));
    }
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
