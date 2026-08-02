import { browser } from 'wxt/browser';
import { getRndInteger, wait } from '@/entrypoints/utils/helpers';

// Safety cap: close the dashboard tab even if the content script never reports
// its links (page failed to render the daily sets, message dropped, etc.).
const DAILY_TAB_MAX_LIFETIME_MS = 90000;
// Each daily-set link tab is closed after a random interval in this range.
const DAILY_LINK_MIN_CLOSE_MS = 3000;
const DAILY_LINK_MAX_CLOSE_MS = 8000;

// Opens the rewards dashboard in a background tab, waits for load, and asks the
// content script for the daily-set link URLs. When they arrive it closes the
// dashboard tab and opens each link in its own tab, closing each after a few
// random seconds. A safety cap closes the dashboard if the links never arrive.
export async function openDailyRewards(): Promise<void> {
    const tab = await browser.tabs.create({ url: 'https://rewards.bing.com/dashboard', active: false });
    const dashboardId = tab.id!;

    let handled = false;
    function closeDashboard(): void {
        if (handled) return;
        handled = true;
        browser.runtime.onMessage.removeListener(linksListener);
        browser.tabs.remove(dashboardId).catch(() => {});
    }

    function linksListener(message: { action?: string; data?: unknown }, sender: { tab?: { id?: number } }): void {
        if (message.action !== 'openDailyLinks' || sender.tab?.id !== dashboardId) return;
        const links = Array.isArray(message.data)
            ? message.data.filter((url): url is string => typeof url === 'string' && url.startsWith('https://'))
            : [];
        closeDashboard();
        void openDailyLinkTabs(links);
    }
    browser.runtime.onMessage.addListener(linksListener);
    setTimeout(closeDashboard, DAILY_TAB_MAX_LIFETIME_MS);

    await new Promise<void>((resolve) => {
        function loadListener(updatedId: number, changeInfo: { status?: string }): void {
            if (updatedId === dashboardId && changeInfo.status === 'complete') {
                browser.tabs.onUpdated.removeListener(loadListener);
                setTimeout(() => {
                    browser.tabs.sendMessage(dashboardId, { action: 'openDaily' }).catch(() => {});
                    resolve();
                }, 300);
            }
        }
        browser.tabs.onUpdated.addListener(loadListener);
    });
}

// Open each daily-set link in its own background tab and close it after a few
// random seconds, staggering the opens so tabs don't all spawn at once.
async function openDailyLinkTabs(urls: string[]): Promise<void> {
    for (const url of urls) {
        openAndCloseTab(url, getRndInteger(DAILY_LINK_MIN_CLOSE_MS, DAILY_LINK_MAX_CLOSE_MS));
        await wait(1000 + getRndInteger(0, 1000));
    }
}

function openAndCloseTab(url: string, closeAfterMs: number): void {
    browser.tabs.create({ url, active: false }).then((tab) => {
        const id = tab.id!;
        setTimeout(() => {
            browser.tabs.get(id).then(() => browser.tabs.remove(id)).catch(() => {});
        }, closeAfterMs);
    });
}
