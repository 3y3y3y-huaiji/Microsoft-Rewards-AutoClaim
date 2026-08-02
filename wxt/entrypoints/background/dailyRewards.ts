import { browser } from 'wxt/browser';

// Safety cap: close the dashboard tab even if the content script never reports
// it finished (page failed to render the daily sets, message dropped, etc.).
const DAILY_TAB_MAX_LIFETIME_MS = 90000;

// Opens the rewards dashboard in a background tab, waits for load, tells the
// content script to click the daily sets, then closes the tab once the content
// script reports it finished (`dailyDone`) — or after the safety cap. A fixed
// short timer used to close the tab mid-run when there were many daily items.
export async function openDailyRewards(): Promise<void> {
    const tab = await browser.tabs.create({ url: 'https://rewards.bing.com/dashboard', active: false });
    const tabId = tab.id!;

    let closed = false;
    function closeTab(): void {
        if (closed) return;
        closed = true;
        browser.runtime.onMessage.removeListener(doneListener);
        browser.tabs.remove(tabId).catch(() => {});
    }

    function doneListener(message: { action?: string }, sender: { tab?: { id?: number } }): void {
        if (message.action === 'dailyDone' && sender.tab?.id === tabId) closeTab();
    }
    browser.runtime.onMessage.addListener(doneListener);
    setTimeout(closeTab, DAILY_TAB_MAX_LIFETIME_MS);

    await new Promise<void>((resolve) => {
        function loadListener(updatedId: number, changeInfo: { status?: string }): void {
            if (updatedId === tabId && changeInfo.status === 'complete') {
                browser.tabs.onUpdated.removeListener(loadListener);
                setTimeout(() => {
                    browser.tabs.sendMessage(tabId, { action: 'openDaily' }).catch(() => {});
                    resolve();
                }, 300);
            }
        }
        browser.tabs.onUpdated.addListener(loadListener);
    });
}
