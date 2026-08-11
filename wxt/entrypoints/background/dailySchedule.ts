import { browser } from 'wxt/browser';
import { getStorageItems, setStorageItem, setStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { toInt } from '@/entrypoints/utils/search';
import { DEFAULTS } from '@/entrypoints/utils/settings';
import { clearBadge, setBadgeText } from '@/entrypoints/utils/browserAction';
import { openDailyRewards } from './dailyRewards';
import { startSearches } from './searchRunner';
import { siteConfig } from '@/entrypoints/config/siteConfig';

const WEBSITE_URL = siteConfig.officialWebsite;

// Runs whatever the user has enabled: the daily set if "Open daily set
// automatically" is on, and the Bing searches if "Do daily searches
// automatically" is on. Both the automatic daily trigger and the popup's
// "Get rewards" button call this, so the button respects the same toggles
// rather than forcing searches.
export async function runRewards(): Promise<void> {
    const s = await getStorageItems(['searches', 'timeout', 'closeTime'], StorageValues.SYNC);
    const searchTimeout = toInt(s.timeout, DEFAULTS.timeout);
    const searches = toInt(s.searches, DEFAULTS.searches);
    const closeTime = toInt(s.closeTime, DEFAULTS.closeTime);
    await openDailyRewards();
    if (searches > 0) {
        await startSearches(searchTimeout, searches, closeTime);
    }
}

export async function checkLastOpened(): Promise<void> {
    const today = new Date().toLocaleDateString();
    const s = await getStorageItems(['lastOpened'], StorageValues.SYNC);
    if (s.lastOpened !== today) {
        await runRewards();
        await setStorageItem('lastOpened', today, StorageValues.SYNC);
    }
}

export async function handleInstallOrUpdate(details: { reason: string }): Promise<void> {
    if (details.reason === 'install') {
        await setStorageItems({
            active: DEFAULTS.active,
            autoDaily: DEFAULTS.autoDaily,
            accountLevel: DEFAULTS.accountLevel,
            timeout: DEFAULTS.timeout,
            searches: DEFAULTS.searches,
            closeTime: DEFAULTS.closeTime,
            openFirstResult: DEFAULTS.openFirstResult,
            isSearching: false,
            currentSearch: 0,
        }, StorageValues.SYNC);
        await browser.runtime.setUninstallURL(siteConfig.uninstallUrl);
        setTimeout(() => { browser.tabs.create({ url: WEBSITE_URL, active: true }); }, 1000);
    } else if (details.reason === 'update') {
        setBadgeText('新');
    }
}

export async function handleStartup(): Promise<void> {
    // A search run never survives a browser restart, so clear its state *before*
    // today's run is considered: alarms outlive the session and would resume
    // opening Bing tabs on their own, and resetting the flag afterwards used to
    // clobber the `isSearching` that a fresh run had just set.
    await browser.alarms.clearAll();
    await setStorageItems({ isSearching: false, currentSearch: 0 }, StorageValues.SYNC);
    clearBadge();
    const s = await getStorageItems(['active', 'autoDaily'], StorageValues.SYNC);
    if (s.active || s.autoDaily) await checkLastOpened();
}
