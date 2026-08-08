import { defineContentScript } from '#imports';
import { getRndInteger, wait } from '@/entrypoints/utils/helpers';
import { oncePerPageRun } from '@/entrypoints/utils/oncePerPageRun';

// LOCAL ANALYSIS ONLY — not for shipping. On search tabs the extension opens
// (tagged with ?marAuto=1), read the first organic Bing result and navigate to
// it, so its landing page can be reviewed manually before the tab auto-closes.
// Manual Bing searches lack the marker and are left alone.
const RESULT_SELECTOR = '#b_results li.b_algo h2 a';
const MAX_WAIT_MS = 8000;
// Wait a randomized 1.5–5.5s before opening so it isn't an instant, robotic jump.
const OPEN_DELAY_MIN_MS = 1500;
const OPEN_DELAY_SPREAD_MS = 4000;

export default defineContentScript({
    matches: ['https://www.bing.com/search*'],
    async main() {
        if (!new URLSearchParams(location.search).has('marAuto')) return;
        if (!oncePerPageRun('_marFirstResultClicked')) return;

        const first = await waitForFirstResult();
        if (!first) {
            console.warn('[MAR] no organic result found for this query');
            return;
        }
        console.log('[MAR] first result:', first.textContent?.trim(), '→', first.href);
        // Randomized pause, then navigate in place. Using location.assign (not
        // anchor.click) keeps navigation in this same background tab: it never
        // spawns a new tab and never activates this one, so the user's current
        // focus is preserved.
        await wait(OPEN_DELAY_MIN_MS + getRndInteger(0, OPEN_DELAY_SPREAD_MS));
        location.assign(first.href);
    },
});

// Bing renders results async, so wait for the first organic anchor to appear,
// falling back to null after a bounded wait rather than hanging.
function waitForFirstResult(): Promise<HTMLAnchorElement | null> {
    return new Promise((resolve) => {
        const existing = document.querySelector<HTMLAnchorElement>(RESULT_SELECTOR);
        if (existing) {
            resolve(existing);
            return;
        }
        const observer = new MutationObserver(() => {
            const found = document.querySelector<HTMLAnchorElement>(RESULT_SELECTOR);
            if (found) {
                observer.disconnect();
                clearTimeout(timer);
                resolve(found);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        const timer = setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, MAX_WAIT_MS);
    });
}
