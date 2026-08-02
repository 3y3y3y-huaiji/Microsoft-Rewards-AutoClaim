import { browser } from 'wxt/browser';
import { getRndInteger } from '@/entrypoints/utils/helpers';
import { SEARCH_WORDS } from '@/entrypoints/data/searchWords';
import { buildSearchQuery, buildSearchUrl, nextDelayMinutes, shouldOpenMore, toInt } from '@/entrypoints/utils/search';
import { getStorageItems, setStorageItem, setStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { DEFAULTS } from '@/entrypoints/settings';

const ALARM_NAME = 'openTabAlarm';

// Opens tab #1 immediately (currentSearch = 1), then schedules the rest via alarm.
export async function startSearches(searchTimeout: number, searches: number, closeTimeSeconds: number, useWords: boolean): Promise<void> {
    await setStorageItems({ isSearching: true, currentSearch: 1 }, StorageValues.SYNC);
    await openSearchTab(useWords, closeTimeSeconds * 1000);
    if (shouldOpenMore(1, searches)) {
        browser.alarms.create(ALARM_NAME, { delayInMinutes: nextDelayMinutes(searchTimeout) });
    } else {
        await stopSearches();
    }
}

export async function handleAlarmStep(alarm: { name: string }): Promise<void> {
    if (alarm.name !== ALARM_NAME) return;
    const s = await getStorageItems(['searches', 'timeout', 'closeTime', 'useWords', 'currentSearch'], StorageValues.SYNC);
    const searches = toInt(s.searches, DEFAULTS.searches);
    const searchTimeout = toInt(s.timeout, DEFAULTS.timeout);
    const closeTimeMs = toInt(s.closeTime, DEFAULTS.closeTime) * 1000;
    const useWords = s.useWords ?? DEFAULTS.useWords;
    const opened = toInt(s.currentSearch, searches);

    if (!shouldOpenMore(opened, searches)) {
        await stopSearches();
        return;
    }
    await openSearchTab(useWords, closeTimeMs);
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

async function openSearchTab(useWords: boolean, closeTimeMs: number): Promise<void> {
    const url = buildSearchUrl(buildSearchQuery(useWords, SEARCH_WORDS));
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
