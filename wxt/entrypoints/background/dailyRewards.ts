import { browser } from 'wxt/browser';

// Opens the rewards dashboard in a background tab, waits for load, tells the
// content script to click daily sets, then closes the tab after 10s.
export async function openDailyRewards(): Promise<void> {
    const tab = await browser.tabs.create({ url: 'https://rewards.bing.com/dashboard', active: false });
    const tabId = tab.id!;

    await new Promise<void>((resolve) => {
        function listener(updatedId: number, changeInfo: { status?: string }): void {
            if (updatedId === tabId && changeInfo.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener);
                setTimeout(() => {
                    browser.tabs.sendMessage(tabId, { action: 'openDaily' }).catch(() => {});
                    resolve();
                }, 300);
            }
        }
        browser.tabs.onUpdated.addListener(listener);
    });

    setTimeout(() => { browser.tabs.remove(tabId).catch(() => {}); }, 10000);
}
