import { browser } from 'wxt/browser';
import { getRndInteger } from '@/entrypoints/utils/helpers';
import { buildSearchQuery, buildSearchUrl, nextDelayMinutes, shouldOpenMore, toInt } from '@/entrypoints/utils/search';
import { getStorageItem, getStorageItems, setStorageItem, setStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { DEFAULTS } from '@/entrypoints/utils/settings';

const ALARM_NAME = 'openTabAlarm';

// Opens tab #1 immediately (currentSearch = 1), then schedules the rest via alarm.
export async function startSearches(searchTimeout: number, searches: number, closeTimeSeconds: number): Promise<void> {
    await setStorageItems({ isSearching: true, currentSearch: 1 }, StorageValues.SYNC);
    // Tell the popup a run actually began, so its button flips to "Stop
    // searches" only when searches are really running (not on a daily-set-only run).
    browser.runtime.sendMessage({ action: 'searchStarted' }).catch(() => {});
    await openSearchTab(closeTimeSeconds * 1000);
    if (shouldOpenMore(1, searches)) {
        browser.alarms.create(ALARM_NAME, { delayInMinutes: nextDelayMinutes(searchTimeout) });
    } else {
        await stopSearches();
    }
}

export async function handleAlarmStep(alarm: { name: string }): Promise<void> {
    if (alarm.name !== ALARM_NAME) return;
    const s = await getStorageItems(['searches', 'timeout', 'closeTime', 'currentSearch'], StorageValues.SYNC);
    const searches = toInt(s.searches, DEFAULTS.searches);
    const searchTimeout = toInt(s.timeout, DEFAULTS.timeout);
    const closeTimeMs = toInt(s.closeTime, DEFAULTS.closeTime) * 1000;
    const opened = toInt(s.currentSearch, searches);

    if (!shouldOpenMore(opened, searches)) {
        await stopSearches();
        return;
    }
    await openSearchTab(closeTimeMs);
    const nowOpened = opened + 1;
    if (shouldOpenMore(nowOpened, searches)) {
        await setStorageItem('currentSearch', nowOpened, StorageValues.SYNC);
        browser.alarms.create(ALARM_NAME, { delayInMinutes: nextDelayMinutes(searchTimeout) });
    } else {
        await stopSearches();
    }
}

export async function stopSearches(): Promise<void> {
    await setStorageItem('isSearching', false, StorageValues.SYNC);
    browser.runtime.sendMessage({ action: 'searchEnded' }).catch(() => {});
    await browser.alarms.clearAll();
}

// The marAuto marker tells the bing-result content script this tab was opened
// by the extension, so it may open the first organic result. It's only added
// when the user enabled "Open first result in search tabs"; manual Bing
// searches (and tabs opened with the option off) lack the marker and are left
// untouched.
async function openSearchTab(closeTimeMs: number): Promise<void> {
    const openFirstResult = await getStorageItem<boolean>('openFirstResult', StorageValues.SYNC);
    const query = buildSearchUrl(buildSearchQuery());
    const url = openFirstResult ? `${query}&marAuto=1` : query;
    await openAndClose(url, closeTimeMs + getRndInteger(0, 1000));
}

async function openAndClose(url: string, closeTimeMs: number): Promise<void> {
    const tab = await browser.tabs.create({ url, active: false });
    const tabId = tab.id!;
    function listener(updatedId: number, changeInfo: { status?: string }): void {
        if (updatedId === tabId && changeInfo.status === 'complete') {
            browser.tabs.onUpdated.removeListener(listener);
            waitAndClose(tabId, closeTimeMs);
        }
    }
    browser.tabs.onUpdated.addListener(listener);
}

function waitAndClose(id: number, closeTimeMs: number): void {
    const timeout = closeTimeMs <= 0 ? 500 : closeTimeMs;
    setTimeout(() => {
        browser.tabs.get(id).then(() => browser.tabs.remove(id)).catch(() => {});
    }, Math.max(timeout - 500, 0) + getRndInteger(0, 1000));
}
