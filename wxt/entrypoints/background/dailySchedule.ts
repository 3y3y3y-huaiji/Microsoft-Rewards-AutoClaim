// Copyright (c) 2026 3y3y3y-huaiji Microsoft-Rewards-AutoSearch is licensed under Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//          http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
// See the Mulan PSL v2 for more details.

// Clean-room reimplementation per docs/rewrite/spec.md §2, §3, §5.
// Fresh identifiers and comments; behavior matches spec.

import { browser } from 'wxt/browser';
import { getStorageItems, setStorageItem, setStorageItems } from '@/entrypoints/hooks/useStorage';
import { StorageValues } from '@/entrypoints/enums/storageValues';
import { toInt } from '@/entrypoints/utils/search';
import { DEFAULTS } from '@/entrypoints/utils/settings';
import { clearBadge, setBadgeText } from '@/entrypoints/utils/browserAction';
import { openDailyRewards } from './dailyRewards';
import { startSearches } from './searchRunner';
import { siteConfig } from '@/entrypoints/config/siteConfig';

const INSTALL_LANDING = siteConfig.officialWebsite;

export async function runRewards(): Promise<void> {
  const cfg = await getStorageItems(['searches', 'timeout', 'closeTime'], StorageValues.SYNC);
  const timeout = toInt(cfg.timeout, DEFAULTS.timeout);
  const total = toInt(cfg.searches, DEFAULTS.searches);
  const close = toInt(cfg.closeTime, DEFAULTS.closeTime);

  await openDailyRewards();

  if (total > 0) {
    await startSearches(timeout, total, close);
  }
}

export async function checkLastOpened(): Promise<void> {
  const today = new Date().toLocaleDateString();
  const snapshot = await getStorageItems(['lastOpened'], StorageValues.SYNC);
  if (snapshot.lastOpened !== today) {
    await runRewards();
    await setStorageItem('lastOpened', today, StorageValues.SYNC);
  }
}

export async function handleInstallOrUpdate(info: { reason: string }): Promise<void> {
  if (info.reason === 'install') {
    await setStorageItems(
      {
        active: DEFAULTS.active,
        autoDaily: DEFAULTS.autoDaily,
        accountLevel: DEFAULTS.accountLevel,
        timeout: DEFAULTS.timeout,
        searches: DEFAULTS.searches,
        closeTime: DEFAULTS.closeTime,
        openFirstResult: DEFAULTS.openFirstResult,
        isSearching: false,
        currentSearch: 0,
      },
      StorageValues.SYNC,
    );
    await browser.runtime.setUninstallURL(siteConfig.uninstallUrl);
    setTimeout(() => {
      browser.tabs.create({ url: INSTALL_LANDING, active: true });
    }, 1000);
  } else if (info.reason === 'update') {
    setBadgeText('新');
  }
}

export async function handleStartup(): Promise<void> {
  // Spec §2 — startup must clear lingering alarms and transient flags BEFORE
  // checking whether today's run is due; otherwise a stale alarm could reopen
  // tabs and the subsequent reset would clobber the new run's isSearching.
  await browser.alarms.clearAll();
  await setStorageItems({ isSearching: false, currentSearch: 0 }, StorageValues.SYNC);
  clearBadge();

  const flags = await getStorageItems(['active', 'autoDaily'], StorageValues.SYNC);
  if (flags.active || flags.autoDaily) {
    await checkLastOpened();
  }
}
