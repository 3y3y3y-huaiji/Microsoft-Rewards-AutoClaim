import { browser } from 'wxt/browser';
import { getStorageItems, setStorageItem, setStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { toInt } from '@/entrypoints/utils/search';
import { DEFAULTS } from '@/entrypoints/utils/settings';
import { setBadgeText } from '@/entrypoints/utils/browserAction';
import { openDailyRewards } from './dailyRewards';
import { startSearches } from './searchRunner';

const WEBSITE_URL = 'https://svitspindler.com/microsoft-automatic-rewards';

// Runs whatever the user has enabled: the daily set if "Open daily set
// automatically" is on, and the Bing searches if "Do daily searches
// automatically" is on. Both the automatic daily trigger and the popup's
// "Get rewards" button call this, so the button respects the same toggles
// rather than forcing searches.
export async function runRewards(): Promise<void> {
    const s = await getStorageItems(['searches', 'timeout', 'closeTime', 'autoDaily', 'active'], StorageValues.SYNC);
    const searchTimeout = toInt(s.timeout, DEFAULTS.timeout);
    const searches = toInt(s.searches, DEFAULTS.searches);
    const closeTime = toInt(s.closeTime, DEFAULTS.closeTime);
    const autoDaily = s.autoDaily ?? DEFAULTS.autoDaily;
    const autoTabs = s.active ?? DEFAULTS.active;

    if (autoDaily) await openDailyRewards();
    if (autoTabs && searches > 0) {
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
        }, StorageValues.SYNC);
        await browser.runtime.setUninstallURL(
            `https://svitspindler.com/uninstall?extension=${encodeURI('Microsoft Automatic Rewards')}`
        );
        setTimeout(() => { browser.tabs.create({ url: WEBSITE_URL, active: true }); }, 1000);
    } else if (details.reason === 'update') {
        setBadgeText('New');
    }
}

export async function handleStartup(): Promise<void> {
    const s = await getStorageItems(['active', 'autoDaily'], StorageValues.SYNC);
    if (s.active || s.autoDaily) await checkLastOpened();
    await setStorageItem('isSearching', false, StorageValues.SYNC);
}
